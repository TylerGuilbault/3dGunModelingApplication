import { PrismaClient } from "@prisma/client";
import process from "process";

const prisma = new PrismaClient();

async function addModel() {
  try {
    const firearm = await prisma.firearm.create({
      data: {
        name: "AR-15",
        sku: "AR15-001",
        basePrice: 899,
        description: "AR-15 Rifle Platform",
        modelPath: "/uploads/models/ar-15.glb", // MUST match your exact filename
      },
    });

    console.log("✅ Added firearm:", firearm);
  } catch (err) {
    console.error("❌ Error adding AR-15:", err);
  } finally {
    process.exit(0);
  }
}

addModel();
