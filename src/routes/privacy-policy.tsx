import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Orator" },
      {
        name: "description",
        content:
          "Read the Orator privacy policy to understand how we collect, use, and protect your personal data.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link to="/" className="legal-back">
          ← Back to home
        </Link>

        <article className="legal-card">
          <h1>Privacy Policy</h1>
          <p>
            This Privacy Policy explains how Orator collects, uses, and protects your
            information when you use our website and services.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We may collect information that you provide directly, including your name, email
            address, account details, and usage data related to practice sessions and account
            preferences.
          </p>

          <h2>2. How We Use Information</h2>
          <p>
            We use your information to operate the service, maintain your account, process
            subscriptions, improve product quality, and provide customer support.
          </p>

          <h2>3. Cookies and Analytics</h2>
          <p>
            We may use cookies and analytics tools to understand usage patterns, improve site
            performance, and maintain security. You can control cookies through your browser
            settings.
          </p>

          <h2>4. Data Sharing</h2>
          <p>
            We do not sell your personal data. We may share limited information with trusted
            service providers that help us operate the platform, such as hosting, authentication,
            and payment processing.
          </p>

          <h2>5. Security</h2>
          <p>
            We use reasonable administrative, technical, and organizational safeguards to protect
            your personal information. However, no online system is completely immune to risk.
          </p>

          <h2>6. Your Choices</h2>
          <p>
            You can manage your account settings, update your profile, and request access to or
            deletion of your personal information by contacting us through the support channels
            associated with the service.
          </p>

          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Continued use of the service after
            changes are posted constitutes acceptance of the revised policy.
          </p>

          <h2>8. Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us via the support
            options available on our website.
          </p>
        </article>
      </div>
    </main>
  );
}
