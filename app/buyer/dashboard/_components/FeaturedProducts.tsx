"use client";

import { Star, MapPin, MessageCircle, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";

const products = [
  {
    id: 1,
    name: "Organic Red Tomatoes",
    farmer: "Maria Garcia",
    location: "Salinas Valley, CA",
    price: 4.99,
    unit: "kg",
    rating: 4.8,
    reviews: 124,
    image: "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=300&fit=crop",
    tag: "Organic",
  },
  {
    id: 2,
    name: "Fresh Sweet Corn",
    farmer: "Robert Chen",
    location: "Iowa Heartland",
    price: 3.49,
    unit: "dozen",
    rating: 4.9,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop",
    tag: "Bestseller",
  },
  {
    id: 3,
    name: "Hass Avocados",
    farmer: "Elena Vasquez",
    location: "San Diego, CA",
    price: 6.99,
    unit: "bag",
    rating: 4.7,
    reviews: 203,
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=300&fit=crop",
    tag: "Premium",
  },
  {
    id: 4,
    name: "Farm Fresh Eggs",
    farmer: "James Wilson",
    location: "Vermont",
    price: 5.49,
    unit: "dozen",
    rating: 4.9,
    reviews: 312,
    image: "https://images.unsplash.com/photo-1569288052389-dac9b0ac9eac?w=400&h=300&fit=crop",
    tag: "Free-range",
  },
];

export function FeaturedProducts() {
  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1a2e1a]">
            Featured Products
          </h2>
          <p className="text-sm text-[#5c7a5c]">
            Fresh picks from local farmers
          </p>
        </div>
        <button className="rounded-full border border-[#d4e7d0] bg-white px-4 py-2 text-xs font-semibold text-[#2d6a4f] transition-all duration-200 hover:bg-[#e8f0e4] hover:shadow-sm">
          View All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            className="glass-card group overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#2d6a4f] shadow-sm backdrop-blur-sm">
                {product.tag}
              </span>
              <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#2d6a4f] opacity-0 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-[#2d6a4f] hover:text-white group-hover:opacity-100">
                <MessageCircle className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4">
              <h3 className="text-sm font-semibold text-[#1a2e1a] line-clamp-1">
                {product.name}
              </h3>

              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#5c7a5c]">
                <span className="font-medium">{product.farmer}</span>
                <span className="text-[#d4ddd0]">|</span>
                <MapPin className="h-3 w-3" />
                <span className="truncate">{product.location}</span>
              </div>

              <div className="mt-2 flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-[#1a2e1a]">
                  {product.rating}
                </span>
                <span className="text-xs text-[#7ca87c]">
                  ({product.reviews})
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-[#2d6a4f]">
                    ${product.price}
                  </span>
                  <span className="text-xs text-[#7ca87c]">
                    /{product.unit}
                  </span>
                </div>
                <button className="flex items-center gap-1.5 rounded-full bg-linear-to-r from-[#2d6a4f] to-[#40916c] px-3.5 py-2 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-110">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Buy
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
