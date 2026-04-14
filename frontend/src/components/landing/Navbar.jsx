import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Services", href: "/services" },
  { label: "Docs", href: "/docs" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <>
      <nav
        data-testid="navbar"
        className={`fixed top-0 inset-x-0 z-50 h-16 flex items-center transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-[#E7E5E4]"
            : "bg-white/80 backdrop-blur-xl border-b border-transparent"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Wordmark */}
          <Link
            to="/"
            data-testid="navbar-logo"
            className="font-serif text-[22px] text-[#0C0A09] tracking-tight select-none"
          >
            Nurekha
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                data-testid={`nav-link-${link.label.toLowerCase()}`}
                className={`text-sm transition-colors ${
                  location.pathname === link.href
                    ? "text-[#0C0A09] font-medium"
                    : "text-[#57534E] hover:text-[#0C0A09]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              data-testid="nav-signin-btn"
              className="text-sm text-[#57534E] hover:text-[#0C0A09] transition-colors px-4 py-2"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              data-testid="nav-cta-btn"
              className="bg-[#0C0A09] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#1C1917] transition-colors inline-flex items-center gap-2"
            >
              Build Your Agent
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            data-testid="mobile-menu-toggle"
            className="md:hidden p-2 text-[#0C0A09]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            data-testid="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-white flex flex-col pt-20"
          >
            <div className="flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  data-testid={`mobile-nav-${link.label.toLowerCase()}`}
                  className="h-14 flex items-center px-6 text-base text-[#0C0A09] border-b border-[#E7E5E4] hover:bg-[#FAFAFA] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="px-6 mt-6 flex flex-col gap-3">
              <Link
                to="/login"
                data-testid="mobile-signin-btn"
                className="h-12 flex items-center justify-center border border-[#E7E5E4] rounded-lg text-sm text-[#0C0A09] hover:bg-[#FAFAFA] transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                data-testid="mobile-cta-btn"
                className="h-12 flex items-center justify-center bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] transition-colors"
              >
                Build Your Agent
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
