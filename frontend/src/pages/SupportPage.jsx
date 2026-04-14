import { LifeBuoy } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="support-page">
      <h1 className="font-serif text-[28px] text-[#0C0A09] mb-2">Support</h1>
      <p className="text-sm text-[#57534E] mb-8">Get help from our team.</p>
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-[#F5F5F4] flex items-center justify-center mx-auto">
          <LifeBuoy className="w-8 h-8 text-[#A8A29E]" />
        </div>
        <h3 className="font-serif text-xl text-[#0C0A09] mt-6">Support Center</h3>
        <p className="text-sm text-[#57534E] mt-2 max-w-xs mx-auto">Create and manage support tickets here.</p>
      </div>
    </div>
  );
}
