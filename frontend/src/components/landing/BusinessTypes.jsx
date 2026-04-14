import { motion } from "framer-motion";
import {
  Store,
  Building,
  Scissors,
  UtensilsCrossed,
  Stethoscope,
  Home,
  Plane,
  GraduationCap,
  Plus,
} from "lucide-react";

const types = [
  { icon: Store, label: "E-commerce" },
  { icon: Building, label: "Hotel" },
  { icon: Scissors, label: "Salon / Spa" },
  { icon: UtensilsCrossed, label: "Restaurant" },
  { icon: Stethoscope, label: "Healthcare" },
  { icon: Home, label: "Real Estate" },
  { icon: Plane, label: "Travel" },
  { icon: GraduationCap, label: "Education" },
  { icon: Plus, label: "Other" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function BusinessTypes() {
  return (
    <section
      data-testid="business-types-section"
      className="py-24 sm:py-32 bg-white"
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
            For every business
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#0C0A09] mt-3 tracking-tight">
            Built for how Nepal works.
          </h2>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 mt-14"
        >
          {types.map((t) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.label}
                variants={itemVariants}
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "#F5F0EB",
                  borderColor: "#0C0A09",
                }}
                transition={{ duration: 0.2 }}
                data-testid={`biz-type-${t.label.toLowerCase().replace(/[\s\/]+/g, "-")}`}
                className="bg-white border border-[#E7E5E4] rounded-2xl p-4 text-center cursor-pointer select-none"
              >
                <Icon className="w-7 h-7 mx-auto text-[#57534E]" />
                <span className="block text-xs font-medium text-[#57534E] mt-2.5 leading-tight">
                  {t.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
