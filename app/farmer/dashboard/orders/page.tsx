"use client";

import { trpc } from "@/trpc/client";
import { Package, IndianRupee, ShoppingBag, Mail, User } from "lucide-react";
import Image from "next/image";

export default function FarmerOrdersPage() {
  const { data: orders, isLoading, error } = trpc.order.getFarmerOrders.useQuery();

  if (isLoading) return <LoadingSkeleton />;

  if (error)
    return (
      <div className="flex h-[50vh] items-center justify-center text-red-500 font-medium">
        Error: {error.message}
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1b4332]">
            Received Orders
          </h1>
          <p className="mt-1 text-gray-500">
            Track and manage orders placed by buyers for your products.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="text-sm font-medium text-[#2d6a4f] bg-[#d8f3dc] px-4 py-2 rounded-lg">
            {orders?.length || 0} Total Orders
          </div>
          <div className="text-sm font-medium text-amber-700 bg-amber-50 px-4 py-2 rounded-lg">
            {orders?.filter((o) => o.status === "pending").length || 0} Pending
          </div>
        </div>
      </div>

      {orders && orders.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="group hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {order.productImage ? (
                          <Image
                            src={order.productImage}
                            alt={order.name || "Product"}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0fff4] text-[#2d6a4f] group-hover:bg-[#1b4332] group-hover:text-white transition-colors">
                            <Package size={20} />
                          </div>
                        )}
                        <span className="font-bold text-gray-900 leading-none">
                          {order.name || "Product"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 font-medium text-gray-900 text-sm">
                          <User size={13} className="text-gray-400" />
                          {order.buyerName}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Mail size={11} className="text-gray-300" />
                          {order.buyerEmail}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        x{order.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center font-bold text-gray-900">
                        <IndianRupee size={14} className="mr-0.5" />
                        {order.price}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-5 text-right text-gray-500 text-xs tabular-nums">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    confirmed: "bg-blue-100 text-blue-700 border-blue-200",
    shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
    delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize shadow-sm ${config[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center">
      <div className="rounded-full bg-gray-50 p-6">
        <ShoppingBag className="h-12 w-12 text-gray-300" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        No orders received yet
      </h3>
      <p className="mt-1 text-gray-500 text-sm">
        When buyers purchase your products, their orders will appear here.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-8 py-10 animate-pulse">
      <div className="h-10 w-56 bg-gray-200 rounded-md mb-2" />
      <div className="h-5 w-80 bg-gray-100 rounded-md mb-8" />
      <div className="h-72 bg-gray-100 rounded-2xl" />
    </div>
  );
}