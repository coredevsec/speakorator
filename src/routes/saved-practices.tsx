import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookMarked, CheckCircle2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { supabase } from "../lib/supabase";
import { checkSubscriptionAccess } from "../lib/subscription-access";

const SAVED_PRACTICES_KEY = "orator.saved-practices";
const PRACTICE_DRAFT_KEY = "orator.practice-draft";

type SavedPractice = {
  id: string;
  title: string;
  text: string;
  savedAt: string;
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const Route = createFileRoute("/saved-practices")({
  component: SavedPracticesPage,
});

function SavedPracticesPage() {
  const navigate = useNavigate();
  const [practices, setPractices] = useState<SavedPractice[]>([]);
  const [checking, setChecking] = useState(true);
  const [practiceToDelete, setPracticeToDelete] = useState<SavedPractice | null>(null);
  const [deletedTitle, setDeletedTitle] = useState("");

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
      const access = await checkSubscriptionAccess(data.session.user.id);
      if (!active) return;
      if (access.error || !access.allowed) {
        void navigate({ to: "/billing", replace: true });
        return;
      }
      setPractices(JSON.parse(window.localStorage.getItem(SAVED_PRACTICES_KEY) ?? "[]"));
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!deletedTitle) return;
    const timeoutId = window.setTimeout(() => setDeletedTitle(""), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [deletedTitle]);

  function removePractice() {
    if (!practiceToDelete) return;
    const next = practices.filter((practice) => practice.id !== practiceToDelete.id);
    setPractices(next);
    window.localStorage.setItem(SAVED_PRACTICES_KEY, JSON.stringify(next));
    setDeletedTitle(practiceToDelete.title);
    setPracticeToDelete(null);
  }

  function practiceSavedText(practice: SavedPractice) {
    window.sessionStorage.setItem(PRACTICE_DRAFT_KEY, practice.text);
    void navigate({ to: "/practice" });
  }

  if (checking) return <main className="auth-page flex min-h-screen items-center justify-center" />;

  return (
    <main className="account-page">
      <header className="account-page-header">
        <Link to="/practice" className="account-page-brand">
          <span className="brand-mark-frame">
            <img src="/orator-mark.svg" alt="" className="brand-mark-image" />
          </span>
          <span>Orator</span>
        </Link>
        <Link to="/" className="account-back-link">
          <ArrowLeft className="h-4 w-4" /> Practice
        </Link>
      </header>
      <section className="account-page-content">
        <p className="practice-kicker">YOUR LIBRARY</p>
        <h1>Saved practices</h1>
        <p className="account-page-intro">Keep passages close for your next speaking session.</p>
        {deletedTitle && (
          <div
            className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-300/25 bg-emerald-950/40 px-4 py-3 text-emerald-100 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Passage deleted</p>
              <p className="mt-0.5 break-words text-sm text-emerald-100/75">
                “{deletedTitle}” was removed from your library.
              </p>
            </div>
            <button
              type="button"
              className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-emerald-100/70 transition hover:bg-emerald-300/10 hover:text-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              onClick={() => setDeletedTitle("")}
              aria-label="Dismiss deletion message"
              title="Dismiss message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {practices.length === 0 ? (
          <div className="empty-account-state">
            <BookMarked className="h-7 w-7" />
            <h2>Your library is empty</h2>
            <p>Save a passage from the practice page and it will appear here.</p>
            <Link to="/" className="account-primary-link">
              Start a practice
            </Link>
          </div>
        ) : (
          <div className="saved-practices-list">
            {practices.map((practice) => (
              <article key={practice.id} className="saved-practice-card">
                <button
                  type="button"
                  onClick={() => practiceSavedText(practice)}
                  className="group min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  aria-label={`Open ${practice.title} to edit and practice`}
                  title="Open passage in the practice editor"
                >
                  <p className="saved-practice-date">
                    {new Date(practice.savedAt).toLocaleDateString()}
                  </p>
                  <h2 className="transition-colors group-hover:text-teal-200 group-focus-visible:text-teal-200">
                    {practice.title}
                  </h2>
                  <p className="mt-[.45rem] max-w-[48rem] leading-[1.6] text-[#b7c5d6]">
                    {practice.text}
                  </p>
                  <span className="mt-3 inline-flex rounded-full border border-teal-200/20 bg-teal-200/10 px-2.5 py-1 text-xs font-semibold text-teal-100">
                    {countWords(practice.text)} words
                  </span>
                </button>
                <button
                  type="button"
                  className="icon-danger-button"
                  onClick={() => {
                    setDeletedTitle("");
                    setPracticeToDelete(practice);
                  }}
                  aria-label={`Remove ${practice.title}`}
                  title="Remove saved practice"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      <AlertDialog
        open={practiceToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPracticeToDelete(null);
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm gap-6 rounded-xl border border-[#30435a] bg-[#102139] p-5 text-[#f3f7fc] shadow-2xl shadow-black/50 sm:p-6">
          <AlertDialogHeader className="items-center text-center">
            <AlertDialogTitle className="w-full text-center text-lg font-semibold text-[#f3f7fc]">
              Confirm delete
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="mt-0 min-h-10 border-[#40566b] bg-[#091727] text-[#e7eef8] hover:bg-[#18314b] hover:text-white sm:mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="min-h-10 border border-red-400/30 bg-red-950/70 text-red-300 shadow-sm hover:bg-red-900 hover:text-red-200 focus-visible:ring-red-400"
              onClick={removePractice}
            >
              <Trash2 className="h-4 w-4" /> Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
