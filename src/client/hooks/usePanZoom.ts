import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface PanZoomState {
  panX: number;
  panY: number;
  zoom: number;
}

interface UsePanZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  initialZoom?: number;
}

const DEFAULT_MIN_ZOOM = 0.3;
const DEFAULT_MAX_ZOOM = 2.0;
const DEFAULT_CANVAS_WIDTH = 2400;
const DEFAULT_CANVAS_HEIGHT = 1600;

// Helper: Calculate the center (centroid) of all active pointers
function getCentroid(pointers: Map<number, { x: number; y: number }>) {
  const pts = Array.from(pointers.values());
  if (pts.length === 0) return { x: 0, y: 0 };

  const total = pts.reduce((acc, curr) => ({ x: acc.x + curr.x, y: acc.y + curr.y }), {
    x: 0,
    y: 0,
  });

  return {
    x: total.x / pts.length,
    y: total.y / pts.length,
  };
}

export function usePanZoom(
  options: UsePanZoomOptions = {},
  containerRef?: React.RefObject<HTMLElement | null>
) {
  const {
    minZoom = DEFAULT_MIN_ZOOM,
    maxZoom = DEFAULT_MAX_ZOOM,
    canvasWidth = DEFAULT_CANVAS_WIDTH,
    canvasHeight = DEFAULT_CANVAS_HEIGHT,
    initialZoom = 1,
  } = options;

  const [state, setState] = useState<PanZoomState>({
    panX: 0,
    panY: 0,
    zoom: initialZoom,
  });

  const clampPan = useCallback(
    (px: number, py: number, z: number, viewW: number, viewH: number) => {
      const scaledW = canvasWidth * z;
      const scaledH = canvasHeight * z;

      let clampedX: number;
      let clampedY: number;

      if (scaledW <= viewW) {
        clampedX = (viewW - scaledW) / 2;
      } else {
        clampedX = Math.max(viewW - scaledW, Math.min(0, px));
      }

      if (scaledH <= viewH) {
        clampedY = (viewH - scaledH) / 2;
      } else {
        clampedY = Math.max(viewH - scaledH, Math.min(0, py));
      }

      return { panX: clampedX, panY: clampedY };
    },
    [canvasWidth, canvasHeight]
  );

  const computeCenterPan = useCallback(
    (z: number, viewW: number, viewH: number) => {
      const centeredX = (viewW - canvasWidth * z) / 2;
      const centeredY = (viewH - canvasHeight * z) / 2;
      return clampPan(centeredX, centeredY, z, viewW, viewH);
    },
    [canvasWidth, canvasHeight, clampPan]
  );

  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const pointerCache = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDist = useRef<number | null>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const rect =
        (containerRef && containerRef.current && containerRef.current.getBoundingClientRect()) ||
        (e.currentTarget && (e.currentTarget as Element).getBoundingClientRect()) ||
        new DOMRect(0, 0, window.innerWidth || 800, window.innerHeight || 600);
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      setState((prev) => {
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(minZoom, Math.min(maxZoom, prev.zoom * factor));
        const newPanX = mx - (mx - prev.panX) * (newZoom / prev.zoom);
        const newPanY = my - (my - prev.panY) * (newZoom / prev.zoom);
        const clamped = clampPan(newPanX, newPanY, newZoom, rect.width, rect.height);
        return { zoom: newZoom, ...clamped };
      });
    },
    [minZoom, maxZoom, clampPan, containerRef]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // 1. Calculate the new centroid of all fingers
    const centroid = getCentroid(pointerCache.current);

    // 2. Reset the lastPointer to this new centroid immediately
    // This prevents jumps when going from 0->1 or 1->2 fingers
    lastPointer.current = centroid;

    isPanning.current = true;

    if (pointerCache.current.size === 2) {
      const pts = Array.from(pointerCache.current.values());
      lastPinchDist.current = Math.hypot(pts[1]!.x - pts[0]!.x, pts[1]!.y - pts[0]!.y);
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Update the current pointer position in cache
      pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // PINCH ZOOM LOGIC
      if (pointerCache.current.size === 2 && lastPinchDist.current !== null) {
        const pts = Array.from(pointerCache.current.values());
        const dist = Math.hypot(pts[1]!.x - pts[0]!.x, pts[1]!.y - pts[0]!.y);

        const rect =
          (containerRef && containerRef.current && containerRef.current.getBoundingClientRect()) ||
          (e.currentTarget && (e.currentTarget as Element).getBoundingClientRect()) ||
          new DOMRect(0, 0, window.innerWidth || 800, window.innerHeight || 600);

        // Midpoint relative to the container (for zoom origin)
        const midX = (pts[0]!.x + pts[1]!.x) / 2 - rect.left;
        const midY = (pts[0]!.y + pts[1]!.y) / 2 - rect.top;

        // Midpoint in Client coordinates (for updating lastPointer)
        const clientMidX = (pts[0]!.x + pts[1]!.x) / 2;
        const clientMidY = (pts[0]!.y + pts[1]!.y) / 2;

        const scale = dist / lastPinchDist.current;
        lastPinchDist.current = dist;

        // IMPORTANT: Keep lastPointer synced with the pinch center
        lastPointer.current = { x: clientMidX, y: clientMidY };

        setState((prev) => {
          const newZoom = Math.max(minZoom, Math.min(maxZoom, prev.zoom * scale));
          const newPanX = midX - (midX - prev.panX) * (newZoom / prev.zoom);
          const newPanY = midY - (midY - prev.panY) * (newZoom / prev.zoom);
          const clamped = clampPan(newPanX, newPanY, newZoom, rect.width, rect.height);
          return { zoom: newZoom, ...clamped };
        });
        return;
      }

      // PAN LOGIC
      if (isPanning.current && pointerCache.current.size === 1) {
        // Here, lastPointer.current was reset in handlePointerUp if we just dropped a finger
        const dx = e.clientX - lastPointer.current.x;
        const dy = e.clientY - lastPointer.current.y;

        lastPointer.current = { x: e.clientX, y: e.clientY };

        setState((prev) => {
          const rect =
            (containerRef &&
              containerRef.current &&
              containerRef.current.getBoundingClientRect()) ||
            (e.currentTarget && (e.currentTarget as Element).getBoundingClientRect()) ||
            new DOMRect(0, 0, window.innerWidth || 800, window.innerHeight || 600);

          const clamped = clampPan(
            prev.panX + dx,
            prev.panY + dy,
            prev.zoom,
            rect.width,
            rect.height
          );
          return { ...prev, ...clamped };
        });
      }
    },
    [minZoom, maxZoom, clampPan, containerRef]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointerCache.current.delete(e.pointerId);

    if (pointerCache.current.size < 2) {
      lastPinchDist.current = null;
    }

    if (pointerCache.current.size === 0) {
      isPanning.current = false;
    } else {
      // CRITICAL FIX:
      // If fingers remain (e.g. 2 -> 1), calculate the NEW center
      // and reset lastPointer. This prevents the "jump" because the next
      // move event will calculate delta from this new center, not the old midpoint.
      const centroid = getCentroid(pointerCache.current);
      lastPointer.current = centroid;
    }
  }, []);

  const resetView = useCallback(() => {
    const z = initialZoom;
    if (containerRef && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centered = computeCenterPan(z, rect.width, rect.height);
      setState({ zoom: z, panX: centered.panX, panY: centered.panY });
    } else {
      setState({ zoom: z, panX: 0, panY: 0 });
    }
  }, [initialZoom, containerRef, computeCenterPan]);

  useEffect(() => {
    if (containerRef && containerRef.current) {
      resetView();
    }
  }, [containerRef, resetView]);

  const cancelPan = useCallback(() => {
    isPanning.current = false;
    pointerCache.current.clear();
    lastPinchDist.current = null;
  }, []);

  const clientToCanvas = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      return {
        x: (clientX - rect.left - state.panX) / state.zoom,
        y: (clientY - rect.top - state.panY) / state.zoom,
      };
    },
    [state]
  );

  return {
    ...state,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetView,
    cancelPan,
    clientToCanvas,
    isPanning: isPanning.current,
    canvasTransform: `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`,
  };
}
