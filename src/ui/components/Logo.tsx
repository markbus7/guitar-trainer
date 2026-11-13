/** The Fretforge mark: a guitar pick cut from molten metal, with a lightning fret slash. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="ff-pick" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd166" />
          <stop offset="0.45" stopColor="#ff6a2b" />
          <stop offset="1" stopColor="#ff3d5a" />
        </linearGradient>
        <radialGradient id="ff-shine" cx="0.35" cy="0.25" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M32 60C22 50 8 36 7 21 6 10 17 4 32 4s26 6 25 17C56 36 42 50 32 60Z"
        fill="url(#ff-pick)"
        stroke="#2a1208"
        strokeWidth="2"
      />
      <path d="M32 58C23 49 10 36 9 22 8 12 18 6 32 6" fill="url(#ff-shine)" opacity="0.8" />
      <path d="M36 13 24 33h9l-5 16 13-22h-9l4-14Z" fill="#1a0d08" />
    </svg>
  );
}

export function Logo({ size = 34, compact = false }: { size?: number; compact?: boolean }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      {!compact && (
        <span className="logo-word">
          FRET<span>FORGE</span>
        </span>
      )}
    </span>
  );
}
