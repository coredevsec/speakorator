import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteNavbar } from "../components/site-navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs | Orator" },
      {
        name: "description",
        content: "Frequently asked questions about Orator speaking practice, accounts, browsers, passages, scoring, and supported languages.",
      },
    ],
  }),
  component: FAQsPage,
});

function FAQsPage() {
  return (
    <main className="landing-page">
      <SiteNavbar brandText="Orator" brandTo="/" showMenu={false} landingMenu>
        <nav className="landing-nav" aria-label="Account actions">
          <Link to="/sign-up" className="landing-nav-cta orator-get-started" style={{ color: "#0a1a27" }}>
            Get Started
          </Link>
        </nav>
      </SiteNavbar>

      <section id="all-faqs" className="landing-feature-grid landing-faq-grid">
        <article className="landing-feature-card landing-faq-card">
          <p className="practice-kicker orator-faq-heading">FAQ</p>
          <h1>Frequently asked questions</h1>
          <Accordion type="single" collapsible>
            <AccordionItem value="account">
              <AccordionTrigger>Do I need an account to try Orator?</AccordionTrigger>
              <AccordionContent>
                Yes. You need an account to use Orator, so it can save your progress and practices.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="browsers">
              <AccordionTrigger>Which browsers work best?</AccordionTrigger>
              <AccordionContent>
                Edge works best. Safari and Firefox also work. Chrome is not very smooth yet.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="passage">
              <AccordionTrigger>Can I use my own passage?</AccordionTrigger>
              <AccordionContent>
                Yes. Paste or type your own speech, passage, or presentation.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="free">
              <AccordionTrigger>Is Orator free?</AccordionTrigger>
              <AccordionContent>Yes, to start. Core practice is free.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="phone">
              <AccordionTrigger>Does it work on phone?</AccordionTrigger>
              <AccordionContent>Yes. Works on phone, tablet, and laptop.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="record">
              <AccordionTrigger>Does Orator record me?</AccordionTrigger>
              <AccordionContent>
                No. It analyzes your speech in real-time and doesn't store your audio unless you choose to.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="scoring">
              <AccordionTrigger>How does scoring work?</AccordionTrigger>
              <AccordionContent>
                It scores your pace, clarity, filler words, and pauses, then shows you what to improve.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="offline">
              <AccordionTrigger>Can I practice offline?</AccordionTrigger>
              <AccordionContent>No. You need internet for speech analysis.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="languages">
              <AccordionTrigger>What languages does it support?</AccordionTrigger>
              <AccordionContent>
                English (United States), English (United Kingdom), English (Australia), English (India), Spanish (Spain), Spanish (Mexico), French, German, and Portuguese (Brazil).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </article>
      </section>
    </main>
  );
}
