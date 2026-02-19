import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "@/db";
import { messages, orders, listings, user, dismissedNotifications } from "@/db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import z from "zod";

export const notificationsRouter = createTRPCRouter({
    /**
     * Aggregates real-time notifications from existing tables:
     * 1. Unread messages (grouped by sender)
     * 2. Recent order updates (pending/confirmed/completed)
     * 3. Filters out dismissed notifications
     * 4. Total unread count for the badge
     */
    getNotifications: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.auth!.user.id;

        // ── 0. Fetch dismissed notification IDs for this user ───────
        const dismissed = await db
            .select({ notificationId: dismissedNotifications.notificationId })
            .from(dismissedNotifications)
            .where(eq(dismissedNotifications.userId, userId));

        const dismissedSet = new Set(dismissed.map((d) => d.notificationId));

        // ── 1. Unread messages grouped by sender ───────────────────
        const unreadMessages = await db
            .select({
                senderId: messages.senderId,
                senderName: user.name,
                senderImage: user.image,
                count: sql<number>`count(*)`.as("count"),
                latestAt: sql<string>`max(${messages.createdAt})`.as("latest_at"),
            })
            .from(messages)
            .innerJoin(user, eq(messages.senderId, user.id))
            .where(
                and(
                    eq(messages.receiverId, userId),
                    eq(messages.read, false)
                )
            )
            .groupBy(messages.senderId, user.name, user.image)
            .orderBy(desc(sql`max(${messages.createdAt})`))
            .limit(10);

        // ── 2. Recent order activity (last 7 days) ─────────────────
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const recentOrders = await db
            .select({
                id: orders.id,
                status: orders.status,
                productName: listings.name,
                productImage: listings.image,
                otherUserName: user.name,
                createdAt: orders.createdAt,
                quantity: orders.quantity,
                price: orders.price,
            })
            .from(orders)
            .innerJoin(listings, eq(orders.productId, listings.id))
            .innerJoin(
                user,
                // Show the OTHER party's name (if I'm buyer, show farmer; if I'm farmer, show buyer)
                or(
                    and(eq(orders.buyerId, userId), eq(user.id, orders.farmerId)),
                    and(eq(orders.farmerId, userId), eq(user.id, orders.buyerId))
                )!
            )
            .where(
                and(
                    or(eq(orders.buyerId, userId), eq(orders.farmerId, userId)),
                    sql`${orders.createdAt} >= ${sevenDaysAgo}`
                )
            )
            .orderBy(desc(orders.createdAt))
            .limit(10);

        // ── 3. Build notification items ────────────────────────────
        type NotificationItem = {
            id: string;
            type: "message" | "order";
            title: string;
            description: string;
            image: string | null;
            timestamp: string;
            read: boolean;
            link?: string;
        };

        const notifications: NotificationItem[] = [];

        // Message notifications
        for (const msg of unreadMessages) {
            const notifId = `msg-${msg.senderId}`;
            if (dismissedSet.has(notifId)) continue; // Skip dismissed
            notifications.push({
                id: notifId,
                type: "message",
                title: `New message${Number(msg.count) > 1 ? "s" : ""} from ${msg.senderName}`,
                description: `${msg.count} unread message${Number(msg.count) > 1 ? "s" : ""}`,
                image: msg.senderImage,
                timestamp: msg.latestAt,
                read: false,
                link: "/farmer/dashboard/messages",
            });
        }

        // Order notifications
        for (const order of recentOrders) {
            const notifId = `order-${order.id}`;
            if (dismissedSet.has(notifId)) continue; // Skip dismissed
            const statusLabels: Record<string, string> = {
                pending: "📦 New order received",
                placed: "🛒 Order placed",
                confirmed: "✅ Order confirmed",
                completed: "🎉 Order completed",
                cancelled: "❌ Order cancelled",
            };
            notifications.push({
                id: notifId,
                type: "order",
                title: statusLabels[order.status] || `Order ${order.status}`,
                description: `${order.productName} — ${order.quantity} qty by ${order.otherUserName}`,
                image: order.productImage,
                timestamp: order.createdAt,
                read: order.status === "completed" || order.status === "cancelled",
                link: "/farmer/dashboard/orders",
            });
        }

        // Sort all by timestamp (newest first)
        notifications.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Total unread count
        const totalUnread = notifications.filter((n) => !n.read).length;

        return {
            items: notifications.slice(0, 15),
            totalUnread,
        };
    }),

    readNotification: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
        const userId = ctx.auth!.user.id;
        const { id } = input;
        await db.update(messages).set({ read: true }).where(eq(messages.id, id));
        return { success: true };
    }),

    /**
     * Dismiss / remove a notification.
     * Persists the dismissal in the dismissed_notifications table so it
     * survives page refreshes. For message notifications, also marks messages as read.
     */
    dismissNotification: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.auth!.user.id;
            const { id } = input;

            // For message notifications, also mark messages as read
            if (id.startsWith("msg-")) {
                const senderId = id.replace("msg-", "");
                await db
                    .update(messages)
                    .set({ read: true })
                    .where(
                        and(
                            eq(messages.receiverId, userId),
                            eq(messages.senderId, senderId),
                            eq(messages.read, false)
                        )
                    );
            }

            // Persist the dismissal in the DB (upsert — ignore if already exists)
            await db
                .insert(dismissedNotifications)
                .values({
                    userId,
                    notificationId: id,
                })
                .onConflictDoNothing();

            return { success: true };
        }),
});
