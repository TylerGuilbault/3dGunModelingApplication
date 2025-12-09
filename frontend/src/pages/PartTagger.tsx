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
              material.emissive = new THREE.Color(0x00ff00);
              material.emissiveIntensity = 1.0;
              material.needsUpdate = true;
            } else {
              material.emissive = new THREE.Color(0x000000);
              material.emissiveIntensity = 0;
              material.needsUpdate = true;
            }
          } else if (material instanceof THREE.MeshBasicMaterial) {
            if (child.name === selectedMesh) {
              material.color = new THREE.Color(0x00ff00);
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
  const [selectedCategory, setSelectedCategory] = useState<string>(PART_CATEGORIES[0]?.label || "");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = searchQuery
    ? PART_CATEGORIES.map(cat => ({
        ...cat,
        options: cat.options.filter(opt =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.options.length > 0)
    : PART_CATEGORIES;

  const currentOptions = selectedCategory
    ? filteredCategories.find(cat => cat.label === selectedCategory)?.options || []
    : [];

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-white z-10 flex flex-col">
      {/* Header with Search and Close */}
      <div className="flex items-center gap-3 p-3 border-b bg-gray-100">
        <input
          type="text"
          placeholder="Search parts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
          autoFocus
        />
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Close"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Horizontal Category Tabs */}
        <div className="flex-none w-56 overflow-y-auto bg-gray-800">
          {filteredCategories.map((category) => (
            <button
              key={category.label}
              type="button"
              onClick={() => setSelectedCategory(category.label)}
              className={`w-full p-3 text-left text-sm border-b border-gray-700 transition-colors ${
                selectedCategory === category.label
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-100 hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{category.label}</span>
                <span className="text-xs opacity-70">({category.options.length})</span>
              </div>
            </button>
          ))}
        </div>

        {/* Options Grid - More columns to reduce scrolling */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {searchQuery && filteredCategories.length > 0 ? (
            <div className="space-y-4">
              {filteredCategories.map((category) => (
                <div key={category.label}>
                  <h4 className="text-xs font-bold text-gray-600 uppercase mb-2 tracking-wide">
                    {category.label}
                  </h4>
                  <div className="grid grid-cols-7 gap-2">
                    {category.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onChange(option.value);
                          onClose();
                          setSearchQuery("");
                        }}
                        className={`p-2 text-left text-xs rounded border transition-all ${
                          value === option.value
                            ? "bg-blue-600 text-white border-blue-700 font-semibold"
                            : "bg-gray-50 text-gray-900 border-gray-300 hover:bg-blue-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : currentOptions.length > 0 ? (
            <div className="grid grid-cols-7 gap-2">
              {currentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    onClose();
                    setSearchQuery("");
                  }}
                  className={`p-2 text-left text-sm rounded border transition-all ${
                    value === option.value
                      ? "bg-blue-600 text-white border-blue-700 font-semibold"
                      : "bg-gray-50 text-gray-900 border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">
              No parts found
            </div>
          )}
        </div>
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
    <div className="absolute inset-0 bg-white z-10 flex flex-col">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-100">
        <h3 className="font-bold text-gray-900">All Meshes ({meshes.length})</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Close"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-6 gap-2">
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
                    ? "bg-blue-100 border-blue-500 ring-2 ring-blue-300"
                    : isTagged
                    ? "bg-green-50 border-green-400"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <span className="font-medium text-xs text-gray-900 block truncate" title={meshName}>
                  {meshName}
                </span>
                {isTagged && (
                  <span className="text-xs bg-green-600 text-white px-1 py-0.5 rounded inline-block mt-1">
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
    <div className="h-[calc(100vh-60px)] flex flex-col">
      {/* 3D Viewer - 60% of screen */}
      <div className="h-[60%] bg-gray-200 relative">
        <Canvas camera={{ position: [2, 1, 2], fov: 50 }}>
          <color attach="background" args={["#e5e7eb"]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

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
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg">
          <h2 className="font-bold text-lg text-gray-900">{firearm.name}</h2>
          <p className="text-xs text-gray-600">SKU: {firearm.sku}</p>
        </div>
      </div>

      {/* Bottom Panel - 40% of screen */}
      <div className="h-[40%] bg-white border-t-2 border-gray-300 shadow-2xl flex relative">
        
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
        <div className="flex-1 p-4 border-r">
          {selectedTag ? (
            <div>
              <h3 className="font-bold mb-3 text-blue-900 text-lg truncate" title={selectedMesh || ""}>
                {selectedMesh}
              </h3>

              <label className="block mb-2 text-sm font-medium text-gray-900">
                Part Type *
              </label>
              <button
                type="button"
                onClick={() => setPartTypeBrowserOpen(!partTypeBrowserOpen)}
                className="w-full p-3 border-2 rounded bg-white text-gray-900 text-left flex items-center justify-between hover:bg-gray-50 transition font-medium"
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

              <label className="block mb-2 mt-4 text-sm font-medium text-gray-900">
                Display Name
              </label>
              <input
                type="text"
                value={selectedTag.displayName}
                onChange={(e) =>
                  updateMeshTag(selectedMesh!, "displayName", e.target.value)
                }
                className="w-full p-3 border-2 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-900 font-medium">Customizable by customer</span>
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-center">
              <div>
                <p className="font-semibold mb-2 text-lg">No mesh selected</p>
                <p className="text-sm">Click on a part in the 3D viewer above</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Stats & Actions */}
        <div className="w-56 border-l p-4 flex flex-col justify-between">
          <div>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-gray-900">{taggedCount}</div>
              <div className="text-sm text-gray-600">of {meshes.length} tagged</div>
            </div>

            <button
              onClick={() => {
                setMeshesBrowserOpen(true);
                setPartTypeBrowserOpen(false);
              }}
              className="w-full p-3 border-2 rounded bg-white text-gray-900 font-semibold hover:bg-gray-50 transition mb-4"
            >
              All Meshes
            </button>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate("/admin/models")}
              className="w-full bg-gray-500 text-white px-4 py-3 rounded hover:bg-gray-600 font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || taggedCount === 0}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition"
            >
              {saving ? "Saving..." : "Save Tags"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}