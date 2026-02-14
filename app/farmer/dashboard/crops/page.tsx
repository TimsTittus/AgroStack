"use client";

import { useState } from "react";
import { Search, Sprout, Leaf, TreePalm, Cherry, Bean, FlowerIcon } from "lucide-react";

/* ─── Crop Data ─── */
const CROPS = [
  { name: "Rubber", emoji: "🌳", category: "Plantation" },
  { name: "Black Pepper", emoji: "⚫", category: "Spices" },
  { name: "Pepper", emoji: "🌶️", category: "Spices" },
  { name: "Cardamom", emoji: "🫛", category: "Spices" },
  { name: "Coffee", emoji: "☕", category: "Plantation" },
  { name: "Robusta Tea", emoji: "🍵", category: "Plantation" },
  { name: "Arecanut", emoji: "🥜", category: "Nuts & Seeds" },
  { name: "Cashew", emoji: "🥜", category: "Nuts & Seeds" },
  { name: "Paddy", emoji: "🌾", category: "Grains & Tubers" },
  { name: "Rice", emoji: "🍚", category: "Grains & Tubers" },
  { name: "Tapioca", emoji: "🥔", category: "Grains & Tubers" },
  { name: "Yam", emoji: "🍠", category: "Grains & Tubers" },
  { name: "Sweet Potato", emoji: "🍠", category: "Grains & Tubers" },
  { name: "Banana Nendran", emoji: "🍌", category: "Fruits" },
  { name: "Banana", emoji: "🍌", category: "Fruits" },
  { name: "Pineapple", emoji: "🍍", category: "Fruits" },
  { name: "Jackfruit", emoji: "🍈", category: "Fruits" },
  { name: "Mango", emoji: "🥭", category: "Fruits" },
  { name: "Papaya", emoji: "🍈", category: "Fruits" },
  { name: "Ginger", emoji: "🫚", category: "Spices" },
  { name: "Turmeric", emoji: "🟡", category: "Spices" },
  { name: "Nutmeg", emoji: "🟤", category: "Spice Specialties" },
  { name: "Cocoa", emoji: "🍫", category: "Plantation" },
  { name: "Clove", emoji: "🌸", category: "Spice Specialties" },
  { name: "Vanilla", emoji: "🌿", category: "Spice Specialties" },
] as const;

const CATEGORIES = [
  "All",
  "Plantation",
  "Spices",
  "Spice Specialties",
  "Nuts & Seeds",
  "Grains & Tubers",
  "Fruits",
] as const;

/* Category color map */
const CATEGORY_STYLES: Record<
  string,
  { gradient: string; border: string; text: string; bg: string; iconBg: string }
> = {
  Plantation: {
    gradient: "from-[#2d6a4f]/10 to-[#40916c]/5",
    border: "border-[#2d6a4f]/20",
    text: "text-[#2d6a4f]",
    bg: "bg-[#2d6a4f]",
    iconBg: "bg-[#d8f3dc]",
  },
  Spices: {
    gradient: "from-[#e76f51]/10 to-[#f4a261]/5",
    border: "border-[#e76f51]/20",
    text: "text-[#e76f51]",
    bg: "bg-[#e76f51]",
    iconBg: "bg-[#fce4cc]",
  },
  "Spice Specialties": {
    gradient: "from-[#7b2cbf]/10 to-[#c77dff]/5",
    border: "border-[#7b2cbf]/20",
    text: "text-[#7b2cbf]",
    bg: "bg-[#7b2cbf]",
    iconBg: "bg-[#e4d8f3]",
  },
  "Nuts & Seeds": {
    gradient: "from-[#6a4c2d]/10 to-[#ddb892]/5",
    border: "border-[#6a4c2d]/20",
    text: "text-[#6a4c2d]",
    bg: "bg-[#6a4c2d]",
    iconBg: "bg-[#fce4cc]",
  },
  "Grains & Tubers": {
    gradient: "from-[#606c38]/10 to-[#dda15e]/5",
    border: "border-[#606c38]/20",
    text: "text-[#606c38]",
    bg: "bg-[#606c38]",
    iconBg: "bg-[#e8f0e4]",
  },
  Fruits: {
    gradient: "from-[#d62828]/10 to-[#f77f00]/5",
    border: "border-[#d62828]/20",
    text: "text-[#d62828]",
    bg: "bg-[#d62828]",
    iconBg: "bg-[#ffe0e0]",
  },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Plantation: <TreePalm className="h-4 w-4" />,
  Spices: <Leaf className="h-4 w-4" />,
  "Spice Specialties": <FlowerIcon className="h-4 w-4" />,
  "Nuts & Seeds": <Bean className="h-4 w-4" />,
  "Grains & Tubers": <Sprout className="h-4 w-4" />,
  Fruits: <Cherry className="h-4 w-4" />,
};

