import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link
      to="/"
      aria-label="Ebright home"
      className="fixed top-3 left-4 z-[210] flex items-center gap-2 font-extrabold text-xl text-eb-chalk select-none transition-transform duration-150 hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(230,51,41,0.6)]"
    >
      <div
        className="w-[30px] h-[30px] bg-eb-ebright-red flex items-center justify-center text-[0.75rem] font-black text-eb-chalk"
        style={{ clipPath: 'polygon(0 0,85% 0,100% 15%,100% 100%,15% 100%,0 85%)' }}
      >
        Eb
      </div>
      <span>Ebright</span>
    </Link>
  );
}
