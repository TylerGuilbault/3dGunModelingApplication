import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { PART_CATEGORIES, getPartLabel } from "../data/partCategories";

interface Firearm {
  id: string;
  name: string;
  sku: string;
  modelPath: string;
  parts: Part[];
}

interface Part {
  id: string;
  meshName: string;
  partType: string;
  displayName: string;
  customizable: boolean;
}

interface MeshInfo {
  name: string;
  partType: string;
  displayName: string;
  customizable: boolean;
}

function Loader() {
  return (
    <Html center>
      <div className="bg-white p-4 rounded shadow">Loading model...</div>
    </Html>
  );
}

function InteractiveModel({
  url,
  selectedMesh,
  onMeshClick,
  onMeshesExtracted,
}: {
  url: string;
  selectedMesh: string | null;
  onMeshClick: (name: string) => void;
  onMeshesExtracted: (meshNames: string[]) => void;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const [extracted, setExtracted] = useState(false);

  useEffect(() => {
    if (!scene || extracted) return;
    const meshNames: string[] = [];
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.name) {
          const defaultName = `Mesh_${meshNames.length}`;
          child.name = defaultName;
        }
        meshNames.push(child.name);
        
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial) {
            child.userData.originalColor = mat.color.clone();
          }
        });
      }
    });
    onMeshesExtracted(meshNames);
    setExtracted(true);
  }, [scene, extracted, onMeshesExtracted]);

  const handleClick = (event: any) => {
    event.stopPropagation();
    if (event.object && event.object.name) {
      onMeshClick(event.object.name);
    }
  };

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((mat) => {
          if (!child.userData.materialCloned) {
            if (Array.isArray(child.material)) {
              child.material = child.material.map(m => m.clone());
            } else {
              child.material = child.material.clone();
            }
            child.userData.materialCloned = true;
          }

          const material = Array.isArray(child.material) ? child.material[0] : child.material;

          if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhongMaterial) {
            if (child.name === selectedMesh) {
              material.emissive = new THREE.Color(0xff4d4d);
              material.emissiveIntensity = 1.0;
              material.needsUpdate = true;
            } else {
              material.emissive = new THREE.Color(0x000000);
              material.emissiveIntensity = 0;
              material.needsUpdate = true;
            }
          } else if (material instanceof THREE.MeshBasicMaterial) {
            if (child.name === selectedMesh) {
              material.color = new THREE.Color(0xff4d4d);
              material.needsUpdate = true;
            } else if (child.userData.originalColor) {
              material.color = child.userData.originalColor.clone();
              material.needsUpdate = true;
            }
          }
        });
      }
    });
  }, [selectedMesh, scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} onClick={handleClick} />
    </group>
  );
}

