// Pixel-art HOD avatars — distinct per person.
// Each ~28×40 viewBox, scaled by w/h passed in.

const HOD_SPRITES = {
  athirah: {     // Academy — Ms., dark hair, yellow scarf
    skin:'#f5c8a8', hair:'#1a0d04', outfit:'#f5c518', accent:'#c89a00', long:true
  },
  najwa: {       // HR — Ms., warm brown hair, purple top
    skin:'#f0bc94', hair:'#3a1808', outfit:'#a070d0', accent:'#7048a0', long:true
  },
  alyaa: {       // Finance — Ms., light brown hair, teal top
    skin:'#f5c8a8', hair:'#5a2a0e', outfit:'#4ac0a8', accent:'#2a8878', long:true
  },
  fazween: {     // I&O Psychology — Ms., dark hair, pink top
    skin:'#f0bc94', hair:'#1a0d04', outfit:'#c84878', accent:'#8a3050', long:true
  },
  iqbal: {       // Optimisation — Mr., blue tech hoodie
    skin:'#e8b890', hair:'#1a0d04', outfit:'#5090e0', accent:'#3060a8', long:false
  },
  didi: {        // Marketing — Ms., copper hair, orange top
    skin:'#f5c8a8', hair:'#7a3010', outfit:'#f08840', accent:'#b85820', long:true
  },
  manjeet: {     // Operations — Ms., long dark hair, red top
    skin:'#d8a070', hair:'#0a0500', outfit:'#d42b2b', accent:'#991f1f', long:true
  }
};

export default function HodSprite({ id, w = 36, h = 50 }) {
  const s = HOD_SPRITES[id] || HOD_SPRITES.iqbal;
  return (
    <svg viewBox="0 0 18 26" width={w} height={h} style={{ imageRendering: 'pixelated' }}>
      {/* Hair back layer (long for Ms.) */}
      {s.long && <rect x="4" y="3" width="10" height="9" fill={s.hair}/>}
      {s.long && <rect x="3" y="6" width="2" height="8" fill={s.hair}/>}
      {s.long && <rect x="13" y="6" width="2" height="8" fill={s.hair}/>}
      {/* Turban hint (Manjeet) */}
      {s.turban && <rect x="5" y="1" width="8" height="3" fill={s.outfit}/>}
      {s.turban && <rect x="6" y="0" width="6" height="2" fill={s.accent}/>}
      {/* Hair top */}
      {!s.turban && <rect x="6" y="2" width="6" height="3" fill={s.hair}/>}
      {!s.turban && <rect x="5" y="3" width="8" height="2" fill={s.hair}/>}
      {/* Face */}
      <rect x="6" y="4" width="6" height="6" fill={s.skin}/>
      <rect x="5" y="5" width="8" height="4" fill={s.skin}/>
      {/* Eyes */}
      <rect x="7" y="6" width="1" height="1" fill="#222"/>
      <rect x="10" y="6" width="1" height="1" fill="#222"/>
      {/* Smile */}
      <rect x="8" y="8" width="2" height="1" fill="#c07858"/>
      {/* Neck */}
      <rect x="7" y="10" width="4" height="1" fill={s.skin}/>
      {/* Body */}
      <rect x="5" y="11" width="8" height="8" fill={s.outfit}/>
      <rect x="5" y="11" width="8" height="2" fill="#fff" opacity="0.25"/>
      {/* Collar accent */}
      <rect x="7" y="11" width="4" height="1" fill={s.accent}/>
      {/* Arms */}
      <rect x="3" y="11" width="2" height="6" fill={s.outfit}/>
      <rect x="13" y="11" width="2" height="6" fill={s.outfit}/>
      <rect x="3" y="16" width="2" height="2" fill={s.skin}/>
      <rect x="13" y="16" width="2" height="2" fill={s.skin}/>
      {/* Legs */}
      <rect x="6" y="19" width="2" height="6" fill="#1a1a2e"/>
      <rect x="10" y="19" width="2" height="6" fill="#1a1a2e"/>
      {/* Shoes */}
      <rect x="5" y="24" width="3" height="2" fill="#111"/>
      <rect x="10" y="24" width="3" height="2" fill="#111"/>
    </svg>
  );
}
