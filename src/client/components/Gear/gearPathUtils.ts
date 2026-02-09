import type { GearDimension } from "../../types";

/** Build the outline path of a gear as an SVG path string */
export function buildGearPath(
  cx: number,
  cy: number,
  dim: GearDimension
): string {
  const { teeth, baseRadius, toothDepth, toothWidth } = dim;
  const outerR = baseRadius + toothDepth;
  const parts: string[] = [];

  for (let i = 0; i < teeth; i++) {
    const angleCenter = (2 * Math.PI * i) / teeth;
    const halfTooth = toothWidth / 2 / outerR;

    const a1 = angleCenter - halfTooth;
    const a2 = angleCenter + halfTooth;

    const prevAngle = angleCenter - Math.PI / teeth;

    if (i === 0) {
      parts.push(
        `M ${cx + Math.cos(prevAngle) * baseRadius} ${cy + Math.sin(prevAngle) * baseRadius}`
      );
    }

    parts.push(
      `L ${cx + Math.cos(a1) * baseRadius} ${cy + Math.sin(a1) * baseRadius}`
    );
    parts.push(
      `L ${cx + Math.cos(a1) * outerR} ${cy + Math.sin(a1) * outerR}`
    );
    parts.push(
      `L ${cx + Math.cos(a2) * outerR} ${cy + Math.sin(a2) * outerR}`
    );
    parts.push(
      `L ${cx + Math.cos(a2) * baseRadius} ${cy + Math.sin(a2) * baseRadius}`
    );
  }

  parts.push("Z");
  return parts.join(" ");
}
