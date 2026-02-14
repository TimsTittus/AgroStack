import { relations } from "drizzle-orm/relations";
import { user, account, session, listings, orders } from "./schema";

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
	sessions: many(session),
	listings: many(listings),
	orders_buyerId: many(orders, {
		relationName: "orders_buyerId_user_id"
	}),
	orders_farmerId: many(orders, {
		relationName: "orders_farmerId_user_id"
	}),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
	user: one(user, {
		fields: [listings.userid],
		references: [user.id]
	}),
	orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  buyer: one(user, {
    fields: [orders.buyerId],
    references: [user.id],
  }),

  farmer: one(user, {
    fields: [orders.farmerId],
    references: [user.id],
  }),
	product: one(listings, {
		fields: [orders.productId],
		references: [listings.id]
	}),
}));
