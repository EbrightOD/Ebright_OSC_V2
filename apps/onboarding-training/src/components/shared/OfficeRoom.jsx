// Pixel-art office room with roof, walls, floor, door, window, desk,
// computer monitor, chair, and a "WELCOME" doormat carpet showing the dept name.

export default function OfficeRoom({ id, emoji, label, color, children, ringClass = '' }) {
  return (
    <div
      data-room={id}
      className={`relative bg-[#1f1f2e] border-[3px] rounded-md overflow-hidden flex flex-col min-h-[180px] transition ${ringClass}`}
      style={{ borderColor: color }}
    >
      {/* Roof / header — emoji only (label moved to doormat below) */}
      <div
        className="relative px-2 py-1.5 flex items-center justify-center gap-1.5"
        style={{
          background: `linear-gradient(180deg, ${color}55, ${color}25)`,
          borderBottom: `2px solid ${color}`,
          clipPath: 'polygon(0 0, 100% 0, 96% 100%, 4% 100%)',
        }}
      >
        <span className="text-base">{emoji}</span>
      </div>

      {/* Wall interior */}
      <div className="relative flex-1 flex items-end justify-center px-2 pt-2 pb-0"
           style={{ background: `linear-gradient(180deg, #1a1a2440 0%, #14141f 70%)` }}>
        {/* Window (top-left) */}
        <div className="absolute top-1.5 left-2 w-6 h-5 border border-white/20 bg-[#3a78c8]/40 grid grid-cols-2 grid-rows-2 gap-px">
          <div className="bg-[#5090e0]/40"></div><div className="bg-[#5090e0]/40"></div>
          <div className="bg-[#5090e0]/30"></div><div className="bg-[#5090e0]/30"></div>
        </div>
        {/* Window (top-right) */}
        <div className="absolute top-1.5 right-2 w-6 h-5 border border-white/20 bg-[#3a78c8]/40 grid grid-cols-2 grid-rows-2 gap-px">
          <div className="bg-[#5090e0]/40"></div><div className="bg-[#5090e0]/40"></div>
          <div className="bg-[#5090e0]/30"></div><div className="bg-[#5090e0]/30"></div>
        </div>

        {/* Door (back of room) */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-0">
          <div className="w-8 h-10 bg-[#3a2010] border-t-2 border-l-2 border-r-2 border-[#5a3018] rounded-t-sm relative">
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-eb-yellow rounded-full" />
            <div className="absolute top-1 left-1 right-1 h-1 bg-[#2a1a08] rounded-sm" />
          </div>
        </div>

        {/* Desk + computer (left side) */}
        <div className="absolute bottom-1 left-1 z-0 flex flex-col items-center">
          {/* Monitor */}
          <div className="relative w-7 h-5 bg-[#1a1a2a] border-eb-border-1 border-eb-border-2 rounded-sm overflow-hidden">
            <div className="absolute inset-0.5 bg-gradient-to-br from-[#3a78c8] to-[#1a3868]">
              {/* Tiny screen content lines */}
              <div className="absolute top-0.5 left-0.5 right-1 h-0.5 bg-eb-yellow/70" />
              <div className="absolute top-1.5 left-0.5 right-2 h-0.5 bg-white/50" />
              <div className="absolute top-2.5 left-0.5 right-1.5 h-0.5 bg-white/40" />
            </div>
          </div>
          {/* Monitor stand */}
          <div className="w-2 h-1 bg-eb-surface-4" />
          <div className="w-4 h-0.5 bg-eb-surface-4" />
          {/* Desk top */}
          <div className="w-12 h-1.5 bg-gradient-to-b from-[#7a4a20] to-[#5a3010]" />
          {/* Desk legs */}
          <div className="relative w-12 h-3 flex justify-between">
            <div className="w-1 h-full bg-[#3a1d08]" />
            <div className="w-1 h-full bg-[#3a1d08]" />
          </div>
        </div>

        {/* Chair (right side) */}
        <div className="absolute bottom-1 right-2 z-0 flex flex-col items-center">
          {/* Backrest */}
          <div className="w-3 h-3 bg-[#5a3018] border border-[#3a1d08] rounded-t-sm" />
          {/* Seat */}
          <div className="w-5 h-1.5 bg-[#6a3a1c] border border-[#3a1d08]" />
          {/* Legs */}
          <div className="relative w-5 h-2 flex justify-between">
            <div className="w-0.5 h-full bg-[#3a1d08]" />
            <div className="w-0.5 h-full bg-[#3a1d08]" />
          </div>
        </div>

        {/* Sprites overlay — placed in front of furniture */}
        <div className="relative z-10 flex flex-wrap gap-1 justify-center items-end pb-1">
          {children}
        </div>
      </div>

      {/* Floor planks */}
      <div className="h-1.5 relative" style={{ background: '#3a2818' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 8px, rgba(0,0,0,0.3) 8px, rgba(0,0,0,0.3) 9px)'
        }}/>
      </div>

      {/* Welcome-mat doormat with dept name (like the WELCOME carpet) */}
      <div
        className="relative px-2 py-1.5 text-center"
        style={{
          background: `linear-gradient(180deg, ${color} 0%, ${color}aa 100%)`,
          clipPath: 'polygon(4% 0, 96% 0, 100% 100%, 0% 100%)',
          marginTop: '-1px',
        }}
      >
        {/* Mat fringe (top) */}
        <div className="absolute top-0 left-0 right-0 h-0.5"
             style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.5) 0, rgba(0,0,0,0.5) 2px, transparent 2px, transparent 4px)' }} />
        <span className="font-pixel text-[0.42rem] tracking-[0.15em] text-black"
              style={{ textShadow: '1px 1px 0 rgba(255,255,255,0.4)' }}>
          {label}
        </span>
      </div>
    </div>
  );
}
