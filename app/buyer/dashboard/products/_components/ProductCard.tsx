"use client";

import Image from "next/image";
import { trpc } from "@/trpc/client";

type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
  userid: string;
  category?: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const { data, isLoading } = trpc.user.getPhone.useQuery({
    userid: product.userid,
  });

  return (
    <div className="group relative w-[17vw] overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md">
      
      <div className="relative h-64 w-full overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 384px"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <div className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1b4332] backdrop-blur-md">
          New Arrival
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest text-[#2d6a4f]/60">
            {product.category || "Lifestyle"}
          </span>

          <h3 className="text-xl font-bold tracking-tight text-[#1a2e1a]">
            {product.name}
          </h3>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-gray-400 uppercase">
              Price
            </span>
            <span className="text-2xl font-bold text-[#1b4332]">
              ₹{product.price}
            </span>
          </div>

          {isLoading ? (
            <button
              disabled
              className="h-11 rounded-full bg-gray-200 px-5 text-sm font-semibold text-gray-500"
            >
              Loading...
            </button>
          ) : data?.phone ? (
            <a
              href={`tel:${data.phone}`}
              className="flex h-11 items-center justify-center rounded-full bg-[#2d6a4f] px-5 text-sm font-semibold text-white transition hover:bg-[#1b4332]"
            >
              Buy Now
            </a>
          ) : (
            <button
              disabled
              className="h-11 rounded-full bg-gray-200 px-5 text-sm font-semibold text-gray-500"
            >
              Not Available
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
