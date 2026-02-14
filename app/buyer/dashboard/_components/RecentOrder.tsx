"use client";

import { motion } from "motion/react";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Truck, Package, CheckCircle2, Clock } from "lucide-react";

const getLiveTrackingData = (id: string, status: string) => {
  const seed = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const baseMap: Record<string, { min: number; max: number; label: string; icon: any }> = {
    pending: { min: 5, max: 20, label: "Processing", icon: Clock },
    confirmed: { min: 25, max: 45, label: "Packing", icon: Package },
    shipped: { min: 50, max: 85, label: "In Transit", icon: Truck },
    delivered: { min: 100, max: 100, label: "Arrived", icon: CheckCircle2 },
    cancelled: { min: 0, max: 0, label: "Void", icon: Clock },
  };

  const config = baseMap[status.toLowerCase()] || baseMap.pending;
  
  const range = config.max - config.min;
  const randomValue = range === 0 ? config.max : config.min + (seed % range);

  return {
    progress: randomValue,
    label: config.label,
    Icon: config.icon
  };
};

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  pending: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  confirmed: { color: "text-violet-700", bg: "bg-violet-50 border-violet-200", dot: "bg-violet-500" },
  shipped: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", dot: "bg-blue-500" },
  delivered: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  cancelled: { color: "text-rose-700", bg: "bg-rose-50 border-rose-200", dot: "bg-rose-500" },
};

export function RecentOrders() {
  const { data: liveOrders, isLoading } = trpc.order.getRecentOrders.useQuery();

  if (isLoading) return <RecentOrdersSkeleton />;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1a2e1a]">Live Tracking</h2>
          <p className="text-sm text-[#5c7a5c]">Real-time status of your farm produce</p>
        </div>
        <button className="rounded-full border border-[#d4e7d0] bg-white px-4 py-2 text-xs font-semibold text-[#2d6a4f] transition-all duration-200 hover:bg-[#e8f0e4] hover:shadow-sm">
          View All
        </button>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl border border-[#e8f0e4] bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#e8f0e4] hover:bg-transparent bg-[#fbfcfb]">
              <TableHead className="w-\[120px\] text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">ID</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">Product</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">Total</TableHead>
              <TableHead className="w-\[200px\] text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">Live Tracking</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {liveOrders?.map((order) => {
              const tracking = getLiveTrackingData(order.id, order.status);
              const config = statusConfig[order.status.toLowerCase()] || statusConfig.pending;

              return (
                <TableRow key={order.id} className="border-b border-[#f0f4ee] transition-colors hover:bg-[#f8faf6]">
                  <TableCell className="font-mono text-[10px] font-bold text-[#2d6a4f]">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </TableCell>

                  <TableCell className="text-sm font-semibold text-[#1a2e1a]">
                    {order.name || "Produce"}
                  </TableCell>

                  <TableCell className="text-sm text-[#5c7a5c]">
                    <span className="font-bold text-[#2d6a4f]">₹{order.price}</span>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1.5 py-1">
                      <div className="flex items-center justify-between w-36">
                        <div className="flex items-center gap-1.5">
                          <tracking.Icon size={12} className="text-[#2d6a4f]" />
                          <span className="text-[10px] font-bold text-[#1a2e1a]">
                            {tracking.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#5c7a5c]">{tracking.progress}%</span>
                      </div>
                      <Progress value={tracking.progress} className="h-1.5 w-36 bg-[#e8f0e4]" />
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className={`${config.bg} ${config.color} flex w-fit items-center gap-1.5 border text-[10px] font-bold uppercase`}>
                      <span className={`h-1 w-1 rounded-full ${config.dot} animate-pulse`} />
                      {order.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right text-xs text-[#7ca87c] whitespace-nowrap">
                    {format(new Date(order.createdAt), "MMM d")}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.section>
  );
}

function RecentOrdersSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse pt-6">
      <div className="h-8 w-40 bg-gray-100 rounded mb-4" />
      <div className="h-48 bg-gray-50 rounded-2xl border border-gray-100" />
    </div>
  );
}