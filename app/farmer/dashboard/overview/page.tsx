"use client";

import { motion } from "motion/react";
import { trpc } from "@/trpc/client";
import {
    TrendingUp,
    PackageSearch,
    Clock,
    Users,
    ArrowUpRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FarmerOverview() {
    const { data: summary, isLoading: sumLoading } = trpc.user.getFarmerSummary.useQuery();
    const { data: farmerOrders, isLoading: ordersLoading } = trpc.order.getFarmerOrders.useQuery();

    if (sumLoading || ordersLoading) return <OverviewSkeleton />;

    const stats = [
        { label: "Total Revenue", value: `₹${summary?.totalRevenue}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Pending Orders", value: summary?.pendingOrders, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "New Buyers", value: "12", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    ];

    return (
        <div className="w-full min-h-screen bg-[#fbfcfb]">
            <div className="mx-auto w-full max-w-(--breakpoint-2xl) p-4 md:p-8 space-y-8">

                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-[#1a2e1a]">Farmer Dashboard</h1>
                        <p className="text-sm text-[#5c7a5c]">Manage your harvest and monitor sales performance.</p>
                    </div>
                    <div className="flex gap-2 text-xs font-bold text-[#7ca87c]">
                        Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 w-full">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="rounded-3xl border border-[#e8f0e4] bg-white p-6 shadow-sm flex flex-col justify-between h-full"
                        >
                            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-[#7ca87c]">{stat.label}</p>
                                <h3 className="mt-1 text-3xl font-black text-[#1a2e1a]">{stat.value}</h3>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 w-full">

                    <div className="lg:col-span-8 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-lg font-bold text-[#1a2e1a]">Recent Sales</h2>
                            <button className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#2d6a4f] border border-[#e8f0e4] hover:bg-[#f8faf6] transition-all">
                                View All Transactions
                            </button>
                        </div>

                        <div className="overflow-x-auto rounded-[2rem] border border-[#e8f0e4] bg-white shadow-sm">
                            <table className="w-full min-w-[600px] text-left">
                                <thead className="bg-[#fbfcfb] text-[10px] font-black uppercase tracking-widest text-[#5c7a5c] border-b border-[#f0f4ee]">
                                    <tr>
                                        <th className="px-8 py-5">Buyer Info</th>
                                        <th className="px-8 py-5">Product Details</th>
                                        <th className="px-8 py-5 text-right">Revenue</th>
                                        <th className="px-8 py-5 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f0f4ee]">
                                    {farmerOrders?.slice(0, 6).map((order) => (
                                        <tr key={order.id} className="group hover:bg-[#f8faf6] transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#1a2e1a]">{order.buyerName}</span>
                                                    <span className="text-[10px] text-[#7ca87c]">{order.buyerEmail}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 overflow-hidden rounded-xl border border-[#e8f0e4]">
                                                        <img src={order.productImage} className="h-full w-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#1a2e1a]">{order.name}</p>
                                                        <p className="text-[10px] text-[#7ca87c]">{order.quantity} units</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-black text-[#2d6a4f]">₹{order.price}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <Badge variant="outline" className={`rounded-lg px-2.5 py-1 text-[10px] font-bold border-none shadow-xs ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {order.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-4">
                        <h2 className="text-lg font-bold text-[#1a2e1a] px-2">Top Performance</h2>
                        <div className="rounded-[2rem] border border-[#e8f0e4] bg-white p-3 shadow-sm">
                            <div className="space-y-2">
                                {farmerOrders?.slice(0, 4).map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-[#f8faf6] rounded-2xl transition-all border border-transparent hover:border-[#e8f0e4]">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f0f7ef] text-[#2d6a4f]">
                                            <PackageSearch size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#1a2e1a] truncate">{item.name}</p>
                                            <p className="text-[10px] font-medium text-[#7ca87c]">Sales: {item.quantity} units</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-[#2d6a4f]">₹{item.price}</p>
                                            <ArrowUpRight size={14} className="ml-auto text-[#d4ddd0]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-4 w-full rounded-2xl border border-dashed border-[#d4e7d0] py-4 text-xs font-bold text-[#5c7a5c] hover:bg-[#fbfcfb] transition-all">
                                Download Inventory Report
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function OverviewSkeleton() {
    return (
        <div className="w-full max-w-(--breakpoint-2xl) mx-auto p-8 space-y-8 animate-pulse">
            <div className="h-12 w-64 bg-gray-100 rounded-xl" />
            <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-50 rounded-[2rem]" />)}
            </div>
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8 h-[500px] bg-gray-50 rounded-[2rem]" />
                <div className="col-span-4 h-[500px] bg-gray-50 rounded-[2rem]" />
            </div>
        </div>
    );
}
