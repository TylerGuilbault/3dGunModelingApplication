import { PrismaClient } from "@prisma/client";
import process from "process";

const prisma = new PrismaClient();

async function addModel() {
  const firearm = await prisma.firearm.create({
    data: {
      name: "Sniper Rifle",
      sku: "Sniper-001",
      basePrice: 2000,
      description: "Generic Sniper Rifle Model",
      modelPath: "/uploads/models/sniper-rifle.glb", // Match your exact filename
    },
  });
  
  console.log("✅ Added firearm:", firearm);
  process.exit(0);
}

addModel().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});