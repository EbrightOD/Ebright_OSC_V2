import { useEffect, useState } from 'react';
import TutorKnight from './TutorKnight';

const TYPE_SPEED_MS = 28; // ms per character

export default function Mascot({ message, dismissible = true }) {
  const [open, setOpen] = useState(!!message);
  const [typedText, setTypedText] = useState('');

  // Auto-open the bubble whenever the page (i.e. the message) changes.
  useEffect(() => {
    setOpen(!!message);
  }, [message]);

  // Letter-by-letter reveal whenever the bubble opens with a message
  useEffect(() => {
    if (!open || !message) {
      setTypedText('');
      return;
    }
    setTypedText('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTypedText(message.slice(0, i));
      if (i >= message.length) clearInterval(id);
    }, TYPE_SPEED_MS);
    return () => clearInterval(id);
  }, [open, message]);

  const skipType = () => {
    if (message) setTypedText(message);
  };

  const isStillTyping = open && message && typedText.length < message.length;

  return (
    <div className="fixed bottom-2 right-4 z-[120] flex items-end gap-2 pointer-events-none">
      {message && open && (
        <div
          className="relative pointer-events-auto max-w-[260px] md:max-w-sm bg-[#fffce8] text-[#1a1208] border-[3px] border-[#1a1208] rounded-xl px-3 py-2.5 mb-3 shadow-[0_4px_0_#1a1208] fade-up cursor-pointer"
          onClick={skipType}
          title={isStillTyping ? 'Tap to skip' : ''}
        >
          <p className="font-bold text-xs md:text-sm leading-snug min-h-[1.2em]">
            {typedText}
            {isStillTyping && <span className="inline-block w-[6px] h-[1em] align-[-2px] bg-[#1a1208] ml-0.5 animate-pulse" />}
          </p>
          {dismissible && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              aria-label="Dismiss"
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#1a1208] text-white text-[0.65rem] font-black flex items-center justify-center border-eb-border-1 border-[#fffce8]"
            >
              ×
            </button>
          )}
          {/* Tail pointing to mascot */}
          <div className="absolute -bottom-3 right-6 w-0 h-0"
               style={{
                 borderLeft: '8px solid transparent',
                 borderRight: '8px solid transparent',
                 borderTop: '12px solid #1a1208',
               }} />
          <div className="absolute -bottom-1.5 right-7 w-0 h-0"
               style={{
                 borderLeft: '6px solid transparent',
                 borderRight: '6px solid transparent',
                 borderTop: '9px solid #fffce8',
               }} />
        </div>
      )}
      <div className="w-16 h-20 bob-slow cursor-pointer pointer-events-auto" onClick={() => setOpen((o) => !o)}>
        <TutorKnight className="w-full h-full" />
      </div>
    </div>
  );
}
