"use client";

import { MapPin, MessageCircle, ShoppingCart, Leaf, Package } from "lucide-react";
import { motion } from "framer-motion";
import { trpc } from "@/trpc/client";

export function FeaturedProducts() {
  const { data: products, isLoading } = trpc.product.getProducts.useQuery();

  if (isLoading) return <FeaturedProductsSkeleton />;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-[#1a2e1a]">
              Featured Products
            </h2>
            <Leaf className="h-3.5 w-3.5 text-[#2d6a4f]" />
          </div>
          <p className="text-xs text-[#5c7a5c]">Fresh picks from local farmers</p>
        </div>

        <button className="rounded-full border border-[#d4e7d0] bg-white px-3 py-1.5 text-[10px] font-bold text-[#2d6a4f] transition-all duration-300 hover:bg-[#2d6a4f] hover:text-white active:scale-95">
          View All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products?.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="group relative flex flex-col rounded-2xl border border-[#e8f0e4] bg-white transition-all duration-300 hover:border-[#2d6a4f]/20 hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] overflow-hidden p-2">
              <div className="relative h-full w-full overflow-hidden rounded-xl">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-[#2d6a4f] opacity-0 shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-[#2d6a4f] hover:text-white group-hover:opacity-100">
                  <MessageCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col px-3 pb-3 pt-1">
              <h3 className="truncate text-sm font-bold text-[#1a2e1a]">
                {product.name}
              </h3>

              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#5c7a5c]">
                <MapPin className="h-2.5 w-2.5 text-[#2d6a4f]" />
                <span className="truncate">Local Farm</span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[#f0f4ee] pt-2.5">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base font-black text-[#1a2e1a]">
                    ₹{product.price}
                  </span>
                  <span className="text-[9px] font-bold text-[#7ca87c]">/unit</span>
                </div>

                <button className="flex h-8 items-center gap-1.5 rounded-lg bg-[#2d6a4f] px-3 text-[10px] font-bold text-white transition-all duration-200 hover:bg-[#1b4332] active:scale-95">
                  <ShoppingCart className="h-3 w-3" />
                  Buy
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {products?.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-xs font-medium text-[#5c7a5c]">No products available</p>
        </div>
      )}
    </section>
  );
}

function FeaturedProductsSkeleton() {
  return (
    <section className="animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-10 w-40 rounded-md bg-gray-50" />
        <div className="h-7 w-16 rounded-full bg-gray-50" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-50 bg-white p-2">
            <div className="aspect-[4/3] rounded-xl bg-gray-100" />
            <div className="mt-3 space-y-2 px-1 pb-2">
              <div className="h-3 w-3/4 rounded bg-gray-100" />
              <div className="h-2 w-1/2 rounded bg-gray-50" />
              <div className="mt-2 flex items-center justify-between pt-2">
                <div className="h-4 w-12 rounded bg-gray-100" />
                <div className="h-7 w-16 rounded bg-gray-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}