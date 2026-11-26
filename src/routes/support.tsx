import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteNavbar } from "../components/site-navbar";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Orator Support | Help and Contact" },
      {
        name: "description",
        content:
          "Get help with Orator accounts, subscriptions, speech practice, supported browsers, and voice typing.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://orator.corenator.com/support" }],
  }),
  component: SupportPage,
});

function SupportPage() {
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

      <section className="orator-support-page">
        <div className="orator-support-heading">
          <p className="practice-kicker">ORATOR SUPPORT</p>
          <h1>How can we help?</h1>
          <p>Questions about Orator, subscriptions, accounts, or practice tools? Contact our support team.</p>
        </div>

        <div className="orator-support-grid">
          <article className="landing-feature-card orator-support-card">
            <p className="practice-kicker">GENERAL SUPPORT</p>
            <h2>Talk to our support team</h2>
            <p>For account, product, and technical help, contact Orator support.</p>
            <a
              href="mailto:support@corenator.com?subject=Orator%20support%20request"
              className="landing-nav-cta orator-support-button"
            >
              support@corenator.com
            </a>
          </article>

          <article className="landing-feature-card orator-support-card">
            <p className="practice-kicker">GENERAL INQUIRIES</p>
            <h2>Send an information request</h2>
            <p>For partnerships, information, and general questions, contact Orator information.</p>
            <a
              href="mailto:info@corenator.com?subject=Orator%20general%20inquiry"
              className="landing-nav-cta orator-support-button"
            >
              info@corenator.com
            </a>
          </article>
        </div>

        <div className="orator-support-guides">
          <article className="landing-feature-card orator-support-faq">
            <p className="practice-kicker">QUICK TROUBLESHOOTING</p>
            <h2>Microphone or speech recognition not working?</h2>
            <ol>
              <li>Check that your browser has microphone permission for the Orator site.</li>
              <li>Choose the microphone you intend to use in your device or browser settings.</li>
              <li>Close other apps using the microphone, reload Orator, and try a short practice again.</li>
              <li>If recognition is still unreliable, try a supported up-to-date browser and a quieter space.</li>
            </ol>
            <p>
              For sign-in, subscription, or practice questions, visit the{" "}
              <Link to="/faqs" className="orator-view-all-faqs">FAQs</Link> or email support.
            </p>
          </article>

          <article className="landing-feature-card orator-support-faq">
            <p className="practice-kicker">CONTACTING SUPPORT</p>
            <h2>What to include in a request</h2>
            <ul>
              <li>The email address associated with your Orator account.</li>
              <li>Your browser and device, plus the steps that led to the issue.</li>
              <li>For a payment question, the transaction reference and date, if available.</li>
            </ul>
            <p className="orator-support-privacy-note">
              Never email your password, full payment card number, security code, or one-time sign-in code.
              See our <Link to="/privacy-policy">Privacy Policy</Link> for information about personal data.
            </p>
            <Link to="/pricing" className="orator-view-all-faqs">View plans and billing details →</Link>
          </article>
        </div>
      </section>
    </main>
  );
}
