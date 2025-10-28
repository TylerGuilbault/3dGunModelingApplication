import { useEffect, useMemo, useState } from "react";
import Viewer from "./components/Viewer";
import { getCatalog, getPrice, saveConfig } from "./api";
import type { Catalog, BuildConfig, PartGroup } from "./types";

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [parts, setParts] = useState<Record<string, string>>({});
  const [price, setPrice] = useState<{ total: number; etaDays: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const firearmId = catalog?.firearms[0]?.id ?? "mvp-01";

  // Per-part finishes
  const [slideHex, setSlideHex] = useState("#2a2a2a");
  const [frameHex, setFrameHex] = useState("#8a8a8a");
  const [triggerHex, setTriggerHex] = useState("#444444");
  const [magHex, setMagHex] = useState("#222222");

  useEffect(() => {
    getCatalog()
      .then((c) => {
        setCatalog(c);
        const pg = c.firearms[0].partGroups;
        const initial: Record<string, string> = {};
        pg.forEach((g) => (initial[g.id] = g.options[0].id));
        setParts(initial);
      })
      .catch((e) => console.error(e));
  }, []);

  // Backend currently expects a single finishHex; use frame for now
  // replace cfg useMemo:
const cfg: BuildConfig = useMemo(
  () => ({
    firearmId,
    parts,
    finishes: {
      frame: frameHex,
      slide: slideHex,
      trigger: triggerHex,
      magazine: magHex,
    },
  }),
  [firearmId, parts, frameHex, slideHex, triggerHex, magHex]
);


  useEffect(() => {
    if (!catalog) return;
    getPrice(cfg)
      .then((p) => setPrice({ total: p.total, etaDays: p.etaDays }))
      .catch(() => setPrice(null));
  }, [catalog, cfg]);

  const groups: PartGroup[] = catalog?.firearms[0]?.partGroups ?? [];

  async function onSave() {
    try {
      setSaving(true);
      const saved = await saveConfig(cfg);
      alert(
        `Saved! ID: ${saved.id}\nTotal: $${price?.total ?? "—"}\nETA: ${price?.etaDays ?? "—"} days`
      );
    } catch (e: any) {
      alert(`Save failed: ${e?.message ?? e}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", height: "100vh" }}>
      <aside style={{ padding: 16, borderRight: "1px solid #eee", overflowY: "auto" }}>
        <h1 style={{ marginBottom: 8 }}>Custom Laser Concepts</h1>
        <h2 style={{ margin: "12px 0" }}>Configurator (MVP)</h2>

        {!catalog && <p>Loading catalog…</p>}

        <section style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Finishes</h3>

          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Slide</label>
          <input
            type="color"
            value={slideHex}
            onChange={(e) => setSlideHex(e.target.value)}
            style={{ width: "100%", height: 36, border: "none", marginBottom: 12 }}
          />

          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Frame</label>
          <input
            type="color"
            value={frameHex}
            onChange={(e) => setFrameHex(e.target.value)}
            style={{ width: "100%", height: 36, border: "none", marginBottom: 12 }}
          />

          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Trigger</label>
          <input
            type="color"
            value={triggerHex}
            onChange={(e) => setTriggerHex(e.target.value)}
            style={{ width: "100%", height: 36, border: "none", marginBottom: 12 }}
          />

          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Magazine</label>
          <input
            type="color"
            value={magHex}
            onChange={(e) => setMagHex(e.target.value)}
            style={{ width: "100%", height: 36, border: "none" }}
          />

          <p style={{ fontSize: 12, color: "#555", marginTop: 8 }}>
            We’ll swap these for Cerakote swatches next.
          </p>
        </section>

        <section style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Parts</h3>
          {groups.map((g) => (
            <div key={g.id} style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, color: "#444", marginBottom: 4 }}>
                {g.name}
              </label>
              <select
                value={parts[g.id] ?? ""}
                onChange={(e) => setParts((p) => ({ ...p, [g.id]: e.target.value }))}
                style={{ width: "100%", padding: 8 }}
              >
                {g.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} {o.price ? `(+ $${o.price})` : ""}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </section>

        <section style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Price</strong>
            <strong>{price ? `$${price.total}` : "—"}</strong>
          </div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
            ETA: {price ? `${price.etaDays} days` : "—"}
          </div>
          <button
            onClick={onSave}
            disabled={saving || !catalog}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Save & Get Quote"}
          </button>
        </section>
      </aside>

      <main style={{ height: "100%", background: "#f7f7f7" }}>
        <Viewer
          baseColor={frameHex}
          slideColor={slideHex}
          triggerColor={triggerHex}
          magColor={magHex}
        />
      </main>
    </div>
  );
}
