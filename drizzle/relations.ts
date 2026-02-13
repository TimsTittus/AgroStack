import { relations } from "drizzle-orm/relations";
import { user, account, session, products, orders } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	products: many(products),
	orders_buyerId: many(orders, {
		relationName: "orders_buyerId_user_id"
	}),
	orders_farmerId: many(orders, {
		relationName: "orders_farmerId_user_id"
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	user: one(user, {
		fields: [products.userid],
		references: [user.id]
	}),
	orders: many(orders),
}));

export const ordersRelations = relations(orders, ({one}) => ({
	user_buyerId: one(user, {
		fields: [orders.buyerId],
		references: [user.id],
		relationName: "orders_buyerId_user_id"
	}),
	user_farmerId: one(user, {
		fields: [orders.farmerId],
		references: [user.id],
		relationName: "orders_farmerId_user_id"
	}),
	product: one(products, {
		fields: [orders.productId],
		references: [products.id]
	}),
}));