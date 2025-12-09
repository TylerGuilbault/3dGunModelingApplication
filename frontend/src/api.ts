// Use relative URLs in production, explicit URL in dev if needed
export const API_URL = import.meta.env.VITE_API_URL || "";

async function handle(r: Response) {
  if (!r.ok) throw new Error(`API Error: ${r.status}`);
  return r.json();
}

export async function getCatalog() {
  return handle(await fetch(`${API_URL}/api/catalog`));
}

export async function getPrice(cfg: any) {
  return handle(await fetch(`${API_URL}/api/price`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(cfg),
  }));
}

export async function saveConfig(cfg: any) {
  return handle(
    await fetch(`${API_URL}/api/configs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    })
  );
}
