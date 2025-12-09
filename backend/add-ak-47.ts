import { PrismaClient } from "@prisma/client";
import process from "process";

const prisma = new PrismaClient();

async function addModel() {
  try {
    const firearm = await prisma.firearm.create({
      data: {
        name: "AK-47",
        sku: "AK47-001",
        basePrice: 799,
        description: "Kalashnikov AK-47 Rifle",
        modelPath: "/uploads/models/ak-47.glb", // Must match exact filename
      },
    });

    console.log("✅ Added firearm:", firearm);
  } catch (err) {
    console.error("❌ Error adding AK-47:", err);
  } finally {
    process.exit(0);
  }
}

addModel();
