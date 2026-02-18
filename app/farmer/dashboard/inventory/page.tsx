"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Loader2,
  Sprout,
  Package,
  Layers,
  IndianRupee,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Trash2,
  Save,
  Minus,
  Plus as PlusIcon,
  ChevronDown,
} from "lucide-react";
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
import { trpc } from "@/trpc/client";

const UNITS = ["kg", "quintal", "ton", "litre", "piece"] as const;
type Unit = (typeof UNITS)[number];

/* ─── Types ─── */
type InventoryItem = {
  id: string;
  cropName: string;
  quantity: number; // in kg
  unit: string;
  marketPrice: number; // ₹ per kg (fetched from market)
  isProfitable: boolean; // prediction from DB / AI engine
  addedAt: string;
};

/* ─── Helper Functions ─── */

/**
 * Mock function to fetch crop profitability prediction from the DB.
 * TODO: Replace with actual tRPC call to your AI price engine.
 */
async function fetchCropPrediction(cropName: string): Promise<boolean> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  const mockPredictions: Record<string, boolean> = {
    "organic tomatoes": true,
    "basmati rice": true,
    "green cardamom": true,
    "black pepper": false,
    "rubber sheets": true,
    "coffee robusta": false,
    arecanut: true,
    "fresh ginger": false,
    wheat: true,
    sugarcane: false,
    turmeric: true,
    coconut: true,
  };

  const prediction = mockPredictions[cropName.toLowerCase()];
  // Default to a random prediction for unknown crops
  return prediction ?? Math.random() > 0.4;
}

/**
 * Submit a new inventory item.
 * Fetches live market price from Data.gov.in via tRPC,
 * then builds the inventory item with the real price.
 */
async function submitInventoryItem(
  data: { cropName: string; quantity: number; unit: string },
  fetchPrice: (cropId: string) => Promise<number>,
): Promise<InventoryItem> {
  const [marketPrice, isProfitable] = await Promise.all([
    fetchPrice(data.cropName),
    fetchCropPrediction(data.cropName),
  ]);

  const newItem: InventoryItem = {
    id: `inv-${Date.now()}`,
    cropName: data.cropName,
    quantity: data.quantity,
    unit: data.unit,
    marketPrice,
    isProfitable,
    addedAt: new Date().toISOString(),
  };

  return newItem;
}



