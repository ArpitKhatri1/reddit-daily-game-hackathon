import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  GearInstance,
  GearInventoryItem,
  GearSize,
  GearRole,
  LevelDefinition,
  Position,
  RotationDirection,
} from '../../types';
import { GEAR_DIMENSIONS, SNAP_TOLERANCE } from '../../lib/constants';
import {
  findSnapTarget,
  propagateRotation,
  initializeStartGears,
  checkWinCondition,
} from '../../lib/engine';
import { saveCustomLevel } from '../../lib/storage';
import { saveDraft, publishLevel, publishDaily, toLevelData } from '../../lib/api';
import { usePanZoom } from '../../hooks/usePanZoom';
import GearSVG from '../Gear/GearSVG';

type EditorMode = 'edit' | 'test';

interface LevelEditorProps {
  onBack: () => void;
  existingLevel?: LevelDefinition;
  isDailyMode?: boolean;
}

const GEAR_SIZES: GearSize[] = ['small', 'medium', 'large', 'extraLarge'];
const DIRECTION_OPTIONS: { label: string; value: RotationDirection }[] = [
  { label: 'Any', value: 'any' },
  { label: 'CW ↻', value: 'cw' },
  { label: 'CCW ↺', value: 'ccw' },
];

export default function LevelEditor({ onBack, existingLevel, isDailyMode }: LevelEditorProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const panZoom = usePanZoom({ minZoom: 0.3, maxZoom: 2.0, initialZoom: 0.5 }, boardRef);
  const {
    clientToCanvas,
    canvasTransform,
    handleWheel,
    handlePointerDown: pzPointerDown,
    handlePointerMove: pzPointerMove,
    handlePointerUp: pzPointerUp,
    cancelPan,
    zoom,
    resetView,
  } = panZoom;

  // Apply initial centered view on mount
  useEffect(() => {
    resetView();
  }, [resetView]);

  const [mode, setMode] = useState<EditorMode>('edit');
  const [levelName, setLevelName] = useState(existingLevel?.name || 'My Level');

  // Board gears (start + goal + positional preview gears)
  const [gears, setGears] = useState<GearInstance[]>([]);
  // Inventory gears defined by editor (what the player gets)
  const [inventoryDef, setInventoryDef] = useState<GearInventoryItem[]>([]);

  // Edit mode: inventory item IDs currently placed on board for preview
  const [editPlacedInventory, setEditPlacedInventory] = useState<string[]>([]);

  // Placement tool state
  const [placingRole, setPlacingRole] = useState<GearRole | null>(null);
  const [placingSize, setPlacingSize] = useState<GearSize>('medium');
  const [placingDirection, setPlacingDirection] = useState<RotationDirection>('any');

  // Test mode inventory (separate copy)
  const [testInventory, setTestInventory] = useState<GearInventoryItem[]>([]);

  // Win state for test mode
  const [testWon, setTestWon] = useState(false);

  // Drag state (shared between edit and test)
  const [dragging, setDragging] = useState<{
    inventoryId?: string;
    gearId?: string;
    size: GearSize;
    offset: Position;
    currentPos: Position;
    snapTarget: { position: Position; anchorId: string } | null;
    /** Whether this is a fixed gear being moved (start/goal in edit mode) */
    isFixedGearDrag?: boolean;
    originalRole?: GearRole;
    originalDirection?: RotationDirection;
    originalSpeed?: number;
  } | null>(null);

  // Initialize from existing level
  useEffect(() => {
    if (existingLevel) {
      const fixed: GearInstance[] = existingLevel.fixedGears.map((fg) => ({
        ...fg,
        angle: 0,
        meshedWith: [],
      }));
      setGears(propagateRotation(initializeStartGears(fixed)));
      setInventoryDef([...existingLevel.inventory]);
    }
  }, [existingLevel]);

  // Animation loop — runs in BOTH modes for live preview
  useEffect(() => {
    const animate = () => {
      setGears((prev) =>
        prev.map((g) => {
          if (g.locked) {
            const jitter = Math.sin(Date.now() * 0.02) * 3;
            return { ...g, angle: (g.angle + jitter * 0.1) % 360 };
          }
          return { ...g, angle: (g.angle + g.rotationSpeed) % 360 };
        })
      );
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Win check in test mode
  useEffect(() => {
    if (mode === 'test' && !testWon && gears.length > 0 && checkWinCondition(gears)) {
      setTestWon(true);
    }
  }, [gears, mode, testWon]);

  // ─── Board position helper ──────────────────────────────────────────────
  const getBoardPos = useCallback(
    (clientX: number, clientY: number): Position => {
      if (!boardRef.current) return { x: clientX, y: clientY };
      const rect = boardRef.current.getBoundingClientRect();
      return clientToCanvas(clientX, clientY, rect);
    },
    [clientToCanvas]
  );

  // ─── Edit mode: click to place start/goal ──────────────────────────────
  const handleBoardClick = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== 'edit' || !placingRole) return;
      if (dragging) return;
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const dim = GEAR_DIMENSIONS[placingSize];
      const canvasPos = clientToCanvas(e.clientX, e.clientY, rect);
      const pos: Position = {
        x: canvasPos.x - dim.outerRadius,
        y: canvasPos.y - dim.outerRadius,
      };

      const startCount = gears.filter((g) => g.role === 'start').length;
      const goalCount = gears.filter((g) => g.role === 'goal').length;
      if (placingRole === 'start' && startCount >= 5) {
        alert('Maximum 5 start gears allowed!');
        return;
      }
      if (placingRole === 'goal' && goalCount >= 2) {
        alert('Maximum 2 goal gears allowed!');
        return;
      }

      const newGear: GearInstance = {
        id: uuidv4(),
        role: placingRole,
        size: placingSize,
        position: pos,
        angle: 0,
        rotationSpeed: placingRole === 'start' ? 0.8 : 0,
        meshedWith: [],
      };
      if (placingRole === 'goal') newGear.requiredDirection = placingDirection;

      setGears((prev) => propagateRotation([...prev, newGear]));
      setPlacingRole(null);
    },
    [mode, placingRole, placingSize, placingDirection, gears, dragging, clientToCanvas]
  );

  // ─── Right-click to remove ──────────────────────────────────────────────
  const handleGearRightClick = useCallback(
    (e: React.MouseEvent, gear: GearInstance) => {
      e.preventDefault();
      if (mode === 'edit') {
        if (gear.role === 'positional') {
          setEditPlacedInventory((prev) => prev.filter((id) => id !== gear.id));
        }
        setGears((prev) => {
          const filtered = prev.filter((g) => g.id !== gear.id);
          return propagateRotation(filtered);
        });
      } else if (mode === 'test' && gear.role === 'positional') {
        setGears((prev) => {
          const filtered = prev.filter((g) => g.id !== gear.id);
          return propagateRotation(filtered);
        });
        setTestInventory((prev) => [...prev, { id: gear.id, size: gear.size }]);
      }
    },
    [mode]
  );

  // ─── Inventory management ───────────────────────────────────────────────
  const addInventoryGear = (size: GearSize) => {
    setInventoryDef((prev) => [...prev, { id: uuidv4(), size }]);
  };

  const removeInventoryGear = (id: string) => {
    if (editPlacedInventory.includes(id)) {
      setEditPlacedInventory((prev) => prev.filter((pid) => pid !== id));
      setGears((prev) => {
        const filtered = prev.filter((g) => g.id !== id);
        return propagateRotation(filtered);
      });
    }
    setInventoryDef((prev) => prev.filter((g) => g.id !== id));
  };

  // Remaining edit inventory (not yet placed on board)
  const remainingEditInventory = inventoryDef.filter(
    (item) => !editPlacedInventory.includes(item.id)
  );

  // ─── Test mode ──────────────────────────────────────────────────────────
  const startTest = () => {
    // Remove positional preview gears, keep only fixed
    const fixedOnly = gears.filter((g) => g.role !== 'positional');
    const initialized = initializeStartGears(fixedOnly);
    setGears(propagateRotation(initialized));
    setTestInventory([...inventoryDef]);
    setTestWon(false);
    setMode('test');
  };

  const stopTest = () => {
    // Remove test positionals, restore edit-placed positionals
    setGears((prev) => {
      const fixed = prev.filter(
        (g) => g.role !== 'positional' || editPlacedInventory.includes(g.id)
      );
      return propagateRotation(fixed.map((g) => ({ ...g, angle: 0, meshedWith: [] })));
    });
    // Keep testWon state so user knows they can publish
    setMode('edit');
  };

  // ─── Drag: start from inventory (edit or test) ─────────────────────────
  const handleInventoryDragStart = useCallback(
    (item: GearInventoryItem, clientX: number, clientY: number) => {
      cancelPan();
      const pos = getBoardPos(clientX, clientY);
      const dim = GEAR_DIMENSIONS[item.size];
      setDragging({
        inventoryId: item.id,
        size: item.size,
        offset: { x: dim.outerRadius, y: dim.outerRadius },
        currentPos: { x: pos.x - dim.outerRadius, y: pos.y - dim.outerRadius },
        snapTarget: null,
      });
    },
    [getBoardPos, cancelPan]
  );

  // ─── Drag: start from existing board gear ──────────────────────────────
  const handleBoardGearDragStart = useCallback(
    (gear: GearInstance, clientX: number, clientY: number) => {
      const pos = getBoardPos(clientX, clientY);
      const isFixed = gear.role === 'start' || gear.role === 'goal';

      // In edit mode: allow dragging ALL gears (start, goal, positional)
      // In test mode: only positional
      if (mode === 'test' && gear.role !== 'positional') return;

      cancelPan();

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
        isFixedGearDrag: isFixed && mode === 'edit',
        originalRole: gear.role,
        originalDirection: gear.requiredDirection,
        originalSpeed: gear.rotationSpeed,
      });
    },
    [getBoardPos, mode, cancelPan]
  );

  // ─── Drag: pointer move ─────────────────────────────────────────────────
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
        dragging.gearId || dragging.inventoryId || '',
        gears,
        SNAP_TOLERANCE
      );
      setDragging((prev) => (prev ? { ...prev, currentPos: gearPos, snapTarget: snap } : null));
    },
    [dragging, gears, getBoardPos]
  );

  // ─── Drag: pointer up (place gear) ─────────────────────────────────────
  const handlePointerUp = useCallback(() => {
    if (!dragging) return;
    const dim = GEAR_DIMENSIONS[dragging.size];

    // Snap if available, else free-place at cursor position
    const placementPos: Position = dragging.snapTarget
      ? {
          x: dragging.snapTarget.position.x - dim.outerRadius,
          y: dragging.snapTarget.position.y - dim.outerRadius,
        }
      : { x: dragging.currentPos.x, y: dragging.currentPos.y };

    if (dragging.isFixedGearDrag) {
      // Re-place the fixed gear (start/goal) at new position
      const movedGear: GearInstance = {
        id: dragging.gearId!,
        role: dragging.originalRole || 'start',
        size: dragging.size,
        position: placementPos,
        angle: 0,
        rotationSpeed: dragging.originalSpeed || 0,
        meshedWith: [],
        requiredDirection: dragging.originalDirection,
      };
      setGears((prev) => propagateRotation([...prev, movedGear]));
    } else {
      // Positional gear placement
      const newGear: GearInstance = {
        id: dragging.gearId || dragging.inventoryId || 'gear-' + Date.now().toString(),
        role: 'positional',
        size: dragging.size,
        position: placementPos,
        angle: 0,
        rotationSpeed: 0,
        meshedWith: [],
      };

      if (dragging.inventoryId) {
        if (mode === 'edit') {
          setEditPlacedInventory((prev) => [...prev, dragging.inventoryId!]);
        } else {
          setTestInventory((prev) => prev.filter((item) => item.id !== dragging.inventoryId));
        }
      }
      setGears((prev) => propagateRotation([...prev, newGear]));
    }
    setDragging(null);
  }, [dragging, mode]);

  // ─── Build level definition helper ───────────────────────────────────────
  const buildLevelDef = (): LevelDefinition | null => {
    const starts = gears.filter((g) => g.role === 'start');
    const goals = gears.filter((g) => g.role === 'goal');
    if (starts.length === 0) {
      alert('Add at least one start gear!');
      return null;
    }
    if (goals.length === 0) {
      alert('Add at least one goal gear!');
      return null;
    }

    return {
      id: existingLevel?.id || uuidv4(),
      name: levelName,
      description: '',
      createdAt: new Date().toISOString(),
      fixedGears: gears
        .filter((g) => g.role !== 'positional')
        .map((g) => ({
          id: g.id,
          role: g.role,
          size: g.size,
          position: g.position,
          rotationSpeed: g.rotationSpeed,
          requiredDirection: g.requiredDirection,
        })),
      inventory: inventoryDef,
    };
  };

  // ─── Save (local + server draft) ───────────────────────────────────────
  const handleSave = async () => {
    const levelDef = buildLevelDef();
    if (!levelDef) return;

    saveCustomLevel(levelDef);
    try {
      await saveDraft(toLevelData(levelDef));
    } catch {
      // Server save failed, local still saved
    }
    alert('Level saved!');
    onBack();
  };

  // ─── Publish as Reddit post ─────────────────────────────────────────────
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    const levelDef = buildLevelDef();
    if (!levelDef) return;

    setPublishing(true);
    try {
      const data = toLevelData(levelDef);
      const result = await publishLevel(data);
      if (result.status === 'success') {
        saveCustomLevel(levelDef);
        alert(`Level published! Post URL: ${result.postUrl}`);
        onBack();
      } else {
        alert(`Publish failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Publish failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPublishing(false);
    }
  };

  // ─── Publish as daily puzzle (admin only) ───────────────────────────────
  const [showDailyConfirm, setShowDailyConfirm] = useState(false);

  const handlePublishDaily = async () => {
    const levelDef = buildLevelDef();
    if (!levelDef) return;
    setShowDailyConfirm(true);
  };

  const confirmPublishDaily = async () => {
    // Close the dialog and perform publish
    setShowDailyConfirm(false);
    const levelDef = buildLevelDef();
    if (!levelDef) return;

    setPublishing(true);
    try {
      const data = toLevelData(levelDef);
      console.debug('[LevelEditor] publishing daily puzzle', data.id);
      const result = await publishDaily(data);
      if (result.status === 'success') {
        console.log(`Daily Puzzle #${result.dailyNumber} published!`);
        onBack();
      } else {
        console.log(`Publish failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Publish daily error:', err);
      console.log(`Publish failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPublishing(false);
    }
  };

  // ─── Styles ─────────────────────────────────────────────────────────────
  const btnStyle = (active?: boolean) => ({
    background: active ? '#FFD54F' : '#5D4037',
    color: active ? '#3E2723' : '#D7CCC8',
    border: active ? '2px solid #FFB300' : '1px solid #795548',
  });

  const sidebarInventory = mode === 'edit' ? remainingEditInventory : testInventory;
  const lockedCount = gears.filter((g) => g.locked).length;

  return (
    <div className="flex flex-col h-screen w-screen" style={{ background: '#2C1810' }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-2 shrink-0 flex-wrap"
        style={{
          background: 'linear-gradient(to bottom, #3E2723, #2C1810)',
          borderBottom: '2px solid #5D4037',
        }}
      >
        <button
          onClick={onBack}
          className="px-3 py-1.5 rounded font-bold text-sm cursor-pointer"
          style={btnStyle()}
        >
          &larr; Back
        </button>

        <input
          type="text"
          value={levelName}
          onChange={(e) => setLevelName(e.target.value)}
          className="px-3 py-1.5 rounded text-sm font-bold"
          style={{
            background: '#4E342E',
            color: '#D7CCC8',
            border: '1px solid #795548',
            width: 180,
          }}
        />

        <div className="flex items-center gap-2 ml-2">
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{
              background: mode === 'edit' ? '#FFD54F' : '#EF5350',
              color: mode === 'edit' ? '#3E2723' : '#fff',
              fontWeight: 'bold',
            }}
          >
            {mode === 'edit' ? 'EDIT MODE' : 'TEST MODE'}
          </span>
          {lockedCount > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded font-bold animate-pulse"
              style={{ background: '#FF6F00', color: '#fff' }}
            >
              ⚠ {lockedCount} gear{lockedCount > 1 ? 's' : ''} locked!
            </span>
          )}
          {mode === 'test' && testWon && (
            <span
              className="text-xs px-2 py-0.5 rounded font-bold"
              style={{ background: '#388E3C', color: '#fff' }}
            >
              ✓ Win condition met!
            </span>
          )}
          <button
            onClick={resetView}
            className="px-2 py-0.5 rounded text-xs cursor-pointer"
            style={{ background: '#5D4037', color: '#D7CCC8', border: '1px solid #795548' }}
          >
            {Math.round(zoom * 100)}% ↺
          </button>
        </div>

        <div className="flex-1" />

        {mode === 'edit' && (
          <>
            <button
              onClick={startTest}
              className="px-3 py-1.5 rounded font-bold text-sm cursor-pointer"
              style={btnStyle()}
            >
              &#9654; Test
            </button>
            <button
              onClick={() => void handleSave()}
              className="px-3 py-1.5 rounded font-bold text-sm cursor-pointer"
              style={{
                background: 'linear-gradient(to bottom, #66BB6A, #388E3C)',
                color: '#fff',
                border: '1px solid #4CAF50',
              }}
            >
              Save Draft
            </button>
          </>
        )}
        {mode === 'test' && (
          <>
            <button
              onClick={stopTest}
              className="px-3 py-1.5 rounded font-bold text-sm cursor-pointer"
              style={{
                background: 'linear-gradient(to bottom, #EF5350, #C62828)',
                color: '#fff',
                border: '1px solid #E53935',
              }}
            >
              &#9632; Stop Test
            </button>
            {testWon && (
              <>
                <button
                  onClick={() => void handlePublish()}
                  disabled={publishing}
                  className="px-3 py-1.5 rounded font-bold text-sm cursor-pointer"
                  style={{
                    background: 'linear-gradient(to bottom, #FFD54F, #FF8F00)',
                    color: '#3E2723',
                    border: '1px solid #FFB300',
                    opacity: publishing ? 0.5 : 1,
                  }}
                >
                  {publishing ? 'Publishing...' : '🚀 Publish'}
                </button>
                {isDailyMode && (
                  <button
                    onClick={() => handlePublishDaily()}
                    disabled={publishing}
                    className="px-3 py-1.5 rounded font-bold text-sm cursor-pointer"
                    style={{
                      background: 'linear-gradient(to bottom, #AB47BC, #7B1FA2)',
                      color: '#fff',
                      border: '1px solid #9C27B0',
                      opacity: publishing ? 0.5 : 1,
                    }}
                  >
                    Post Daily
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Board */}
        <div
          ref={boardRef}
          className="flex-1 relative overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at center, #4E342E 0%, #2C1810 70%)',
            cursor: mode === 'edit' && placingRole ? 'copy' : 'crosshair',
            touchAction: 'none',
            userSelect: 'none',
          }}
          onClick={handleBoardClick}
          onWheel={handleWheel}
          onPointerDown={(e) => {
            if (!dragging && !placingRole) {
              // Prevent the OS from hijacking the touch (scrolling, pinch)
              e.preventDefault();
              pzPointerDown(e);
            }
          }}
          onPointerMove={(e) => {
            if (dragging) {
              handlePointerMove(e);
            } else {
              pzPointerMove(e);
            }
          }}
          onPointerUp={(e) => {
            pzPointerUp(e);
            handlePointerUp();
          }}
          onPointerLeave={(e) => {
            pzPointerUp(e);
            handlePointerUp();
          }}
        >
          {/* Transformed canvas layer */}
          <div
            className="absolute"
            style={{
              transform: canvasTransform,
              transformOrigin: '0 0',
              width: 2400,
              height: 1600,
              touchAction: 'none',
              userSelect: 'none',
            }}
          >
            {/* Grid */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={2400}
              height={1600}
              style={{ opacity: 0.06 }}
            >
              <defs>
                <pattern id="editorGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D7CCC8" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#editorGrid)" />
            </svg>

            {/* Gears */}
            {gears.map((gear) => {
              const isDraggable =
                mode === 'edit' || (mode === 'test' && gear.role === 'positional');
              return (
                <div
                  key={gear.id}
                  className="absolute"
                  style={{
                    left: gear.position.x,
                    top: gear.position.y,
                    cursor: isDraggable ? 'grab' : 'default',
                  }}
                  onPointerDown={(e) => {
                    if (isDraggable && !placingRole) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBoardGearDragStart(gear, e.clientX, e.clientY);
                    }
                  }}
                  onContextMenu={(e) => handleGearRightClick(e, gear)}
                >
                  <GearSVG
                    size={gear.size}
                    role={gear.role}
                    angle={gear.angle}
                    locked={gear.locked}
                    requiredDirection={gear.requiredDirection}
                  />
                </div>
              );
            })}

            {/* Snap ghost */}
            {dragging?.snapTarget && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: dragging.snapTarget.position.x - GEAR_DIMENSIONS[dragging.size].outerRadius,
                  top: dragging.snapTarget.position.y - GEAR_DIMENSIONS[dragging.size].outerRadius,
                }}
              >
                <GearSVG
                  size={dragging.size}
                  role={
                    dragging.isFixedGearDrag ? dragging.originalRole || 'positional' : 'positional'
                  }
                  angle={0}
                  opacity={0.4}
                  highlight
                  requiredDirection={dragging.originalDirection}
                />
              </div>
            )}

            {/* Drag ghost */}
            {dragging && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: dragging.currentPos.x,
                  top: dragging.currentPos.y,
                  opacity: dragging.snapTarget ? 0.3 : 0.7,
                }}
              >
                <GearSVG
                  size={dragging.size}
                  role={
                    dragging.isFixedGearDrag ? dragging.originalRole || 'positional' : 'positional'
                  }
                  angle={0}
                  requiredDirection={dragging.originalDirection}
                />
              </div>
            )}
          </div>
          {/* end transformed canvas */}
        </div>

        {/* Bottom tools panel */}
        <div
          className="shrink-0 overflow-y-auto"
          style={{
            maxHeight: '40vh',
            background: 'linear-gradient(to top, #3E2723, #4E342E)',
            borderTop: '2px solid #5D4037',
          }}
        >
          {/* Draggable inventory tray — horizontal row */}
          <div
            className="flex items-center gap-2 px-3 py-2 overflow-x-auto"
            style={{ borderBottom: '1px solid #5D4037' }}
          >
            <div
              className="text-xs font-bold uppercase whitespace-nowrap shrink-0"
              style={{ color: '#A1887F' }}
            >
              {mode === 'edit' ? 'Preview' : 'Inventory'}
            </div>
            {sidebarInventory.length === 0 && (
              <div className="text-xs whitespace-nowrap" style={{ color: '#795548' }}>
                {mode === 'edit' ? 'All inventory gears placed!' : 'All gears placed!'}
              </div>
            )}
            {sidebarInventory.map((item) => (
              <div
                key={item.id}
                className="cursor-grab active:cursor-grabbing p-1 rounded shrink-0"
                style={{
                  border: '1px dashed #5D4037',
                  background: 'rgba(93,64,55,0.2)',
                  transform: 'scale(0.6)',
                  transformOrigin: 'center',
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleInventoryDragStart(item, e.clientX, e.clientY);
                }}
              >
                <GearSVG size={item.size} role="positional" angle={0} />
              </div>
            ))}
          </div>

          {mode === 'edit' && (
            <div className="flex flex-col gap-2 p-3">
              {/* Place gear tools — in horizontal rows */}
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="text-xs font-bold uppercase whitespace-nowrap"
                  style={{ color: '#A1887F' }}
                >
                  Size:
                </div>
                {GEAR_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlacingSize(s)}
                    className="px-2 py-1 rounded text-xs cursor-pointer capitalize"
                    style={btnStyle(placingSize === s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-xs whitespace-nowrap" style={{ color: '#8D6E63' }}>
                  Click board to place:
                </div>
                <button
                  onClick={() => setPlacingRole(placingRole === 'start' ? null : 'start')}
                  className="px-3 py-1.5 rounded font-bold text-xs cursor-pointer"
                  style={btnStyle(placingRole === 'start')}
                >
                  ▶ Start ({gears.filter((g) => g.role === 'start').length}/5)
                </button>
                <button
                  onClick={() => setPlacingRole(placingRole === 'goal' ? null : 'goal')}
                  className="px-3 py-1.5 rounded font-bold text-xs cursor-pointer"
                  style={btnStyle(placingRole === 'goal')}
                >
                  ■ Goal ({gears.filter((g) => g.role === 'goal').length}/2)
                </button>

                {placingRole === 'goal' &&
                  DIRECTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPlacingDirection(opt.value)}
                      className="px-2 py-1 rounded text-xs cursor-pointer"
                      style={btnStyle(placingDirection === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
              </div>

              {/* Inventory definition — horizontal row */}
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="text-xs font-bold uppercase whitespace-nowrap"
                  style={{ color: '#A1887F' }}
                >
                  Player Inventory:
                </div>
                {GEAR_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => addInventoryGear(s)}
                    className="px-2 py-1 rounded text-xs cursor-pointer capitalize"
                    style={btnStyle()}
                  >
                    + {s}
                  </button>
                ))}
              </div>

              {inventoryDef.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {inventoryDef.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-xs capitalize"
                      style={{
                        background: editPlacedInventory.includes(item.id)
                          ? 'rgba(76,175,80,0.2)'
                          : 'rgba(93,64,55,0.3)',
                        color: '#D7CCC8',
                        border: editPlacedInventory.includes(item.id)
                          ? '1px solid #4CAF50'
                          : 'none',
                      }}
                    >
                      <span>
                        {item.size}
                        {editPlacedInventory.includes(item.id) && (
                          <span style={{ color: '#66BB6A' }}> ✓</span>
                        )}
                      </span>
                      <button
                        onClick={() => removeInventoryGear(item.id)}
                        className="text-red-400 cursor-pointer font-bold"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs italic" style={{ color: '#795548' }}>
                Drag gears on board to reposition · Right-click to remove
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation modal for daily publishing */}
      {showDailyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />
          <div
            className="relative z-10 p-6 rounded-lg"
            style={{ background: 'rgba(62,39,35,0.95)', border: '2px solid #8D6E63', width: 380 }}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: '#FFD54F' }}>
              Publish as Daily Puzzle?
            </h3>
            <p style={{ color: '#D7CCC8' }} className="mb-4">
              This will post the current level as the official Daily Puzzle. Are you sure?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDailyConfirm(false)}
                className="px-3 py-1.5 rounded font-bold text-sm"
                style={{ background: '#5D4037', color: '#D7CCC8', border: '1px solid #795548' }}
                disabled={publishing}
              >
                Cancel
              </button>
              <button
                onClick={() => void confirmPublishDaily()}
                className="px-3 py-1.5 rounded font-bold text-sm"
                style={{
                  background: 'linear-gradient(to bottom, #AB47BC, #7B1FA2)',
                  color: '#fff',
                  border: '1px solid #9C27B0',
                }}
                disabled={publishing}
              >
                {publishing ? 'Posting...' : 'Post Daily'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
