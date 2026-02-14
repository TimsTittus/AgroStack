"use client";

import { useRouter, useParams, redirect } from "next/navigation";
import { trpc } from "@/trpc/client";
import { motion } from "framer-motion";
import {
    ShieldCheck,
    ChevronRight,
    Package,
    CreditCard,
    Loader2,
    ArrowLeft
} from "lucide-react";

export default function CheckoutPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.orderId as string;

    const { data: order, isLoading } = trpc.order.getOrderById.useQuery(
        { id: orderId },
        { enabled: !!orderId }
    );
    const orderMessgae = trpc.order.orderMessage.useMutation();

    const handleConfirm = () => {
        orderMessgae.mutate({ orderId });
        redirect(`/buyer/dashboard/orders`);
    };

    if (isLoading) return <CheckoutSkeleton />;
    if (!order) return <div className="p-20 text-center font-medium text-rose-500">Order not found</div>;

    return (
        <div className="min-h-screen bg-[#fbfcfb] py-12 px-4">
            <div className="mx-auto max-w-2xl">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-sm font-bold text-[#5c7a5c] hover:text-[#2d6a4f] transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Market
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-black tracking-tight text-[#1a2e1a]">Checkout</h1>
                    <p className="text-sm text-[#5c7a5c]">Review your harvest details before confirming</p>
                </div>

                <div className="grid gap-6">
                    {/* Order Summary Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="overflow-hidden rounded-3xl border border-[#e8f0e4] bg-white shadow-sm"
                    >
                        <div className="border-b border-[#f0f4ee] bg-[#fbfcfb] px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-[#2d6a4f]" />
                                <h2 className="text-xs font-black uppercase tracking-widest text-[#5c7a5c]">Product Details</h2>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-[#1a2e1a]">{order.name}</h3>
                                    <p className="text-sm text-[#7ca87c]">Quantity: <span className="font-bold text-[#1a2e1a]">{order.quantity}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-[#5c7a5c] uppercase">Unit Price</p>
                                    <p className="text-sm font-bold text-[#1a2e1a]">₹{(Number(order.price) / Number(order.quantity)).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Pricing Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-3xl border border-[#e8f0e4] bg-white p-6 shadow-sm"
                    >
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#5c7a5c]">Subtotal</span>
                                <span className="font-bold text-[#1a2e1a]">₹{order.price}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#5c7a5c]">Platform Fee</span>
                                <span className="font-bold text-[#2d6a4f]">FREE</span>
                            </div>
                            <div className="my-2 border-t border-[#f0f4ee] pt-3 flex justify-between">
                                <span className="text-base font-bold text-[#1a2e1a]">Total Amount</span>
                                <span className="text-xl font-black text-[#1b4332]">₹{order.price}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Secure Payment Note */}
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f0f7ef] p-4 border border-[#d4e7d0]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2d6a4f] shadow-sm">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#1a2e1a]">Secure Transaction</p>
                            <p className="text-[10px] text-[#5c7a5c]">Your payment info is encrypted and processed via our secure farm network.</p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleConfirm}
                        disabled={orderMessgae.isPending}
                        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#1b4332] py-4 text-sm font-black text-white shadow-xl shadow-[#1b4332]/20 transition-all hover:bg-[#2d6a4f] active:scale-[0.98] disabled:opacity-70"
                    >
                        {orderMessgae.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Confirm and Pay ₹{order.price}
                                <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CheckoutSkeleton() {
    return (
        <div className="mx-auto max-w-2xl p-12 animate-pulse">
            <div className="h-10 w-48 rounded-lg bg-gray-100 mb-8" />
            <div className="h-40 rounded-3xl bg-gray-50 mb-6" />
            <div className="h-32 rounded-3xl bg-gray-50 mb-6" />
            <div className="h-14 rounded-2xl bg-gray-100" />
        </div>
    );
}