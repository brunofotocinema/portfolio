const ICON_PATH =
  "M585.00 778.72 C492.63 778.72 417.76 703.84 417.76 611.48 C417.76 519.11 492.63 444.23 585.00 444.23 C677.36 444.23 752.24 519.11 752.24 611.48 C752.24 703.84 677.36 778.72 585.00 778.72 M792.10 544.18 C743.28 531.19 710.27 485.75 712.99 435.31 L712.99 435.31 C665.86 453.48 612.44 436.13 585.00 393.72 C557.55 436.13 504.13 453.48 457.00 435.31 C459.73 485.75 426.71 531.19 377.90 544.18 L377.90 544.18 C409.75 583.39 409.75 639.56 377.90 678.77 C426.71 691.76 459.73 737.20 457.00 787.64 L457.00 787.64 C504.13 769.47 557.55 786.82 585.00 829.23 L585.00 829.23 L587.14 825.93 C613.34 785.44 664.33 768.87 709.32 786.23 L712.99 787.64 L712.99 787.64 C710.27 737.20 743.28 691.76 792.10 678.77 C760.24 639.56 760.24 583.39 792.10 544.18 Z M762.12 609.60 C762.12 707.42 682.82 786.72 585.00 786.72 C487.18 786.72 407.88 707.42 407.88 609.60 C407.88 511.77 487.18 432.48 585.00 432.48 C682.82 432.48 762.12 511.77 762.12 609.60 M699.47 544.87 L651.61 544.87 L651.61 497.01 L623.95 469.35 L545.51 469.35 L518.39 496.47 L518.39 544.87 L470.00 544.87 L442.88 571.99 L442.88 651.37 L469.59 678.08 L518.39 678.08 L518.39 726.89 L545.10 753.60 L624.36 753.60 L651.61 726.35 L651.61 678.08 L699.88 678.08 L727.12 650.84 L727.12 572.52 Z M585.00 544.27 C547.94 544.27 517.80 574.42 517.80 611.48 C517.80 648.53 547.94 678.68 585.00 678.68 C622.05 678.68 652.20 648.53 652.20 611.48 C652.20 574.42 622.05 544.27 585.00 544.27 M585.00 685.72 C544.06 685.72 510.75 652.41 510.75 611.48 C510.75 570.54 544.06 537.23 585.00 537.23 C625.94 537.23 659.25 570.54 659.25 611.48 C659.25 652.41 625.94 685.72 585.00 685.72 M655.72 611.47 C655.72 650.53 624.06 682.20 585.00 682.20 C545.94 682.20 514.28 650.53 514.28 611.47 C514.28 572.41 545.94 540.75 585.00 540.75 C624.06 540.75 655.72 572.41 655.72 611.47 M651.61 544.87 L518.39 544.87 L518.39 678.08 L651.61 678.08 Z M644.06 670.54 L525.94 670.54 L525.94 552.41 L644.06 552.41 Z";

const TEXT_STYLE = {
  fontFamily: "var(--font-logo), sans-serif",
  fontWeight: 900,
  fontSize: 64,
  letterSpacing: "1.2px",
} as const;

/**
 * The "2D -> 2F" brand animation: starts big and centered (2D — icon on
 * top, BRUNO/HOMEM side by side) and settles into the small top-left
 * corner mark (2F — icon left, BRUNO/HOMEM stacked). Timing/positions
 * are sampled straight from the motion the brand animation file produces
 * (see logoStage keyframes in globals.css), not hand-guessed.
 */
export default function LogoMark() {
  return (
    <a href="#top" aria-label="Bruno Homem" className="logo-stage">
      <span className="logo-icon">
        <svg viewBox="369.90 385.72 430.20 451.51" preserveAspectRatio="xMidYMid meet">
          <path fillRule="evenodd" fill="currentColor" d={ICON_PATH} />
        </svg>
      </span>

      <span className="logo-bruno">
        <svg viewBox="0 0 340 70" preserveAspectRatio="xMinYMid meet">
          <text x="0" y="58" style={TEXT_STYLE} fill="currentColor">
            BRUNO
          </text>
        </svg>
      </span>

      <span className="logo-homem">
        <svg viewBox="0 0 340 70" preserveAspectRatio="xMinYMid meet">
          <defs>
            <mask id="logoHomemMask" maskUnits="userSpaceOnUse" x="-20" y="-20" width="380" height="110">
              <text
                x="0"
                y="58"
                style={TEXT_STYLE}
                fill="none"
                stroke="#fff"
                strokeWidth="10.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              >
                HOMEM
              </text>
              <text x="0" y="58" style={TEXT_STYLE} fill="#000">
                HOMEM
              </text>
            </mask>
          </defs>
          <rect x="-20" y="-20" width="380" height="110" fill="currentColor" mask="url(#logoHomemMask)" />
        </svg>
      </span>
    </a>
  );
}
