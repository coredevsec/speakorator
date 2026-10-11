import { createFileRoute } from "@tanstack/react-router";

import {
  adminRest,
  getAuthenticatedUser,
  getPaymentEnv,
  isPlanKey,
  PLAN_DETAILS,
} from "../../lib/flutterwave.server";

export const Route = createFileRoute("/api/flutterwave-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const env = getPaymentEnv();
        if (
          !env.supabaseUrl ||
          !env.serviceRoleKey ||
          !env.flutterwaveSecretKey ||
          !env.redirectUrl
        ) {
          return Response.json({ error: "Payment checkout is not configured." }, { status: 503 });
        }

        const user = await getAuthenticatedUser(request, env.supabaseUrl, env.serviceRoleKey);
        if (!user) return Response.json({ error: "Sign in to continue." }, { status: 401 });

        let body: { plan?: unknown };
        try {
          body = (await request.json()) as { plan?: unknown };
        } catch {
          return Response.json({ error: "Invalid checkout request." }, { status: 400 });
        }
        if (!isPlanKey(body.plan)) {
          return Response.json({ error: "Choose a valid subscription plan." }, { status: 400 });
        }

        const planKey = body.plan;
        const planId = env.planIds[planKey];
        if (!/^\d+$/.test(planId)) {
          return Response.json(
            { error: "This payment plan is not configured yet." },
            { status: 503 },
          );
        }

        const existingResponse = await adminRest(
          env.supabaseUrl,
          env.serviceRoleKey,
          `subscriptions?select=status&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
        );
        if (!existingResponse.ok) {
          return Response.json({ error: "Could not check membership status." }, { status: 502 });
        }
        const existing = (await existingResponse.json()) as Array<{ status: string }>;
        if (
          existing.some(
            (subscription) =>
              subscription.status === "active" || subscription.status === "trialing",
          )
        ) {
          return Response.json(
            { error: "Your account already has an active membership." },
            { status: 409 },
          );
        }

        const txRef = `orator-${crypto.randomUUID()}`;
        const attemptResponse = await adminRest(
          env.supabaseUrl,
          env.serviceRoleKey,
          "payment_attempts",
          {
            method: "POST",
            headers: { prefer: "return=minimal" },
            body: JSON.stringify({ tx_ref: txRef, user_id: user.id, plan_key: planKey }),
          },
        );
        if (!attemptResponse.ok) {
          return Response.json({ error: "Could not prepare your payment." }, { status: 502 });
        }

        const checkoutResponse = await fetch("https://api.flutterwave.com/v3/payments", {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.flutterwaveSecretKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            tx_ref: txRef,
            amount: PLAN_DETAILS[planKey].amount,
            currency: "USD",
            payment_plan: Number(planId),
            redirect_url: env.redirectUrl,
            customer: { email: user.email },
            customizations: {
              title: "Orator Premium",
              description: `${planKey[0]?.toUpperCase()}${planKey.slice(1)} Orator membership`,
              logo: "",
            },
            meta: [
              { metaname: "orator_user_id", metavalue: user.id },
              { metaname: "orator_plan_key", metavalue: planKey },
            ],
          }),
        });
        const checkout = (await checkoutResponse.json()) as {
          status?: string;
          message?: string;
          data?: { link?: string };
        };
        const checkoutUrl = checkout.data?.link;
        if (!checkoutResponse.ok || checkout.status !== "success" || !checkoutUrl) {
          console.error("Flutterwave checkout initialization failed", checkout.message);
          return Response.json(
            { error: "Flutterwave could not start checkout. Please try again." },
            { status: 502 },
          );
        }
        try {
          const url = new URL(checkoutUrl);
          const isFlutterwaveDomain =
            url.hostname === "flutterwave.com" || url.hostname.endsWith(".flutterwave.com");
          const isFlutterwaveTestDomain =
            env.flutterwaveSecretKey.startsWith("FLWSECK_TEST-") &&
            url.hostname === "checkout-v2.dev-flutterwave.com";
          if (url.protocol !== "https:" || (!isFlutterwaveDomain && !isFlutterwaveTestDomain)) {
            console.error("Unexpected Flutterwave checkout URL origin", {
              protocol: url.protocol,
              hostname: url.hostname,
            });
            return Response.json(
              {
                error: `Flutterwave returned an unexpected checkout URL origin: ${url.protocol}//${url.hostname}`,
              },
              { status: 502 },
            );
          }
        } catch {
          return Response.json(
            { error: "Flutterwave returned an invalid checkout URL." },
            { status: 502 },
          );
        }

        return Response.json({ checkoutUrl });
      },
    },
  },
});
