import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section
      data-testid="cta-section"
      className="relative bg-[#0C0A09] overflow-hidden py-28 sm:py-36 border-t border-[#1C1917]"
    >
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' fill='white'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative w-full max-w-2xl mx-auto text-center px-6">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-serif text-4xl sm:text-5xl text-white leading-tight tracking-tight"
        >
          Never miss a customer
          <br />
          message again.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-base sm:text-lg text-white/50 mt-5"
        >
          Join 200+ Nepali businesses automating their growth.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8"
        >
          <Link
            to="/signup"
            data-testid="cta-start-free"
            className="inline-flex items-center justify-center gap-2 bg-white text-[#0C0A09] h-12 px-8 rounded-xl text-sm font-medium hover:bg-[#FAFAFA] transition-colors"
          >
            Start free — no card needed
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
