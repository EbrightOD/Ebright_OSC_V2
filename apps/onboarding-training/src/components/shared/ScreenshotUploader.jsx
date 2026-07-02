import { useRef } from 'react';

export default function ScreenshotUploader({
  label = 'SCREENSHOT (REQUIRED)',
  hint = 'PNG / JPG from your device',
  value,
  onChange,
  capture = false,
  accent = 'red',
}) {
  const inputRef = useRef(null);
  const isCamera = capture === 'environment' || capture === 'user' || capture === true;
  const accentBorder =
    accent === 'red' ? 'border-eb-red/40' :
    accent === 'green' ? 'border-eb-green/40' :
    accent === 'yellow' ? 'border-eb-yellow/40' :
    'border-eb-border-3';
  const accentLabel =
    accent === 'red' ? 'text-eb-red-bright' :
    accent === 'green' ? 'text-eb-green' :
    accent === 'yellow' ? 'text-eb-yellow' :
    'text-white/70';

  const handlePick = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange?.(reader.result);
    reader.onerror = () => {
      // eslint-disable-next-line no-console
      console.error('Could not read screenshot file', reader.error);
      onChange?.(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`bg-eb-surface-0 border-eb-border-1 rounded-lg p-3 ${accentBorder}`}>
      <p className={`font-pixel text-[0.55rem] mb-2 ${accentLabel}`}>📸 {label}</p>
      {value ? (
        <div className="flex flex-col gap-2">
          <img src={value} alt="Submitted" className="w-full max-h-64 object-contain bg-black rounded border-eb-border-1 border-eb-green/40" />
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[0.5rem] text-eb-green flex-1">✓ SUBMITTED</span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-2 py-1 bg-eb-surface-3 border border-eb-border-3 hover:border-eb-yellow text-white/70 hover:text-white text-[0.65rem] font-bold rounded"
            >
              🔄 Replace
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full py-5 px-3 bg-eb-surface-0 border-[2px] border-dashed border-[#444] hover:border-eb-yellow rounded flex flex-col items-center gap-1 text-white/60 hover:text-white transition"
        >
          <span className="text-3xl">{isCamera ? '📷' : '📤'}</span>
          <span className="text-xs font-bold">{isCamera ? 'Tap to take a photo' : 'Tap to upload screenshot'}</span>
          <span className="text-[0.6rem] text-white/40 font-semibold">{hint}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        {...(capture ? { capture: capture === true ? 'environment' : capture } : {})}
        className="hidden"
        onChange={(e) => handlePick(e.target.files?.[0])}
      />
    </div>
  );
}
