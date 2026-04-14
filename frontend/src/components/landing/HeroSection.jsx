import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section
      data-testid="hero-section"
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
    >
      {/* Dot Grid Background */}
      <div
        className="absolute inset-0 -z-10 h-full w-full bg-white"
        style={{
          backgroundImage: "radial-gradient(#E7E5E4 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="w-full max-w-[900px] mx-auto text-center px-6 py-24 md:py-32 lg:py-40">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-[#E7E5E4] px-4 py-1.5 mb-8"
        >
          <span className="text-sm text-[#57534E]">Built for Nepal</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-[#0C0A09] leading-[1.05] tracking-tight"
        >
          Your business,
          <br />
          <span className="italic">always online.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-base md:text-lg text-[#57534E] max-w-lg mx-auto mt-6 leading-relaxed"
        >
          Deploy an AI assistant across Facebook, Instagram, WhatsApp, TikTok
          and your website. In minutes. No code required.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link
            to="/signup"
            data-testid="hero-cta-primary"
            className="h-12 px-6 bg-[#0C0A09] text-white rounded-xl text-sm font-medium hover:bg-[#1C1917] transition-colors inline-flex items-center justify-center gap-2"
          >
            Build your agent free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            data-testid="hero-cta-secondary"
            className="h-12 px-6 border border-[#E7E5E4] text-[#0C0A09] rounded-xl text-sm font-medium hover:bg-[#FAFAFA] transition-colors inline-flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Watch demo
          </button>
        </motion.div>

        {/* Social Proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="mt-10 text-sm text-[#A8A29E]"
        >
          Trusted by 200+ Nepali businesses
        </motion.p>
      </div>
    </section>
  );
}