// Part Type Browser (fills bottom panel with horizontal scrolling categories)
function PartTypeBrowser({
  value,
  onChange,
  isOpen,
  onClose,
}: {
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const searchTerm = searchQuery.toLowerCase();

  const categories = PART_CATEGORIES.map((cat) => ({
    ...cat,
    options: cat.options.filter((opt) =>
      searchTerm ? opt.label.toLowerCase().includes(searchTerm) : true
    ),
    matchesSearch:
      !searchTerm ||
      cat.label.toLowerCase().includes(searchTerm) ||
      cat.options.some((opt) => opt.label.toLowerCase().includes(searchTerm)),
  })).filter((cat) => cat.matchesSearch);

  const activeCategoryData = activeCategory
    ? categories.find((cat) => cat.label === activeCategory)
    : null;

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col text-slate-50"
      style={{ fontFamily: "'Segoe UI', 'Segoe UI Symbol', system-ui, sans-serif" }}
    >
      {/* Xbox 360-inspired chrome */}
      <div className="flex items-center gap-3 p-3 border-b border-red-400/30 bg-gradient-to-r from-[#0f2a0f] via-[#123512] to-[#0f2a0f] shadow-[0_10px_40px_-20px_#ff7f7f]">
        {activeCategory && (
          <button
            onClick={() => setActiveCategory(null)}
            className="px-3 py-2 rounded-md bg-black/40 text-red-200 border border-red-300/30 hover:bg-black/30 transition shadow"
            title="Back to categories"
          >
            ← Categories
          </button>
        )}
        <input
          type="text"
          placeholder="Search parts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 p-2 rounded-md text-sm bg-black/30 text-slate-50 placeholder:text-slate-300 border border-red-300/40 focus:ring-2 focus:ring-red-300/70 focus:outline-none shadow-inner"
          autoFocus
        />
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-gradient-to-r from-[#ff7f7f] to-[#e63946] text-black font-semibold shadow-lg shadow-[#ff7f7f40] hover:brightness-110 transition"
          title="Close"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-[#0c1b0c] via-[#0e2310] to-[#0a180c]">
        {!activeCategoryData ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {categories.map((category) => (
              <button
                key={category.label}
                type="button"
                onClick={() => setActiveCategory(category.label)}
                className="flex flex-col items-start gap-2 p-3 rounded-lg border border-red-300/30 bg-white/10 hover:bg-white/15 shadow-[0_10px_30px_-20px_#00ff88] transition text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-gradient-to-r from-[#ff7f7f] to-[#e63946] shadow-[0_0_10px_#ff7f7f]"></span>
                  <span className="font-semibold text-sm truncate">{category.label}</span>
                </div>
                <div className="text-[12px] text-slate-200/80 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-black/30 border border-white/15 rounded-full shadow-inner">
                    {category.options.length} parts
                  </span>
                  <span className="text-red-200 font-bold">▸</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-wide text-red-200">
                {activeCategoryData.label}
              </h3>
              <span className="text-xs text-slate-200/80">
                {activeCategoryData.options.length} options
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {activeCategoryData.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    onClose();
                    setSearchQuery("");
                    setActiveCategory(null);
                  }}
                  className={`p-3 text-left text-xs rounded-md border transition-all shadow-sm ${
                    value === option.value
                      ? "bg-gradient-to-r from-[#ff7f7f] to-[#e63946] text-black border-red-300 shadow-lg shadow-[#ff7f7f40]"
                      : "bg-black/25 text-slate-50 border-white/10 hover:border-red-300/60 hover:bg-black/15"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {activeCategoryData.options.length === 0 && (
              <div className="text-xs italic text-slate-300">No matches for this category.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Meshes Browser Component
function MeshesBrowser({
  meshes,
  meshTags,
  selectedMesh,
  onMeshClick,
  isOpen,
  onClose,
}: {
  meshes: string[];
  meshTags: Record<string, MeshInfo>;
  selectedMesh: string | null;
  onMeshClick: (name: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#0c1b0c] via-[#0e2310] to-[#0a180c] z-10 flex flex-col text-slate-50">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between p-3 border-b border-red-300/30 bg-black/30 shadow-inner">
        <h3 className="font-bold text-red-100">All Meshes ({meshes.length})</h3>
        <button
          onClick={onClose}
          className="px-3 py-2 rounded-md bg-black/40 text-red-200 border border-red-300/30 hover:bg-black/30 transition shadow"
          title="Close"
        >
          Close
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {meshes.map((meshName) => {
            const tag = meshTags[meshName];
            const isTagged = tag && tag.partType !== "";

            return (
              <div
                key={meshName}
                onClick={() => {
                  onMeshClick(meshName);
                  onClose();
                }}
                className={`p-2 rounded border cursor-pointer transition-all ${
                  selectedMesh === meshName
                    ? "bg-gradient-to-r from-[#ff7f7f] to-[#e63946] text-black border-red-300 ring-2 ring-red-200"
                    : isTagged
                    ? "bg-black/25 border-red-300/60 text-slate-50"
                    : "bg-black/20 border-white/10 hover:border-red-300/50 hover:bg-black/10"
                }`}
              >
                <span className="font-medium text-xs block truncate" title={meshName}>
                  {meshName}
                </span>
                {isTagged && (
                  <span className="text-xs bg-red-600 text-white px-1 py-0.5 rounded inline-block mt-1">
                    {getPartLabel(tag.partType)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PartTagger() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [firearm, setFirearm] = useState<Firearm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meshes, setMeshes] = useState<string[]>([]);
  const [meshTags, setMeshTags] = useState<Record<string, MeshInfo>>({});
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [partTypeBrowserOpen, setPartTypeBrowserOpen] = useState(false);
  const [meshesBrowserOpen, setMeshesBrowserOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/admin/firearms/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch firearm");
        return res.json();
      })
      .then((data) => {
        setFirearm(data);
        const existingTags: Record<string, MeshInfo> = {};
        data.parts?.forEach((part: Part) => {
          existingTags[part.meshName] = {
            name: part.meshName,
            partType: part.partType,
            displayName: part.displayName,
            customizable: part.customizable,
          };
        });
        setMeshTags(existingTags);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load firearm:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleMeshesExtracted = (meshNames: string[]) => {
    setMeshes(meshNames);
  };

  const handleMeshClick = (meshName: string) => {
    // Toggle selection - click again to unselect
    if (selectedMesh === meshName) {
      setSelectedMesh(null);
      setPartTypeBrowserOpen(false);
      return;
    }

    setSelectedMesh(meshName);
    
    // Initialize tag if doesn't exist
    setMeshTags((prev) => {
      if (prev[meshName]) return prev;
      return {
        ...prev,
        [meshName]: {
          name: meshName,
          partType: "",
          displayName: meshName,
          customizable: true,
        },
      };
    });

    // Auto-open part type browser
    setPartTypeBrowserOpen(true);
    setMeshesBrowserOpen(false);
  };

  const setPartTypeForMesh = (meshName: string, newPartType: string) => {
    setMeshTags((prev) => {
      const prevTag = prev[meshName];
      const prevPartType = prevTag?.partType ?? "";
      const prevDefaultLabel = prevPartType ? getPartLabel(prevPartType) : "";
      const currentDisplay = prevTag?.displayName ?? "";

      const shouldReplaceLabel =
        !currentDisplay ||
        currentDisplay === meshName ||
        currentDisplay === prevDefaultLabel;

      const newLabel = getPartLabel(newPartType);

      const nextTag: MeshInfo = {
        name: meshName,
        partType: newPartType,
        displayName: shouldReplaceLabel ? newLabel : currentDisplay,
        customizable: prevTag?.customizable ?? true,
      };

      return { ...prev, [meshName]: nextTag };
    });
  };

  const updateMeshTag = (
    meshName: string,
    field: keyof MeshInfo,
    value: any
  ) => {
    setMeshTags((prev) => {
      const current: MeshInfo =
        prev[meshName] ?? {
          name: meshName,
          partType: "",
          displayName: meshName,
          customizable: true,
        };
      return {
        ...prev,
        [meshName]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSave = async () => {
    if (!firearm) return;

    setSaving(true);
    const parts = Object.values(meshTags)
      .filter((tag) => tag.partType !== "")
      .map((tag) => ({
        meshName: tag.name,
        partType: tag.partType,
        displayName: tag.displayName,
        customizable: tag.customizable,
      }));

    try {
      const res = await fetch(`/api/admin/firearms/${firearm.id}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parts }),
      });

      if (res.ok) {
        alert("✅ Parts tagged successfully!");
        navigate("/admin/models");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(
          `❌ Failed to save tags: ${
            errorData.error || "Unknown server error"
          }`
        );
      }
    } catch (error) {
      console.error("Save error:", error);
      alert(`❌ Error: ${String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-2xl mb-4 text-red-600">Error: {error}</div>
          <button
            onClick={() => navigate("/admin/models")}
            className="bg-blue-600 text-white px-6 py-3 rounded"
          >
            Back to Models
          </button>
        </div>
      </div>
    );
  }

  if (!firearm) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Firearm not found</div>
      </div>
    );
  }

  const selectedTag = selectedMesh ? meshTags[selectedMesh] : null;
  const modelUrl = firearm.modelPath;
  const taggedCount = Object.values(meshTags).filter(tag => tag.partType !== "").length;

  return (
    <div
      className="w-full flex flex-col text-slate-100 relative overflow-hidden"
      style={{
        height: "calc(100vh - 120px)",
        maxWidth: "1200px",
        width: "94%",
        margin: "16px auto 24px",
        padding: "8px 12px",
        background: "rgba(10, 15, 18, 0.85)",
        boxShadow: "0 20px 60px -30px rgba(0,0,0,0.55)",
      }}
    >
      {/* decorative splashes */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.05),transparent_45%)]" />
      <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70 bg-[radial-gradient(circle_at_70%_60%,rgba(232,92,92,0.1),transparent_50%)]" />
      <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-60 bg-[radial-gradient(120px_80px_at_25%_40%,rgba(232,92,92,0.18),transparent_60%),radial-gradient(180px_140px_at_80%_30%,rgba(160,80,80,0.16),transparent_60%),radial-gradient(90px_120px_at_50%_80%,rgba(255,255,255,0.08),transparent_70%)]" />
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.03)_0,rgba(255,255,255,0.03)_6px,transparent_6px,transparent_12px)]" />

      <div className="relative flex flex-col h-full px-4 pb-6 overflow-hidden">
        {/* 3D Viewer - 60% of screen */}
        <div className="flex-[0_0_56%] min-h-[320px] max-h-[62%] relative shadow-[0_20px_60px_-30px_#ff7f7f40] border-b border-red-400/20 bg-gradient-to-br from-[#dbe9d1] via-[#cfe4d8] to-[#e5f2f8]">
          <Canvas camera={{ position: [2, 1, 2], fov: 50 }}>
            <color attach="background" args={["#dce9df"]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1.1} />

          <Suspense fallback={<Loader />}>
            <InteractiveModel
              url={modelUrl}
              selectedMesh={selectedMesh}
              onMeshClick={handleMeshClick}
              onMeshesExtracted={handleMeshesExtracted}
            />
          </Suspense>

          <Environment preset="studio" />
          <OrbitControls />
        </Canvas>

        {/* Firearm Info - Top Right */}
        <div className="absolute top-4 right-4 bg-black/50 px-4 py-2 rounded-lg shadow-lg border border-white/10 backdrop-blur-sm">
          <h2 className="font-bold text-lg text-red-100">{firearm.name}</h2>
          <p className="text-xs text-slate-200/80">SKU: {firearm.sku}</p>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="flex-1 min-h-0 bg-black/30 border-t border-red-400/20 shadow-inner flex relative backdrop-blur-sm overflow-hidden">
        
        {/* Part Type Browser Overlay */}
        <PartTypeBrowser
          value={selectedTag?.partType || ""}
          onChange={(newValue) => {
            if (selectedMesh) {
              setPartTypeForMesh(selectedMesh, newValue);
            }
          }}
          isOpen={partTypeBrowserOpen}
          onClose={() => setPartTypeBrowserOpen(false)}
        />

        {/* Meshes Browser Overlay */}
        <MeshesBrowser
          meshes={meshes}
          meshTags={meshTags}
          selectedMesh={selectedMesh}
          onMeshClick={handleMeshClick}
          isOpen={meshesBrowserOpen}
          onClose={() => setMeshesBrowserOpen(false)}
        />

        {/* Left: Selected Mesh Info */}
        <div className="flex-1 p-4 border-r border-white/10 bg-white/5 backdrop-blur-sm">
          {selectedTag ? (
            <div>
              <h3 className="font-bold mb-3 text-red-100 text-lg truncate" title={selectedMesh || ""}>
                {selectedMesh}
              </h3>

              <label className="block mb-2 text-sm font-medium text-slate-100">
                Part Type *
              </label>
              <button
                type="button"
                onClick={() => setPartTypeBrowserOpen(!partTypeBrowserOpen)}
                className="w-full p-3 border border-red-300/30 rounded bg-black/30 text-slate-50 text-left flex items-center justify-between hover:bg-black/20 transition font-semibold shadow-inner"
              >
                <span className="truncate">
                  {selectedTag.partType ? getPartLabel(selectedTag.partType) : "-- Select Part Type --"}
                </span>
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <label className="block mb-2 mt-4 text-sm font-medium text-slate-100">
                Display Name
              </label>
              <input
                type="text"
                value={selectedTag.displayName}
                onChange={(e) =>
                  updateMeshTag(selectedMesh!, "displayName", e.target.value)
                }
                className="w-full p-3 border border-white/15 rounded bg-black/30 text-slate-50 focus:ring-2 focus:ring-red-300/70 focus:outline-none shadow-inner"
                placeholder="e.g., Front Slide"
              />

              <label className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={selectedTag.customizable}
                  onChange={(e) =>
                    updateMeshTag(
                      selectedMesh!,
                      "customizable",
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 accent-red-400"
                />
                <span className="text-sm text-slate-100 font-medium">Customizable by customer</span>
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-300 text-center">
              <div>
                <p className="font-semibold mb-2 text-lg text-red-100">No mesh selected</p>
                <p className="text-sm">Click on a part in the 3D viewer above</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Stats & Actions */}
        <div className="w-56 border-l border-white/10 p-4 flex flex-col justify-between bg-black/25 backdrop-blur-sm overflow-y-auto">
          <div>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-red-100">{taggedCount}</div>
              <div className="text-sm text-slate-200/80">of {meshes.length} tagged</div>
            </div>

            <button
              onClick={() => {
                setMeshesBrowserOpen(true);
                setPartTypeBrowserOpen(false);
              }}
              className="w-full p-3 border border-red-300/40 rounded bg-black/30 text-slate-50 font-semibold hover:bg-black/20 transition mb-4 shadow-inner"
            >
              All Meshes
            </button>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate("/admin/models")}
              className="w-full bg-black/40 text-slate-100 px-4 py-3 rounded border border-white/15 hover:bg-black/30 font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || taggedCount === 0}
              className="w-full bg-gradient-to-r from-[#ff7f7f] to-[#e63946] text-black px-4 py-3 rounded shadow-lg shadow-[#ff7f7f40] hover:brightness-110 disabled:bg-gray-500 disabled:text-gray-200 disabled:cursor-not-allowed font-semibold transition"
            >
              {saving ? "Saving..." : "Save Tags"}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}


