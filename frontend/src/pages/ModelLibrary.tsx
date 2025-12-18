import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Firearm {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
  description: string;
  parts: any[];
}

export default function ModelLibrary() {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const loadFirearms = async () => {
    try {
      const res = await fetch("/api/admin/firearms");
      if (!res.ok) throw new Error("Failed to load firearms");
      const data = await res.json();
      setFirearms(data);
    } catch (err) {
      console.error("Error loading firearms:", err);
      alert("Failed to load firearms from the server.");
    }
  };

  useEffect(() => {
    loadFirearms();
  }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/admin/firearms", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const firearm = await res.json();
        alert(`✅ Uploaded: ${firearm.name}`);
        e.currentTarget.reset();
        loadFirearms();
      } else {
        let errorMsg = "Unknown error";
        try {
          const error = await res.json();
          errorMsg = error.error ?? JSON.stringify(error);
        } catch {
          // ignore
        }
        alert(`❌ Upload failed: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(`❌ Error: ${String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/firearms/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("✅ Deleted");
        loadFirearms();
      } else {
        alert("❌ Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Delete failed (network error)");
    }
  };

  return (
    <div
      className="p-8 max-w-7xl mx-auto text-slate-50 rounded-xl"
      style={{
        background:
          "linear-gradient(135deg, rgba(44,20,24,0.9) 0%, rgba(36,18,24,0.9) 45%, rgba(26,14,18,0.94) 100%)",
        boxShadow: "0 20px 60px -30px rgba(0,0,0,0.55)",
      }}
    >
      <h1 className="text-4xl font-bold mb-8 text-red-100 drop-shadow">Model Library</h1>

      {/* Upload Form */}
      <form
        onSubmit={handleUpload}
        className="bg-gradient-to-b from-[#2a1b1d]/80 to-[#1b1014]/85 border border-red-300/25 p-6 rounded-lg shadow-[0_20px_50px_-35px_#ff7f7f40] mb-8 backdrop-blur"
      >
        <h2 className="text-2xl font-semibold mb-4 text-red-100">Upload New Model</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            name="name"
            placeholder="Gun Name *"
            required
            className="border border-red-300/30 bg-black/30 text-slate-50 p-3 rounded focus:ring-2 focus:ring-red-300/60"
          />
          <input
            type="text"
            name="sku"
            placeholder="SKU *"
            required
            className="border border-red-300/30 bg-black/30 text-slate-50 p-3 rounded focus:ring-2 focus:ring-red-300/60"
          />
        </div>

        <input
          type="number"
          name="basePrice"
          placeholder="Base Price *"
          step="0.01"
          required
          className="border border-red-300/30 bg-black/30 text-slate-50 p-3 rounded w-full mb-4 focus:ring-2 focus:ring-red-300/60"
        />

        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={3}
          className="border border-red-300/30 bg-black/30 text-slate-50 p-3 rounded w-full mb-4 focus:ring-2 focus:ring-red-300/60"
        />

        <input
          type="file"
          name="model"
          accept=".glb"
          required
          className="border border-red-300/30 bg-black/30 text-slate-50 p-3 rounded w-full mb-4"
        />

        <button
          type="submit"
          disabled={uploading}
          className="bg-gradient-to-r from-[#ff9e9e] to-[#e04848] text-[#0b1a12] px-6 py-3 rounded shadow-lg shadow-[#ff7f7f40] hover:brightness-110 disabled:bg-gray-500 disabled:text-gray-200 disabled:cursor-not-allowed font-semibold"
        >
          {uploading ? "Uploading..." : "Upload Model"}
        </button>
      </form>

      {/* Model List */}
      <h2 className="text-2xl font-semibold mb-4 text-red-100">
        Uploaded Models ({firearms.length})
      </h2>

      {firearms.length === 0 ? (
        <p className="text-slate-200 text-center py-8">
          No models uploaded yet. Upload one above!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {firearms.map((firearm) => (
            <div
              key={firearm.id}
              className="border border-red-200/25 rounded-lg p-5 hover:shadow-lg transition-shadow bg-black/30 text-slate-50"
            >
              <h3 className="font-bold text-xl mb-2">{firearm.name}</h3>
              <p className="text-sm text-slate-200 mb-1">SKU: {firearm.sku}</p>
              <p className="text-lg font-semibold text-[#7ee07c] mb-2">
                ${firearm.basePrice}
              </p>
              <p className="text-xs text-slate-300 mb-4">
                {firearm.parts?.length || 0} parts tagged
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin/tag/${firearm.id}`)}
                  className="flex-1 bg-gradient-to-r from-[#ff9e9e] to-[#e04848] text-[#0b1a12] px-4 py-2 rounded shadow hover:brightness-110 text-sm font-medium"
                >
                  Tag Parts
                </button>
                <button
                  onClick={() => handleDelete(firearm.id, firearm.name)}
                  className="bg-black/40 text-slate-100 px-4 py-2 rounded border border-red-200/25 hover:bg-black/30 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

