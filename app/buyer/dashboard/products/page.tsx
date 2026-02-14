"use client";

import ProductCard from "./_components/ProductCard";
import { trpc } from "@/trpc/client";

export default function BrowseProducts() {
  const { data: products, isLoading } =
    trpc.listings.getAllListings.useQuery();

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-semibold text-[#1a2e1a]">
          Browse Products
        </h1>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold text-[#1a2e1a]">
        Browse Products
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
