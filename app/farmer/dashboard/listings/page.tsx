"use client";

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
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { trpc } from "@/trpc/client";

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

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const [recommendation, setRecommendation] = useState("");

  const recommendMutation = trpc.federated.recommend.useMutation({
    onSuccess: (data) => {
      if (typeof data === "string") setRecommendation(data);
      else setRecommendation(JSON.stringify(data));
    },
  });

  useEffect(() => {
    if (!selectedListing) return;

    setRecommendation("");
    recommendMutation.mutate({
      crop: selectedListing.name,
      current_price: Number(selectedListing.price),
      current_location: "kottayam",
    });
  }, [selectedListing]);

  const addListingMutation = trpc.listings.addListing.useMutation({
    onSuccess: () => {
      utils.listings.getFarmerListings.invalidate();
      setDialogOpen(false);
    },
  });

  const deleteListingMutation = trpc.listings.deleteListing.useMutation({
    onSuccess: () => {
      utils.listings.getFarmerListings.invalidate();
      setDetailDialogOpen(false);
      setSelectedListing(null);
    },
  });

  const filtered = listings?.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="text-sm text-gray-500">
            Manage and track all your product listings
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Listing
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
        <button className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Listings */}
      {isLoading ? (
        <p>Loading...</p>
      ) : !filtered?.length ? (
        <p>No listings found</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={() => {
                setSelectedListing(listing);
                setDetailDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          {selectedListing && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedListing.name}</DialogTitle>
                <DialogDescription>
                  ₹{selectedListing.price} • Qty: {selectedListing.quantity}
                </DialogDescription>
              </DialogHeader>

              {selectedListing.description && (
                <div className="mt-3 text-sm text-gray-600">
                  {selectedListing.description}
                </div>
              )}

              {/* Recommendation Section */}
              <div className="mt-4 rounded-xl border p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase">
                    Market Recommendation
                  </p>
                </div>

                {recommendMutation.isPending && (
                  <p className="text-sm text-gray-500">
                    Fetching recommendation…
                  </p>
                )}

                {recommendation && (
                  <p className="text-sm">{recommendation}</p>
                )}

                {recommendMutation.error && (
                  <p className="text-sm text-red-500">
                    Failed to load recommendation
                  </p>
                )}
              </div>

              <DialogFooter>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          selectedListing &&
                          deleteListingMutation.mutate({
                            id: selectedListing.id,
                          })
                        }
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button onClick={() => setDetailDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Listing Card */
function ListingCard({
  listing,
  onClick,
}: {
  listing: Listing;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border bg-white shadow hover:shadow-md transition"
    >
      <div className="relative h-40 w-full">
        <Image src={listing.image} alt={listing.name} fill className="object-cover rounded-t-xl" />
      </div>

      <div className="p-4">
        <h3 className="font-bold">{listing.name}</h3>
        <p className="text-sm text-gray-500">₹{listing.price}</p>
      </div>
    </div>
  );
}
