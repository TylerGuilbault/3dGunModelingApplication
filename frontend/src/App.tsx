import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";

import React, { useEffect, useMemo, useState, Suspense, useRef } from "react";
import * as THREE from "three";
import Viewer from "./components/Viewer";
import { getCatalog, getPrice, saveConfig } from "./api";
import type { Catalog, BuildConfig, PartGroup } from "./types";
import ModelLibrary from "./pages/ModelLibrary";
import "./App.css";
import PartTagger from "./pages/PartTagger";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Center } from "@react-three/drei";
import GunModel from "./components/GunModel";
import ErrorBoundary from "./components/ErrorBoundary";

const CUSTOMER_ROOM_SIZE = 4.2;        // box dimensions
const CUSTOMER_ROOM_DIVISIONS = 10;    // how many squares per edge

function CustomerRoomGrid() {
  const gridColor = new THREE.Color("#dfe4f2");
  const lineOpacity = 1;
  const HALF = CUSTOMER_ROOM_SIZE / 2;

  const makeGrid = () => {
    const grid = new THREE.GridHelper(
      CUSTOMER_ROOM_SIZE,
      CUSTOMER_ROOM_DIVISIONS,
      gridColor,
      gridColor
    );

    const mat = grid.material as THREE.Material & {
      opacity?: number;
      transparent?: boolean;
      depthWrite?: boolean;
      depthTest?: boolean;
    };

    mat.transparent = true;
    mat.opacity = lineOpacity;
    mat.depthWrite = false;
    mat.depthTest = true;

    return grid;
  };

  // 🔹 FLOOR: lies in XZ plane, under the gun
  const floor = makeGrid();
  floor.position.set(0, -HALF, 0); // y = -size/2

  // 🔹 BACK WALL: vertical plane behind the gun
  const backWall = makeGrid();
  backWall.rotation.x = Math.PI / 2; // from XZ -> XY
  backWall.position.set(0, 0, -HALF); // z = -size/2

  // 🔹 RIGHT WALL: vertical plane to the right of the gun
  const rightWall = makeGrid();
  rightWall.rotation.z = -Math.PI / 2; // from XZ -> YZ
  rightWall.position.set(HALF, 0, 0); // x = +size/2

  // (optional) LEFT WALL: uncomment if you want 4 walls instead of 3
  // const leftWall = makeGrid();
  // leftWall.rotation.z = Math.PI / 2;
  // leftWall.position.set(-HALF, 0, 0);

  return (
    <group>
      <primitive object={floor} />
      <primitive object={backWall} />
      <primitive object={rightWall} />
      {/* <primitive object={leftWall} /> */}
    </group>
  );
}



const PART_TYPE_LABELS: Record<string, string> = {
  slide: "Slide",
  frame: "Frame / Grip Module",
  barrel: "Barrel",
  trigger: "Trigger",
  trigger_shoe: "Trigger Shoe",
  trigger_bar: "Trigger Bar",
  slide_stop: "Slide Stop / Slide Release",
  mag_catch: "Magazine Release / Catch",
  safety: "Safety Lever / Selector",
  front_sight: "Front Sight",
  rear_sight: "Rear Sight",
  optic_plate: "Optic Plate / Cover Plate",
  magazine: "Magazine Body",
  mag_basepad: "Magazine Basepad / Floorplate",
  mag_follower: "Magazine Follower",
  backstrap: "Backstrap",
  grip_panel: "Grip Panel / Scale",
  compensator: "Compensator / Muzzle Device",
  dust_cover: "Dust Cover",
  accessory_rail: "Accessory Rail",
  ejection_port: "Ejection Port",
  extractor: "Extractor",
  pin: "Pins / Roll Pins",
  screw: "Screws / Fasteners",
  small_control: "Small Control (Misc.)",
  slide_cut: "Slide Cut / Window",
  serration: "Serrations / Texturing",
  other: "Other (Custom / Misc.)",
};

function XboxStarField() {
  const starCount = 2000;

  // Only compute once
  const { positions, sizes } = React.useMemo(() => {
    const pos: number[] = [];
    const sz: number[] = [];

    for (let i = 0; i < starCount; i++) {
      // Bring stars closer so they’re more visible
      const r = 25 + Math.random() * 20; // 25–45 units
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos.push(x, y, z);

      // noticeable size variation
      sz.push(2 + Math.random() * 4); // 2–6
    }

    return {
      positions: new Float32Array(pos),
      sizes: new Float32Array(sz),
    };
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>

      {/* Xbox 360 particles */}
      <pointsMaterial
        color="#e85c5c"
        size={1.8}              // base size
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}    // don’t block later objects
      />
    </points>
  );
}




