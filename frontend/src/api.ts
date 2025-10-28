import type { Catalog, BuildConfig, PriceResponse, SavedConfig } from "./types";

export async function getCatalog(): Promise<Catalog> {
  const res = await fetch("/api/catalog");
  if (!res.ok) throw new Error("Failed to load catalog");
  return res.json();
}

export async function getPrice(cfg: BuildConfig): Promise<PriceResponse> {
  const res = await fetch("/api/price", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg),
  });
  if (!res.ok) throw new Error("Failed to get price");
  return res.json();
}

export async function saveConfig(cfg: BuildConfig): Promise<SavedConfig> {
  const res = await fetch("/api/configs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg),
  });
  if (!res.ok) throw new Error("Failed to save config");
  return res.json();
}
