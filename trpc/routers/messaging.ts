import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "@/db";
import { messages, user } from "@/db/schema";
import { eq, or, and, desc, inArray, ilike, ne, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const messagingRouter = createTRPCRouter({
    sendMessage: protectedProcedure
        .input(
            z.object({
                receiverId: z.string(),
                content: z.string().min(1, "Message content is required"),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const senderId = ctx.auth!.user.id;

            if (senderId === input.receiverId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot send a message to yourself",
                });
            }

            const receiver = await db.query.user.findFirst({
                where: eq(user.id, input.receiverId),
            });

            if (!receiver) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }

            const inserted = await db
                .insert(messages)
                .values({
                    senderId,
                    receiverId: input.receiverId,
                    content: input.content,
                })
                .returning();

            return {
                ...inserted[0],
                sender: {
                    id: ctx.auth!.user.id,
                    name: ctx.auth!.user.name,
                    image: ctx.auth!.user.image,
                },
            };
        }),

    getMessages: protectedProcedure
        .input(
            z.object({
                otherUserId: z.string(),
            })
        )
        .query(async ({ input, ctx }) => {
            const currentUserId = ctx.auth!.user.id;

            const chatMessages = await db
                .select()
                .from(messages)
                .where(
                    or(
                        and(
                            eq(messages.senderId, currentUserId),
                            eq(messages.receiverId, input.otherUserId)
                        ),
                        and(
                            eq(messages.senderId, input.otherUserId),
                            eq(messages.receiverId, currentUserId)
                        )
                    )
                )
                .orderBy(messages.createdAt);

            return chatMessages;
        }),

    getConversations: protectedProcedure.query(async ({ ctx }) => {
        const currentUserId = ctx.auth!.user.id;

        // 1. Find all users the current user has interacted with
        const sentMessages = await db
            .selectDistinct({ id: messages.receiverId })
            .from(messages)
            .where(eq(messages.senderId, currentUserId));

        const receivedMessages = await db
            .selectDistinct({ id: messages.senderId })
            .from(messages)
            .where(eq(messages.receiverId, currentUserId));

        const partnerIds = new Set<string>([
            ...sentMessages.map(m => m.id),
            ...receivedMessages.map(m => m.id)
        ]);

        if (partnerIds.size === 0) {
            return [];
        }

        // 2. Fetch user details for these partners
        const partners = await db
            .select({
                id: user.id,
                name: user.name,
                image: user.image,
                role: user.role,
            })
            .from(user)
            .where(inArray(user.id, Array.from(partnerIds)));

        // 3. For each partner, fetch last message and unread count in parallel
        const conversations = await Promise.all(
            partners.map(async (partner) => {
                const lastMsg = await db.query.messages.findFirst({
                    where: or(
                        and(eq(messages.senderId, currentUserId), eq(messages.receiverId, partner.id)),
                        and(eq(messages.senderId, partner.id), eq(messages.receiverId, currentUserId))
                    ),
                    orderBy: desc(messages.createdAt),
                });

                // Count unread messages from this partner
                const unreadCountResult = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(messages)
                    .where(
                        and(
                            eq(messages.senderId, partner.id),
                            eq(messages.receiverId, currentUserId),
                            eq(messages.read, false)
                        )
                    );

                return {
                    ...partner,
                    lastMessage: lastMsg?.content,
                    lastMessageTime: lastMsg?.createdAt,
                    unread: Number(unreadCountResult[0]?.count ?? 0),
                };
            })
        );

        // Sort by last message time
        return conversations.sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
        });
    }),

    markAsRead: protectedProcedure
        .input(
            z.object({
                otherUserId: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const currentUserId = ctx.auth!.user.id;

            await db
                .update(messages)
                .set({ read: true })
                .where(
                    and(
                        eq(messages.senderId, input.otherUserId),
                        eq(messages.receiverId, currentUserId),
                        eq(messages.read, false)
                    )
                );

            return { success: true };
        }),
    searchUsers: protectedProcedure
        .input(z.object({ query: z.string() }))
        .query(async ({ input, ctx }) => {
            if (!input.query) return [];

            const currentUserId = ctx.auth!.user.id;

            return await db
                .select({
                    id: user.id,
                    name: user.name,
                    image: user.image,
                    role: user.role,
                })
                .from(user)
                .where(
                    and(
                        ne(user.id, currentUserId),
                        or(
                            ilike(user.name, `%${input.query}%`),
                            ilike(user.email, `%${input.query}%`)
                        )
                    )
                )
                .limit(10);
        }),
    setTypingStatus: protectedProcedure
        .input(z.object({ isTyping: z.boolean() }))
        .mutation(async ({ input, ctx }) => {
            await db
                .update(user)
                .set({ isTyping: input.isTyping })
                .where(eq(user.id, ctx.auth!.user.id));
            return { success: true };
        }),

    getUserStatus: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
            const userData = await db.query.user.findFirst({
                where: eq(user.id, input.userId),
                columns: {
                    isTyping: true,
                    lastSeen: true,
                },
            });
            return userData;
        }),

    updateLastSeen: protectedProcedure.mutation(async ({ ctx }) => {
        await db
            .update(user)
            .set({ lastSeen: new Date().toISOString() })
            .where(eq(user.id, ctx.auth!.user.id));
        return { success: true };
    }),
});