// Custom viewer for uploaded models (DB-tagged parts)
function CustomViewer({
  firearm,
  partColors,
  activePartType,
  onPartClick,
}: {
  firearm: any;
  partColors: Record<string, string>;
  activePartType: string | null;
  onPartClick?: (partType: string) => void;
}) {
  const meshToPartMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(firearm?.parts)) {
      firearm.parts.forEach((p: any) => {
        if (p.meshName && p.partType) {
          map[p.meshName] = p.partType; // "Slide_Main_001" -> "slide"
        }
      });
    }
    return map;
  }, [firearm?.parts]);

  console.log("🧩 CustomViewer firearm:", {
    id: firearm?.id,
    name: firearm?.name,
    modelPath: firearm?.modelPath,
  });

  // ✅ Always have a valid URL – fall back to MVP model if missing
  const modelUrl: string =
    firearm?.modelPath && firearm.modelPath.trim().length > 0
      ? firearm.modelPath
      : "/models/canik_mete_sft_threaded.glb";

  return (
    <Canvas shadows camera={{ position: [2.7, 1.7, 3.1], fov: 45 }}>
      {/* Soft tinted background */}
      <color attach="background" args={["#b2b6b0"]} />

      {/* Xbox particles */}
      <XboxStarField />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 6, 3]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Environment preset="city" />

      <Suspense fallback={null}>
        <Center>
          <group position={[0, -0.1, 0]}>
            <GunModel
              key={modelUrl}
              url={modelUrl}
              meshToPartMap={meshToPartMap}
              partColors={partColors}
              selectedPartType={activePartType ?? undefined}
              onPartClick={(partType) => onPartClick?.(partType)}
            />
          </group>
        </Center>
      </Suspense>

      <OrbitControls enablePan enableZoom enableRotate />
    </Canvas>
  );
}





