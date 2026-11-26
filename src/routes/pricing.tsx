import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { SiteNavbar } from "../components/site-navbar";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing | Orator" },
      {
        name: "description",
        content:
          "Choose a weekly, monthly, or yearly Orator plan for speaking practice and premium coaching tools.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://orator.corenator.com/pricing" }],
  }),
  component: PricingPage,
});

const pricingPlans = {
  weekly: {
    name: "Weekly",
    price: "$2.99",
    cadence: "per week",
    billed: "Billed weekly",
    description: "Starter plan for quick practice.",
  },
  monthly: {
    name: "Monthly",
    price: "$5.99",
    cadence: "per month",
    billed: "Billed monthly",
    description: "Most flexible for regular speakers.",
  },
  yearly: {
    name: "Yearly",
    price: "$71.88",
    cadence: "per year",
    billed: "Billed yearly",
    description: "Unlimited access for power users.",
  },
} as const;

function PricingPage() {
  const [activePricingPeriod, setActivePricingPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");

  return (
    <main className="landing-page">
      <SiteNavbar brandText="Orator" brandTo="/" showMenu={false} landingMenu>
        <nav className="landing-nav" aria-label="Account actions">
          <Link
            to="/sign-up"
            className="landing-nav-cta orator-get-started"
            style={{ color: "#0a1a27" }}
          >
            Get Started
          </Link>
        </nav>
      </SiteNavbar>

      <section className="landing-built-everyone orator-pricing-section">
        <div className="landing-built-everyone-heading orator-pricing-heading orator-centered-section-heading">
          <p className="practice-kicker">PRICING</p>
          <h2>Choose the plan that's right for you</h2>
        </div>

        <div className="orator-pricing-toggle" role="tablist" aria-label="Billing period">
          {(["weekly", "monthly", "yearly"] as const).map((period) => (
            <button
              type="button"
              role="tab"
              aria-selected={activePricingPeriod === period}
              className={activePricingPeriod === period ? "active" : ""}
              key={period}
              onClick={() => setActivePricingPeriod(period)}
            >
              {pricingPlans[period].name}
              {period === "yearly" ? <span className="orator-pricing-badge">-20%</span> : null}
            </button>
          ))}
        </div>

        <div className="landing-feature-grid orator-pricing-grid">
          {(["weekly", "monthly", "yearly"] as const).map((period) => {
            const plan = pricingPlans[period];
            const active = activePricingPeriod === period;
            return (
              <article
                className={`landing-feature-card orator-pricing-card ${period === "monthly" ? "orator-pricing-popular" : ""} ${active ? "orator-pricing-active" : ""}`}
                key={period}
              >
                {period === "monthly" ? (
                  <span className="orator-pricing-popular-badge">POPULAR</span>
                ) : null}
                <h2>{plan.name}</h2>
                <div className="orator-pricing-price">
                  <strong>{plan.price}</strong>
                  <span>/ {plan.cadence}</span>
                </div>
                <p className="orator-pricing-billed">{plan.billed}</p>
                <p>{plan.description}</p>
                <ul className="orator-pricing-checklist">
                  <li><CheckCircle2 className="h-4 w-4" /> Full voice-following practice</li>
                  <li><CheckCircle2 className="h-4 w-4" /> Voice typing tools</li>
                  <li><CheckCircle2 className="h-4 w-4" /> Mobile and desktop access</li>
                </ul>
                <Link to="/billing" className="landing-nav-cta orator-pricing-button">
                  Choose Plan
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
