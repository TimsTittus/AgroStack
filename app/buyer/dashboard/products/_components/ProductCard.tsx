"use client";

import { useState } from "react";
import Image from "next/image";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
  userid: string;
  category?: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const createOrder = trpc.order.setOrder.useMutation({
    onSuccess: (orderId) => {
      setIsModalOpen(false);
      router.push(`/buyer/checkout/${orderId}`);
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  const basePrice = parseFloat(product.price);
  const totalPrice = (basePrice * quantity).toFixed(2);

  const handleCheckout = () => {
    if (createOrder.isPending) return;

    createOrder.mutate({
      product_id: product.id,
      quantity: quantity.toString(),
      price: totalPrice,
      name: product.name,
      farmer_id: product.userid,
    });
  };

  return (
    <>
      <div className="group relative w-[17vw] overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md">
        
        {/* Image */}
        <div className="relative h-64 w-full overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>

        {/* Info */}
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

            <button
              onClick={() => {
                setQuantity(1);
                setIsModalOpen(true);
              }}
              className="group/btn relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#2d6a4f] text-white transition-all duration-500 hover:w-32 active:scale-95"
            >
              <div className="absolute transition-all duration-300 group-hover/btn:translate-x-10 group-hover/btn:opacity-0">
                <PlusIcon />
              </div>
              <span className="absolute -translate-x-10 text-sm font-bold opacity-0 transition-all duration-300 group-hover/btn:translate-x-0 group-hover/btn:opacity-100">
                Buy Now
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-80 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              Select Quantity
            </h3>
            <p className="mb-4 text-sm text-gray-500">{product.name}</p>

            <div className="flex items-center justify-center gap-4 py-4">
              <button
                disabled={quantity === 1}
                onClick={() => setQuantity(quantity - 1)}
                className="h-8 w-8 rounded-full border border-gray-300 disabled:opacity-50"
              >
                -
              </button>

              <span className="text-xl font-bold">{quantity}</span>

              <button
                onClick={() => setQuantity(quantity + 1)}
                className="h-8 w-8 rounded-full border border-gray-300"
              >
                +
              </button>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Total Amount:</span>
                <span className="font-bold text-[#1b4332]">
                  ₹{totalPrice}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-lg py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                disabled={createOrder.isPending}
                onClick={handleCheckout}
                className="flex-1 rounded-lg bg-[#2d6a4f] py-2 text-sm font-bold text-white transition hover:bg-[#1b4332] disabled:opacity-50"
              >
                {createOrder.isPending ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