export default function CropsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = CROPS.filter((crop) => {
    const matchesSearch = crop.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || crop.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  /* Group filtered crops by category */
  const grouped = filtered.reduce<Record<string, typeof CROPS[number][]>>(
    (acc, crop) => {
      if (!acc[crop.category]) acc[crop.category] = [];
      acc[crop.category].push(crop);
      return acc;
    },
    {}
  );

  return (
    <div className="flex-1 p-6 md:p-8">
      {/* ─── Header ─── */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2d6a4f] to-[#40916c] shadow-md">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1a2e1a]">
              Available Crops
            </h1>
            <p className="mt-0.5 text-sm text-[#5c7a5c]">
              Browse through {CROPS.length} crops supported on the platform
            </p>
          </div>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {CATEGORIES.filter((c) => c !== "All").map((cat) => {
          const count = CROPS.filter((c) => c.category === cat).length;
          const styles = CATEGORY_STYLES[cat];
          return (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? "All" : cat)
              }
              className={`group relative overflow-hidden rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${activeCategory === cat
                  ? `${styles.border} ring-2 ring-offset-1 ${styles.border.replace("border-", "ring-")}`
                  : "border-white/60"
                }`}
            >
              <div
                className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${styles.gradient} opacity-60 blur-xl transition group-hover:opacity-80`}
              />
              <div className="relative flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles.iconBg} shadow-sm`}
                >
                  <span className={styles.text}>
                    {CATEGORY_ICONS[cat]}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#7ca87c]">
                    {cat}
                  </p>
                  <p className="text-lg font-bold text-[#1a2e1a]">{count}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Search Bar ─── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7ca87c]" />
          <input
            id="crop-search"
            type="text"
            placeholder="Search crops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#d8f3dc] bg-white/80 py-2.5 pl-10 pr-4 text-sm text-[#1a2e1a] outline-none backdrop-blur-sm transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${activeCategory === cat
                  ? "bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white shadow-md"
                  : "border border-[#d8f3dc] bg-white/80 text-[#5c7a5c] hover:bg-[#e8f0e4] hover:text-[#1a2e1a]"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Crops Grid ─── */}
      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#b7e4c7] bg-white/50 py-20 backdrop-blur-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d8f3dc] to-[#b7e4c7]">
            <Sprout className="h-8 w-8 text-[#2d6a4f]" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#1a2e1a]">
            No crops found
          </h3>
          <p className="mt-1 text-sm text-[#5c7a5c]">
            Try a different search term or category.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, crops]) => {
            const styles = CATEGORY_STYLES[category];
            return (
              <div key={category}>
                {/* Section Header */}
                <div className="mb-4 flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${styles.iconBg}`}
                  >
                    <span className={styles.text}>
                      {CATEGORY_ICONS[category]}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#1a2e1a]">
                    {category}
                  </h2>
                  <span className="rounded-full bg-[#e8f0e4] px-2 py-0.5 text-[10px] font-semibold text-[#5c7a5c]">
                    {crops.length}
                  </span>
                  <div className="ml-2 h-px flex-1 bg-gradient-to-r from-[#d8f3dc] to-transparent" />
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {crops.map((crop) => (
                    <CropCard
                      key={crop.name}
                      name={crop.name}
                      emoji={crop.emoji}
                      category={crop.category}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Crop Card Component ─── */
function CropCard({
  name,
  emoji,
  category,
}: {
  name: string;
  emoji: string;
  category: string;
}) {
  const styles = CATEGORY_STYLES[category];

  return (
    <div
      className={`group relative cursor-default overflow-hidden rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${styles.border}`}
    >
      {/* Decorative glow */}
      <div
        className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${styles.gradient} opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-80`}
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Emoji Icon */}
        <div
          className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${styles.iconBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}
        >
          <span className="text-2xl">{emoji}</span>
        </div>

        {/* Name */}
        <h3 className="text-sm font-bold tracking-tight text-[#1a2e1a] transition-colors group-hover:text-[#2d6a4f]">
          {name}
        </h3>

        {/* Category tag */}
        <span
          className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${styles.iconBg} ${styles.text}`}
        >
          {category}
        </span>
      </div>
    </div>
  );
}