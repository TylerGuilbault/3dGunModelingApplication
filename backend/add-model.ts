import { PrismaClient } from "@prisma/client";
import process from "process";

const prisma = new PrismaClient();

async function addModel() {
  const firearm = await prisma.firearm.create({
    data: {
      name: "Glock 19",
      sku: "GLOCK-19-001",
      basePrice: 599,
      description: "Glock 19 Gen 5",
      modelPath: "/uploads/models/glock_-_19.glb", // Match your exact filename
    },
  });
  
  console.log("✅ Added firearm:", firearm);
  process.exit(0);
}

addModel().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});