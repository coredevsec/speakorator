import { Link, useNavigate } from "@tanstack/react-router";
import { BookMarked, CreditCard, LogOut, Menu, Mic, Settings, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { supabase } from "../lib/supabase";

export function SiteNavbar({
  brandText = "rator",
  brandTo = "/",
  showMenu = true,
  children,
}: {
  brandText?: string;
  brandTo?: "/" | "/practice";
  showMenu?: boolean;
  children?: ReactNode;
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  async function signOut() {
    await supabase?.auth.signOut();
    setMenuOpen(false);
    void navigate({ to: "/sign-in", replace: true });
  }

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      if (!session) setMenuOpen(false);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [menuOpen]);

  return (
    <header className="site-navbar">
      <Link to={brandTo} className="site-navbar-brand">
        <span className="brand-mark-frame">
          <img src="/orator-mark.svg" alt="" className="brand-mark-image" />
        </span>
        <span>{brandText}</span>
      </Link>
      <div className="site-navbar-actions">
        {children}
        {showMenu && (
          <div className="account-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="account-menu-trigger"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {menuOpen && (
              <nav className="account-menu" aria-label="Site navigation">
                <Link to="/practice" onClick={() => setMenuOpen(false)}>
                  <Mic className="h-4 w-4" /> Practice
                </Link>
                <Link to="/voice-typing" onClick={() => setMenuOpen(false)}>
                  <Mic className="h-4 w-4" /> Voice typing
                </Link>
                <Link to="/saved-practices" onClick={() => setMenuOpen(false)}>
                  <BookMarked className="h-4 w-4" /> Library
                </Link>
                <Link to="/settings" onClick={() => setMenuOpen(false)}>
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <Link to="/billing" onClick={() => setMenuOpen(false)}>
                  <CreditCard className="h-4 w-4" /> Membership
                </Link>
                {!signedIn && (
                  <>
                    <Link to="/sign-in" onClick={() => setMenuOpen(false)}>
                      Sign in
                    </Link>
                    <Link to="/sign-up" onClick={() => setMenuOpen(false)}>
                      Sign up
                    </Link>
                  </>
                )}
                {signedIn && (
                  <button type="button" role="menuitem" onClick={() => void signOut()}>
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                )}
              </nav>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
