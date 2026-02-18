"use client";

import { trpc } from "@/trpc/client";
import Image from "next/image";
import {
  Package,
  IndianRupee,
  Layers,
  Clock,
  Search,
  SlidersHorizontal,
  Plus,
  Loader2,
  Trash2,
  CalendarDays,
  Tag,
  BarChart3,
  FileText,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Listing = {
  id: string;
  name: string;
  price: string;
  quantity: string;
  image: string;
  description: string | null;
  createdAt: string;
};

export default function ListingsPage() {
  const utils = trpc.useUtils();
  const { data: listings, isLoading } =
    trpc.listings.getFarmerListings.useQuery();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Detail dialog state
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  const addListingMutation = trpc.listings.addListing.useMutation({
    onSuccess: () => {
      utils.listings.getFarmerListings.invalidate();
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteListingMutation = trpc.listings.deleteListing.useMutation({
    onSuccess: () => {
      utils.listings.getFarmerListings.invalidate();
      setDetailDialogOpen(false);
      setSelectedListing(null);
    },
  });

  function resetForm() {
    setName("");
    setPrice("");
    setQuantity("");
    setDescription("");
    setImage("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addListingMutation.mutate({
      name,
      price,
      quantity,
      description: description || undefined,
      image,
    });
  }

  function handleCardClick(listing: Listing) {
    setSelectedListing(listing);
    setDetailDialogOpen(true);
  }

  function handleDelete() {
    if (!selectedListing) return;
    deleteListingMutation.mutate({ id: selectedListing.id });
  }

  const filtered = listings?.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a2e1a]">
            My Listings
          </h1>
          <p className="mt-1 text-sm text-[#5c7a5c]">
            Manage and track all your product listings
          </p>
        </div>

        {/* Add Listing Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              id="add-listing-btn"
              className="gap-2 rounded-xl bg-gradient-to-r from-[#2d6a4f] to-[#40916c] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Add Listing
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px] border-[#d8f3dc] bg-white/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#1a2e1a]">
                Create New Listing
              </DialogTitle>
              <DialogDescription className="text-[#5c7a5c]">
                Add a new product to your listings. Fill out the details below.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 grid gap-5">
              {/* Product Name */}
              <div className="grid gap-2">
                <Label htmlFor="listing-name" className="text-sm font-medium text-[#1a2e1a]">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="listing-name"
                  placeholder="e.g. Organic Tomatoes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="rounded-xl border-[#d8f3dc] bg-white/80 text-[#1a2e1a] placeholder:text-[#7ca87c] focus-visible:ring-[#2d6a4f]/30"
                />
              </div>

              {/* Price & Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="listing-price" className="text-sm font-medium text-[#1a2e1a]">
                    Price (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="listing-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="rounded-xl border-[#d8f3dc] bg-white/80 text-[#1a2e1a] placeholder:text-[#7ca87c] focus-visible:ring-[#2d6a4f]/30"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="listing-quantity" className="text-sm font-medium text-[#1a2e1a]">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="listing-quantity"
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="rounded-xl border-[#d8f3dc] bg-white/80 text-[#1a2e1a] placeholder:text-[#7ca87c] focus-visible:ring-[#2d6a4f]/30"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="listing-description" className="text-sm font-medium text-[#1a2e1a]">
                  Description
                </Label>
                <Textarea
                  id="listing-description"
                  placeholder="Describe your product (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="rounded-xl border-[#d8f3dc] bg-white/80 text-[#1a2e1a] placeholder:text-[#7ca87c] focus-visible:ring-[#2d6a4f]/30 resize-none"
                />
              </div>

              {/* Image URL */}
              <div className="grid gap-2">
                <Label htmlFor="listing-image" className="text-sm font-medium text-[#1a2e1a]">
                  Image URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="listing-image"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  required
                  className="rounded-xl border-[#d8f3dc] bg-white/80 text-[#1a2e1a] placeholder:text-[#7ca87c] focus-visible:ring-[#2d6a4f]/30"
                />
              </div>

              {/* Error message */}
              {addListingMutation.error && (
                <p className="text-sm text-red-500">
                  {addListingMutation.error.message}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-xl border-[#d8f3dc] text-[#5c7a5c] hover:bg-[#e8f0e4] hover:text-[#1a2e1a]"
                >
                  Cancel
                </Button>
                <Button
                  id="submit-listing-btn"
                  type="submit"
                  disabled={addListingMutation.isPending}
                  className="gap-2 rounded-xl bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-50"
                >
                  {addListingMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Create Listing"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={() => handleCardClick(listing)}
            />
          ))}
        </div>
      )}

      {/* ─── Listing Detail Dialog ─── */}
      <Dialog open={detailDialogOpen} onOpenChange={(open) => {
        setDetailDialogOpen(open);
        if (!open) setSelectedListing(null);
      }}>
        <DialogContent className="sm:max-w-[560px] p-0 border-[#d8f3dc] bg-white/95 backdrop-blur-xl overflow-hidden">
          {selectedListing && (() => {
            const date = new Date(selectedListing.createdAt);
            const formattedDate = date.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            const formattedTime = date.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <>
                {/* Hero Image */}
                <div className="relative h-56 w-full overflow-hidden">
                  <Image
                    src={selectedListing.image}
                    alt={selectedListing.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5">
                    <h2 className="text-2xl font-bold text-white drop-shadow-md">
                      {selectedListing.name}
                    </h2>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 pb-6 pt-5 space-y-5">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-[#d8f3dc]/60 to-[#b7e4c7]/30 p-3.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 shadow-sm">
                        <IndianRupee className="h-4 w-4 text-[#2d6a4f]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-[#7ca87c]">
                          Price
                        </p>
                        <p className="text-lg font-bold text-[#1b4332]">
                          ₹{selectedListing.price}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-[#fce4cc]/60 to-[#f5d0a9]/30 p-3.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 shadow-sm">
                        <BarChart3 className="h-4 w-4 text-[#6a4c2d]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-[#7ca87c]">
                          Quantity
                        </p>
                        <p className="text-lg font-bold text-[#1b4332]">
                          {selectedListing.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-[#e4d8f3]/60 to-[#cbb7e4]/30 p-3.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 shadow-sm">
                        <Tag className="h-4 w-4 text-[#4c2d6a]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-[#7ca87c]">
                          Listing ID
                        </p>
                        <p className="text-xs font-mono font-medium text-[#1b4332] truncate max-w-[120px]" title={selectedListing.id}>
                          {selectedListing.id.slice(0, 8)}…
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-[#cce5ff]/60 to-[#a9d4f5]/30 p-3.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 shadow-sm">
                        <CalendarDays className="h-4 w-4 text-[#2d4f6a]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-[#7ca87c]">
                          Created
                        </p>
                        <p className="text-xs font-medium text-[#1b4332]">
                          {formattedDate}
                        </p>
                        <p className="text-[10px] text-[#7ca87c]">{formattedTime}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedListing.description && (
                    <div className="rounded-xl border border-[#d8f3dc]/80 bg-[#f0f7ed]/40 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#5c7a5c]" />
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#5c7a5c]">
                          Description
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed text-[#1a2e1a]">
                        {selectedListing.description}
                      </p>
                    </div>
                  )}

                  {/* Delete error */}
                  {deleteListingMutation.error && (
                    <p className="text-sm text-red-500">
                      {deleteListingMutation.error.message}
                    </p>
                  )}

                  {/* Footer Actions */}
                  <DialogFooter className="flex items-center justify-between gap-3 pt-2 sm:justify-between">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          id="delete-listing-btn"
                          variant="outline"
                          className="gap-2 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-red-100 bg-white/95 backdrop-blur-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-[#1a2e1a]">
                            Delete this listing?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-[#5c7a5c]">
                            This will permanently remove <span className="font-semibold text-[#1a2e1a]">&quot;{selectedListing.name}&quot;</span> from your listings. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl border-[#d8f3dc] text-[#5c7a5c] hover:bg-[#e8f0e4]">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteListingMutation.isPending}
                            className="gap-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {deleteListingMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting…
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                Yes, delete
                              </>
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button
                      variant="outline"
                      onClick={() => setDetailDialogOpen(false)}
                      className="rounded-xl border-[#d8f3dc] text-[#5c7a5c] hover:bg-[#e8f0e4] hover:text-[#1a2e1a]"
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
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
  onClick,
}: {
  listing: Listing;
  onClick: () => void;
}) {
  const date = new Date(listing.createdAt);
  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
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