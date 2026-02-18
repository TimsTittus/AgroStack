"use client";

import { useMemo, useState } from "react";
import { TrendingUp, ArrowRight, Filter, Loader2, Package } from "lucide-react";
import { trpc } from "@/trpc/client";

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState("Inventory");

  const { data, isLoading } = trpc.inventory.getInventory.useQuery();

  const inventoryItems = data ?? [];

  const totalValue = useMemo(() => {
    return inventoryItems.reduce(
      (acc, item) =>
        acc + (Number(item.marketPrice || 0) * Number(item.quantity || 0)),
      0
    );
  }, [inventoryItems]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 font-sans text-green-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Portfolio</h1>
          <p className="text-green-500 font-medium">
            Track your stock levels and market valuations
          </p>
        </div>

        <div className="flex bg-green-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("Inventory")}
            className="px-6 py-2.5 text-sm font-bold rounded-xl bg-white text-green-900 shadow-sm"
          >
            Inventory
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-green-900 rounded-3xl p-8 text-white shadow-xl">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-white/10 rounded-xl">
                <Package className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            <p className="text-white/60 text-xs font-bold uppercase mb-1">
              Estimated Stock Value
            </p>
            <h2 className="text-4xl font-black mb-6">
              {formatCurrency(totalValue)}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Total Items" value={inventoryItems.length} />
              <StatCard label="Status" value="Active" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-green-800 text-sm font-bold">
                Market Analysis
              </p>
              <p className="text-green-600/80 text-xs font-medium">
                Prices are updated based on current market trends.
              </p>
            </div>
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-white border border-green-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-green-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-green-800">Current Stock</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100">
              <Filter size={14} /> Filter
            </button>
          </div>

          <div className="grid grid-cols-10 px-8 py-4 bg-green-50 text-[11px] font-bold uppercase tracking-wide text-green-500">
            <div className="col-span-4">Crop Type</div>
            <div className="col-span-2 text-right">Quantity</div>
            <div className="col-span-2 text-right">Market Price</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="flex-1 min-h-75">
            {isLoading ? (
              <LoadingState />
            ) : inventoryItems.length === 0 ? (
              <EmptyState />
            ) : (
              inventoryItems.map((item) => (
                <InventoryRow key={item.id} item={item} formatCurrency={formatCurrency} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
      <p className="text-white/40 text-xs font-bold uppercase mb-1">
        {label}
      </p>
      <p className="text-emerald-400 font-bold text-lg">{value}</p>
    </div>
  );
}

function InventoryRow({ item, formatCurrency }: any) {
  const total = Number(item.marketPrice || 0) * Number(item.quantity || 0);

  return (
    <div className="grid grid-cols-10 px-8 py-6 items-center hover:bg-green-50 transition border-b border-green-50 last:border-0 group">
      <div className="col-span-4 flex items-center gap-4">
        <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-700 font-bold">
          {item.cropId?.substring(0, 2).toUpperCase() || "CR"}
        </div>
        <div>
          <p className="font-bold text-green-900 group-hover:text-emerald-600">
            {item.cropId || "Unknown Crop"}
          </p>
          <p className="text-xs text-green-400">
            Added {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="col-span-2 text-right">
        <p className="font-bold text-green-700">{item.quantity || 0}</p>
        <p className="text-xs text-green-400 uppercase">{item.unit || "units"}</p>
      </div>

      <div className="col-span-2 text-right">
        <p className="font-bold text-green-900">
          {formatCurrency(Number(item.marketPrice || 0))}
        </p>
        <p className="text-xs text-green-400">per {item.unit}</p>
      </div>

      <div className="col-span-2 text-right flex justify-end items-center gap-3">
        <div className="font-bold text-green-900">
          {formatCurrency(total)}
        </div>
        <ArrowRight size={16} className="text-green-300 opacity-0 group-hover:opacity-100 transition" />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
      <p className="text-green-400 text-sm font-medium">Loading inventory...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Package className="w-12 h-12 text-green-200 mb-4" />
      <p className="text-green-500 font-bold">No inventory found</p>
    </div>
  );
}
