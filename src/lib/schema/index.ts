import { pgTable, text, timestamp, boolean, doublePrecision, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('UserRole', ['ADMIN', 'USER']);
export const userStatusEnum = pgEnum('UserStatus', ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']);
export const orderStatusEnum = pgEnum('OrderStatus', ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']);
export const paymentStatusEnum = pgEnum('PaymentStatus', ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED']);

// Users
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  emailVerified: timestamp('emailVerified'),
  image: text('image'),
  role: userRoleEnum('role').notNull().default('ADMIN'),
  password: text('password'),
  status: userStatusEnum('status').notNull().default('ACTIVE'),
  isVerified: boolean('isVerified').notNull().default(false),
  token: text('token'),
  resetExpiry: timestamp('resetExpiry'),
  roleId: text('roleId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
});

// Departments
export const departments = pgTable('departments', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  bannerImage: text('bannerImage').notNull(),
  description: text('description'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
});

// Categories
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  image: text('image').notNull(),
  bannerImage: text('bannerImage'),
  description: text('description'),
  isActive: boolean('isActive').notNull().default(true),
  departmentId: text('departmentId').notNull().references(() => departments.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt'),
});

// Brands
export const brands = pgTable('brands', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  bannerImage: text('bannerImage'),
  logo: text('logo'),
  description: text('description'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
});

// Banners
export const banners = pgTable('banners', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('imageUrl').notNull(),
  mobileImageUrl: text('mobileImageUrl'),
  linkUrl: text('linkUrl'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
});

// Products
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  imageUrl: text('imageUrl'),
  productImages: jsonb('productImages').$type<string[]>().default([]),
  description: text('description'),
  summary: text('summary'),
  isActive: boolean('isActive').notNull().default(true),
  isFeatured: boolean('isFeatured').notNull().default(false),
  isDeal: boolean('isDeal').notNull().default(false),
  price: doublePrecision('price').notNull(),
  buyingPrice: doublePrecision('buyingPrice'),
  dealPrice: doublePrecision('dealPrice'),
  stockQty: integer('stockQty'),
  lowStockAlert: integer('lowStockAlert').default(5),
  discount: doublePrecision('discount'),
  categoryId: text('categoryId').references(() => categories.id),
  frequentlyBoughtTogetherItemIds: jsonb('frequentlyBoughtTogetherItemIds').$type<string[]>().default([]),
  brandId: text('brandId').references(() => brands.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt'),
});

// Orders
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('orderNumber').notNull(),
  userId: text('userId').notNull().references(() => users.id),
  currency: text('currency').notNull().default('usd'),
  totalOrderAmount: doublePrecision('totalOrderAmount').notNull(),
  paymentStatus: paymentStatusEnum('paymentStatus').notNull().default('PENDING'),
  transactionId: text('transactionId'),
  orderStatus: orderStatusEnum('orderStatus').notNull().default('DELIVERED'),
  trackingNumber: text('trackingNumber'),
  stripePaymentIntentId: text('stripePaymentIntentId'),
  stripeCustomerId: text('stripeCustomerId'),
  addressId: text('addressId').references(() => addresses.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
});

// Order Items
export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('orderId').notNull().references(() => orders.id),
  productId: text('productId').notNull(),
  imageUrl: text('imageUrl'),
  title: text('title').notNull(),
  quantity: integer('quantity').notNull(),
  price: doublePrecision('price').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
});

// Payments
export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  orderId: text('orderId').notNull().references(() => orders.id),
  stripePaymentIntentId: text('stripePaymentIntentId').notNull(),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').notNull().default('usd'),
  status: paymentStatusEnum('status').notNull().default('PENDING'),
  paymentMethod: text('paymentMethod'),
  stripeChargeId: text('stripeChargeId'),
  stripeReceiptUrl: text('stripeReceiptUrl'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
});

// Addresses
export const addresses = pgTable('addresses', {
  id: text('id').primaryKey(),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zip: text('zip').notNull(),
  phone: text('phone').notNull(),
  isDefault: boolean('isDefault').notNull().default(false),
  userId: text('userId').notNull().references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  addresses: many(addresses),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  department: one(departments, {
    fields: [categories.departmentId],
    references: [departments.id],
  }),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  address: one(addresses, {
    fields: [orders.addressId],
    references: [addresses.id],
  }),
  items: many(orderItems),
  payment: one(payments, {
    fields: [orders.id],
    references: [payments.orderId],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));
