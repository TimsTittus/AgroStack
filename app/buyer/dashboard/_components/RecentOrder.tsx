"use client";

import { motion } from "framer-motion";
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

const orders = [
  {
    id: "ORD-2841",
    farmer: "Maria Garcia",
    product: "Organic Red Tomatoes",
    quantity: "25 kg",
    status: "Delivered",
    progress: 100,
    date: "Feb 10, 2026",
  },
  {
    id: "ORD-2839",
    farmer: "Robert Chen",
    product: "Fresh Sweet Corn",
    quantity: "10 dozen",
    status: "In Transit",
    progress: 65,
    date: "Feb 11, 2026",
  },
  {
    id: "ORD-2836",
    farmer: "Elena Vasquez",
    product: "Hass Avocados",
    quantity: "15 bags",
    status: "Processing",
    progress: 30,
    date: "Feb 12, 2026",
  },
  {
    id: "ORD-2834",
    farmer: "James Wilson",
    product: "Farm Fresh Eggs",
    quantity: "20 dozen",
    status: "Confirmed",
    progress: 15,
    date: "Feb 13, 2026",
  },
  {
    id: "ORD-2830",
    farmer: "Sarah Johnson",
    product: "Organic Strawberries",
    quantity: "8 kg",
    status: "Delivered",
    progress: 100,
    date: "Feb 8, 2026",
  },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  Delivered: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  "In Transit": { color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  Processing: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  Confirmed: { color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
};

export function RecentOrders() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1a2e1a]">Recent Orders</h2>
          <p className="text-sm text-[#5c7a5c]">Track your purchase history</p>
        </div>
        <button className="rounded-full border border-[#d4e7d0] bg-white px-4 py-2 text-xs font-semibold text-[#2d6a4f] transition-all duration-200 hover:bg-[#e8f0e4] hover:shadow-sm">
          View All Orders
        </button>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#e8f0e4] hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">
                Order ID
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">
                Farmer
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">
                Product
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">
                Quantity
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">
                Tracking
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const config = statusConfig[order.status];
              return (
                <TableRow
                  key={order.id}
                  className="border-b border-[#f0f4ee] transition-colors hover:bg-[#f8faf6]"
                >
                  <TableCell className="font-mono text-xs font-semibold text-[#2d6a4f]">
                    {order.id}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-[#1a2e1a]">
                    {order.farmer}
                  </TableCell>
                  <TableCell className="text-sm text-[#5c7a5c]">
                    {order.product}
                  </TableCell>
                  <TableCell className="text-sm text-[#5c7a5c]">
                    {order.quantity}
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <Progress
                        value={order.progress}
                        className="h-1.5 bg-[#e8f0e4]"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${config.bg} ${config.color} border text-[10px] font-semibold`}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[#7ca87c]">
                    {order.date}
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
