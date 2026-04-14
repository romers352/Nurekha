import { Link } from "react-router-dom";

const footerLinks = {
  Product: [
    { label: "Features", href: "/services" },
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Changelog", href: "/docs" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  Support: [
    { label: "Help Center", href: "/support" },
    { label: "Status", href: "/status" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer data-testid="footer" className="bg-[#0C0A09] border-t border-white/[0.06]">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="font-serif text-xl text-white">
              Nurekha
            </Link>
            <p className="text-sm text-white/40 mt-3 leading-relaxed">
              AI chat automation
              <br />
              for Nepali businesses.
            </p>
            <p className="text-xs text-white/25 mt-4">Made for Nepal</p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-xs font-medium text-white/50 uppercase tracking-widest mb-4">
                {group}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-sm text-white/40 hover:text-white/80 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/[0.06]">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Nurekha. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/20">eSewa</span>
            <span className="text-xs text-white/20">Khalti</span>
            <span className="text-xs text-white/20">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
