import { useState } from 'react';

// Pixel-art tutor knight mascot SVG (glasses, navy blazer, red tie, holding pointer + book).
// The ruler is held DOWN by default. Clicking the knight lifts it UP, click again to lower.
export default function TutorKnight({ className = '' }) {
  const [rulerUp, setRulerUp] = useState(false);

  const onClick = () => {
    setRulerUp((u) => !u);
  };

  return (
    <svg
      viewBox="0 0 32 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ imageRendering: 'pixelated', cursor: 'pointer' }}
      onClick={onClick}
    >
      <rect x="11" y="1" width="10" height="4" fill="#2a1a08"/>
      <rect x="10" y="2" width="12" height="3" fill="#2a1a08"/>
      <rect x="11" y="4" width="10" height="10" fill="#f5c8a8"/>
      <rect x="10" y="5" width="12" height="8" fill="#f5c8a8"/>
      <rect x="11" y="8" width="4" height="3" fill="#b8d8f0" stroke="#3a2a10" strokeWidth="0.6" opacity="0.5"/>
      <rect x="17" y="8" width="4" height="3" fill="#b8d8f0" stroke="#3a2a10" strokeWidth="0.6" opacity="0.5"/>
      <rect x="15" y="9" width="2" height="1" fill="#3a2a10"/>
      <rect x="12" y="9" width="2" height="2" fill="#222"/>
      <rect x="18" y="9" width="2" height="2" fill="#222"/>
      <rect x="13" y="12" width="6" height="1" fill="#c07858"/>
      <rect x="14" y="14" width="4" height="2" fill="#f0b898"/>
      <rect x="13" y="15" width="6" height="2" fill="#f0f0f8"/>
      <rect x="15" y="15" width="2" height="7" fill="#d42b2b"/>
      <polygon points="15,22 17,22 16,25" fill="#991f1f"/>
      <rect x="11" y="16" width="10" height="11" fill="#1e2a4a"/>
      <rect x="13" y="16" width="2" height="5" fill="#28387a"/>
      <rect x="17" y="16" width="2" height="5" fill="#28387a"/>
      <rect x="6" y="15" width="4" height="3" fill="#1e2a4a"/>
      <rect x="5" y="13" width="3" height="5" fill="#1e2a4a"/>
      <rect x="4" y="12" width="3" height="3" fill="#f5c8a8"/>

      {/* Ruler — animated. Pivots around the hand grip (~4,13). Default rotated 180° (down). */}
      <g
        style={{
          transformOrigin: '4px 13px',
          transformBox: 'view-box',
          transform: rulerUp ? 'rotate(0deg)' : 'rotate(180deg)',
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <rect x="1" y="4" width="2" height="10" fill="#c8a050"/>
        <rect x="1" y="3" width="2" height="1" fill="#d42b2b"/>
      </g>

      <rect x="22" y="15" width="4" height="3" fill="#1e2a4a"/>
      <rect x="23" y="17" width="3" height="5" fill="#1e2a4a"/>
      <rect x="22" y="21" width="3" height="3" fill="#f5c8a8"/>
      <rect x="21" y="23" width="8" height="9" fill="#d42b2b"/>
      <rect x="22" y="24" width="6" height="7" fill="#e84040"/>
      <rect x="21" y="23" width="2" height="9" fill="#991f1f"/>
      <rect x="23" y="25" width="4" height="1" fill="#fff" opacity="0.5"/>
      <rect x="23" y="27" width="4" height="1" fill="#fff" opacity="0.5"/>
      <rect x="11" y="27" width="4" height="8" fill="#111827"/>
      <rect x="17" y="27" width="4" height="8" fill="#111827"/>
      <rect x="11" y="27" width="10" height="2" fill="#0a0f1e"/>
      <rect x="10" y="34" width="5" height="3" fill="#111"/>
      <rect x="17" y="34" width="5" height="3" fill="#111"/>
    </svg>
  );
}
