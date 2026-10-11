import { createFileRoute } from "@tanstack/react-router";

import { adminRest, getPaymentEnv, isPlanKey, PLAN_DETAILS } from "../../lib/flutterwave.server";

export const Route = createFileRoute("/api/flutterwave-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const env = getPaymentEnv();
        if (
          !env.supabaseUrl ||
          !env.serviceRoleKey ||
          !env.flutterwaveSecretKey ||
          !env.flutterwaveSecretHash
        ) {
          return new Response("Webhook server configuration is incomplete.", { status: 500 });
        }

        const receivedHash = request.headers.get("verif-hash") ?? "";
        if (!constantTimeEqual(receivedHash, env.flutterwaveSecretHash)) {
          return new Response("Invalid webhook signature.", { status: 401 });
        }

        let event: FlutterwaveWebhookEvent;
        try {
          event = (await request.json()) as FlutterwaveWebhookEvent;
        } catch {
          return new Response("Invalid webhook payload.", { status: 400 });
        }

        try {
          if (event.event === "subscription.cancelled") {
            const subscriptionId =
              getString(event.data?.subscription_id) ?? getString(event.data?.id);
            if (subscriptionId) {
              const response = await adminRest(
                env.supabaseUrl,
                env.serviceRoleKey,
                `subscriptions?payment_provider=eq.flutterwave&payment_subscription_id=eq.${encodeURIComponent(subscriptionId)}`,
                {
                  method: "PATCH",
                  headers: { prefer: "return=minimal" },
                  body: JSON.stringify({ status: "canceled", cancel_at_period_end: false }),
                },
              );
              if (!response.ok) throw new Error("Could not update canceled membership.");
            }
            return Response.json({ received: true });
          }

          if (event.event !== "charge.completed" || event.data?.status !== "successful") {
            return Response.json({ received: true, ignored: true });
          }

          const transactionId = getString(event.data.id);
          const eventTxRef = getString(event.data.tx_ref);
          if (!transactionId || !eventTxRef)
            return new Response("Missing transaction reference.", { status: 400 });

          const verifyResponse = await fetch(
            `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
            { headers: { authorization: `Bearer ${env.flutterwaveSecretKey}` } },
          );
          const verification = (await verifyResponse.json()) as FlutterwaveVerificationResponse;
          const verified = verification.data;
          if (
            !verifyResponse.ok ||
            verification.status !== "success" ||
            verified?.status !== "successful" ||
            verified.tx_ref !== eventTxRef ||
            verified.currency !== "USD"
          ) {
            return Response.json({ received: true, ignored: true });
          }

          const subscriptionId =
            getString(verified.subscription_id) ?? getString(event.data.subscription_id);
          const attemptResponse = await adminRest(
            env.supabaseUrl,
            env.serviceRoleKey,
            `payment_attempts?select=user_id,plan_key&tx_ref=eq.${encodeURIComponent(eventTxRef)}&limit=1`,
          );
          if (!attemptResponse.ok) throw new Error("Payment attempt lookup failed.");
          const attempts = (await attemptResponse.json()) as Array<{
            user_id: string;
            plan_key: string;
          }>;
          let userId = attempts[0]?.user_id;
          let planKey: unknown = attempts[0]?.plan_key;

          if ((!userId || !isPlanKey(planKey)) && subscriptionId) {
            const subscriptionResponse = await adminRest(
              env.supabaseUrl,
              env.serviceRoleKey,
              `subscriptions?select=user_id,plan_key&payment_provider=eq.flutterwave&payment_subscription_id=eq.${encodeURIComponent(subscriptionId)}&limit=1`,
            );
            if (!subscriptionResponse.ok) throw new Error("Membership lookup failed.");
            const memberships = (await subscriptionResponse.json()) as Array<{
              user_id: string;
              plan_key: string;
            }>;
            userId = memberships[0]?.user_id;
            planKey = memberships[0]?.plan_key;
          }

          if (!userId || !isPlanKey(planKey)) {
            return Response.json({ received: true, ignored: true });
          }
          const expectedCents = PLAN_DETAILS[planKey].cents;
          if (
            !Number.isFinite(verified.amount) ||
            Math.round(verified.amount * 100) !== expectedCents
          ) {
            return new Response("Verified transaction amount does not match the membership plan.", {
              status: 400,
            });
          }

          const customerId = getString(verified.customer?.id) ?? getString(event.data.customer?.id);
          const paymentPlanId = getString(verified.payment_plan) ?? env.planIds[planKey];
          const upsertResponse = await adminRest(
            env.supabaseUrl,
            env.serviceRoleKey,
            "subscriptions?on_conflict=user_id",
            {
              method: "POST",
              headers: { prefer: "resolution=merge-duplicates,return=minimal" },
              body: JSON.stringify({
                user_id: userId,
                payment_provider: "flutterwave",
                payment_customer_id: customerId,
                payment_subscription_id: subscriptionId,
                payment_transaction_id: transactionId,
                payment_plan_id: paymentPlanId,
                plan_key: planKey,
                status: "active",
                trial_end: null,
                current_period_end: null,
                cancel_at_period_end: false,
                updated_at: new Date().toISOString(),
              }),
            },
          );
          if (!upsertResponse.ok) throw new Error("Could not save the verified membership.");

          if (attempts[0]) {
            await adminRest(
              env.supabaseUrl,
              env.serviceRoleKey,
              `payment_attempts?tx_ref=eq.${encodeURIComponent(eventTxRef)}`,
              {
                method: "PATCH",
                headers: { prefer: "return=minimal" },
                body: JSON.stringify({
                  status: "completed",
                  completed_at: new Date().toISOString(),
                }),
              },
            );
          }
          return Response.json({ received: true });
        } catch (error) {
          console.error("Flutterwave webhook processing failed", error);
          return new Response("Webhook processing failed.", { status: 500 });
        }
      },
    },
  },
});

type FlutterwaveWebhookEvent = {
  event?: string;
  data?: {
    id?: unknown;
    tx_ref?: unknown;
    status?: string;
    subscription_id?: unknown;
    customer?: { id?: unknown };
  };
};

type FlutterwaveVerificationResponse = {
  status?: string;
  data?: {
    id?: unknown;
    tx_ref?: string;
    status?: string;
    amount?: number;
    currency?: string;
    subscription_id?: unknown;
    payment_plan?: unknown;
    customer?: { id?: unknown };
  };
};

function getString(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  return undefined;
}

function constantTimeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}
