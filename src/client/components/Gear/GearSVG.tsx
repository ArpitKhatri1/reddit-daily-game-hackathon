import { GEAR_DIMENSIONS, ROLE_COLORS } from "../../lib/constants";
import type { GearRole, GearSize, RotationDirection } from "../../types";

interface GearSVGProps {
  size: GearSize;
  role: GearRole;
  angle: number;
  /** Optional opacity for ghost/preview gears */
  opacity?: number;
  /** Whether to show a highlight ring (e.g. snap preview) */
  highlight?: boolean;
  /** Whether this gear is locked (conflicting rotation) */
  locked?: boolean;
  /** Required rotation direction — shown as arrow on goal gears */
  requiredDirection?: RotationDirection;
}

/**
 * Build an SVG path for a circular arrow showing rotation direction.
 * The arrow is an arc with an arrowhead at the end.
 */
function buildCircularArrowPath(
  cx: number,
  cy: number,
  r: number,
  direction: "cw" | "ccw"
): string {
  // Arc from -120° to 120° (240° arc) for CW, mirrored for CCW
  const startAngleDeg = direction === "cw" ? -130 : 130;
  const endAngleDeg = direction === "cw" ? 100 : -100;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const sx = cx + r * Math.cos(toRad(startAngleDeg));
  const sy = cy + r * Math.sin(toRad(startAngleDeg));
  const ex = cx + r * Math.cos(toRad(endAngleDeg));
  const ey = cy + r * Math.sin(toRad(endAngleDeg));

  // Arrowhead at the end
  const arrowLen = 6;
  // Tangent direction at the endpoint
  const tangentAngle =
    direction === "cw" ? toRad(endAngleDeg) + Math.PI / 2 : toRad(endAngleDeg) - Math.PI / 2;
  const perpAngle = tangentAngle + Math.PI;

  const ax1 = ex + arrowLen * Math.cos(tangentAngle + 0.5);
  const ay1 = ey + arrowLen * Math.sin(tangentAngle + 0.5);
  const ax2 = ex + arrowLen * Math.cos(perpAngle - 0.5);
  const ay2 = ey + arrowLen * Math.sin(perpAngle - 0.5);

  const sweep = direction === "cw" ? 1 : 0;
  const largeArc = 1;

  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweep} ${ex} ${ey} M ${ax1} ${ay1} L ${ex} ${ey} L ${ax2} ${ay2}`;
}

/**
 * Pure SVG gear renderer. Does NOT handle its own animation —
 * the parent passes `angle` which updates each frame.
 */
export default function GearSVG({
  size,
  role,
  angle,
  opacity = 1,
  highlight = false,
  locked = false,
  requiredDirection,
}: GearSVGProps) {
  const dim = GEAR_DIMENSIONS[size];
  const colors = ROLE_COLORS[role];
  const viewSize = dim.outerRadius * 2 + 4; // +4 for stroke padding
  const cx = viewSize / 2;
  const cy = viewSize / 2;

  // Build the gear tooth path (kept for potential future path-based rendering)

  return (
    <svg
      width={viewSize}
      height={viewSize}
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      style={{ overflow: "visible", opacity }}
    >
      {/* Highlight ring for snap preview */}
      {highlight && (
        <circle
          cx={cx}
          cy={cy}
          r={dim.outerRadius + 6}
          fill="none"
          stroke="#FFD54F"
          strokeWidth={3}
          strokeDasharray="8 4"
          opacity={0.8}
        />
      )}

      {/* Gear body + teeth as a single rotated group */}
      <g transform={`rotate(${angle} ${cx} ${cy})`}>
        {/* Tooth tips (individual rects for crisp look) */}
        {Array.from({ length: dim.teeth }).map((_, i) => {
          const toothAngle = (360 / dim.teeth) * i;
          return (
            <rect
              key={i}
              x={cx - dim.toothWidth / 2}
              y={cy - dim.baseRadius - dim.toothDepth}
              width={dim.toothWidth}
              height={dim.toothDepth + 2}
              rx={2}
              fill={colors.teeth}
              transform={`rotate(${toothAngle} ${cx} ${cy})`}
            />
          );
        })}

        {/* Main body circle */}
        <circle cx={cx} cy={cy} r={dim.baseRadius} fill={colors.body} />

        {/* Inner ring decorative detail */}
        <circle
          cx={cx}
          cy={cy}
          r={dim.baseRadius * 0.7}
          fill="none"
          stroke={colors.bodyDark}
          strokeWidth={2}
          opacity={0.4}
        />

        {/* Spokes for steampunk feel */}
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line
            key={a}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos((a * Math.PI) / 180) * dim.baseRadius * 0.65}
            y2={cy + Math.sin((a * Math.PI) / 180) * dim.baseRadius * 0.65}
            stroke={colors.bodyDark}
            strokeWidth={2}
            opacity={0.3}
          />
        ))}

        {/* Center hole */}
        <circle cx={cx} cy={cy} r={dim.outerRadius * 0.12} fill={colors.hole} />
        <circle
          cx={cx}
          cy={cy}
          r={dim.outerRadius * 0.12}
          fill="none"
          stroke={colors.highlight}
          strokeWidth={1.5}
          opacity={0.6}
        />
      </g>

      {/* Role indicator icon in center (doesn't rotate) */}
      {role === "start" && (
        <polygon
          points={`${cx},${cy - 6} ${cx + 5},${cy + 4} ${cx - 5},${cy + 4}`}
          fill={colors.highlight}
          opacity={0.9}
        />
      )}
      {role === "goal" && requiredDirection && requiredDirection !== "any" && (
        <g>
          {/* Circular arrow showing required direction */}
          <path
            d={buildCircularArrowPath(cx, cy, dim.baseRadius * 0.4, requiredDirection)}
            fill="none"
            stroke={colors.highlight}
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.9}
          />
        </g>
      )}
      {role === "goal" && (!requiredDirection || requiredDirection === "any") && (
        <g>
          {/* Double circular arrows for "any direction" */}
          <path
            d={buildCircularArrowPath(cx, cy, dim.baseRadius * 0.4, "cw")}
            fill="none"
            stroke={colors.highlight}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.6}
          />
          <path
            d={buildCircularArrowPath(cx, cy, dim.baseRadius * 0.4, "ccw")}
            fill="none"
            stroke={colors.highlight}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.6}
          />
        </g>
      )}

      {/* Locked gear visual: pulsing yellow ring */}
      {locked && (
        <circle
          cx={cx}
          cy={cy}
          r={dim.outerRadius + 3}
          fill="none"
          stroke="#FFD54F"
          strokeWidth={3}
          opacity={0.8}
        >
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="0.6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-width"
            values="2;4;2"
            dur="0.6s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </svg>
  );
}

export type { GearSVGProps };
