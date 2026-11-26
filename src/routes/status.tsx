import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteNavbar } from "../components/site-navbar";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Orator Status | Service Availability" },
      {
        name: "description",
        content:
          "Check Orator service availability and find updates about speech practice, accounts, and payments.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://orator.corenator.com/status" }],
  }),
  component: StatusPage,
});

const services = [
  {
    name: "Orator app and website",
    description: "Loading the public site and signed-in app experience.",
  },
  {
    name: "Accounts and sign-in",
    description: "Creating an account and accessing saved preferences and practices.",
  },
  {
    name: "Speech practice and voice typing",
    description: "Microphone access, speech recognition, and practice tools.",
  },
  {
    name: "Subscriptions and payments",
    description: "Plan access, checkout, and subscription updates.",
  },
];

function StatusPage() {
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

      <section className="orator-status-page">
        <header className="orator-status-heading">
          <p className="practice-kicker">ORATOR STATUS</p>
          <h1>Service availability</h1>
          <p>Updates about the parts of Orator you rely on.</p>
        </header>

        <div className="orator-status-notice" role="status">
          <span className="orator-status-indicator" aria-hidden="true" />
          <div>
            <h2>Live status monitoring is not connected</h2>
            <p>
              This page does not currently receive automated health checks or incident updates.
              The services below are listed for reference, not as a real-time availability report.
            </p>
          </div>
        </div>

        <section className="orator-status-services" aria-labelledby="status-services-heading">
          <h2 id="status-services-heading">Services</h2>
          <ul>
            {services.map((service) => (
              <li key={service.name}>
                <div>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </div>
                <span className="orator-status-unmonitored">Not monitored</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="orator-status-updates">
          <h2>Incident history and maintenance</h2>
          <p>
            Incident history and scheduled maintenance notices will appear here once status
            monitoring is configured. For help with a current issue, visit{" "}
            <Link to="/support">Orator Support</Link>.
          </p>
        </section>
      </section>
    </main>
  );
}
