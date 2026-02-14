"use client";

import { useRouter, useParams } from "next/navigation";
import { CheckCircle2, ShoppingBag, ArrowRight, ReceiptText } from "lucide-react";
import { motion } from "framer-motion";

export default function OrderSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 bg-[#fbfcfb]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-[#e8f0e4] bg-white p-10 text-center shadow-2xl shadow-[#2d6a4f]/5"
      >
        <div className="relative mb-8 flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              delay: 0.2 
            }}
            className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-[#f0f7ef] text-[#2d6a4f]"
          >
            <CheckCircle2 className="h-12 w-12" strokeWidth={2.5} />
          </motion.div>
          
          <div className="absolute top-0 flex h-24 w-24 animate-ping items-center justify-center rounded-full bg-[#2d6a4f]/10" />
        </div>

        <h1 className="text-3xl font-black tracking-tight text-[#1a2e1a]">
          Harvest Confirmed!
        </h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-[#5c7a5c]">
          Your order is being prepped by the farm. You'll receive live tracking updates shortly.
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-[#d4e7d0] bg-[#fbfcfb] p-5">
          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#7ca87c]">
            <ReceiptText size={14} /> Transaction ID
          </div>
          <div className="mt-2 font-mono text-sm font-bold text-[#2d6a4f]">
            #{orderId?.slice(0, 12).toUpperCase()}
          </div>
        </div>

        <div className="mt-10 space-y-3">
          <button
            onClick={() => router.push("/buyer/dashboard/orders")}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1b4332] py-4 text-sm font-black text-white shadow-xl shadow-[#1b4332]/20 transition-all hover:bg-[#2d6a4f] active:scale-[0.98]"
          >
            Track My Order <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => router.push("/buyer/dashboard/products")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e8f0e4] bg-white py-4 text-sm font-bold text-[#5c7a5c] transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            <ShoppingBag size={18} /> Continue Shopping
          </button>
        </div>

        <p className="mt-8 text-[10px] font-bold uppercase tracking-tighter text-[#7ca87c]/60">
          A confirmation email has been sent to your inbox
        </p>
      </motion.div>
    </div>
  );
}