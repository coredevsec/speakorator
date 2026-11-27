import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Orator" },
      {
        name: "description",
        content:
          "Review the Orator terms of service for the public-speaking practice app built and operated by Corenator.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://orator.corenator.com/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link to="/" className="legal-back">
          ← Back to home
        </Link>

        <article className="legal-card">
          <h1>Terms of Service</h1>
          <p>
            These Terms of Service govern your access to and use of Orator and any related
            products and services.
          </p>
          <p>
            Orator is built and operated by Corenator. In these Terms, “Corenator,” “we,” “us,”
            and “our” refer to the organization providing the Orator service.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By creating an account or using Orator, you agree to these Terms and any policies
            referenced herein.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 13 years old to use the service, or older if required by the laws
            in your jurisdiction.
          </p>

          <h2>3. Account Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account, using a secure
            password, and ensuring that your account information is accurate and up to date.
          </p>

          <h2>4. Subscription and Payments</h2>
          <p>
            Certain features may require a paid subscription. Subscription fees are billed according
            to the pricing and billing terms presented at checkout. We may change pricing with
            notice where required.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>
            You agree not to misuse the platform, interfere with other users, attempt unauthorized
            access, or upload content that violates applicable laws or the rights of others.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            Orator retains ownership of the platform, branding, and related materials. You retain
            ownership of content you create or upload, but you grant us the rights needed to operate
            the service.
          </p>

          <h2>7. Service Availability</h2>
          <p>
            We aim to provide a reliable service, but availability may be affected by maintenance,
            third-party services, or technical issues beyond our control.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            Orator is provided on an “as is” basis. We are not liable for indirect, incidental,
            special, or consequential damages arising from your use of the service.
          </p>

          <h2>9. Termination</h2>
          <p>
            We may suspend or terminate access to the service if you violate these Terms or if we
            believe your use poses risk to the platform, other users, or legal compliance.
          </p>

          <h2>10. Changes</h2>
          <p>
            We may revise these Terms from time to time. Continued use of the service after updates
            are posted indicates your acceptance of the revised Terms.
          </p>

          <h2>11. Contact</h2>
          <p>
            Questions regarding these Terms may be sent to <a href="mailto:support@corenator.com">support@corenator.com</a>.
          </p>
        </article>
      </div>
    </main>
  );
}
