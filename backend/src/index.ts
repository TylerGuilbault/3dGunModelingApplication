import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { z } from "zod";
import multer, { MulterError } from "multer";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const app = express();
const prisma = new PrismaClient();

// 🔥 SIMPLE, NO-MAGIC CORS: allow everything for now
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// 🔥 ADD THESE LINES - Increase body size limits for file uploads
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads/models");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "model/gltf-binary" || file.originalname.endsWith(".glb")) {
      cb(null, true);
    } else {
      cb(new Error("Only .glb files allowed"));
    }
  },
  // ⬇⬇⬇ RAISED LIMIT HERE (500 MB)
  limits: { fileSize: 500 * 1024 * 1024 },
});

// Serve uploaded models with proper MIME types
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, filepath) => {
      if (filepath.endsWith(".glb")) {
        res.setHeader("Content-Type", "model/gltf-binary");
      }
    },
  })
);

/** ===================== ADMIN API ===================== */

// Upload new firearm model
app.post("/api/admin/firearms", upload.single("model"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { name, sku, basePrice, description } = req.body;

    if (!name || !sku || !basePrice) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const firearm = await prisma.firearm.create({
      data: {
        name,
        sku,
        basePrice: parseFloat(basePrice),
        description: description || "",
        modelPath: `/uploads/models/${req.file.filename}`,
      },
    });

    res.json(firearm);
  } catch (error) {
    next(error);
  }
});

