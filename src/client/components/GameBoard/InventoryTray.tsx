import type { GearInventoryItem } from "../../types";
import GearSVG from "../Gear/GearSVG";

interface InventoryTrayProps {
  items: GearInventoryItem[];
  onDragStart: (
    item: GearInventoryItem,
    clientX: number,
    clientY: number,
  ) => void;
}

export default function InventoryTray({
  items,
  onDragStart,
}: InventoryTrayProps) {
  // Group items by size for display
  const grouped = items.reduce(
    (acc, item) => {
      acc[item.size] = acc[item.size] || [];
      acc[item.size].push(item);
      return acc;
    },
    {} as Record<string, GearInventoryItem[]>,
  );

  return (
    <div
      className="flex flex-col items-center gap-4 p-3 shrink-0 overflow-y-auto"
      style={{
        width: 140,
        background: "linear-gradient(to right, #3E2723, #4E342E)",
        borderRight: "2px solid #5D4037",
      }}
    >
      <div
        className="text-xs font-bold uppercase tracking-wider mb-1"
        style={{ color: "#A1887F", fontFamily: "Georgia, serif" }}
      >
        Inventory
      </div>

      {items.length === 0 && (
        <div className="text-xs text-center mt-4" style={{ color: "#795548" }}>
          All gears placed!
        </div>
      )}

      {Object.entries(grouped).map(([size, groupItems]) => (
        <div key={size} className="flex flex-col items-center gap-1">
          <div className="text-xs capitalize" style={{ color: "#8D6E63" }}>
            {size} &times;{groupItems.length}
          </div>
          <div
            className="cursor-grab active:cursor-grabbing p-1 rounded"
            style={{
              border: "1px dashed #5D4037",
              background: "rgba(93,64,55,0.2)",
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              const item = groupItems[0];
              onDragStart(item, e.clientX, e.clientY);
            }}
          >
            <GearSVG
              size={size as GearInventoryItem["size"]}
              role="positional"
              angle={0}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
