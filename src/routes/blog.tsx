import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteNavbar } from "../components/site-navbar";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Orator Blog | Public Speaking and Voice Practice" },
      {
        name: "description",
        content:
          "Practical guides about public speaking, pacing, filler words, presentations, confidence, and voice-following teleprompters.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://orator.corenator.com/blog" }],
  }),
  component: BlogPage,
});

const articles = [
  {
    id: "reduce-filler-words",
    category: "PRESENTATION SKILLS",
    title: "How to reduce filler words while speaking",
    excerpt:
      "Learn simple pause techniques that make your presentation feel calmer and more deliberate.",
    introduction:
      "Filler words often appear when your thoughts are moving faster than your next sentence. The goal is not to eliminate every natural hesitation; it is to replace distracting repetition with a pause that gives you and your audience room to think.",
    steps: [
      "Notice your patterns. Record a short practice and identify when fillers tend to appear, such as between ideas or at the start of an answer.",
      "Swap the filler for silence. Finish the thought, take a relaxed breath, and begin the next sentence when you are ready.",
      "Practice in short sections. Repeat one paragraph at a comfortable pace, then increase the length once the pauses feel natural.",
    ],
    takeaway:
      "Measure progress by whether your ideas are easier to follow, not by whether every hesitation disappears.",
  },
  {
    id: "natural-speaking-pace",
    category: "PACING",
    title: "Find a natural speaking pace",
    excerpt:
      "Use short practice sessions to avoid rushing and keep your delivery steady, clear, and engaging.",
    introduction:
      "A useful speaking pace is one your listeners can follow while still feeling connected to your energy. Your pace can change with the material: important points benefit from space, while familiar transitions can move along briskly.",
    steps: [
      "Mark the key ideas in your script and pause briefly after each one so listeners can absorb it.",
      "Practice aloud rather than silently. Speaking reveals where long sentences or unfamiliar phrases make you speed up.",
      "Review one short recording or feedback summary, choose one adjustment, and practice the same section again.",
    ],
    takeaway:
      "Aim for variation with purpose, not a perfectly even metronome-like delivery.",
  },
  {
    id: "voice-following-teleprompter",
    category: "TELEPROMPTERS",
    title: "How voice-following teleprompters work",
    excerpt:
      "Discover how Orator follows your voice and keeps your place as you read without constant scrolling.",
    introduction:
      "A voice-following teleprompter listens for the words you are reading and moves the script to keep your current line in view. Unlike fixed-speed scrolling, it can adapt when you pause, slow down, or speak more quickly.",
    steps: [
      "Use a quiet space and allow microphone access so speech recognition can follow your reading.",
      "Keep your script close to the words you plan to say; large edits or skipped paragraphs can make matching less reliable.",
      "Set readable text size and scroll position before you begin, then practice a short section to check tracking.",
    ],
    takeaway:
      "The prompt is there to support eye contact and delivery, not to make every spoken word sound scripted.",
  },
  {
    id: "practice-without-pressure",
    category: "CONFIDENCE",
    title: "Practice for presentations without pressure",
    excerpt:
      "Build confidence by practicing one section at a time and reviewing clear feedback after each pass.",
    introduction:
      "Confidence grows from knowing what you want to say and having rehearsed the moments that matter. A practice session does not need to be a full performance; small, repeatable goals make improvement easier to see.",
    steps: [
      "Choose one goal for the session, such as a clear opening, calmer pace, or stronger closing sentence.",
      "Rehearse a manageable section, take a short break, and repeat it while focusing on that single goal.",
      "Finish by saying the section once without stopping to correct yourself, so you also practice recovering and moving forward.",
    ],
    takeaway:
      "Treat each rehearsal as information, not a verdict on your ability.",
  },
  {
    id: "spoken-first-draft",
    category: "VOICE TYPING",
    title: "Turn spoken ideas into a better first draft",
    excerpt:
      "Use voice typing to capture a rough script quickly, then refine your pacing and word choices.",
    introduction:
      "Speaking your ideas aloud can help you get a first draft out before editing slows you down. The first transcript is raw material: it may include repetition, unfinished thoughts, and punctuation that needs attention.",
    steps: [
      "Start with a simple prompt or outline so you have somewhere to take the thought when you pause.",
      "Keep speaking through small mistakes; mark unclear sections and return to them during editing.",
      "Read the revised draft aloud and shorten sentences that are difficult to say in one breath.",
    ],
    takeaway:
      "A good spoken draft sounds natural when read aloud and gives each main point a clear place to land.",
  },
  {
    id: "interview-and-defense-practice",
    category: "PUBLIC SPEAKING",
    title: "Prepare for interviews and project defenses",
    excerpt:
      "A practical rehearsal plan for answering clearly, staying focused, and finishing with confidence.",
    introduction:
      "Interviews and project defenses ask you to explain ideas under pressure. Preparing a few flexible examples and a clear answer structure helps you stay direct without sounding memorized.",
    steps: [
      "List likely questions and identify the one or two points each answer should communicate.",
      "Build concise examples with context, your action, and the result, then practice explaining them in your own words.",
      "Rehearse follow-up questions and practice pausing briefly before you answer instead of filling the silence.",
    ],
    takeaway:
      "Aim to make the reasoning behind your answer easy to follow, even when the exact question is unexpected.",
  },
];

function BlogPage() {
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

      <section id="blog-top" className="orator-blog-page">
        <div className="orator-blog-heading">
          <p className="practice-kicker">ORATOR BLOG</p>
          <h1>Speak with more clarity and confidence</h1>
          <p>
            Practical guides for presentations, interviews, sermons, speeches, and everyday speaking.
          </p>
        </div>

        <div className="orator-blog-grid">
          {articles.map((article) => (
            <article className="landing-feature-card orator-blog-card" key={article.title}>
              <p className="practice-kicker">{article.category}</p>
              <h2>{article.title}</h2>
              <p>{article.excerpt}</p>
              <a className="orator-blog-read-link" href={`#${article.id}`}>
                Read guide <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>

        <div className="orator-blog-articles" aria-label="Public speaking guides">
          {articles.map((article) => (
            <article id={article.id} className="orator-blog-article" key={article.id}>
              <p className="practice-kicker">{article.category}</p>
              <h2>{article.title}</h2>
              <p>{article.introduction}</p>
              <ol>
                {article.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <p>{article.takeaway}</p>
              <a href="#blog-top" className="orator-blog-back-link">Back to all guides ↑</a>
            </article>
          ))}
        </div>

        <div className="orator-blog-cta">
          <h2>Ready to put these ideas into practice?</h2>
          <Link to="/sign-up" className="landing-nav-cta orator-get-started" style={{ color: "#0a1a27" }}>
            Get Started
          </Link>
        </div>
      </section>
    </main>
  );
}
