import { CHART_GRID, CHART_SERIES } from "../../lib/chartTheme";

const RADIUS = 80;
const CENTER = 100;
const TRACK_Y = 100;
/** Half-circle from 180deg to 0deg: length = pi * r. */
const ARC_LENGTH = Math.PI * RADIUS;

const BAND_LABEL: Record<string, string> = {
  building: "Building",
  steady: "Steady",
  strong: "Strong",
  resilient: "Resilient",
  unknown: "Not enough information yet",
};

/** Hand-rolled SVG arc gauge. No charting dependency. */
export function FinancialScoreDial({
  score,
  maxPoints,
  band,
  basisNote,
}: {
  score: number;
  maxPoints: number;
  band: string;
  /** Plain-language note on how much of the score was measurable, e.g. "Based on 2 of 3 areas." Included in the accessible label as well as shown visually. */
  basisNote?: string;
}) {
  const fraction = maxPoints > 0 ? Math.max(0, Math.min(1, score / maxPoints)) : 0;
  const filled = ARC_LENGTH * fraction;
  const bandLabel = BAND_LABEL[band] ?? band;
  const ariaLabel = `Financial score ${score} out of ${maxPoints}, band: ${bandLabel}${basisNote ? `. ${basisNote}` : ""}`;

  return (
    <div className="flex flex-col items-center">
      <svg
        aria-label={ariaLabel}
        role="img"
        viewBox="0 0 200 118"
        width="200"
        height="118"
      >
        <path
          d={`M ${CENTER - RADIUS} ${TRACK_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER + RADIUS} ${TRACK_Y}`}
          fill="none"
          stroke={CHART_GRID}
          strokeLinecap="round"
          strokeWidth="16"
        />
        <path
          d={`M ${CENTER - RADIUS} ${TRACK_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER + RADIUS} ${TRACK_Y}`}
          fill="none"
          stroke={CHART_SERIES}
          strokeDasharray={`${filled} ${ARC_LENGTH}`}
          strokeLinecap="round"
          strokeWidth="16"
        />
        <text fontFamily="var(--font-mono)" fontSize="34" fontWeight="500" textAnchor="middle" x={CENTER} y="92" fill="var(--color-pure)">
          {Math.round(score)}
        </text>
        <text fontFamily="var(--font-mono)" fontSize="12" textAnchor="middle" x={CENTER} y="110" fill="var(--color-ash)">
          out of {maxPoints}
        </text>
      </svg>
      <p className="mt-3 display-lg" style={{ fontSize: "20px" }}>{bandLabel}</p>
      {basisNote ? (
        <p className="mt-3 max-w-[12rem] text-center body-text-sm">{basisNote}</p>
      ) : null}
    </div>
  );
}
