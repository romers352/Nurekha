import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageSquare, Bot, Check, ArrowRight, Zap } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const MSG_PACKS = [
  { pack_id: "msg_1k", name: "1,000 Messages", amount: 1000, price: 499, perMsg: "0.50" },
  { pack_id: "msg_5k", name: "5,000 Messages", amount: 5000, price: 1999, perMsg: "0.40", popular: true },
  { pack_id: "msg_20k", name: "20,000 Messages", amount: 20000, price: 6999, perMsg: "0.35" },
];

const AGENT_PACKS = [
  { pack_id: "agent_1", name: "+1 Agent Slot", amount: 1, price: 999 },
  { pack_id: "agent_3", name: "+3 Agent Slots", amount: 3, price: 2499, popular: true },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white" data-testid="pricing-page">
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="py-20 sm:py-28 px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs tracking-[0.2em] text-[#A8A29E] uppercase font-medium">Pricing</p>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#0C0A09] mt-3 tracking-tight">
              Pay only for what you use.
            </h1>
            <p className="text-base text-[#57534E] mt-4 max-w-lg mx-auto">
              Start free with 1,000 messages and 2 agents. Buy more credits anytime. No monthly subscriptions.
            </p>
          </motion.div>
        </section>

        {/* Free Tier */}
        <section className="pb-16 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-[#FAFAFA] border border-[#E7E5E4] rounded-2xl p-8 text-center">
              <Zap className="w-8 h-8 text-[#0C0A09] mx-auto" />
              <h2 className="font-serif text-3xl text-[#0C0A09] mt-4">Free to start</h2>
              <p className="text-sm text-[#57534E] mt-2">Every account gets these for free:</p>
              <div className="flex flex-wrap justify-center gap-6 mt-6">
                {["1,000 messages", "2 AI agents", "All 5 channels", "Basic analytics", "Email support"].map(f => (
                  <span key={f} className="flex items-center gap-1.5 text-sm text-[#0C0A09]"><Check className="w-4 h-4 text-[#166534]" />{f}</span>
                ))}
              </div>
              <Link to="/signup" data-testid="pricing-signup-btn" className="mt-6 inline-flex items-center justify-center h-12 px-8 bg-[#0C0A09] text-white rounded-xl text-sm font-medium hover:bg-[#1C1917] gap-2">
                Start free <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Message Credits */}
        <section className="py-16 px-6 bg-white" data-testid="message-packs-section">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="w-10 h-10 bg-[#F5F5F4] rounded-xl flex items-center justify-center mx-auto"><MessageSquare className="w-5 h-5 text-[#0C0A09]" /></div>
              <h2 className="font-serif text-3xl text-[#0C0A09] mt-4">Message Credits</h2>
              <p className="text-sm text-[#57534E] mt-2">Buy message packs when you need more capacity.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {MSG_PACKS.map(pack => (
                <motion.div key={pack.pack_id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} data-testid={`pack-${pack.pack_id}`} className={`relative bg-white border rounded-2xl p-6 shadow-card ${pack.popular ? "border-[#0C0A09] ring-1 ring-[#0C0A09]" : "border-[#E7E5E4]"}`}>
                  {pack.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0C0A09] text-white text-xs font-medium px-3 py-1 rounded-full">Best Value</span>}
                  <h3 className="text-lg font-semibold text-[#0C0A09]">{pack.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-sm text-[#57534E]">NPR</span>
                    <span className="font-serif text-4xl text-[#0C0A09]">{pack.price.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-[#A8A29E] mt-1">NPR {pack.perMsg} per message</p>
                  <Link to="/login" className="mt-5 w-full h-10 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center justify-center">Buy Credits</Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Agent Slots */}
        <section className="py-16 px-6 bg-[#FAFAFA]" data-testid="agent-packs-section">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto border border-[#E7E5E4]"><Bot className="w-5 h-5 text-[#0C0A09]" /></div>
              <h2 className="font-serif text-3xl text-[#0C0A09] mt-4">Agent Slots</h2>
              <p className="text-sm text-[#57534E] mt-2">Need more than 2 agents? Add extra slots.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-xl mx-auto">
              {AGENT_PACKS.map(pack => (
                <motion.div key={pack.pack_id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} data-testid={`pack-${pack.pack_id}`} className={`bg-white border rounded-2xl p-6 shadow-card ${pack.popular ? "border-[#0C0A09] ring-1 ring-[#0C0A09]" : "border-[#E7E5E4]"}`}>
                  <h3 className="text-lg font-semibold text-[#0C0A09]">{pack.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1"><span className="text-sm text-[#57534E]">NPR</span><span className="font-serif text-4xl text-[#0C0A09]">{pack.price.toLocaleString()}</span><span className="text-sm text-[#A8A29E]">one-time</span></div>
                  <Link to="/login" className="mt-5 w-full h-10 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center justify-center">Add Agents</Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl text-[#0C0A09] text-center mb-8">Common Questions</h2>
            {[
              { q: "What counts as a message?", a: "Each incoming customer message and each AI reply counts as one message each. So a typical conversation of 5 back-and-forth exchanges uses 10 messages." },
              { q: "Do unused messages expire?", a: "No. Your message credits never expire. Use them at your own pace." },
              { q: "Can I add agents later?", a: "Yes. You can buy additional agent slots anytime from your dashboard." },
              { q: "What payment methods do you accept?", a: "We accept eSewa, Khalti, and bank transfer. All payments are processed securely." },
            ].map((item, i) => (
              <div key={i} className="border-b border-[#E7E5E4] py-5">
                <h3 className="text-sm font-semibold text-[#0C0A09]">{item.q}</h3>
                <p className="text-sm text-[#57534E] mt-1.5">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
