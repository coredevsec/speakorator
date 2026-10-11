import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookmarkCheck,
  Check,
  CreditCard,
  Gauge,
  LoaderCircle,
  Palette,
  ScanText,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";
import { SiteNavbar } from "../components/site-navbar";

const PLANS = [
  {
    key: "weekly",
    title: "Weekly",
    price: "$2.99",
    cadence: "per week",
    description: "Try the full toolkit, one week at a time.",
  },
  {
    key: "monthly",
    title: "Monthly",
    price: "$5.99",
    cadence: "per month",
    description: "A steady rhythm for regular practice.",
  },
  {
    key: "yearly",
    title: "Yearly",
    price: "$71.88",
    cadence: "per year",
    description: "Keep your speaking practice going all year.",
    featured: true,
  },
] as const;

export const Route = createFileRoute("/billing")({
  component: BillingPage,
});

function BillingPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [activeSubscription, setActiveSubscription] = useState<{
    plan_key: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (!supabase) {
      void navigate({ to: "/sign-in", replace: true });
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (!data.session) {
        void navigate({ to: "/sign-in", replace: true });
        return;
      }

      const { data: subscriptionData, error } = await supabase
        .from("subscriptions")
        .select("plan_key, status")
        .eq("user_id", data.session.user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle();

      if (!active) return;
      if (!error && subscriptionData) {
        setActiveSubscription({
          plan_key:
            typeof subscriptionData.plan_key === "string" ? subscriptionData.plan_key : "monthly",
          status: typeof subscriptionData.status === "string" ? subscriptionData.status : "active",
        });
      }
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function beginCheckout(plan: string) {
    if (!supabase || loadingPlan) return;
    setLoadingPlan(plan);
    setCheckoutError("");
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        void navigate({ to: "/sign-in", replace: true });
        return;
      }
      const response = await fetch("/api/flutterwave-checkout", {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });
      if (!(response.headers.get("content-type") ?? "").includes("json")) {
        throw new Error(
          response.status === 404
            ? "The checkout API route was not found. Restart the app with npm run dev and try again."
            : `The checkout API returned a non-JSON response (HTTP ${response.status}). Check the app server logs.`,
        );
      }
      const result = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.error || "Could not start checkout. Please try again.");
      }
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Could not start checkout. Please try again.",
      );
      setLoadingPlan(null);
    }
  }

  if (checking) return <main className="auth-page flex min-h-screen items-center justify-center" />;

  return (
    <main className="account-page">
      <SiteNavbar brandTo="/practice" />
      <section className="account-page-content billing-content">
        <section className="membership-hero">
          <div className="membership-hero-copy">
            <p className="practice-kicker">ORATOR MEMBERSHIP</p>
            <h1>Make every practice count.</h1>
            <p>
              The reading room stays free. Premium adds the tools to shape your sessions, keep your
              best passages, and see how your delivery improves.
            </p>
            <div className="membership-proof-row">
              <span>
                <Check className="h-4 w-4" /> Core practice stays free
              </span>
              <span>
                <CreditCard className="h-4 w-4" /> Secure Flutterwave checkout
              </span>
            </div>
          </div>
          <div className="membership-hero-preview" aria-label="Premium feature preview">
            <div className="membership-preview-topline">
              <span>
                <Sparkles className="h-4 w-4" /> PREMIUM TOOLKIT
              </span>
              <span className="membership-live-dot" />
            </div>
            <div className="membership-preview-wordline">
              Find your <strong>steady voice</strong>, one word at a time.
            </div>
            <div className="membership-preview-stats">
              <span>
                <Gauge className="h-4 w-4" /> Pace insights
              </span>
              <span>
                <ScanText className="h-4 w-4" /> Sentence focus
              </span>
              <span>
                <BookmarkCheck className="h-4 w-4" /> Saved passages
              </span>
            </div>
          </div>
        </section>

        <section className="membership-benefits" aria-labelledby="membership-benefits-title">
          <div className="membership-section-heading">
            <p className="practice-kicker">MORE CONTROL, MORE CLARITY</p>
            <h2 id="membership-benefits-title">Your Premium toolkit</h2>
          </div>
          <div className="membership-benefit-grid">
            <article>
              <span>
                <Gauge className="h-5 w-5" />
              </span>
              <h3>Understand your delivery</h3>
              <p>Track pace, session time, and filler words as you practice.</p>
            </article>
            <article>
              <span>
                <ScanText className="h-5 w-5" />
              </span>
              <h3>Focus on one thought</h3>
              <p>Read one sentence at a time when you want a calmer, focused session.</p>
            </article>
            <article>
              <span>
                <BookmarkCheck className="h-5 w-5" />
              </span>
              <h3>Keep useful passages</h3>
              <p>Save material you want to rehearse again for an upcoming talk.</p>
            </article>
            <article>
              <span>
                <Palette className="h-5 w-5" />
              </span>
              <h3>Set your reading colors</h3>
              <p>Choose a canvas and active-word highlight that feel clear to you.</p>
            </article>
          </div>
        </section>

        <section className="membership-plans-section" aria-labelledby="membership-plans-title">
          {activeSubscription ? (
            <div className="membership-section-heading membership-plans-heading">
              <div>
                <p className="practice-kicker">CURRENT MEMBERSHIP</p>
                <h2 id="membership-plans-title">Premium is active</h2>
              </div>
              <p>Your {activeSubscription.plan_key} plan is currently active.</p>
            </div>
          ) : (
            <div className="membership-section-heading membership-plans-heading">
              <div>
                <p className="practice-kicker">SIMPLE RECURRING PLANS</p>
                <h2 id="membership-plans-title">Choose your rhythm</h2>
              </div>
              <p>Payment is processed securely by Flutterwave at the interval shown.</p>
            </div>
          )}
          {checkoutError && (
            <p className="auth-error" role="alert">
              {checkoutError}
            </p>
          )}
          {activeSubscription ? (
            <div className="billing-active-status">
              <div className="billing-plan billing-plan-featured">
                <div className="billing-plan-heading">
                  <h3>
                    {activeSubscription.plan_key[0].toUpperCase() +
                      activeSubscription.plan_key.slice(1)}
                  </h3>
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="billing-price">
                  {PLANS.find((plan) => plan.key === activeSubscription.plan_key)?.price ?? "$0.00"}
                  <span>
                    {PLANS.find((plan) => plan.key === activeSubscription.plan_key)?.cadence ??
                      "active"}
                  </span>
                </p>
                <p className="billing-plan-description">
                  Premium is active for your account. You can continue practicing with your unlocked
                  tools.
                </p>
                <p className="billing-plan-includes">
                  <Check className="h-4 w-4" /> Status: {activeSubscription.status}
                </p>
                <Link to="/practice" className="billing-action" type="button">
                  Continue to practice
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="billing-plans">
                {PLANS.map((plan) => (
                  <PlanCard
                    key={plan.key}
                    title={plan.title}
                    price={plan.price}
                    cadence={plan.cadence}
                    description={plan.description}
                    featured={"featured" in plan && plan.featured}
                    loading={loadingPlan === plan.key}
                    disabled={loadingPlan !== null}
                    onCheckout={() => void beginCheckout(plan.key)}
                  />
                ))}
              </div>
              <p className="membership-cancellation-note">
                Subscriptions renew at the selected interval. For cancellation or billing support,
                contact Orator support.
              </p>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function PlanCard({
  title,
  price,
  cadence,
  description,
  featured = false,
  loading,
  disabled,
  onCheckout,
}: {
  title: string;
  price: string;
  cadence: string;
  description: string;
  featured?: boolean;
  loading: boolean;
  disabled: boolean;
  onCheckout: () => void;
}) {
  return (
    <article className={`billing-plan ${featured ? "billing-plan-featured" : ""}`}>
      {featured && <span className="billing-plan-badge">YEARLY</span>}
      <div className="billing-plan-heading">
        <h3>{title}</h3>
        {featured && <Sparkles className="h-5 w-5" aria-hidden="true" />}
      </div>
      <p className="billing-price">
        {price}
        <span>{cadence}</span>
      </p>
      <p className="billing-plan-description">{description}</p>
      <p className="billing-plan-includes">
        <Check className="h-4 w-4" /> All Premium features included
      </p>
      <button className="billing-action" type="button" onClick={onCheckout} disabled={disabled}>
        {loading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {loading ? "Opening secure checkout" : "Choose plan"}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </article>
  );
}
