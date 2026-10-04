-- The same tables `npx prisma db push` creates from schema.prisma.
-- Kept as plain SQL so `npm run setup` works without downloading
-- Prisma's schema engine (some corporate networks block it).
PRAGMA foreign_keys = ON;
DROP TABLE IF EXISTS "Outbox";
DROP TABLE IF EXISTS "CartItem";
DROP TABLE IF EXISTS "OrderItem";
DROP TABLE IF EXISTS "Order";
DROP TABLE IF EXISTS "Review";
DROP TABLE IF EXISTS "Product";
DROP TABLE IF EXISTS "User";

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'customer'
);
CREATE TABLE "Product" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "stock" INTEGER NOT NULL,
  "ratingAverage" REAL NOT NULL DEFAULT 0,
  "ratingCount" INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE "Review" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "authorId" TEXT,
  "rating" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("productId") REFERENCES "Product" ("id"),
  FOREIGN KEY ("authorId") REFERENCES "User" ("id")
);
CREATE UNIQUE INDEX "Review_productId_authorId_key" ON "Review"("productId", "authorId");
CREATE TABLE "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "total" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "chargeId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id")
);
CREATE UNIQUE INDEX "Order_userId_idempotencyKey_key" ON "Order"("userId", "idempotencyKey");
CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  FOREIGN KEY ("orderId") REFERENCES "Order" ("id"),
  FOREIGN KEY ("productId") REFERENCES "Product" ("id")
);
CREATE TABLE "CartItem" (
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  PRIMARY KEY ("userId", "productId"),
  FOREIGN KEY ("userId") REFERENCES "User" ("id"),
  FOREIGN KEY ("productId") REFERENCES "Product" ("id")
);
CREATE TABLE "Outbox" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" DATETIME
);
