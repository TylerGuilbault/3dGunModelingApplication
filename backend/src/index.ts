import express from "express";
import cors from "cors";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json());

/** --- Stub Data for MVP --- */
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
    { id: "sights", name: "Sights", options: [
      { id: "sight_iron", name: "Iron Sights", price: 50 },
      { id: "sight_none", name: "None", price: 0 }
    ]}
  ]
};

app.get("/api/catalog", (req, res) => {
  res.json({
    firearms: [mvpFirearm],
    finishes: cerakotePalette
  });
});

const ConfigSchema = z.object({
    firearmId: z.string(),
    parts: z.record(z.string(), z.string()),
    finishes: z.record(z.string(), z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)),
  });
  
  

  app.post("/api/price", (req, res) => {
    const parsed = ConfigSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  
    const { parts, finishes } = parsed.data;
  
    // Base labor (disassembly/prep)
    const base = 300;
  
    // Parts upcharges from catalog
    const partsSum = Object.values(parts).reduce((acc, optId) => {
      const price =
        mvpFirearm.partGroups.flatMap(pg => pg.options).find(o => o.id === optId)?.price ?? 0;
      return acc + price;
    }, 0);
  
    // Per-part finishing labor (simple model)
    // You can tune by part: slides cost more than triggers, etc.
    const perPartLabor: Record<string, number> = {
      slide: 90,
      frame: 110,
      trigger: 25,
      magazine: 30,
    };
  
    // Sum finishes: material price (from palette or fallback) + labor per part
    const finishBreakdown: Record<string, { hex: string; matPrice: number; labor: number; total: number }> = {};
    let finishesSum = 0;
  
    for (const [part, hex] of Object.entries(finishes)) {
      const material = priceForHex(hex);
      const labor = perPartLabor[part] ?? 40; // default labor for unknown parts
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
  

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`CLC backend running on http://localhost:${port}`));
