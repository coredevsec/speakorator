import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

export function SiteNavbar({
  brandText = "Orator",
  brandTo = "/",
  showMenu = true,
  children,
}: {
  brandText?: string;
  brandTo?: "/" | "/practice";
  showMenu?: boolean;
  children?: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <div className="account-menu-wrap">
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
                  Practice
                </Link>
                <Link to="/voice-typing" onClick={() => setMenuOpen(false)}>
                  Voice typing
                </Link>
                <Link to="/saved-practices" onClick={() => setMenuOpen(false)}>
                  Saved practices
                </Link>
                <Link to="/settings" onClick={() => setMenuOpen(false)}>
                  Settings
                </Link>
                <Link to="/billing" onClick={() => setMenuOpen(false)}>
                  Membership
                </Link>
                <Link to="/sign-in" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
                <Link to="/sign-up" onClick={() => setMenuOpen(false)}>
                  Sign up
                </Link>
              </nav>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
