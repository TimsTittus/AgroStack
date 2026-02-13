"use client";

import { useRouter, useParams } from "next/navigation";
import { trpc } from "@/trpc/client";

export default function CheckoutPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.orderId as string;

    const { data: order, isLoading } = trpc.order.getOrderById.useQuery(
        { id: orderId },
        { enabled: !!orderId }
    );
    const orderMessgae = trpc.order.orderMessage.useMutation();
    const completeOrder = trpc.order.completeOrder.useMutation({
        onSuccess: () => {
            orderMessgae.mutate({orderId})
            router.push(`/buyer/checkout/confirm/${orderId}`);
        },
    });
    const handleConfirm = () => {
        completeOrder.mutate({ orderId });
    };

    if (isLoading) return <div className="p-6">Loading...</div>;
    if (!order) return <div className="p-6">Order not found</div>;

    return (
        <div className="mx-auto max-w-2xl p-6">
            <h1 className="mb-6 text-2xl font-semibold">Checkout</h1>

            <div className="space-y-2 rounded-xl border p-4 shadow-sm">
                <p><strong>Product:</strong> {order.name}</p>
                <p><strong>Quantity:</strong> {order.quantity}</p>
                <p><strong>Total Price:</strong> ₹{order.price}</p>
            </div>

            <button
                onClick={handleConfirm}
                className="mt-6 w-full rounded-lg bg-green-600 py-3 text-white hover:bg-green-700"
            >
                Proceed to Payment
            </button>
        </div>
    );
}
