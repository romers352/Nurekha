import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageSquare, Brain, ShoppingBag, ToggleRight, BarChart2, Wallet, Globe, Plug, ArrowRight } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const services = [
  { icon: MessageSquare, title: "Multi-Channel AI Chat", description: "Deploy a single AI assistant across Facebook Messenger, Instagram DMs, WhatsApp Business, TikTok messages, and your website. One AI, five channels, always on.", features: ["Unified inbox for all channels", "Channel-specific formatting", "Automatic language detection", "24/7 availability"] },
  { icon: Brain, title: "Custom AI Training", description: "Train your AI with your business data. Upload FAQs, product catalogs, menus, and policies. Your AI learns your business inside out.", features: ["FAQ-based training", "Product catalog integration", "CSV bulk import", "Business hours awareness"] },
  { icon: ShoppingBag, title: "Automated Order Management", description: "Your AI detects purchase intent, creates orders, tracks delivery, and manages the full order lifecycle from conversation to completion.", features: ["Intent detection", "Order creation from chat", "Status tracking", "Refund management"] },
  { icon: ToggleRight, title: "Human Takeover", description: "Seamlessly switch between AI and human agents. Turn off AI for specific conversations, respond manually, then hand back to AI.", features: ["Per-conversation toggle", "Keyword-triggered handoff", "Agent notification", "Full conversation history"] },
  { icon: BarChart2, title: "Business Analytics", description: "Real-time dashboard showing message volumes, channel performance, conversion rates, and revenue tracking.", features: ["Message analytics", "Channel comparison", "Conversion tracking", "Export reports"] },
  { icon: Wallet, title: "Nepal Payments", description: "Accept payments through eSewa, Khalti, bank transfer, and cash on delivery. Built specifically for the Nepali market.", features: ["eSewa integration", "Khalti integration", "COD support", "Payment verification"] },
];

const containerV = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemV = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white" data-testid="services-page">
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="py-20 sm:py-28 px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs tracking-[0.2em] text-[#A8A29E] uppercase font-medium">Services</p>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#0C0A09] mt-3 tracking-tight">Everything you need to automate customer conversations.</h1>
            <p className="text-base text-[#57534E] mt-4 max-w-lg mx-auto">From AI chat to order management, built for how Nepali businesses work.</p>
          </motion.div>
        </section>

        {/* Services */}
        <section className="pb-24 px-6">
          <motion.div variants={containerV} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-5xl mx-auto space-y-8">
            {services.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <motion.div key={svc.title} variants={itemV} className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all" data-testid={`service-${i}`}>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="shrink-0"><div className="w-12 h-12 bg-[#F5F5F4] rounded-xl flex items-center justify-center"><Icon className="w-6 h-6 text-[#0C0A09]" /></div></div>
                    <div className="flex-1">
                      <h3 className="font-serif text-2xl text-[#0C0A09]">{svc.title}</h3>
                      <p className="text-sm text-[#57534E] mt-2 leading-relaxed">{svc.description}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">{svc.features.map(f => (<span key={f} className="flex items-center gap-1.5 text-sm text-[#57534E]"><span className="w-1 h-1 rounded-full bg-[#0C0A09]" />{f}</span>))}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* CTA */}
        <section className="bg-[#0C0A09] py-20 px-6 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl text-white">Ready to automate?</h2>
          <p className="text-base text-white/50 mt-3">Start free with 1,000 messages. No card required.</p>
          <Link to="/signup" data-testid="services-cta" className="mt-6 inline-flex items-center justify-center h-12 px-8 bg-white text-[#0C0A09] rounded-xl text-sm font-medium hover:bg-[#FAFAFA] gap-2">Get Started <ArrowRight className="w-4 h-4" /></Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
