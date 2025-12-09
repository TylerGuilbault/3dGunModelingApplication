import { useState, useRef, useEffect } from "react";
import { PART_CATEGORIES } from "../data/partCategories";

interface PartTypeMenuProps {
  value: string;
  onChange: (value: string) => void;
  currentLabel?: string;
}

export default function PartTypeMenu({ value, onChange, currentLabel }: PartTypeMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-select first category when opening
  useEffect(() => {
    if (isOpen && !selectedCategory && PART_CATEGORIES.length > 0) {
      setSelectedCategory(PART_CATEGORIES[0].label);
    }
  }, [isOpen, selectedCategory]);

  const displayText = currentLabel || value || "-- Select Part Type --";

  // Filter options based on search
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

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 border rounded bg-white text-gray-900 text-left flex items-center justify-between hover:bg-gray-50 transition"
      >
        <span className="truncate">{displayText}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

        {/* Sytrus-Style Grid Menu */}
        {isOpen && (
          <div 
            className="fixed z-50 bg-white border-2 border-gray-400 rounded-lg shadow-2xl"
            style={{ 
              width: '900px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',  // Center on screen
              maxHeight: '500px'
            }}
        >  
          
          {/* Search Box */}
          <div className="p-3 border-b bg-gray-100">
            <input
              type="text"
              placeholder="Search parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
              autoFocus
            />
          </div>

          <div className="flex" style={{ height: '440px' }}>
            {/* Category Tabs (Left Side) */}
            <div className="w-56 border-r overflow-y-auto bg-gray-800">
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
                    <span className="text-xs opacity-70">
                      ({category.options.length})
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Options Grid (Right Side) */}
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              {searchQuery && filteredCategories.length > 0 ? (
                // Search results: show all matching across categories
                <div className="space-y-4">
                  {filteredCategories.map((category) => (
                    <div key={category.label}>
                      <h4 className="text-xs font-bold text-gray-600 uppercase mb-2 tracking-wide">
                        {category.label}
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        {category.options.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              onChange(option.value);
                              setIsOpen(false);
                              setSearchQuery("");
                            }}
                            className={`p-2 text-left text-xs rounded border transition-all ${
                              value === option.value
                                ? "bg-blue-600 text-white border-blue-700 font-semibold shadow-md"
                                : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-blue-50 hover:border-blue-400"
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
                // Category view: grid of options
                <div className="grid grid-cols-4 gap-2">
                  {currentOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className={`p-3 text-left text-sm rounded border transition-all ${
                        value === option.value
                          ? "bg-blue-600 text-white border-blue-700 font-semibold shadow-md"
                          : "bg-gray-50 text-gray-900 border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm py-8">
                  No parts found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}