/* ─── Main Component ─── */
export default function InventoryPage() {
  // Fetch inventory from DB via tRPC
  const { data: dbInventory, isLoading: isLoadingInventory, refetch: refetchInventory } = trpc.inventory.getInventory.useQuery();

  // Map DB records to the UI shape
  const mappedInventory: InventoryItem[] = (dbInventory ?? []).map((row) => ({
    id: String(row.id),
    cropName: row.cropId ?? "Unknown",
    quantity: Number(row.quantity ?? 0),
    unit: row.unit ?? "kg",
    marketPrice: Number(row.marketPrice ?? 0),
    isProfitable: row.isProfitable ?? false,
    addedAt: row.createdAt,
  }));

  // Local state for optimistic UI (new items added during this session)
  const [localItems, setLocalItems] = useState<InventoryItem[]>([]);
  const inventory = [...localItems, ...mappedInventory];
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "quantity" | "value">("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Detail dialog state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editQuantity, setEditQuantity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [cropName, setCropName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<Unit>("kg");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // tRPC utils for imperative (on-demand) market price fetching
  const utils = trpc.useUtils();

  // tRPC mutations
  const addInventoryMutation = trpc.inventory.addInventory.useMutation({
    onSuccess: () => {
      refetchInventory();
    },
  });

  const deleteInventoryMutation = trpc.inventory.deleteInventory.useMutation({
    onSuccess: () => {
      refetchInventory();
    },
  });

  const modifyInventoryMutation = trpc.inventory.modifyInventory.useMutation({
    onSuccess: () => {
      refetchInventory();
    },
  });

  /** Fetch live market price for a crop via tRPC */
  async function fetchLiveMarketPrice(cropId: string): Promise<number> {
    try {
      const result = await utils.inventory.getMarketPrice.fetch({ cropId });
      return result.avg_modal ?? 0;
    } catch {
      return 0;
    }
  }

  async function handleFetchPrice() {
    if (!cropName.trim()) return;
    setIsFetchingPrice(true);
    try {
      const price = await fetchLiveMarketPrice(cropName);
      setPreviewPrice(price);
    } catch {
      setPreviewPrice(null);
    } finally {
      setIsFetchingPrice(false);
    }
  }

  function resetForm() {
    setCropName("");
    setQuantity("");
    setUnit("kg");
    setPreviewPrice(null);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!cropName.trim()) {
      setFormError("Crop name is required.");
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      setFormError("Please enter a valid quantity.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Fetch market price first
      const marketPrice = previewPrice ?? (await fetchLiveMarketPrice(cropName.trim()));

      // Call tRPC addInventory mutation to persist to DB
      await addInventoryMutation.mutateAsync({
        cropName: cropName.trim(),
        quantity: parseFloat(quantity),
        unit,
        marketPrice,
      });

      setDialogOpen(false);
      resetForm();
    } catch {
      setFormError("Failed to add item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSort(key: "name" | "quantity" | "value") {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(true);
    }
  }

  function handleCardClick(item: InventoryItem) {
    setSelectedItem(item);
    setEditQuantity(String(item.quantity));
    setDetailDialogOpen(true);
  }

  async function handleSaveQuantity() {
    if (!selectedItem) return;
    const newQty = parseFloat(editQuantity);
    if (isNaN(newQty) || newQty <= 0) return;

    setIsSaving(true);
    try {
      await modifyInventoryMutation.mutateAsync({
        id: Number(selectedItem.id),
        quantity: newQty,
      });
      setSelectedItem((prev) => (prev ? { ...prev, quantity: newQty } : prev));
      setDetailDialogOpen(false);
    } catch {
      // handle error
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteItem() {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      await deleteInventoryMutation.mutateAsync({
        id: Number(selectedItem.id),
      });
      setDetailDialogOpen(false);
      setSelectedItem(null);
    } catch {
      // handle error
    } finally {
      setIsDeleting(false);
    }
  }

  // Filter & sort
  const filtered = inventory
    .filter((item) =>
      item.cropName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.cropName.localeCompare(b.cropName);
      else if (sortBy === "quantity") cmp = a.quantity - b.quantity;
      else cmp = a.quantity * a.marketPrice - b.quantity * b.marketPrice;
      return sortAsc ? cmp : -cmp;
    });

  const totalItems = inventory.length;
  const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = inventory.reduce(
    (sum, item) => sum + item.quantity * item.marketPrice,
    0
  );

  if (isLoadingInventory) {
    return (
      <div className="flex-1 p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#1a2e1a]">Inventory</h1>
          <p className="mt-1 text-sm text-[#5c7a5c]">Track and manage your farm&apos;s crop stock</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#2d6a4f]" />
            <p className="text-sm text-[#5c7a5c]">Loading inventory…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a2e1a]">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-[#5c7a5c]">
            Track and manage your farm&apos;s crop stock
          </p>
        </div>

        {/* Add Item Dialog */}
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              id="add-inventory-btn"
              className="gap-2 rounded-xl bg-gradient-to-r from-[#2d6a4f] to-[#40916c] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[480px] border-[#d8f3dc] bg-white/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#1a2e1a]">
                Add Inventory Item
              </DialogTitle>
              <DialogDescription className="text-[#5c7a5c]">
                Add a new crop to your inventory. The market price will be
                fetched automatically.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 grid gap-5">
              {/* Crop Name + Fetch Price */}
              <div className="grid gap-2">
                <Label
                  htmlFor="crop-name"
                  className="text-sm font-medium text-[#1a2e1a]"
                >
                  Crop Name <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="crop-name"
                    placeholder="e.g. Organic Tomatoes"
                    value={cropName}
                    onChange={(e) => {
                      setCropName(e.target.value);
                      setPreviewPrice(null);
                    }}
                    required
                    className="flex-1 rounded-xl border-[#d8f3dc] bg-white/80 text-[#1a2e1a] placeholder:text-[#7ca87c] focus-visible:ring-[#2d6a4f]/30"
                  />
                  <Button
                    id="fetch-price-btn"
                    type="button"
                    onClick={handleFetchPrice}
                    disabled={!cropName.trim() || isFetchingPrice}
                    className="shrink-0 gap-1.5 rounded-xl bg-[#2d6a4f]/10 px-3 text-xs font-semibold text-[#2d6a4f] hover:bg-[#2d6a4f]/20 disabled:opacity-50"
                    variant="ghost"
                  >
                    {isFetchingPrice ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5" />
                    )}
                    {isFetchingPrice ? "Fetching…" : "Fetch Price"}
                  </Button>
                </div>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="grid gap-2">
                  <Label
                    htmlFor="crop-quantity"
                    className="text-sm font-medium text-[#1a2e1a]"
                  >
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="crop-quantity"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 100"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="rounded-xl border-[#d8f3dc] bg-white/80 text-[#1a2e1a] placeholder:text-[#7ca87c] focus-visible:ring-[#2d6a4f]/30"
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="crop-unit"
                    className="text-sm font-medium text-[#1a2e1a]"
                  >
                    Unit
                  </Label>
                  <div className="relative">
                    <select
                      id="crop-unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as Unit)}
                      className="h-10 w-full appearance-none rounded-xl border border-[#d8f3dc] bg-white/80 py-2 pl-3 pr-8 text-sm font-medium text-[#1a2e1a] outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7ca87c]" />
                  </div>
                </div>
              </div>

              {/* Market Price Preview */}
              <div className="rounded-xl border border-[#d8f3dc]/80 bg-[#f0f7ed]/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#2d6a4f]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#5c7a5c]">
                      Market Price
                    </span>
                  </div>
                  {isFetchingPrice ? (
                    <div className="flex items-center gap-1.5 text-[#7ca87c]">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Fetching…</span>
                    </div>
                  ) : previewPrice !== null ? (
                    <span className="text-lg font-bold text-[#1b4332]">
                      ₹{previewPrice.toFixed(2)}
                      <span className="text-xs font-normal text-[#7ca87c]">
                        /kg
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-[#7ca87c]">
                      Enter crop name to see price
                    </span>
                  )}
                </div>
                {previewPrice !== null && quantity && (
                  <div className="mt-3 flex items-center justify-between border-t border-[#d8f3dc]/60 pt-3">
                    <span className="text-xs font-medium text-[#5c7a5c]">
                      Estimated Value
                    </span>
                    <span className="text-base font-bold text-[#2d6a4f]">
                      ₹
                      {(previewPrice * parseFloat(quantity || "0")).toLocaleString(
                        "en-IN",
                        { maximumFractionDigits: 2 }
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Error */}
              {formError && (
                <p className="text-sm text-red-500">{formError}</p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  className="rounded-xl border-[#d8f3dc] text-[#5c7a5c] hover:bg-[#e8f0e4] hover:text-[#1a2e1a]"
                >
                  Cancel
                </Button>
                <Button
                  id="submit-inventory-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 rounded-xl bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding…
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add to Inventory
                    </>
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
          label="Total Items"
          value={String(totalItems)}
          accent="from-[#d8f3dc] to-[#b7e4c7]"
        />
        <StatCard
          icon={<Layers className="h-5 w-5 text-[#6a4c2d]" />}
          label="Total Stock"
          value={`${totalStock.toLocaleString("en-IN")} kg`}
          accent="from-[#fce4cc] to-[#f5d0a9]"
        />
        <StatCard
          icon={<IndianRupee className="h-5 w-5 text-[#4c2d6a]" />}
          label="Total Value"
          value={`₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          accent="from-[#e4d8f3] to-[#cbb7e4]"
        />
      </div>

      {/* Search & Sort Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7ca87c]" />
          <input
            id="inventory-search"
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#d8f3dc] bg-white/80 py-2.5 pl-10 pr-4 text-sm text-[#1a2e1a] outline-none backdrop-blur-sm transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20"
          />
        </div>
        <div className="flex gap-2">
          <SortButton
            label="Name"
            active={sortBy === "name"}
            asc={sortAsc}
            onClick={() => handleSort("name")}
          />
          <SortButton
            label="Qty"
            active={sortBy === "quantity"}
            asc={sortAsc}
            onClick={() => handleSort("quantity")}
          />
          <SortButton
            label="Value"
            active={sortBy === "value"}
            asc={sortAsc}
            onClick={() => handleSort("value")}
          />
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState hasSearch={search.length > 0} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              onClick={() => handleCardClick(item)}
            />
          ))}
        </div>
      )}

      {/* ─── Detail Dialog ─── */}
      <Dialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) {
            setSelectedItem(null);
            setEditQuantity("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px] border-[#d8f3dc] bg-white/95 backdrop-blur-xl p-0 overflow-hidden">
          {selectedItem && (() => {
            const profitable = selectedItem.isProfitable;
            const totalValue = selectedItem.quantity * selectedItem.marketPrice;
            const date = new Date(selectedItem.addedAt);
            const formattedDate = date.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            const formattedTime = date.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const accentGradient = profitable
              ? "from-[#2d6a4f] to-[#40916c]"
              : "from-[#b91c1c] to-[#dc2626]";
            const accentText = profitable ? "text-[#2d6a4f]" : "text-[#b91c1c]";
            const accentBg = profitable ? "bg-[#d8f3dc]" : "bg-red-50";
            const accentBorder = profitable ? "border-[#b7e4c7]" : "border-red-200";
            const labelColor = profitable ? "text-[#7ca87c]" : "text-[#b07a7a]";
            const statBg = profitable ? "bg-[#f0f7ed]/60" : "bg-red-50/60";

            return (
              <>
                {/* Top accent bar */}
                <div className={`h-2 w-full bg-gradient-to-r ${accentGradient}`} />

                <div className="px-6 pb-6 pt-5 space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold text-[#1a2e1a]">
                        {selectedItem.cropName}
                      </h2>
                      <p className="mt-1 text-xs text-[#7ca87c]">
                        Added {formattedDate} at {formattedTime}
                      </p>
                    </div>
                    <div
                      className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${accentBg} ${accentText} ${accentBorder}`}
                    >
                      {profitable ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {profitable ? "Profitable" : "Not Profitable"}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`flex flex-col gap-1 rounded-xl ${statBg} p-3.5`}>
                      <p className={`text-[10px] font-medium uppercase tracking-widest ${labelColor}`}>
                        Market Price
                      </p>
                      <p className="text-xl font-bold text-[#1a2e1a]">
                        ₹{selectedItem.marketPrice.toFixed(2)}
                        <span className={`ml-1 text-xs font-normal ${labelColor}`}>/kg</span>
                      </p>
                    </div>
                    <div className={`flex flex-col gap-1 rounded-xl ${statBg} p-3.5`}>
                      <p className={`text-[10px] font-medium uppercase tracking-widest ${labelColor}`}>
                        Est. Value
                      </p>
                      <p className={`text-xl font-bold ${accentText}`}>
                        ₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className={`flex flex-col gap-1 rounded-xl ${statBg} p-3.5`}>
                      <p className={`text-[10px] font-medium uppercase tracking-widest ${labelColor}`}>
                        Current Qty
                      </p>
                      <p className="text-xl font-bold text-[#1a2e1a]">
                        {selectedItem.quantity.toLocaleString("en-IN")}
                        <span className={`ml-1 text-xs font-normal ${labelColor}`}>{selectedItem.unit}</span>
                      </p>
                    </div>
                    <div className={`flex flex-col gap-1 rounded-xl ${statBg} p-3.5`}>
                      <p className={`text-[10px] font-medium uppercase tracking-widest ${labelColor}`}>
                        Item ID
                      </p>
                      <p className="text-xs font-mono font-medium text-[#1a2e1a] truncate" title={selectedItem.id}>
                        {selectedItem.id}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Editor */}
                  <div className={`rounded-xl border ${accentBorder} ${profitable ? "bg-[#f0f7ed]/40" : "bg-red-50/40"} p-4`}>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#5c7a5c]">
                      Update Quantity
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseFloat(editQuantity) || 0;
                          if (current > 1) setEditQuantity(String(Math.max(0, current - 10)));
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8f3dc] bg-white text-[#5c7a5c] transition hover:bg-[#e8f0e4] hover:text-[#1a2e1a]"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <Input
                        id="edit-quantity"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        className="flex-1 rounded-xl border-[#d8f3dc] bg-white/80 text-center text-lg font-bold text-[#1a2e1a] focus-visible:ring-[#2d6a4f]/30"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseFloat(editQuantity) || 0;
                          setEditQuantity(String(current + 10));
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8f3dc] bg-white text-[#5c7a5c] transition hover:bg-[#e8f0e4] hover:text-[#1a2e1a]"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-center text-[10px] text-[#7ca87c]">
                      Use the buttons to adjust by ±10 kg or type a custom value
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <DialogFooter className="flex items-center justify-between gap-3 pt-2 sm:justify-between">
                    {/* Delete with confirmation */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          id="delete-inventory-btn"
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
                            Delete this item?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-[#5c7a5c]">
                            This will permanently remove{" "}
                            <span className="font-semibold text-[#1a2e1a]">
                              &quot;{selectedItem.cropName}&quot;
                            </span>{" "}
                            from your inventory. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl border-[#d8f3dc] text-[#5c7a5c] hover:bg-[#e8f0e4]">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteItem}
                            disabled={isDeleting}
                            className="gap-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {isDeleting ? (
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

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setDetailDialogOpen(false)}
                        className="rounded-xl border-[#d8f3dc] text-[#5c7a5c] hover:bg-[#e8f0e4] hover:text-[#1a2e1a]"
                      >
                        Cancel
                      </Button>
                      <Button
                        id="save-inventory-btn"
                        onClick={handleSaveQuantity}
                        disabled={
                          isSaving ||
                          editQuantity === String(selectedItem.quantity)
                        }
                        className="gap-2 rounded-xl bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
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

/* ─── Inventory Card ─── */
function InventoryCard({ item, onClick }: { item: InventoryItem; onClick: () => void }) {
  const date = new Date(item.addedAt);
  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const totalValue = item.quantity * item.marketPrice;
  const profitable = item.isProfitable;

  // Theme tokens based on profitability
  const theme = profitable
    ? {
      accentFrom: "from-[#2d6a4f]",
      accentTo: "to-[#40916c]",
      statBg: "bg-[#f0f7ed]/60",
      valueBg: "bg-gradient-to-r from-[#2d6a4f]/5 to-[#40916c]/5",
      valueText: "text-[#2d6a4f]",
      hoverText: "group-hover:text-[#2d6a4f]",
      badgeBg: "bg-[#d8f3dc]",
      badgeText: "text-[#2d6a4f]",
      badgeBorder: "border-[#b7e4c7]",
      labelColor: "text-[#7ca87c]",
    }
    : {
      accentFrom: "from-[#b91c1c]",
      accentTo: "to-[#dc2626]",
      statBg: "bg-red-50/60",
      valueBg: "bg-gradient-to-r from-[#b91c1c]/5 to-[#dc2626]/5",
      valueText: "text-[#b91c1c]",
      hoverText: "group-hover:text-[#b91c1c]",
      badgeBg: "bg-red-50",
      badgeText: "text-[#b91c1c]",
      badgeBorder: "border-red-200",
      labelColor: "text-[#b07a7a]",
    };

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Top accent bar */}
      <div
        className={`h-1.5 w-full bg-gradient-to-r ${theme.accentFrom} ${theme.accentTo}`}
      />

      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="min-w-0">
            <h3
              className={`truncate text-base font-bold text-[#1a2e1a] transition-colors ${theme.hoverText}`}
            >
              {item.cropName}
            </h3>
            <p className="text-[10px] font-medium text-[#7ca87c]">
              Added {formattedDate}
            </p>
          </div>

          {/* Prediction badge */}
          <div
            className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
          >
            {profitable ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {profitable ? "Profitable" : "Not Profitable"}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl ${theme.statBg} p-3`}>
            <p
              className={`text-[10px] font-medium uppercase tracking-widest ${theme.labelColor}`}
            >
              Quantity
            </p>
            <p className="mt-0.5 text-lg font-bold text-[#1a2e1a]">
              {item.quantity.toLocaleString("en-IN")}
              <span className={`ml-1 text-xs font-normal ${theme.labelColor}`}>
                {item.unit}
              </span>
            </p>
          </div>
          <div className={`rounded-xl ${theme.statBg} p-3`}>
            <p
              className={`text-[10px] font-medium uppercase tracking-widest ${theme.labelColor}`}
            >
              Market Price
            </p>
            <p className="mt-0.5 text-lg font-bold text-[#1a2e1a]">
              ₹{item.marketPrice.toFixed(2)}
              <span
                className={`ml-0.5 text-[10px] font-normal ${theme.labelColor}`}
              >
                /kg
              </span>
            </p>
          </div>
        </div>

        {/* Total value */}
        <div
          className={`mt-3 flex items-center justify-between rounded-xl ${theme.valueBg} px-3 py-2.5`}
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-widest ${profitable ? "text-[#5c7a5c]" : "text-[#8c5c5c]"}`}
          >
            Est. Value
          </span>
          <span className={`text-base font-bold ${theme.valueText}`}>
            ₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Sort Button ─── */
function SortButton({
  label,
  active,
  asc,
  onClick,
}: {
  label: string;
  active: boolean;
  asc: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${active
        ? "border-[#2d6a4f] bg-[#2d6a4f]/10 text-[#2d6a4f]"
        : "border-[#d8f3dc] bg-white/80 text-[#5c7a5c] hover:bg-[#e8f0e4] hover:text-[#1a2e1a]"
        }`}
    >
      <ArrowUpDown className={`h-3 w-3 ${active ? "text-[#2d6a4f]" : ""}`} />
      {label}
      {active && (
        <span className="text-[10px]">{asc ? "↑" : "↓"}</span>
      )}
    </button>
  );
}

/* ─── Empty State ─── */
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#b7e4c7] bg-white/50 py-20 backdrop-blur-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d8f3dc] to-[#b7e4c7]">
        <Sprout className="h-8 w-8 text-[#2d6a4f]" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[#1a2e1a]">
        {hasSearch ? "No items found" : "No inventory yet"}
      </h3>
      <p className="mt-1 text-sm text-[#5c7a5c]">
        {hasSearch
          ? "Try a different search term."
          : "Add your first crop to start tracking your inventory."}
      </p>
    </div>
  );
}