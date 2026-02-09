import { useState, useEffect, useRef, useCallback } from "react";
import type {
  GearInstance,
  GearInventoryItem,
  GearSize,
  LevelDefinition,
  Position,
} from "../../types";
import { GEAR_DIMENSIONS, SNAP_TOLERANCE } from "../../lib/constants";
import {
  findSnapTarget,
  propagateRotation,
  checkWinCondition,
  initializeStartGears,
} from "../../lib/engine";
import GearSVG from "../Gear/GearSVG";
import InventoryTray from "./InventoryTray";
import WinOverlay from "./WinOverlay";

interface GameBoardProps {
  level: LevelDefinition;
  onWin: (timeTakenMs: number) => void;
  onBack: () => void;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0
    ? `${min}:${sec.toString().padStart(2, "0")}`
    : `0:${sec.toString().padStart(2, "0")}`;
}

export default function GameBoard({ level, onWin, onBack }: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const [gears, setGears] = useState<GearInstance[]>([]);
  const [inventory, setInventory] = useState<GearInventoryItem[]>([]);
  const [won, setWon] = useState(false);
  const [winTime, setWinTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const [dragging, setDragging] = useState<{
    inventoryId?: string;
    gearId?: string;
    size: GearSize;
    offset: Position;
    currentPos: Position;
    snapTarget: { position: Position; anchorId: string } | null;
  } | null>(null);

  // Initialize level
  useEffect(() => {
    const fixedGears: GearInstance[] = level.fixedGears.map((fg) => ({
      ...fg,
      angle: 0,
      meshedWith: [],
    }));
    const initialized = initializeStartGears(fixedGears);
    setGears(propagateRotation(initialized));
    setInventory([...level.inventory]);
    setWon(false);
    setWinTime(0);
    setElapsed(0);
    startTimeRef.current = Date.now();
  }, [level]);

  // Animation loop + timer update
  useEffect(() => {
    const animate = () => {
      setGears((prev) =>
        prev.map((g) => {
          if (g.locked) {
            // Locked gears jitter back and forth
            const jitter = Math.sin(Date.now() * 0.02) * 3;
            return { ...g, angle: (g.angle + jitter * 0.1) % 360 };
          }
          return { ...g, angle: (g.angle + g.rotationSpeed) % 360 };
        }),
      );
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (won) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 200);
    return () => clearInterval(interval);
  }, [won]);

  // Win check
  useEffect(() => {
    if (!won && gears.length > 0 && checkWinCondition(gears)) {
      const el = Date.now() - startTimeRef.current;
      setWon(true);
      setWinTime(el);
      onWin(el);
    }
  }, [gears, won, onWin]);

  const getBoardPos = useCallback(
    (clientX: number, clientY: number): Position => {
      if (!boardRef.current) return { x: clientX, y: clientY };
      const rect = boardRef.current.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [],
  );

  const handleInventoryDragStart = useCallback(
    (item: GearInventoryItem, clientX: number, clientY: number) => {
      const pos = getBoardPos(clientX, clientY);
      const dim = GEAR_DIMENSIONS[item.size];
      setDragging({
        inventoryId: item.id,
        size: item.size,
        offset: { x: dim.outerRadius, y: dim.outerRadius },
        currentPos: {
          x: pos.x - dim.outerRadius,
          y: pos.y - dim.outerRadius,
        },
        snapTarget: null,
      });
    },
    [getBoardPos],
  );

  const handleBoardGearDragStart = useCallback(
    (gear: GearInstance, clientX: number, clientY: number) => {
      if (gear.role !== "positional") return;
      const pos = getBoardPos(clientX, clientY);

      setGears((prev) => {
        const filtered = prev.filter((g) => g.id !== gear.id);
        return propagateRotation(filtered);
      });

      setDragging({
        gearId: gear.id,
        size: gear.size,
        offset: {
          x: pos.x - gear.position.x,
          y: pos.y - gear.position.y,
        },
        currentPos: { x: gear.position.x, y: gear.position.y },
        snapTarget: null,
      });
    },
    [getBoardPos],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const pos = getBoardPos(e.clientX, e.clientY);
      const dim = GEAR_DIMENSIONS[dragging.size];
      const gearPos: Position = {
        x: pos.x - dragging.offset.x,
        y: pos.y - dragging.offset.y,
      };
      const centerPos: Position = {
        x: gearPos.x + dim.outerRadius,
        y: gearPos.y + dim.outerRadius,
      };

      const snap = findSnapTarget(
        centerPos,
        dragging.size,
        dragging.gearId || dragging.inventoryId || "",
        gears,
        SNAP_TOLERANCE,
      );

      setDragging((prev) =>
        prev ? { ...prev, currentPos: gearPos, snapTarget: snap } : null,
      );
    },
    [dragging, gears, getBoardPos],
  );

  const handlePointerUp = useCallback(() => {
    if (!dragging) return;
    const dim = GEAR_DIMENSIONS[dragging.size];

    // Determine placement position: snap if available, else free-place at cursor
    const placementPos: Position = dragging.snapTarget
      ? {
          x: dragging.snapTarget.position.x - dim.outerRadius,
          y: dragging.snapTarget.position.y - dim.outerRadius,
        }
      : { x: dragging.currentPos.x, y: dragging.currentPos.y };

    const newGear: GearInstance = {
      id:
        dragging.gearId ||
        dragging.inventoryId ||
        "gear-" + Date.now().toString(),
      role: "positional",
      size: dragging.size,
      position: placementPos,
      angle: 0,
      rotationSpeed: 0,
      meshedWith: [],
    };

    if (dragging.inventoryId) {
      setInventory((prev) =>
        prev.filter((item) => item.id !== dragging.inventoryId),
      );
    }
    setGears((prev) => propagateRotation([...prev, newGear]));
    setDragging(null);
  }, [dragging]);

  const handleGearContextMenu = useCallback(
    (e: React.MouseEvent, gear: GearInstance) => {
      e.preventDefault();
      if (gear.role !== "positional") return;
      setGears((prev) => {
        const filtered = prev.filter((g) => g.id !== gear.id);
        return propagateRotation(filtered);
      });
      setInventory((prev) => [...prev, { id: gear.id, size: gear.size }]);
    },
    [],
  );

  return (
    <div
      className="flex flex-col h-screen w-screen"
      style={{ background: "#2C1810" }}
    >
      {/* Elapsed timer bar */}
      {!won && (
        <div
          className="flex items-center justify-center py-1 shrink-0"
          style={{ background: "#1a0f0a" }}
        >
          <span
            className="text-sm font-mono font-bold tracking-wider"
            style={{ color: "#FFD54F" }}
          >
            ⏱ {formatElapsed(elapsed)}
          </span>
        </div>
      )}

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{
          background: "linear-gradient(to bottom, #3E2723, #2C1810)",
          borderBottom: "2px solid #5D4037",
        }}
      >
        <button
          onClick={onBack}
          className="px-4 py-2 rounded font-bold text-sm cursor-pointer"
          style={{
            background: "#5D4037",
            color: "#D7CCC8",
            border: "1px solid #795548",
          }}
        >
          &larr; Back
        </button>
        <h2
          className="text-lg font-bold"
          style={{ color: "#D7CCC8", fontFamily: "Georgia, serif" }}
        >
          {level.name}
        </h2>
        <div className="text-xs" style={{ color: "#A1887F" }}>
          Drag to place · Right-click to remove
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <InventoryTray
          items={inventory}
          onDragStart={handleInventoryDragStart}
        />

        <div
          ref={boardRef}
          className="flex-1 relative overflow-hidden cursor-crosshair"
          style={{
            background:
              "radial-gradient(ellipse at center, #4E342E 0%, #2C1810 70%)",
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.06 }}
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#D7CCC8"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {gears.map((gear) => (
            <div
              key={gear.id}
              className="absolute"
              style={{
                left: gear.position.x,
                top: gear.position.y,
                cursor: gear.role === "positional" ? "grab" : "default",
              }}
              onPointerDown={(e) => {
                if (gear.role === "positional") {
                  e.preventDefault();
                  handleBoardGearDragStart(gear, e.clientX, e.clientY);
                }
              }}
              onContextMenu={(e) => handleGearContextMenu(e, gear)}
            >
              <GearSVG
                size={gear.size}
                role={gear.role}
                angle={gear.angle}
                locked={gear.locked}
                requiredDirection={gear.requiredDirection}
              />
            </div>
          ))}

          {dragging?.snapTarget && (
            <div
              className="absolute pointer-events-none"
              style={{
                left:
                  dragging.snapTarget.position.x -
                  GEAR_DIMENSIONS[dragging.size].outerRadius,
                top:
                  dragging.snapTarget.position.y -
                  GEAR_DIMENSIONS[dragging.size].outerRadius,
              }}
            >
              <GearSVG
                size={dragging.size}
                role="positional"
                angle={0}
                opacity={0.4}
                highlight
              />
            </div>
          )}

          {dragging && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: dragging.currentPos.x,
                top: dragging.currentPos.y,
                opacity: dragging.snapTarget ? 0.3 : 0.7,
              }}
            >
              <GearSVG size={dragging.size} role="positional" angle={0} />
            </div>
          )}
        </div>
      </div>

      {won && <WinOverlay timeTakenMs={winTime} onContinue={onBack} />}
    </div>
  );
}