// Configurator (Customer View)
function ConfiguratorPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [parts, setParts] = useState<Record<string, string>>({});
  const [price, setPrice] = useState<{ total: number; etaDays: number } | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  // Per-partType colors (for uploaded models)
  const [finishColors, setFinishColors] = useState<Record<string, string>>({});

  // Uploaded firearms state
  const [uploadedFirearms, setUploadedFirearms] = useState<any[]>([]);
  const [selectedFirearmId, setSelectedFirearmId] = useState<string | null>(
    null
  );
  const [selectedFirearm, setSelectedFirearm] = useState<any | null>(null);
  const [activePartType, setActivePartType] = useState<string | null>(null);

  const firearmId = catalog?.firearms[0]?.id ?? "mvp-01";

  // Legacy MVP flat colors (for demo model)
  const [slideHex, setSlideHex] = useState("#2a2a2a");
  const [frameHex, setFrameHex] = useState("#8a8a8a");
  const [triggerHex, setTriggerHex] = useState("#444444");
  const [magHex, setMagHex] = useState("#222222");

  // 🔹 Load uploaded firearms ONCE and normalize IDs to strings
  useEffect(() => {
    fetch("/api/admin/firearms")
      .then((res) => res.json())
      .then((data: any[]) => {
        const normalized = data.map((f) => ({
          ...f,
          id: String(f.id),
        }));
        setUploadedFirearms(normalized);

        if (normalized.length > 0) {
          // default to first firearm (AK-47 in your seed)
          setSelectedFirearmId(normalized[0].id);
          setSelectedFirearm(normalized[0]);
        }
      })
      .catch((err) => console.error("Failed to load firearms:", err));
  }, []);

  // ❌ REMOVE the old "Load selected firearm details" useEffect entirely
  // (we now derive selectedFirearm from uploadedFirearms)

  // Load MVP catalog for parts/options
  useEffect(() => {
    getCatalog()
      .then((c: Catalog) => {
        setCatalog(c);
        const firstFirearm = c.firearms?.[0];
        if (!firstFirearm) return;
        const pg: PartGroup[] = firstFirearm.partGroups ?? [];
        const initial: Record<string, string> = {};
        pg.forEach((g) => {
          const firstOption = g.options?.[0];
          if (firstOption) {
            initial[g.id] = firstOption.id;
          }
        });
        setParts(initial);
      })
      .catch((e) => console.error("getCatalog error:", e));
  }, []);

  // Unique partTypes for the selected firearm
  const uniquePartTypes = useMemo(
    () =>
      selectedFirearm
        ? Array.from(
            new Set(
              (selectedFirearm.parts || [])
                .map((p: any) => p.partType)
                .filter(Boolean)
            )
          )
        : [],
    [selectedFirearm]
  );

  // Build config for pricing
  const cfg: BuildConfig = useMemo(() => {
    const baseFinishes = {
      frame: frameHex,
      slide: slideHex,
      trigger: triggerHex,
      magazine: magHex,
    };

    const dynamicFinishes =
      selectedFirearm && Object.keys(finishColors).length > 0
        ? {
            frame: finishColors.frame ?? baseFinishes.frame,
            slide: finishColors.slide ?? baseFinishes.slide,
            trigger: finishColors.trigger ?? baseFinishes.trigger,
            magazine: finishColors.magazine ?? baseFinishes.magazine,
          }
        : baseFinishes;

    return {
      firearmId,
      parts,
      finishes: dynamicFinishes,
    };
  }, [
    firearmId,
    parts,
    frameHex,
    slideHex,
    triggerHex,
    magHex,
    selectedFirearm,
    finishColors,
  ]);

  // Price updates
  useEffect(() => {
    if (!catalog) return;
    getPrice(cfg)
      .then((p) => setPrice({ total: p.total, etaDays: p.etaDays }))
      .catch((e) => {
        console.error("getPrice error:", e);
        setPrice(null);
      });
  }, [catalog, cfg]);

  // Initialize / reset finishColors when firearm changes
  useEffect(() => {
    if (!selectedFirearm) {
      setFinishColors({});
      return;
    }

    const types = Array.from(
      new Set(
        (selectedFirearm.parts || [])
          .map((p: any) => p.partType)
          .filter(Boolean)
      )
    );

    const initial: Record<string, string> = {};
    types.forEach((t) => {
      if (t === "frame") initial[t] = frameHex;
      else if (t === "slide") initial[t] = slideHex;
      else if (t === "trigger") initial[t] = triggerHex;
      else if (t === "magazine") initial[t] = magHex;
      else initial[t] = "#777777";
    });

    setFinishColors(initial);
  }, [selectedFirearm, frameHex, slideHex, triggerHex, magHex]);

  const groups: PartGroup[] = catalog?.firearms[0]?.partGroups ?? [];

  async function onSave() {
    try {
      setSaving(true);
      const saved = await saveConfig(cfg);
      alert(
        `Saved! ID: ${saved.id}\nTotal: $${price?.total ?? "—"}\nETA: ${
          price?.etaDays ?? "—"
        } days`
      );
    } catch (e: any) {
      alert(`Save failed: ${e?.message ?? e}`);
    } finally {
      setSaving(false);
    }
  }

  // Small debug helper so you can confirm what's going into CustomViewer
  console.log("🎯 Selected firearm in Configurator:", {
    selectedFirearmId,
    selectedFirearmName: selectedFirearm?.name,
    selectedFirearmModelPath: selectedFirearm?.modelPath,
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        height: "calc(100vh - 120px)",
        maxWidth: "1200px",
        width: "94%",
        margin: "16px auto 24px",
        padding: "8px 12px",
        background: "rgba(10, 15, 18, 0.85)",
        color: "#f6e8e8",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 20px 60px -30px rgba(0,0,0,0.55)",
        position: "relative",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          padding: 20,
          borderRight: "1px solid rgba(232,92,92,0.3)",
          overflowY: "auto",
          background:
            "linear-gradient(180deg, rgba(46,24,28,0.75), rgba(34,18,22,0.9))",
          backdropFilter: "blur(6px)",
        }}
      >
          <h1 style={{ marginBottom: 6, color: "#ffc7c7", fontWeight: 700 }}>
            Custom Laser Concepts
          </h1>
          <h2 style={{ margin: "10px 0 12px", color: "#f6e8e8" }}>
            Configurator (MVP)
          </h2>

        {/* Firearm selector */}
        {uploadedFirearms.length > 0 && (
          <section style={{ marginTop: 16, marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: "bold",
                marginBottom: 8,
                color: "#ffc7c7",
              }}
            >
              Select Firearm
            </label>
            <select
              value={selectedFirearmId || ""}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedFirearmId(nextId);
                const firearm = uploadedFirearms.find(
                  (f) => String(f.id) === nextId
                );
                setSelectedFirearm(firearm || null);
                setActivePartType(null);
              }}
              style={{
                width: "100%",
                padding: 10,
                backgroundColor: "rgba(28,16,18,0.78)",
                color: "#f6e8e8",
                border: "1px solid rgba(232,92,92,0.35)",
                borderRadius: 10,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {uploadedFirearms.map((firearm) => (
                <option
                  key={firearm.id}
                  value={firearm.id}
                  style={{ color: "#0f0f0f" }}
                >
                  {firearm.name} - ${firearm.basePrice}
                </option>
              ))}
            </select>
          </section>
        )}

        {!catalog && <p style={{ color: "#d8c7c7" }}>Loading catalog…</p>}

        {/* Finishes */}
        <section style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8, color: "#f6e8e8" }}>Finishes</h3>

          {selectedFirearm ? (
            uniquePartTypes.length === 0 ? (
              <p style={{ fontSize: 12, color: "#d8c7c7" }}>
                No parts tagged yet for this model. Tag parts in the Admin
                Dashboard to enable per-part coloring.
              </p>
            ) : (
              uniquePartTypes.map((type) => (
                <div
                  key={type}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 12,
                    border:
                      activePartType === type
                        ? "2px solid rgba(232,92,92,0.7)"
                        : "1px solid rgba(232,92,92,0.28)",
                    backgroundColor:
                      activePartType === type
                        ? "rgba(48,26,30,0.92)"
                        : "rgba(26,18,20,0.78)",
                    boxShadow:
                      activePartType === type
                        ? "0 0 0 2px rgba(232,92,92,0.2)"
                        : "inset 0 1px 0 rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    transition:
                      "background-color 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                  }}
                  onClick={() =>
                    setActivePartType((prev) =>
                      prev === type ? null : type
                    )
                  }
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      marginBottom: 10,
                      color: "#f6e8e8",
                    }}
                  >
                    <span
                      style={{
                        display: finishColors[type] ? "inline-block" : "none",
                        height: 12,
                        width: 12,
                        borderRadius: "999px",
                        background: finishColors[type] ?? "transparent",
                        boxShadow: finishColors[type]
                          ? "0 0 10px rgba(232,92,92,0.6)"
                          : "none",
                      }}
                    />
                    {PART_TYPE_LABELS[type] ?? type}
                  </label>
                  <input
                    type="color"
                    value={finishColors[type] ?? "#777777"}
                    onChange={(e) =>
                      setFinishColors((prev) => ({
                        ...prev,
                        [type]: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      height: 40,
                      border: "1px solid rgba(232,92,92,0.35)",
                      borderRadius: 10,
                      background: "rgba(28,16,18,0.78)",
                    }}
                  />
                </div>
              ))
            )
          ) : (
            <>
              {[
                ["Slide", slideHex, setSlideHex],
                ["Frame", frameHex, setFrameHex],
                ["Trigger", triggerHex, setTriggerHex],
                ["Magazine", magHex, setMagHex],
              ].map(([label, value, setter]) => (
                <div key={label as string} style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      marginBottom: 10,
                      color: "#f6e8e8",
                    }}
                  >
                    <span
                      style={{
                        height: 12,
                        width: 12,
                        borderRadius: "999px",
                        background: value as string,
                        boxShadow: "0 0 10px rgba(232,92,92,0.6)",
                      }}
                    />
                    {label as string}
                  </label>
                  <input
                    type="color"
                    value={value as string}
                    onChange={(e) => (setter as any)(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      border: "1px solid rgba(232,92,92,0.35)",
                      borderRadius: 10,
                      background: "rgba(28,16,18,0.78)",
                    }}
                  />
                </div>
              ))}
              <p style={{ fontSize: 12, color: "#d8c7c7", marginTop: 8 }}>
                We'll swap these for Cerakote swatches next.
              </p>
            </>
          )}
        </section>

        {/* Parts (legacy catalog options) */}
        <section style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8, color: "#111" }}>Parts</h3>
          {groups.map((g) => (
            <div key={g.id} style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#444",
                  marginBottom: 4,
                }}
              >
                {g.name}
              </label>
              <select
                value={parts[g.id] ?? ""}
                onChange={(e) =>
                  setParts((p) => ({ ...p, [g.id]: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: 8,
                  backgroundColor: "#fff",
                  color: "#111",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              >
                {g.options.map((o) => (
                  <option key={o.id} value={o.id} style={{ color: "#111" }}>
                    {o.name} {o.price ? `(+ $${o.price})` : ""}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </section>

        {/* Price & Save */}
        <section
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid #eee",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <strong style={{ color: "#f6e8e8" }}>Price</strong>
            <strong style={{ color: "#f6e8e8" }}>
              {price ? `$${price.total}` : "—"}
            </strong>
          </div>
          <div style={{ fontSize: 12, color: "#d8c7c7", marginBottom: 12 }}>
            ETA: {price ? `${price.etaDays} days` : "—"}
          </div>
          <button
            onClick={onSave}
            disabled={saving || !catalog}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid rgba(232,92,92,0.4)",
              background: "linear-gradient(90deg, #ff9e9e, #f46a6a, #e04848)",
              color: "#0b1a12",
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
              boxShadow: "0 10px 30px -15px rgba(232,92,92,0.6)",
            }}
          >
            {saving ? "Saving…" : "Save & Get Quote"}
          </button>
        </section>
      </aside>

      {/* 3D Viewer column */}
      <main style={{ height: "100%", background: "transparent", overflow: "hidden" }}>
        <div
          className="relative h-full w-full"
          style={{
            backgroundColor: "#c2c7c0",
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(220,90,90,0.16) 0, rgba(220,90,90,0.16) 42px, transparent 42px, transparent 84px)," +
              "repeating-linear-gradient(-45deg, rgba(80,80,80,0.16) 0, rgba(80,80,80,0.16) 36px, transparent 36px, transparent 72px)," +
              "radial-gradient(220px 140px at 20% 25%, rgba(210,110,110,0.18), transparent 60%)," +
              "radial-gradient(180px 120px at 70% 30%, rgba(100,100,100,0.16), transparent 60%)," +
              "radial-gradient(240px 180px at 60% 75%, rgba(160,80,80,0.12), transparent 65%)",
            backgroundBlendMode: "multiply",
          }}
        >
          {selectedFirearm ? (
            <CustomViewer
              firearm={selectedFirearm}
              partColors={finishColors}
              activePartType={activePartType}
              onPartClick={(partType) =>
                setActivePartType((prev) => (prev === partType ? null : partType))
              }
            />
          ) : (
            <Viewer
              baseColor={frameHex}
              slideColor={slideHex}
              triggerColor={triggerHex}
              magColor={magHex}
              activePartType={activePartType}
              onPartClick={(partType) =>
                setActivePartType((prev) => (prev === partType ? null : partType))
              }
            />
          )}
        </div>
      </main>
    </div>
  );
}


// Navigation
function Navigation() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <nav className="bg-gradient-to-r from-[#2b0f13] via-[#31151b] to-[#1a1218] text-slate-100 p-4 shadow-[0_10px_30px_-20px_#ff7f7f] border-b border-red-400/20">
      <div className="max-w-7xl mx-auto flex items-center gap-6">
        <h1 className="text-xl font-bold text-red-100 drop-shadow">3D Gun Configurator</h1>
        <Link
          to="/configurator"
          className={`hover:text-red-200 transition ${
            !isAdmin ? "text-red-200 font-semibold" : "text-slate-200"
          }`}
        >
          Customer View
        </Link>
        <Link
          to="/admin/models"
          className={`hover:text-red-200 transition ${
            isAdmin ? "text-red-200 font-semibold" : "text-slate-200"
          }`}
        >
          Admin Dashboard
        </Link>
      </div>
    </nav>
  );
}

// Main App
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen w-full relative overflow-hidden text-slate-100" style={{ background: "transparent" }}>
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/configurator" replace />} />
          <Route path="/configurator" element={<ConfiguratorPage />} />
          <Route path="/admin/models" element={<ModelLibrary />} />
          <Route path="/admin/tag/:id" element={<PartTagger />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}


