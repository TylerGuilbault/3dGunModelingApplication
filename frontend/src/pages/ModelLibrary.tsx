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
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Model Library</h1>

      {/* Upload Form */}
      <form
        onSubmit={handleUpload}
        className="bg-white p-6 rounded-lg shadow-md mb-8"
      >
        <h2 className="text-2xl font-semibold mb-4">Upload New Model</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            name="name"
            placeholder="Gun Name *"
            required
            className="border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="sku"
            placeholder="SKU *"
            required
            className="border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <input
          type="number"
          name="basePrice"
          placeholder="Base Price *"
          step="0.01"
          required
          className="border border-gray-300 p-3 rounded w-full mb-4 focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={3}
          className="border border-gray-300 p-3 rounded w-full mb-4 focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="file"
          name="model"
          accept=".glb"
          required
          className="border border-gray-300 p-3 rounded w-full mb-4"
        />

        <button
          type="submit"
          disabled={uploading}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          {uploading ? "Uploading..." : "Upload Model"}
        </button>
      </form>

      {/* Model List */}
      <h2 className="text-2xl font-semibold mb-4">
        Uploaded Models ({firearms.length})
      </h2>

      {firearms.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No models uploaded yet. Upload one above!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {firearms.map((firearm) => (
            <div
              key={firearm.id}
              className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow bg-white"
            >
              <h3 className="font-bold text-xl mb-2">{firearm.name}</h3>
              <p className="text-sm text-gray-600 mb-1">SKU: {firearm.sku}</p>
              <p className="text-lg font-semibold text-green-600 mb-2">
                ${firearm.basePrice}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {firearm.parts?.length || 0} parts tagged
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin/tag/${firearm.id}`)}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm font-medium"
                >
                  Tag Parts
                </button>
                <button
                  onClick={() => handleDelete(firearm.id, firearm.name)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm font-medium"
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
