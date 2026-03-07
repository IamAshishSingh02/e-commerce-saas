import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Controller } from "react-hook-form";

const defaultColors = [
  "#000000", // Black
  "#ffffff", // White
  "#ff0000", // Red
  "#00ff00", // Green
  "#0000ff", // Blue
  "#ffff00", // Yellow
  "#ff00ff", // Magenta
  "#00ffff", // Cyan
];

const ColorSelector = ({ control, errors }: any) => {
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColor, setNewColor] = useState("#ffffff");

  const handleAddColor = () => {
    if (!customColors.includes(newColor) && !defaultColors.includes(newColor)) {
      setCustomColors([...customColors, newColor]);
    }
    setShowColorPicker(false);
  };

  const handleRemoveCustomColor = (colorToRemove: string, field: any) => {
    // Remove from custom colors list
    setCustomColors(customColors.filter((c) => c !== colorToRemove));
    // Remove from selected colors if it was selected
    if (field.value?.includes(colorToRemove)) {
      field.onChange(field.value.filter((c: string) => c !== colorToRemove));
    }
  };

  return (
    <div className="mt-2">
      <label className="block font-semibold text-gray-300 mb-1">Colors</label>

      <Controller
        name="colors"
        control={control}
        render={({ field }) => (
          <div className="flex gap-3 flex-wrap items-center">
            {/* Default colors */}
            {defaultColors.map((color) => {
              const isSelected = (field.value || []).includes(color);
              const isLightColor = ["#ffffff", "#ffff00", "#00ffff"].includes(color);

              return (
                <button
                  type="button"
                  key={color}
                  onClick={() =>
                    field.onChange(
                      isSelected
                        ? field.value.filter((c: string) => c !== color)
                        : [...(field.value || []), color]
                    )
                  }
                  className={`w-8 h-8 rounded-md flex items-center justify-center border-2 transition-all ${
                    isSelected ? "scale-110 border-white" : "border-gray-600"
                  } ${isLightColor && !isSelected ? "border-gray-500" : ""}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              );
            })}

            {/* Custom colors with remove button */}
            {customColors.map((color) => {
              const isSelected = (field.value || []).includes(color);
              const isLightColor = ["#ffffff", "#ffff00", "#00ffff"].includes(color);

              return (
                <div key={color} className="relative group">
                  <button
                    type="button"
                    onClick={() =>
                      field.onChange(
                        isSelected
                          ? field.value.filter((c: string) => c !== color)
                          : [...(field.value || []), color]
                      )
                    }
                    className={`w-8 h-8 rounded-md flex items-center justify-center border-2 transition-all ${
                      isSelected ? "scale-110 border-white" : "border-gray-600"
                    } ${isLightColor && !isSelected ? "border-gray-500" : ""}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                  {/* Remove button - shows on hover */}
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomColor(color, field)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove color ${color}`}
                  >
                    <X size={10} color="white" />
                  </button>
                </div>
              );
            })}

            {/* Add new color button */}
            {!showColorPicker && (
              <button
                type="button"
                onClick={() => setShowColorPicker(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-500 bg-gray-800 hover:bg-gray-700 transition"
                aria-label="Add custom color"
              >
                <Plus size={16} color="white" />
              </button>
            )}

            {/* Color picker */}
            {showColorPicker && (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-10 h-10 p-0 border-2 border-gray-600 rounded cursor-pointer"
                />

                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition"
                >
                  Add
                </button>

                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      />

      {errors?.colors && (
        <p className="text-red-500 text-sm mt-1">{errors.colors.message}</p>
      )}
    </div>
  );
};

export default ColorSelector;