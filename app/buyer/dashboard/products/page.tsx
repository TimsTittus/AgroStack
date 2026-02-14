"use client";

import ProductCard from "./_components/ProductCard";
import { trpc } from "@/trpc/client";

export default function BrowseProducts() {
  const { data: products, isLoading } = trpc.listings.getAllListings.useQuery();

  return (
    <div className="w-full min-h-screen bg-[#fbfcfb] p-6 md:p-8">
      <div className="mx-auto w-full max-w-(--breakpoint-2xl)">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#1a2e1a]">
            Browse Products
          </h1>
          <p className="text-sm text-[#5c7a5c] mt-1">
            Discover fresh harvests from verified local farmers.
          </p>
        </div>

        {isLoading ? (
          <BrowseSkeleton />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!isLoading && products?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
               <span className="text-4xl">🌱</span>
            </div>
            <p className="mt-4 text-sm font-medium text-[#5c7a5c]">No products found in your area.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BrowseSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div 
          key={i} 
          className="rounded-[2rem] border border-[#e8f0e4] bg-white p-3 shadow-sm animate-pulse"
        >
          <div className="aspect-square w-full rounded-2xl bg-gray-100" />
          
          <div className="space-y-4 px-2 py-5">
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded-lg bg-gray-100" />
              <div className="h-3 w-1/2 rounded-lg bg-gray-50" />
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="h-6 w-16 rounded-lg bg-gray-100" />
              <div className="h-9 w-24 rounded-xl bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}