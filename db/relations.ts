import { relations } from "drizzle-orm/relations";
import { user, account, session, products } from "./schema";

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
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const productsRelations = relations(products, ({one}) => ({
	user: one(user, {
		fields: [products.userid],
		references: [user.id]
	}),
}));