import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "@/db";
import { orders, user } from "@/db/schema";
import { transporter } from "@/lib/mailer";
import { eq, and,desc } from "drizzle-orm";
import { z } from "zod";
import client from "@/lib/twilio";
import { render } from "@react-email/render";
import OrderConfirmEmail from "@/components/email/orderMail";

export const orderRouter = createTRPCRouter({
    setOrder: protectedProcedure
        .input(
            z.object({
                product_id: z.string(),
                name: z.string(),
                quantity: z.string(),
                farmer_id: z.string(),
                price: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.auth) throw new Error("Unauthorized");

            const userId = ctx.auth.user.id;
            console.log("user id : ", userId);
            const inserted = await db
                .insert(orders)
                .values({
                    buyerId: userId,
                    farmerId: input.farmer_id,
                    productId: input.product_id,
                    name: input.name,
                    price: input.price,
                    quantity: input.quantity,
                })
                .returning({ id: orders.id });

            return inserted[0]?.id ?? null;
        }),

    getOrderById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input, ctx }) => {
            if (!ctx.auth) throw new Error("Unauthorized");

            const userId = ctx.auth.user.id;

            const result = await db
                .select()
                .from(orders)
                .where(
                    and(
                        eq(orders.id, input.id),
                        eq(orders.buyerId, userId),
                        eq(orders.status, "pending")
                    )
                )
                .limit(1);

            return result[0] ?? null;
        }),
    completeOrder: protectedProcedure
        .input(z.object({ orderId: z.string() }))
        .mutation(async ({ input, ctx }) => {
            if (!ctx.auth) throw new Error("Unauthorized");

            const userId = ctx.auth.user.id;

            const updated = await db
                .update(orders)
                .set({ status: "completed" })
                .where(
                    and(
                        eq(orders.id, input.orderId),
                        eq(orders.buyerId, userId)
                    )
                )
                .returning({ id: orders.id });

            return updated[0]?.id ?? null;
        }),
    orderMessage: protectedProcedure
        .input(
            z.object({
                orderId: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.auth) throw new Error("Unauthorized");

            const userId = ctx.auth.user.id;
            const farmerId = await db
                .select({ farmerId: orders.farmerId })
                .from(orders)
                .where(eq(orders.id, input.orderId));
            const userContact = await db
                .select({
                    email: user.email,
                    phone: user.phone,
                    name: user.name
                })
                .from(user)
                .where(eq(user.id, userId))
                .limit(1);

            const farmerContact = await db
                .select({
                    email: user.email,
                    phone: user.phone,
                })
                .from(user)
                .where(eq(user.id, farmerId[0].farmerId))
                .limit(1);

            if (!userContact.length || !farmerContact.length) {
                throw new Error("User or Farmer not found");
            }

            const buyer = userContact[0];
            const farmer = farmerContact[0];
            const html = await render(
                OrderConfirmEmail({
                    buyerName: buyer.name,
                    buyerEmail: buyer.email,
                    orderId: input.orderId,
                })
            );

            await transporter.sendMail({
                to: farmer.email,
                subject: "New Order Received - AgroStack",
                html,
            });
            await client.messages.create({
                body: `${buyer.name} (${buyer.email}) ൽ നിന്ന് നിങ്ങൾക്ക് ഒരു പുതിയ ഓർഡർ അഭ്യർത്ഥന ലഭിച്ചു. AgroStack ഡാഷ്‌ബോർഡ് പരിശോധിക്കുക.`,
                from: process.env.TWILIO_PHONE,
                to: `+91${farmer.phone}`,
            });

            console.log("Send email to:", farmer.email);
            console.log("Send SMS to:", farmer.phone);

            return { success: true };
        }),
    getMyOrders: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.auth) throw new Error("Unauthorized");
        const userId = ctx.auth.user.id;

        const result = await db
            .select()
            .from(orders)
            .where(eq(orders.buyerId, userId))
            .orderBy(orders.createdAt);

        return result;
    }),

getRecentOrders: protectedProcedure.query(async ({ ctx }) => {
  if (!ctx.auth) throw new Error("Unauthorized");

  const userId = ctx.auth.user.id;
  
  const ordersData = await db
    .select()
    .from(orders)
    .where(eq(orders.buyerId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(4);
  return ordersData;
}),


});
