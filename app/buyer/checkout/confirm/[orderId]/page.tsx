"use client";

import { useRouter, useParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function OrderSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900">
          Order Placed Successfully!
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-sm text-gray-500">
          Your order has been confirmed and is being processed.
        </p>

        {/* Order ID */}
        <div className="mt-4 rounded-lg bg-gray-100 p-3 text-sm">
          Order ID:
          <span className="ml-1 font-semibold">{orderId}</span>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => router.push("/buyer/dashboard/orders")}
            className="w-full rounded-lg bg-[#2d6a4f] py-2.5 text-white font-semibold hover:bg-[#1b4332]"
          >
            View Orders
          </button>

          <button
            onClick={() => router.push("/buyer/dashboard/products")}
            className="w-full rounded-lg border py-2.5 font-semibold hover:bg-gray-50"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
