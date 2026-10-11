import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  CreditCard,
  LoaderCircle,
  LogOut,
  Palette,
  RotateCcw,
  Save,
  Settings2,
} from "lucide-react";
import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";
import { SiteNavbar } from "../components/site-navbar";
import { checkSubscriptionAccess } from "../lib/subscription-access";
import {
  getPresentationPreferences,
  savePresentationPreferences,
  type PresentationPreferences,
} from "../lib/presentation-preferences";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [occupation, setOccupation] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");
  const [hasPaidAccess, setHasPaidAccess] = useState(false);
  const [presentationPreferences, setPresentationPreferences] = useState<PresentationPreferences>(
    getPresentationPreferences(""),
  );
  const [savedPresentationPreferences, setSavedPresentationPreferences] =
    useState<PresentationPreferences>(getPresentationPreferences(""));
  const [presentationMessage, setPresentationMessage] = useState("");
  const [presentationError, setPresentationError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!message || message.includes("Check your new email address to confirm the email change.")) {
      return;
    }
    const timeoutId = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  useEffect(() => {
    if (!presentationMessage) return;
    const timeoutId = window.setTimeout(() => setPresentationMessage(""), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [presentationMessage]);

  useEffect(() => {
    if (!supabase) {
      void navigate({ to: "/sign-in", replace: true });
      return;
    }
    let active = true;
    void supabase.auth
      .getSession()
      .then(async ({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) {
          setError(sessionError.message);
          setChecking(false);
          return;
        }
        if (!data.session) void navigate({ to: "/sign-in", replace: true });
        else {
          setUserId(data.session.user.id);
          setEmail(data.session.user.email ?? "");
          const access = await checkSubscriptionAccess(data.session.user.id);
          setHasPaidAccess(!access.error && access.allowed);
          const savedPreferences = getPresentationPreferences(data.session.user.id);
          setPresentationPreferences(savedPreferences);
          setSavedPresentationPreferences(savedPreferences);
          const { data: profile, error: profileLoadError } = await supabase
            .from("profiles")
            .select("first_name, surname, country, state_region, occupation, phone")
            .eq("id", data.session.user.id)
            .maybeSingle();
          if (profileLoadError) setError(profileLoadError.message);
          if (profile) {
            setFirstName(profile.first_name ?? "");
            setSurname(profile.surname ?? "");
            setCountry(profile.country ?? "");
            setStateRegion(profile.state_region ?? "");
            setOccupation(profile.occupation ?? "");
            setPhone(profile.phone ?? "");
          } else {
            const metadata = data.session.user.user_metadata ?? {};
            setFirstName(typeof metadata.first_name === "string" ? metadata.first_name : "");
            setSurname(typeof metadata.surname === "string" ? metadata.surname : "");
            setCountry(typeof metadata.country === "string" ? metadata.country : "");
            setStateRegion(typeof metadata.state_region === "string" ? metadata.state_region : "");
            setOccupation(typeof metadata.occupation === "string" ? metadata.occupation : "");
            setPhone(typeof metadata.phone === "string" ? metadata.phone : "");
          }
          setChecking(false);
        }
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load your profile.");
        setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function signOut() {
    await supabase?.auth.signOut();
    void navigate({ to: "/sign-in", replace: true });
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData.session?.user;
      if (!user) {
        void navigate({ to: "/sign-in", replace: true });
        return;
      }
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          first_name: firstName.trim(),
          surname: surname.trim(),
          country: country.trim(),
          state_region: stateRegion.trim(),
          occupation: occupation.trim() || null,
          phone: phone.trim(),
        },
        { onConflict: "id" },
      );
      if (profileError) throw profileError;

      if (email.trim() !== (user.email ?? "")) {
        const { error: emailError } = await supabase.auth.updateUser({ email: email.trim() });
        if (emailError) throw emailError;
        setMessage("Profile saved. Check your new email address to confirm the email change.");
      } else {
        setMessage("Profile saved successfully.");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  }

  function updatePresentationPreference<K extends keyof PresentationPreferences>(
    key: K,
    value: PresentationPreferences[K],
  ) {
    setPresentationPreferences((current) => ({ ...current, [key]: value }));
    setPresentationMessage("");
    setPresentationError("");
  }

  function savePresentationSettings() {
    if (!userId) return;
    try {
      savePresentationPreferences(userId, presentationPreferences);
      setSavedPresentationPreferences({ ...presentationPreferences });
      setPresentationError("");
      setPresentationMessage("Reading colors saved.");
    } catch {
      setPresentationError("Could not save reading colors. Try again.");
    }
  }

  function undoPresentationChanges() {
    const saved = userId ? getPresentationPreferences(userId) : savedPresentationPreferences;
    setPresentationPreferences({ ...saved });
    setSavedPresentationPreferences({ ...saved });
    setPresentationError("");
    setPresentationMessage("Unsaved appearance changes were undone.");
  }

  const hasUnsavedPresentationChanges =
    presentationPreferences.background !== savedPresentationPreferences.background ||
    presentationPreferences.accent !== savedPresentationPreferences.accent;

  if (checking) return <main className="auth-page flex min-h-screen items-center justify-center" />;

  return (
    <main className="account-page">
      <SiteNavbar brandTo="/practice" />
      <section className="account-page-content account-settings-content">
        <header className="account-settings-heading">
          <span className="account-page-icon">
            <Settings2 className="h-5 w-5" />
          </span>
          <p className="practice-kicker">ACCOUNT</p>
          <h1>Settings</h1>
          <p className="account-page-intro">Manage your Orator account.</p>
        </header>
        <form className="settings-card settings-form" onSubmit={saveProfile}>
          <div className="settings-name-fields">
            <label>
              Name
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </label>
            <label>
              Surname
              <input
                value={surname}
                onChange={(event) => setSurname(event.target.value)}
                required
              />
            </label>
          </div>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Phone number
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </label>
          <div className="settings-name-fields">
            <label>
              Country
              <input
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                required
              />
            </label>
            <label>
              State / region
              <input
                value={stateRegion}
                onChange={(event) => setStateRegion(event.target.value)}
                required
              />
            </label>
          </div>
          <label>
            Occupation <span className="auth-optional">Optional</span>
            <input value={occupation} onChange={(event) => setOccupation(event.target.value)} />
          </label>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}
          <button type="submit" className="settings-save" disabled={saving}>
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving" : "Save changes"}
          </button>
          <Link to="/billing" className="settings-billing-link">
            <CreditCard className="h-4 w-4" /> Manage membership
          </Link>
          <button type="button" className="settings-signout" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
        <section className="appearance-settings">
          <div className="appearance-settings-heading">
            <span className="account-page-icon">
              <Palette className="h-5 w-5" />
            </span>
            <div>
              <p className="practice-kicker">PREMIUM</p>
              <h2>Reading appearance</h2>
              <p>Choose colors for your fixed Orator reading screen.</p>
            </div>
            <span className="appearance-plan-tag">ORATOR PLUS</span>
          </div>
          {hasPaidAccess ? (
            <div className="appearance-controls">
              <div className="appearance-preview-wrap">
                <div className="appearance-preview-label">READING SCREEN PREVIEW</div>
                <div
                  className="appearance-preview-surface"
                  style={
                    {
                      backgroundColor: presentationPreferences.background,
                      color: presentationPreferences.accent,
                      "--preview-background": presentationPreferences.background,
                      "--preview-accent": presentationPreferences.accent,
                    } as CSSProperties
                  }
                >
                  <div className="appearance-preview-brand">
                    <img src="/orator-mark.svg" alt="" />
                    <span>Orator</span>
                  </div>
                  <p>
                    Find your <strong>steady voice</strong>, one word at a time.
                  </p>
                </div>
              </div>
              <div className="appearance-control-group">
                <div className="appearance-control-heading">
                  <h3>Reading colors</h3>
                  <p>Adjust the canvas and the word currently being read.</p>
                </div>
                <div className="appearance-color-row">
                  <label>
                    <span>
                      Reading background <small>Canvas</small>
                    </span>
                    <input
                      type="color"
                      value={presentationPreferences.background}
                      onChange={(event) =>
                        updatePresentationPreference("background", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <span>
                      Highlight color <small>Active word</small>
                    </span>
                    <input
                      type="color"
                      value={presentationPreferences.accent}
                      onChange={(event) =>
                        updatePresentationPreference("accent", event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
              <p className="appearance-storage-note">
                Color choices preview instantly. Save to apply them to your reading screen.
              </p>
              {presentationError && (
                <p className="auth-error" role="alert">
                  {presentationError}
                </p>
              )}
              {presentationMessage && (
                <p className="auth-message" role="status">
                  {presentationMessage}
                </p>
              )}
              <div className="appearance-actions">
                <button
                  type="button"
                  className="appearance-undo-button"
                  onClick={undoPresentationChanges}
                  disabled={!hasUnsavedPresentationChanges}
                  title="Restore the last saved reading colors"
                >
                  <RotateCcw className="h-4 w-4" /> Undo changes
                </button>
                <button type="button" className="settings-save" onClick={savePresentationSettings}>
                  <Save className="h-4 w-4" /> Save appearance
                </button>
              </div>
            </div>
          ) : (
            <div className="appearance-upgrade">
              <div className="appearance-upgrade-intro">
                <span className="appearance-upgrade-icon">
                  <Palette className="h-5 w-5" />
                </span>
                <div>
                  <h3>Make every practice session yours</h3>
                  <p>Premium tools for a focused, personal reading setup.</p>
                </div>
              </div>
              <ul className="appearance-feature-list">
                <li>
                  <Check className="h-4 w-4" /> Choose your reading canvas and word highlight
                </li>
                <li>
                  <Check className="h-4 w-4" /> Pair your look with analytics and sentence focus
                </li>
              </ul>
              <Link to="/billing" className="account-primary-link">
                <CreditCard className="h-4 w-4" /> Explore Premium
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
