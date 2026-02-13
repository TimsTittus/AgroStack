"use client";

import { Filter, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const categories = ["All", "Vegetables", "Fruits", "Grains", "Dairy", "Organic"];
const locations = ["All Locations", "California", "Iowa", "Vermont", "Texas"];
const priceRanges = ["Any Price", "Under $5", "$5 - $10", "$10 - $25", "$25+"];

export function ProductFilters() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-full border border-[#d4e7d0] bg-white px-4 py-2 text-xs font-semibold text-[#2d6a4f] transition-all duration-200 hover:bg-[#e8f0e4] hover:shadow-sm"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
              activeCategory === cat
                ? "bg-linear-to-r from-[#2d6a4f] to-[#40916c] text-white shadow-md"
                : "border border-[#e8f0e4] bg-white text-[#5c7a5c] hover:border-[#b7e4c7] hover:text-[#2d6a4f]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="glass-card flex flex-wrap gap-3 rounded-2xl p-4">
              <FilterDropdown label="Location" options={locations} />
              <FilterDropdown label="Price Range" options={priceRanges} />
              <button className="ml-auto rounded-full bg-linear-to-r from-[#2d6a4f] to-[#40916c] px-5 py-2 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg">
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterDropdown({
  label,
  options,
}: {
  label: string;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(options[0]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-[#d4e7d0] bg-white px-4 py-2 text-xs font-medium text-[#1a2e1a] transition-all duration-200 hover:border-[#b7e4c7]"
      >
        <span className="text-[#7ca87c]">{label}:</span>
        <span>{selected}</span>
        <ChevronDown className={`h-3 w-3 text-[#7ca87c] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-30 mt-1 w-full min-w-\[160px] overflow-hidden rounded-xl border border-[#d4e7d0] bg-white py-1 shadow-lg"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setSelected(opt);
                  setOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-xs transition-colors ${
                  selected === opt
                    ? "bg-[#e8f0e4] font-semibold text-[#2d6a4f]"
                    : "text-[#5c7a5c] hover:bg-[#f0f4ee]"
                }`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
