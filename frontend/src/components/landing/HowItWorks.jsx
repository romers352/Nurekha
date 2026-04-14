import { motion } from "framer-motion";
import { UserPlus, Bot, Plug, Zap } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: UserPlus,
    title: "Create account",
    description: "Sign up in 30 seconds with your email and business details.",
  },
  {
    num: "02",
    icon: Bot,
    title: "Build your agent",
    description: "Upload your FAQs, products, and business info to train your AI.",
  },
  {
    num: "03",
    icon: Plug,
    title: "Connect your pages",
    description: "Link Facebook, Instagram, WhatsApp, TikTok, or embed on your site.",
  },
  {
    num: "04",
    icon: Zap,
    title: "Go live",
    description: "Your AI starts responding to customers instantly. 24/7.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function HowItWorks() {
  return (
    <section
      data-testid="how-it-works-section"
      className="py-24 sm:py-32 bg-[#FAFAFA]"
    >
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-xs tracking-[0.2em] text-[#A8A29E] uppercase font-medium">
            How it works
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#0C0A09] mt-3 tracking-tight">
            Live in 10 minutes.
          </h2>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 mt-16 relative"
        >
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-[52px] left-[12.5%] right-[12.5%] h-px border-t border-dashed border-[#D6D3D1]" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                variants={itemVariants}
                data-testid={`step-${step.num}`}
                className="text-center relative"
              >
                <span className="font-serif text-5xl text-[#E7E5E4] select-none leading-none">
                  {step.num}
                </span>
                <div className="w-12 h-12 mx-auto mt-3 bg-white border border-[#E7E5E4] rounded-xl flex items-center justify-center relative z-10">
                  <Icon className="w-5 h-5 text-[#0C0A09]" />
                </div>
                <h3 className="text-base font-semibold text-[#0C0A09] mt-4 font-sans">
                  {step.title}
                </h3>
                <p className="text-sm text-[#57534E] mt-1.5 leading-relaxed max-w-[200px] mx-auto">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
