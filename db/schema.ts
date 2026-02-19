import { pgTable, index, text, timestamp, foreignKey, unique, boolean, uuid, bigint, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	role: text().notNull(),
	phone: text().notNull(),
	wallet: text().default('0').notNull(),
	lastSeen: timestamp("last_seen"),
	isTyping: boolean("is_typing").default(false),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const listings = pgTable("listings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull(),
	price: text().notNull(),
	quantity: text().notNull(),
	userid: text().notNull(),
	description: text(),
	image: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userid],
			foreignColumns: [user.id],
			name: "listings_userid_fkey"
		}),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	senderId: text("sender_id").notNull(),
	receiverId: text("receiver_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	read: boolean().default(false).notNull(),
}, (table) => [
	index("idx_messages_created").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_messages_receiver").using("btree", table.receiverId.asc().nullsLast().op("text_ops")),
	index("idx_messages_sender").using("btree", table.senderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [user.id],
			name: "messages_receiver_id_fkey"
		}),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [user.id],
			name: "messages_sender_id_fkey"
		}),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text(),
	buyerId: text("buyer_id").notNull(),
	quantity: text().notNull(),
	price: text().notNull(),
	farmerId: text("farmer_id").notNull(),
	productId: uuid("product_id").notNull(),
	status: text().default('pending').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [user.id],
			name: "orders_buyer_id_fkey"
		}),
	foreignKey({
			columns: [table.farmerId],
			foreignColumns: [user.id],
			name: "orders_farmer_id_fkey"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [listings.id],
			name: "orders_product_id_fkey"
		}),
]);

export const inventory = pgTable("inventory", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "inventory_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: text("user_id"),
	cropId: text("crop_id"),
	marketPrice: text("market_price"),
	isProfitable: boolean("is_profitable"),
	unit: text().default('0'),
	quantity: text(),
	imageUrl: text("image_url"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "inventory_user_id_fkey"
		}).onDelete("cascade"),
]);

export const dismissedNotifications = pgTable("dismissed_notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	notificationId: text("notification_id").notNull(),
	dismissedAt: timestamp("dismissed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "dismissed_notifications_user_id_fkey"
	}).onDelete("cascade"),
	unique("dismissed_notifications_user_notif_unique").on(table.userId, table.notificationId),
]);
