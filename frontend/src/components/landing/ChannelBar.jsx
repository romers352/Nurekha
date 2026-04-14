import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  MessageCircle,
  Music2,
  Globe,
} from "lucide-react";

const channels = [
  { name: "Facebook", icon: Facebook, color: "#1877F2" },
  { name: "Instagram", icon: Instagram, color: "#E4405F" },
  { name: "WhatsApp", icon: MessageCircle, color: "#25D366" },
  { name: "TikTok", icon: Music2, color: "#010101" },
  { name: "Website", icon: Globe, color: "#6366F1" },
];

export default function ChannelBar() {
  return (
    <section
      data-testid="channel-bar"
      className="w-full bg-[#FAFAFA] border-y border-[#E7E5E4] py-5"
    >
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
        <span className="text-xs text-[#A8A29E] uppercase tracking-widest font-medium shrink-0">
          Works on
        </span>
        <div className="flex items-center gap-6 flex-wrap justify-center">
          {channels.map((ch, i) => {
            const Icon = ch.icon;
            return (
              <motion.div
                key={ch.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * i }}
                data-testid={`channel-${ch.name.toLowerCase()}`}
                className="flex items-center gap-2 group cursor-default"
              >
                <span
                  className="w-2 h-2 rounded-full transition-transform group-hover:scale-125"
                  style={{ backgroundColor: ch.color }}
                />
                <span className="text-sm text-[#57534E] group-hover:text-[#0C0A09] transition-colors">
                  {ch.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
