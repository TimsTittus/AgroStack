"use client";

import { trpc } from "@/trpc/client";
import Image from "next/image";
import { Package, IndianRupee, Layers, Clock, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export default function ListingsPage() {
  const { data: listings, isLoading } = trpc.listings.getFarmerListings.useQuery();
  const [search, setSearch] = useState("");

  const filtered = listings?.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#1a2e1a]">
          My Listings
        </h1>
        <p className="mt-1 text-sm text-[#5c7a5c]">
          Manage and track all your product listings
        </p>
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Package className="h-5 w-5 text-[#2d6a4f]" />}
          label="Total Listings"
          value={isLoading ? "—" : String(listings?.length ?? 0)}
          accent="from-[#d8f3dc] to-[#b7e4c7]"
        />
        <StatCard
          icon={<Layers className="h-5 w-5 text-[#6a4c2d]" />}
          label="Total Stock"
          value={
            isLoading
              ? "—"
              : String(
                listings?.reduce(
                  (sum, l) => sum + (parseFloat(l.quantity) || 0),
                  0
                ) ?? 0
              )
          }
          accent="from-[#fce4cc] to-[#f5d0a9]"
        />
        <StatCard
          icon={<IndianRupee className="h-5 w-5 text-[#4c2d6a]" />}
          label="Avg. Price"
          value={
            isLoading || !listings?.length
              ? "—"
              : `₹${(
                listings.reduce(
                  (sum, l) => sum + (parseFloat(l.price) || 0),
                  0
                ) / listings.length
              ).toFixed(2)}`
          }
          accent="from-[#e4d8f3] to-[#cbb7e4]"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7ca87c]" />
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#d8f3dc] bg-white/80 py-2.5 pl-10 pr-4 text-sm text-[#1a2e1a] outline-none backdrop-blur-sm transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20"
          />
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-[#d8f3dc] bg-white/80 px-4 py-2.5 text-sm font-medium text-[#5c7a5c] backdrop-blur-sm transition hover:bg-[#e8f0e4] hover:text-[#1a2e1a]">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : !filtered?.length ? (
        <EmptyState hasSearch={search.length > 0} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md transition hover:shadow-md">
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-40 blur-2xl transition group-hover:opacity-60`}
      />
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white to-[#f0f7ed] shadow-sm">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#7ca87c]">
            {label}
          </p>
          <p className="text-2xl font-bold text-[#1a2e1a]">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Listing Card ─── */
function ListingCard({
  listing,
}: {
  listing: {
    id: string;
    name: string;
    price: string;
    quantity: string;
    image: string;
    description: string | null;
    createdAt: string;
  };
}) {
  const date = new Date(listing.createdAt);
  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={listing.image}
          alt={listing.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Quantity Badge */}
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#1a2e1a] shadow-sm backdrop-blur-sm">
          <Layers className="h-3 w-3 text-[#2d6a4f]" />
          {listing.quantity} in stock
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="text-lg font-bold tracking-tight text-[#1a2e1a] transition-colors group-hover:text-[#2d6a4f]">
          {listing.name}
        </h3>

        {listing.description && (
          <p className="mt-1 line-clamp-2 text-xs text-[#5c7a5c]">
            {listing.description}
          </p>
        )}

        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-[#7ca87c]">
              Price
            </span>
            <p className="text-xl font-bold text-[#1b4332]">
              ₹{listing.price}
            </p>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-[#7ca87c]">
            <Clock className="h-3 w-3" />
            {formattedDate}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Loading Skeleton ─── */
function LoadingSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md"
        >
          <div className="h-48 w-full bg-[#e8f0e4]" />
          <div className="p-4">
            <div className="mb-2 h-5 w-3/4 rounded-md bg-[#e8f0e4]" />
            <div className="mb-4 h-3 w-1/2 rounded-md bg-[#e8f0e4]" />
            <div className="flex justify-between">
              <div className="h-7 w-16 rounded-md bg-[#e8f0e4]" />
              <div className="h-4 w-20 rounded-md bg-[#e8f0e4]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Empty State ─── */
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#b7e4c7] bg-white/50 py-20 backdrop-blur-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d8f3dc] to-[#b7e4c7]">
        <Package className="h-8 w-8 text-[#2d6a4f]" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[#1a2e1a]">
        {hasSearch ? "No listings found" : "No listings yet"}
      </h3>
      <p className="mt-1 text-sm text-[#5c7a5c]">
        {hasSearch
          ? "Try a different search term."
          : "Create your first product listing to start selling."}
      </p>
    </div>
  );
}