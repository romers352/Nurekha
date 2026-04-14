import { motion } from "framer-motion";
import {
  MessageSquare,
  Brain,
  ShoppingBag,
  ToggleRight,
  BarChart2,
  Wallet,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI on every platform",
    description:
      "One AI handles Facebook, Instagram, WhatsApp, TikTok, and your website 24/7.",
  },
  {
    icon: Brain,
    title: "Learns your business",
    description:
      "Upload your menus, products, FAQs. Your AI knows your business inside out.",
  },
  {
    icon: ShoppingBag,
    title: "Takes orders automatically",
    description:
      "AI detects purchase intent, creates orders, sends payment links, confirms transactions.",
  },
  {
    icon: ToggleRight,
    title: "Live chat takeover",
    description:
      "Turn AI off per conversation and respond manually. Turn it back on anytime.",
  },
  {
    icon: BarChart2,
    title: "Real-time analytics",
    description:
      "See which channels drive the most messages and track your revenue at a glance.",
  },
  {
    icon: Wallet,
    title: "Nepal payments built-in",
    description:
      "eSewa, Khalti, COD, and bank transfer \u2014 fully integrated.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function FeaturesGrid() {
  return (
    <section
      data-testid="features-section"
      className="py-24 sm:py-32 bg-white"
    >
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs tracking-[0.2em] text-[#A8A29E] uppercase font-medium">
            Features
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#0C0A09] mt-3 tracking-tight leading-tight">
            Everything your business
            <br className="hidden sm:block" />
            needs, automated.
          </h2>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-14"
        >
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                variants={itemVariants}
                data-testid={`feature-card-${feat.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="bg-white border border-[#E7E5E4] rounded-2xl p-7 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
              >
                <div className="w-11 h-11 bg-[#F5F5F4] rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#0C0A09]" />
                </div>
                <h3 className="text-lg font-semibold text-[#0C0A09] mt-5 font-sans">
                  {feat.title}
                </h3>
                <p className="text-sm text-[#57534E] mt-2 leading-relaxed">
                  {feat.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
