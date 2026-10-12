import { Link, useNavigate } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

import { SiteNavbar } from "./site-navbar";
import { supabase } from "../lib/supabase";

type AuthPageProps = {
  mode: "sign-in" | "sign-up";
};

const REGIONS: Record<string, string[]> = {
  Australia: [
    "Australian Capital Territory",
    "New South Wales",
    "Northern Territory",
    "Queensland",
    "South Australia",
    "Tasmania",
    "Victoria",
    "Western Australia",
  ],
  Canada: [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
  ],
  India: [
    "Andhra Pradesh",
    "Assam",
    "Bihar",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Tamil Nadu",
    "Telangana",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ],
  "United Kingdom": ["England", "Northern Ireland", "Scotland", "Wales"],
  "United States": [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ],
};

const COUNTRIES = [
  "Australia",
  "Canada",
  "Ghana",
  "India",
  "Nigeria",
  "United Kingdom",
  "United States",
  "Other",
];
const OCCUPATIONS = [
  "Student",
  "Educator",
  "Business professional",
  "Public speaker",
  "Healthcare professional",
  "Creative professional",
  "Other",
];

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const isSignUp = mode === "sign-up";
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [country, setCountry] = useState("");
  const [otherCountry, setOtherCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [occupation, setOccupation] = useState("");
  const [otherOccupation, setOtherOccupation] = useState("");
  const [occupationSkipped, setOccupationSkipped] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const hasName = firstName.trim().length > 0;
  const hasSurname = surname.trim().length > 0;
  const hasCountry = country.length > 0 && (country !== "Other" || otherCountry.trim().length > 0);
  const hasRegion = stateRegion.trim().length > 0;
  const hasOccupation =
    occupationSkipped ||
    (occupation.length > 0 && (occupation !== "Other" || otherOccupation.trim().length > 0));
  const hasPhone = phone.trim().length > 0;
  const hasEmail = email.trim().length > 0;
  const hasPassword = password.length >= 8;
  const showSurname = isSignUp && hasName;
  const showCountry = isSignUp && hasName && hasSurname;
  const showRegion = isSignUp && hasName && hasSurname && hasCountry;
  const showOccupation = isSignUp && hasName && hasSurname && hasCountry && hasRegion;
  const showPhone = isSignUp && hasName && hasSurname && hasCountry && hasRegion && hasOccupation;
  const showEmail = !isSignUp || (showPhone && hasPhone);
  const showPasswordField = showEmail && hasEmail;
  const showConfirmPasswordField = isSignUp && showPasswordField && hasPassword;

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setSessionEmail(data.session?.user.email ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!supabase) {
      setError(
        "Supabase is not connected. Create a .env file from .env.example, add your project URL and public key, then restart the app.",
      );
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/sign-in`,
            data: {
              first_name: firstName.trim(),
              surname: surname.trim(),
              country: country === "Other" ? otherCountry.trim() : country,
              state_region: stateRegion.trim(),
              occupation: (occupation === "Other" ? otherOccupation.trim() : occupation) || null,
              phone: phone.trim(),
            },
          },
        });
        if (signUpError) throw signUpError;
        setMessage(
          data.session
            ? "Your account is ready. You are signed in."
            : "Check your inbox for a confirmation link to finish creating your account.",
        );
        if (data.session) void navigate({ to: "/practice" });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        setMessage("You are signed in.");
        void navigate({ to: "/practice" });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    setError("");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
    else setMessage("You have signed out.");
  }

  async function handleGoogleAuth() {
    if (!supabase) {
      setError(
        "Supabase is not connected. Create a .env file from .env.example, add your project URL and public key, then restart the app.",
      );
      return;
    }
    setGoogleLoading(true);
    setError("");
    setMessage("");
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/practice`,
      },
    });
    if (googleError) {
      setGoogleLoading(false);
      setError(googleError.message);
    }
  }

  return (
    <main className="auth-page">
      <SiteNavbar showMenu={false} />

      <section className="auth-content">
        <div className="auth-heading">
          <p className="practice-kicker">SPEAKING PRACTICE</p>
          <h1>{isSignUp ? "Create your account" : "Welcome back"}</h1>
          <p>
            {isSignUp
              ? "Create an account and make room for regular practice."
              : "Sign in to continue your speaking practice."}
          </p>
        </div>

        <div className="auth-panel">
          {sessionEmail ? (
            <div className="auth-session-card" role="status">
              <div className="auth-session-avatar">{sessionEmail.slice(0, 1).toUpperCase()}</div>
              <p className="auth-session-label">YOU ARE SIGNED IN</p>
              <p className="auth-session-email">{sessionEmail}</p>
              <p className="auth-session-copy">Your practice space is ready whenever you are.</p>
              <div className="auth-session-actions">
                <Link to="/" className="auth-submit auth-continue">
                  Continue to Orator
                </Link>
                <button type="button" className="auth-secondary-action" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="google-auth-button"
                onClick={handleGoogleAuth}
                disabled={loading || googleLoading}
              >
                <svg className="google-auth-mark" viewBox="0 0 48 48" aria-hidden="true">
                  <path
                    fill="#FFC107"
                    d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 19.2-7.2 19.2-20 0-1.3-.1-2.4-.4-3.5Z"
                  />
                  <path
                    fill="#FF3D00"
                    d="m6.3 14.7 6.6 4.8C14.7 16 18.9 12 24 12c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.4 39.3 16.1 44 24 44Z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.1 5.4-6 6.8l6.2 5.2C35.1 38.8 44 33.1 44 24c0-1.3-.1-2.4-.4-3.5Z"
                  />
                </svg>
                {googleLoading ? "Connecting to Google" : "Continue with Google"}
              </button>
              <div className="auth-divider" aria-hidden="true">
                <span>or use email</span>
              </div>
              <form className="auth-form" onSubmit={handleSubmit}>
                {isSignUp && (
                  <div className="auth-name-fields">
                    <div className="auth-field-step">
                      <label htmlFor="auth-first-name">Name</label>
                      <input
                        id="auth-first-name"
                        type="text"
                        autoComplete="given-name"
                        required
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    {showSurname && (
                      <div className="auth-field-step">
                        <label htmlFor="auth-surname">Surname</label>
                        <input
                          id="auth-surname"
                          type="text"
                          autoComplete="family-name"
                          required
                          value={surname}
                          onChange={(event) => setSurname(event.target.value)}
                          placeholder="Your surname"
                        />
                      </div>
                    )}
                  </div>
                )}
                {isSignUp && (
                  <>
                    {showCountry && (
                      <div className="auth-field-step">
                        <label htmlFor="auth-country">Country</label>
                        <select
                          id="auth-country"
                          required
                          value={country}
                          onChange={(event) => {
                            setCountry(event.target.value);
                            setStateRegion("");
                          }}
                        >
                          <option value="">Choose your country</option>
                          {COUNTRIES.map((countryName) => (
                            <option key={countryName} value={countryName}>
                              {countryName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {showCountry && country === "Other" && (
                      <input
                        className="auth-field-step"
                        id="auth-country-other"
                        type="text"
                        autoComplete="country-name"
                        required
                        value={otherCountry}
                        onChange={(event) => setOtherCountry(event.target.value)}
                        placeholder="Enter your country"
                      />
                    )}
                    {showRegion && (
                      <div className="auth-field-step">
                        <label htmlFor="auth-state">State / province / region</label>
                        {REGIONS[country] ? (
                          <select
                            id="auth-state"
                            required
                            value={stateRegion}
                            onChange={(event) => setStateRegion(event.target.value)}
                          >
                            <option value="">Choose your state or region</option>
                            {REGIONS[country].map((region) => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id="auth-state"
                            type="text"
                            autoComplete="address-level1"
                            required
                            value={stateRegion}
                            onChange={(event) => setStateRegion(event.target.value)}
                            placeholder="Enter your state or region"
                          />
                        )}
                      </div>
                    )}
                    {showOccupation && (
                      <div className="auth-field-step">
                        <label htmlFor="auth-occupation">Occupation</label>
                        <select
                          id="auth-occupation"
                          value={occupation}
                          onChange={(event) => {
                            setOccupation(event.target.value);
                            setOccupationSkipped(false);
                          }}
                        >
                          <option value="">Choose an occupation</option>
                          {OCCUPATIONS.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                        {occupation === "Other" && (
                          <input
                            id="auth-occupation-other"
                            type="text"
                            required
                            value={otherOccupation}
                            onChange={(event) => setOtherOccupation(event.target.value)}
                            placeholder="Enter your occupation"
                          />
                        )}
                        {!hasOccupation && (
                          <button
                            type="button"
                            className="auth-field-skip"
                            onClick={() => setOccupationSkipped(true)}
                          >
                            Skip optional occupation
                          </button>
                        )}
                      </div>
                    )}
                    {showPhone && (
                      <div className="auth-field-step">
                        <label htmlFor="auth-phone">Phone number</label>
                        <input
                          id="auth-phone"
                          type="tel"
                          autoComplete="tel"
                          required
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          placeholder="Include your country code"
                        />
                      </div>
                    )}
                  </>
                )}
                {showEmail && (
                  <div className="auth-field-step">
                    <label htmlFor="auth-email">Email address</label>
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                )}
                {showPasswordField && (
                  <div className="auth-field-step">
                    <label htmlFor="auth-password">Password</label>
                    <div className="password-field">
                      <input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={isSignUp ? "new-password" : "current-password"}
                        minLength={8}
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 8 characters"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {showConfirmPasswordField && (
                  <>
                    <div className="auth-field-step">
                      <label htmlFor="auth-confirm-password">Confirm password</label>
                      <div className="password-field">
                        <input
                          id="auth-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          minLength={8}
                          required
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="Enter your password again"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowConfirmPassword((visible) => !visible)}
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirmed password"
                              : "Show confirmed password"
                          }
                          title={
                            showConfirmPassword
                              ? "Hide confirmed password"
                              : "Show confirmed password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
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
                {(!isSignUp && showPasswordField) || (isSignUp && showConfirmPasswordField) ? (
                  <button type="submit" className="auth-submit" disabled={loading}>
                    {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    {loading ? "Please wait" : isSignUp ? "Create account" : "Sign in"}
                  </button>
                ) : null}
              </form>
            </>
          )}

          {!sessionEmail && (
            <p className="auth-switch">
              {isSignUp ? "Already have an account?" : "New to Orator?"}{" "}
              <Link to={isSignUp ? "/sign-in" : "/sign-up"}>
                {isSignUp ? "Sign in" : "Create an account"}
              </Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
