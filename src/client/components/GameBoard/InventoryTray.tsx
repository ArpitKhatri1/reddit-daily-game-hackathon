import type { GearInventoryItem } from '../../types';
import GearSVG from '../Gear/GearSVG';

interface InventoryTrayProps {
  items: GearInventoryItem[];
  onDragStart: (item: GearInventoryItem, clientX: number, clientY: number) => void;
}

export default function InventoryTray({ items, onDragStart }: InventoryTrayProps) {
  // Group items by size for display
  const grouped = items.reduce<Record<string, GearInventoryItem[]>>((acc, item) => {
    if (!acc[item.size]) {
      acc[item.size] = [];
    }
    acc[item.size]!.push(item);
    return acc;
  }, {});

  return (
    <div
      className="flex items-center gap-4 min-h-[5rem] md:h-28 px-4 py-2 shrink-0 overflow-x-auto overflow-y-hidden"
      style={{
        background: 'linear-gradient(to top, #3E2723, #4E342E)',
        borderTop: '2px solid #5D4037',
      }}
    >
      <div
        className="text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap"
        style={{ color: '#A1887F' }}
      >
        Inventory
      </div>

      {items.length === 0 && (
        <div className="text-xs whitespace-nowrap" style={{ color: '#795548' }}>
          All gears placed!
        </div>
      )}

      {Object.entries(grouped).map(([size, groupItems]) => (
        <div key={size} className="flex flex-col items-center justify-center shrink-0 min-w-[60px]">
          {/* Label: Added leading-tight to save vertical space */}
          <div
            className="text-[10px] md:text-xs capitalize leading-tight mb-1"
            style={{ color: '#8D6E63' }}
          >
            {size} <span className="opacity-70">×{groupItems.length}</span>
          </div>

          <div
            className="cursor-grab active:cursor-grabbing p-1 md:p-2 rounded transition-transform hover:scale-110"
            style={{
              border: '1px dashed #5D4037',
              background: 'rgba(93,64,55,0.2)',
              touchAction: 'none',
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const item = groupItems[0];
              if (!item) return;
              onDragStart(item, e.clientX, e.clientY);
            }}
          >
            {/* Control size via the SVG prop or a wrapper div height */}
            <div className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center scale-[0.5]">
              <GearSVG size={'small'} role="positional" angle={0} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
