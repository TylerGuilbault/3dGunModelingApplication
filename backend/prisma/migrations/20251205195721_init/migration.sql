-- CreateTable
CREATE TABLE "Firearm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "modelPath" TEXT NOT NULL,
    "basePrice" REAL NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firearmId" TEXT NOT NULL,
    "meshName" TEXT NOT NULL,
    "partType" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "customizable" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Part_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ColorOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "brand" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ModificationOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "partType" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "modelPath" TEXT
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firearmId" TEXT NOT NULL,
    "partType" TEXT NOT NULL,
    "laborCost" REAL NOT NULL,
    CONSTRAINT "PricingRule_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Firearm_sku_key" ON "Firearm"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Part_firearmId_meshName_key" ON "Part"("firearmId", "meshName");

-- CreateIndex
CREATE UNIQUE INDEX "PricingRule_firearmId_partType_key" ON "PricingRule"("firearmId", "partType");