// List all firearms
app.get("/api/admin/firearms", async (req, res, next) => {
  try {
    const firearms = await prisma.firearm.findMany({
      include: {
        parts: true,
        pricingRules: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(firearms);
  } catch (error) {
    next(error);
  }
});

// Get single firearm with all details
app.get("/api/admin/firearms/:id", async (req, res, next) => {
  try {
    const firearm = await prisma.firearm.findUnique({
      where: { id: req.params.id },
      include: {
        parts: true,
        pricingRules: true,
      },
    });

    if (!firearm) {
      return res.status(404).json({ error: "Firearm not found" });
    }

    res.json(firearm);
  } catch (error) {
    next(error);
  }
});

// Delete firearm
app.delete("/api/admin/firearms/:id", async (req, res, next) => {
  try {
    const firearm = await prisma.firearm.findUnique({
      where: { id: req.params.id },
    });

    if (!firearm) {
      return res.status(404).json({ error: "Firearm not found" });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, "..", firearm.modelPath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database (cascades to parts and pricing rules)
    await prisma.firearm.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Save part tagging
app.post("/api/admin/firearms/:id/parts", async (req, res, next) => {
  try {
    const { parts } = req.body; // Array of { meshName, partType, displayName, customizable }

    // Delete existing parts for this firearm
    await prisma.part.deleteMany({
      where: { firearmId: req.params.id },
    });

    // Create new parts
    const createdParts = await prisma.part.createMany({
      data: parts.map((p: any) => ({
        firearmId: req.params.id,
        meshName: p.meshName,
        partType: p.partType,
        displayName: p.displayName,
        customizable: p.customizable ?? true,
      })),
    });

    res.json({ message: "Parts saved", count: createdParts.count });
  } catch (error) {
    next(error);
  }
});

// Get color options
app.get("/api/admin/colors", async (req, res, next) => {
  try {
    const colors = await prisma.colorOption.findMany();
    res.json(colors);
  } catch (error) {
    next(error);
  }
});

// Add color option
app.post("/api/admin/colors", async (req, res, next) => {
  try {
    const { name, hex, price, brand } = req.body;
    const color = await prisma.colorOption.create({
      data: { name, hex, price: parseFloat(price), brand },
    });
    res.json(color);
  } catch (error) {
    next(error);
  }
});

// Save pricing rules for a firearm
app.post("/api/admin/firearms/:id/pricing", async (req, res, next) => {
  try {
    const { rules } = req.body; // Array of { partType, laborCost }

    // Delete existing rules
    await prisma.pricingRule.deleteMany({
      where: { firearmId: req.params.id },
    });

    // Create new rules
    const created = await prisma.pricingRule.createMany({
      data: rules.map((r: any) => ({
        firearmId: req.params.id,
        partType: r.partType,
        laborCost: parseFloat(r.laborCost),
      })),
    });

    res.json({ message: "Pricing rules saved", count: created.count });
  } catch (error) {
    next(error);
  }
});

/** ===================== ORIGINAL API ===================== */

const cerakotePalette = [
  { id: "H-146", name: "Graphite Black", hex: "#2A2A2A", price: 120 },
  { id: "H-140", name: "Bright White", hex: "#FFFFFF", price: 120 },
  { id: "H-267", name: "MagPul FDE", hex: "#9A7D55", price: 130 },
];

const mvpFirearm = {
  id: "mvp-01",
  name: "MVP Pistol Stand-in",
  partGroups: [
    { id: "slide", name: "Slide", options: [{ id: "slide_std", name: "Standard Slide", price: 0 }] },
    { id: "barrel", name: "Barrel", options: [{ id: "barrel_std", name: "Standard Barrel", price: 0 }] },
    {
      id: "sights",
      name: "Sights",
      options: [
        { id: "sight_iron", name: "Iron Sights", price: 50 },
        { id: "sight_none", name: "None", price: 0 },
      ],
    },
  ],
};

app.get("/api/catalog", (req, res) => {
  res.json({
    firearms: [mvpFirearm],
    finishes: cerakotePalette,
  });
});

const ConfigSchema = z.object({
  firearmId: z.string(),
  parts: z.record(z.string(), z.string()),
  finishes: z.record(z.string(), z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)),
});

const priceForHex = (hex: string): { id: string; name: string; hex: string; price: number } => {
  const match = cerakotePalette.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
  if (match) return match;

  return {
    id: "custom",
    name: "Custom Color",
    hex,
    price: 150,
  };
};

app.post("/api/price", (req, res) => {
  const parsed = ConfigSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const { parts, finishes } = parsed.data;

  const base = 300;

  const partsSum = Object.values(parts).reduce((acc, optId) => {
    const price =
      mvpFirearm.partGroups.flatMap((pg) => pg.options).find((o) => o.id === optId)?.price ?? 0;
    return acc + price;
  }, 0);

  const perPartLabor: Record<string, number> = {
    slide: 90,
    frame: 110,
    trigger: 25,
    magazine: 30,
  };

  const finishBreakdown: Record<string, { hex: string; matPrice: number; labor: number; total: number }> = {};
  let finishesSum = 0;

  for (const [part, hex] of Object.entries(finishes)) {
    const material = priceForHex(hex);
    const labor = perPartLabor[part] ?? 40;
    const total = material.price + labor;
    finishBreakdown[part] = { hex, matPrice: material.price, labor, total };
    finishesSum += total;
  }

  const total = base + partsSum + finishesSum;
  res.json({
    total,
    breakdown: { base, partsSum, finishesSum, finishBreakdown },
    currency: "USD",
    etaDays: 10 + Math.ceil(Object.keys(finishes).length / 2),
  });
});

app.post("/api/configs", (req, res) => {
  const parsed = ConfigSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const id = "cfg_" + Math.random().toString(36).slice(2, 8);
  res.status(201).json({ id, ...parsed.data, createdAt: new Date().toISOString() });
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: "ok", database: "connected" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

/** ===================== GLOBAL ERROR HANDLER ===================== */

app.use(
  (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Global error handler:", err);

    if (err instanceof MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(413)
          .json({ error: "File too large. Max size is 500MB." });
      }
      return res.status(400).json({ error: err.message });
    }

    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }

    res.status(500).json({ error: "Internal server error" });
  }
);

/** ===================== FRONTEND SERVING (at the end, before app.listen) ===================== */
// Serve frontend in production OR from dist folder in dev
const frontendPath = path.join(__dirname, "../../frontend/dist");

if (fs.existsSync(frontendPath)) {
  console.log("✅ Serving frontend from:", frontendPath);
  
  // Serve static files (JS, CSS, images)
  app.use(express.static(frontendPath));
  
  // SPA fallback - serve index.html for all routes that don't match API/uploads
  app.use((req, res, next) => {
    // Skip if it's an API or upload request
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    
    // Skip if the file exists (like .js, .css files)
    const filePath = path.join(frontendPath, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return next();
    }
    
    // Otherwise, serve index.html for React Router
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  console.log("⚠️  Frontend dist folder not found. Run 'npm run build' in frontend/");
}

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));