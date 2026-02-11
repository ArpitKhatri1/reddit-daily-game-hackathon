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
      className="flex items-center gap-3 h-18 px-3 py-2 shrink-0 overflow-x-auto overflow-y-hidden"
      style={{
        background: 'linear-gradient(to top, #3E2723, #4E342E)',
        borderTop: '2px solid #5D4037',
      }}
    >
      <div
        className="text-xs font-bold uppercase tracking-wider whitespace-nowrap"
        style={{ color: '#A1887F', fontFamily: 'Georgia, serif' }}
      >
        Inventory
      </div>

      {items.length === 0 && (
        <div className="text-xs whitespace-nowrap" style={{ color: '#795548' }}>
          All gears placed!
        </div>
      )}

      {Object.entries(grouped).map(([size, groupItems]) => (
        <div key={size} className="flex flex-col items-center gap-0.5 shrink-0">
          <div className="text-xs capitalize" style={{ color: '#8D6E63' }}>
            {size} &times;{groupItems.length}
          </div>
          <div
            className="cursor-grab active:cursor-grabbing p-3 rounded"
            style={{
              border: '1px dashed #5D4037',
              background: 'rgba(93,64,55,0.2)',
              transform: 'scale(0.6)',
              transformOrigin: 'center',
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              const item = groupItems[0];
              if (!item) return;
              onDragStart(item, e.clientX, e.clientY);
            }}
          >
            <GearSVG size="small" role="positional" angle={0} />
          </div>
        </div>
      ))}
    </div>
  );
}
