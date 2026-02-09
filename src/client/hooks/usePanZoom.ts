import React, { useState, useCallback, useRef } from 'react';

export interface PanZoomState {
  /** Current pan offset (pixels) */
  panX: number;
  panY: number;
  /** Current zoom scale (1 = 100%) */
  zoom: number;
}

interface UsePanZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  /** Maximum canvas size that limits how far you can pan */
  canvasWidth?: number;
  canvasHeight?: number;
}

const DEFAULT_MIN_ZOOM = 0.3;
const DEFAULT_MAX_ZOOM = 2.0;
const DEFAULT_CANVAS_WIDTH = 2400;
const DEFAULT_CANVAS_HEIGHT = 1600;

export function usePanZoom(options: UsePanZoomOptions = {}) {
  const {
    minZoom = DEFAULT_MIN_ZOOM,
    maxZoom = DEFAULT_MAX_ZOOM,
    canvasWidth = DEFAULT_CANVAS_WIDTH,
    canvasHeight = DEFAULT_CANVAS_HEIGHT,
  } = options;

  const [state, setState] = useState<PanZoomState>({
    panX: 0,
    panY: 0,
    zoom: 1,
  });

  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  /** How many pointers are down (2 = pinch) */
  const pointerCache = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDist = useRef<number | null>(null);

  const clampPan = useCallback(
    (px: number, py: number, z: number, viewW: number, viewH: number) => {
      const scaledW = canvasWidth * z;
      const scaledH = canvasHeight * z;

      let clampedX: number;
      let clampedY: number;

      if (scaledW <= viewW) {
        // Canvas fits inside viewport → center it, no panning
        clampedX = (viewW - scaledW) / 2;
      } else {
        // Canvas is bigger than viewport → clamp so it always covers the viewport
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

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      setState((prev) => {
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(minZoom, Math.min(maxZoom, prev.zoom * factor));
        // Zoom towards mouse pointer
        const newPanX = mx - (mx - prev.panX) * (newZoom / prev.zoom);
        const newPanY = my - (my - prev.panY) * (newZoom / prev.zoom);
        const clamped = clampPan(newPanX, newPanY, newZoom, rect.width, rect.height);
        return { zoom: newZoom, ...clamped };
      });
    },
    [minZoom, maxZoom, clampPan]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointerCache.current.size === 1 && (e.button === 1 || e.button === 0)) {
      // Left-click or middle-click can start a pan.
      // The consuming component should only call this when the click is on empty canvas.
      isPanning.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (pointerCache.current.size === 2) {
      // Start pinch
      const pts = Array.from(pointerCache.current.values());
      lastPinchDist.current = Math.hypot(pts[1]!.x - pts[0]!.x, pts[1]!.y - pts[0]!.y);
      isPanning.current = true;
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointerCache.current.size === 2 && lastPinchDist.current !== null) {
        // Pinch zoom
        const pts = Array.from(pointerCache.current.values());
        const dist = Math.hypot(pts[1]!.x - pts[0]!.x, pts[1]!.y - pts[0]!.y);
        const rect = e.currentTarget.getBoundingClientRect();
        const midX = (pts[0]!.x + pts[1]!.x) / 2 - rect.left;
        const midY = (pts[0]!.y + pts[1]!.y) / 2 - rect.top;
        const scale = dist / lastPinchDist.current;
        lastPinchDist.current = dist;

        setState((prev) => {
          const newZoom = Math.max(minZoom, Math.min(maxZoom, prev.zoom * scale));
          const newPanX = midX - (midX - prev.panX) * (newZoom / prev.zoom);
          const newPanY = midY - (midY - prev.panY) * (newZoom / prev.zoom);
          const clamped = clampPan(newPanX, newPanY, newZoom, rect.width, rect.height);
          return { zoom: newZoom, ...clamped };
        });
        return;
      }

      if (isPanning.current && pointerCache.current.size === 1) {
        const dx = e.clientX - lastPointer.current.x;
        const dy = e.clientY - lastPointer.current.y;
        lastPointer.current = { x: e.clientX, y: e.clientY };

        setState((prev) => {
          const rect = e.currentTarget.getBoundingClientRect();
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
    [minZoom, maxZoom, clampPan]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointerCache.current.delete(e.pointerId);
    if (pointerCache.current.size < 2) {
      lastPinchDist.current = null;
    }
    if (pointerCache.current.size === 0) {
      isPanning.current = false;
    }
  }, []);

  const resetView = useCallback(() => {
    setState({ panX: 0, panY: 0, zoom: 1 });
  }, []);

  /** Cancel any in-progress pan (call when a gear drag starts) */
  const cancelPan = useCallback(() => {
    isPanning.current = false;
    pointerCache.current.clear();
    lastPinchDist.current = null;
  }, []);

  /** Convert client coords to canvas (board) coords */
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
    /** CSS transform for the canvas container */
    canvasTransform: `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`,
  };
}
