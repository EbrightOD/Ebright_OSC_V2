import { useCallback, useEffect, useRef, useState } from 'react';

const PROPS = [
  { id: 'none',    label: 'NONE',    icon: '🚫' },
  { id: 'stars',   label: 'STARS',   icon: '⭐' },
  { id: 'flowers', label: 'FLOWERS', icon: '🌸' },
];

const PHOTO_COUNT = 2;

/* eBright brand font — matches the existing Logo wordmark (Pixelify Sans, heavy weight). */
const BRAND_FONT = '"Pixelify Sans", monospace';

/* ---------- Canvas prop drawing (camera-space coords) ---------- */
function drawProp(ctx, propId, w, h) {
  if (propId === 'none') return;
  ctx.save();
  if (propId === 'stars')        drawStars(ctx, w, h);
  else if (propId === 'flowers') drawFlowerCrown(ctx, w, h);
  ctx.restore();
}

function drawStars(ctx, w, h) {
  const positions = [
    [0.10, 0.10], [0.28, 0.06], [0.50, 0.10], [0.72, 0.05], [0.90, 0.10],
    [0.05, 0.48], [0.95, 0.46],
    [0.12, 0.88], [0.32, 0.94], [0.55, 0.86], [0.78, 0.92], [0.90, 0.85],
  ];
  positions.forEach(([px, py], i) => {
    const size = (i % 3 === 0 ? h * 0.07 : h * 0.045);
    drawStar(ctx, w * px, h * py, size);
  });
}

function drawStar(ctx, cx, cy, size) {
  const spikes = 5;
  const outer = size * 0.5;
  const inner = size * 0.22;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#f5c518';
  ctx.fill();
  ctx.strokeStyle = '#cc8800';
  ctx.lineWidth = size * 0.06;
  ctx.stroke();
}

/* Flowers scattered around the frame (filter-style, same scatter as stars) */
function drawFlowerCrown(ctx, w, h) {
  const positions = [
    [0.10, 0.10], [0.28, 0.06], [0.50, 0.10], [0.72, 0.05], [0.90, 0.10],
    [0.05, 0.48], [0.95, 0.46],
    [0.12, 0.88], [0.32, 0.94], [0.55, 0.86], [0.78, 0.92], [0.90, 0.85],
  ];
  positions.forEach(([px, py], i) => {
    const size = (i % 3 === 0 ? h * 0.08 : h * 0.055);
    drawFlower(ctx, w * px, h * py, size);
  });
}

function drawFlower(ctx, cx, cy, size) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(a) * size * 0.5;
    const py = cy + Math.sin(a) * size * 0.5;
    ctx.beginPath();
    ctx.fillStyle = '#ff5e9c';
    ctx.arc(px, py, size * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f5c518';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------- Component ---------- */
export default function Photobooth({
  onCapture,
  instruction,
  day = 1,
  dayLabel,
}) {
  const computedDayLabel =
    dayLabel ||
    (day === 1
      ? 'Day 1 · New Employee Orientation'
      : day === 2
      ? 'Day 2 · Systems & Tools'
      : day === 3
      ? 'Day 3 · Wrap-up & Reflection'
      : `Day ${day}`);

  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const stripCanvasRef = useRef(null);
  const streamRef = useRef(null);

  const [now, setNow] = useState(new Date());
  const [selectedProp, setSelectedProp] = useState('none');
  const [photos, setPhotos] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [stripUrl, setStripUrl] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);
  const [delivered, setDelivered] = useState(false);
  const [deliverSecs, setDeliverSecs] = useState(0);
  const [pickedUp, setPickedUp] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  /* Clock */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* Camera */
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 }, aspectRatio: 4 / 3 },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch((err) => setCameraError(err?.message || 'Camera access denied'));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  /* Live overlay redraw on prop change */
  useEffect(() => {
    const c = overlayCanvasRef.current;
    if (!c) return;
    const W = 800;
    const H = 600;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    drawProp(ctx, selectedProp, W, H);
  }, [selectedProp]);

  /* Capture one frame */
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const w = video.videoWidth;
    const h = video.videoHeight;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();
    drawProp(ctx, selectedProp, w, h);
    return c.toDataURL('image/jpeg', 0.92);
  }, [selectedProp]);

  const startCapture = async () => {
    if (capturing || photos.length >= PHOTO_COUNT || cameraError) return;
    setCapturing(true);
    setPhotos([]);
    setStripUrl(null);
    setDelivered(false);
    setPickedUp(false);

    const takeOne = async () => {
      for (let i = 3; i >= 1; i--) {
        setCountdown(i);
        await new Promise((r) => setTimeout(r, 800));
      }
      setCountdown(0);
      setFlashing(true);
      const shot = captureFrame();
      setTimeout(() => setFlashing(false), 220);
      return shot;
    };

    const taken = [];
    for (let n = 0; n < PHOTO_COUNT; n++) {
      const shot = await takeOne();
      taken.push(shot);
      setPhotos([...taken]);
      if (n < PHOTO_COUNT - 1) await new Promise((r) => setTimeout(r, 700));
    }
    setCapturing(false);
    await buildStrip(taken);
  };

  /* ---- Landscape strip composition ----
   * Layout:
   *   ┌─────────────────────────────────────────┐
   *   │  RED HEADER (ebright · date)            │
   *   ├──────────────────┬──────────────────────┤
   *   │   PHOTO 1 (4:3)  │   PHOTO 2 (4:3)      │
   *   ├──────────────────┴──────────────────────┤
   *   │  DARK BAND  (Induction Training · Day X)│
   *   ├─────────────────────────────────────────┤
   *   │  RED FOOTER (thank you!)                │
   *   └─────────────────────────────────────────┘
   */
  const buildStrip = async (photoList) => {
    try { await document.fonts.load('900 80px "Pixelify Sans"'); } catch (_) {}
    try { await document.fonts.load('600 26px "Pixelify Sans"'); } catch (_) {}
    try { await document.fonts.load('bold 34px "Pixelify Sans"'); } catch (_) {}

    const photoW = 800;
    const photoH = 600;
    const W = photoW * 2;          // 1600 — landscape width
    const headerH = 150;
    const footerH = 100;
    const H = headerH + photoH + footerH; // 850

    const canvas = stripCanvasRef.current || document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // --- Almond header (only the wordmark stays red) ---
    ctx.fillStyle = '#ECE3BD';
    ctx.fillRect(0, 0, W, headerH);
    ctx.textBaseline = 'middle';
    // Ebright wordmark — left, RED
    ctx.fillStyle = '#CB1B03';
    ctx.textAlign = 'left';
    ctx.font = `900 88px ${BRAND_FONT}`;
    ctx.fillText('Ebright', 40, headerH / 2);
    // date + time stamp — right, stacked, dark plum on almond
    ctx.fillStyle = '#1A0B1F';
    ctx.textAlign = 'right';
    const stampedAt = new Date();
    const dateStr = stampedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = stampedAt.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
    ctx.font = `600 28px ${BRAND_FONT}`;
    ctx.fillText(dateStr, W - 40, headerH / 2 - 18);
    ctx.font = `600 24px ${BRAND_FONT}`;
    ctx.fillText(timeStr, W - 40, headerH / 2 + 20);

    // --- Photos side by side ---
    const photoY = headerH;
    for (let i = 0; i < 2; i++) {
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, i * photoW, photoY, photoW, photoH);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = photoList[i];
      });
    }
    // Thin white divider between photos
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(photoW - 4, photoY, 8, photoH);

    // --- Red footer ---
    const footerY = photoY + photoH;
    ctx.fillStyle = '#ECE3BD';  /* almond footer (only header logo stays red) */
    ctx.fillRect(0, footerY, W, footerH);
    ctx.fillStyle = '#1A0B1F';  /* dark plum text on almond */
    ctx.textAlign = 'center';
    ctx.font = `bold 40px ${BRAND_FONT}`;
    ctx.fillText('eBright Induction Training', W / 2, footerY + footerH / 2);

    const stripData = canvas.toDataURL('image/jpeg', 0.95);
    setStripUrl(stripData);
    startPrinting(stripData);
  };

  const startPrinting = (stripData) => {
    setPrinting(true);
    setPrintProgress(0);
    setDelivered(false);
    const start = Date.now();
    let pct = 0;
    const tick = setInterval(() => {
      pct += 4;
      if (pct >= 100) {
        clearInterval(tick);
        setPrintProgress(100);
        setTimeout(() => {
          setPrinting(false);
          setDelivered(true);
          setDeliverSecs(Math.max(1, Math.round((Date.now() - start) / 1000)));
          onCapture?.(stripData);
        }, 500);
      } else {
        setPrintProgress(pct);
      }
    }, 160);
  };

  const handlePickup = () => {
    if (!stripUrl) return;
    const a = document.createElement('a');
    a.href = stripUrl;
    a.download = 'ebright_induction_strip.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setPickedUp(true);
  };

  const retake = () => {
    setPhotos([]);
    setStripUrl(null);
    setPrinting(false);
    setPrintProgress(0);
    setDelivered(false);
    setPickedUp(false);
  };

  const clockStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Kiosk header */}
      <div
        className="rounded-t-2xl px-5 py-2.5 border-b-4"
        style={{ background: '#ECE3BD', borderColor: '#C7B98A' }}
      >
        <span
          className="text-2xl md:text-3xl leading-none font-black tracking-tight"
          style={{ fontFamily: BRAND_FONT, color: '#CB1B03' }}
        >
          Ebright
        </span>
      </div>

      <div
        className="bg-[#111] border-x-4 border-b-4 rounded-b-2xl grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-5 p-5"
        style={{ borderColor: '#C7B98A' }}
      >
        {/* LEFT — Camera + props BELOW it */}
        <div className="flex flex-col gap-3 items-center">
          {instruction && (
            <p className="text-eb-yellow font-pixel text-[0.55rem] md:text-[0.65rem] tracking-widest text-center">
              📸 {instruction}
            </p>
          )}

          <div
            className="relative bg-black border-4 rounded-lg overflow-hidden shadow-[0_0_22px_rgba(236,227,189,0.45)] w-full max-w-[360px]"
            style={{ borderColor: '#ECE3BD', aspectRatio: '4 / 3' }}
          >
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 gap-2">
                <span className="text-4xl">📷</span>
                <p className="text-eb-red-bright font-pixel text-[0.6rem] tracking-widest">CAMERA UNAVAILABLE</p>
                <p className="text-white/55 text-xs">{cameraError}</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  playsInline
                  muted
                />
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
                <span className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-eb-yellow/80" />
                <span className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-eb-yellow/80" />
                <span className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-eb-yellow/80" />
                <span className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-eb-yellow/80" />

                {countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span
                      key={countdown}
                      className="text-white text-[8rem] md:text-[10rem] leading-none font-black star-pop"
                      style={{ textShadow: '0 6px 0 rgba(204,0,0,0.7)' }}
                    >
                      {countdown}
                    </span>
                  </div>
                )}
                {flashing && <div className="absolute inset-0 bg-white opacity-80" />}

                {photos.length < PHOTO_COUNT && !capturing && (
                  <button
                    type="button"
                    onClick={startCapture}
                    disabled={!!cameraError}
                    aria-label="Start capture"
                    title="Start capture"
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 w-14 h-14 md:w-16 md:h-16 rounded-full border-4 disabled:opacity-50 hover:scale-110 active:scale-95 transition shadow-[0_4px_14px_rgba(0,0,0,0.55)] flex items-center justify-center group"
                    style={{ background: '#ECE3BD', borderColor: '#C7B98A' }}
                  >
                    <span
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 group-hover:brightness-110 transition"
                      style={{ background: '#CB1B03', borderColor: '#ECE3BD' }}
                    />
                  </button>
                )}
                {photos.length < PHOTO_COUNT && capturing && countdown === 0 && (
                  <div
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 w-14 h-14 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center"
                    style={{ background: 'rgba(236, 227, 189, 0.6)', borderColor: '#C7B98A' }}
                  >
                    <span
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full animate-pulse"
                      style={{ background: 'rgba(203, 27, 3, 0.7)' }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Photo dots */}
          <div className="flex justify-center items-center gap-3">
            {Array.from({ length: PHOTO_COUNT }).map((_, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full border-eb-border-1 transition ${
                  photos[i]
                    ? 'bg-eb-yellow border-eb-yellow shadow-[0_0_10px_rgba(245,197,24,0.7)]'
                    : 'border-white/40 bg-transparent'
                }`}
              />
            ))}
            <span className="font-pixel text-[0.45rem] text-white/55 ml-1 tracking-widest">
              {photos.length}/{PHOTO_COUNT}
            </span>
          </div>

          {photos.length >= PHOTO_COUNT && (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={retake}
                className="px-3 py-1 bg-eb-surface-4 hover:bg-eb-surface-4 text-white/80 hover:text-white border-eb-border-1 border-eb-border-3 hover:border-eb-yellow rounded font-bold text-[0.6rem]"
              >
                🔄 RETAKE
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — Strip + dispenser */}
        <div className="flex flex-col items-center gap-3">
          <p className="font-pixel text-[0.5rem] text-eb-yellow tracking-widest">▸ PHOTO STRIP</p>

          {/* Landscape strip preview */}
          <div
            className="relative w-full max-w-[380px] bg-white border-eb-border-1 border-eb-border-1 rounded-md overflow-hidden shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
            style={{ aspectRatio: '1600 / 850' }}
          >
            {stripUrl ? (
              <img
                src={stripUrl}
                alt="Strip"
                className={`w-full h-full object-contain bg-white ${delivered ? 'fade-up' : ''}`}
              />
            ) : (
              <StripTemplate dateStr={dateStr} timeStr={clockStr} />
            )}
          </div>

          {/* Dispenser slot */}
          <div className="w-full max-w-[380px]">
            <div className="h-2.5 bg-black border-eb-border-1 border-eb-border-3 rounded-sm shadow-inner relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 right-0 bg-gradient-to-b from-eb-red/50 to-transparent transition-opacity"
                style={{ opacity: printing ? 1 : 0 }}
              />
            </div>
            <p className="font-pixel text-[0.4rem] text-white/45 tracking-widest text-center mt-1">▸ DISPENSE SLOT</p>
          </div>

          {delivered && stripUrl && !pickedUp && (
            <div className="flex flex-col gap-2 fade-up items-center">
              <p className="font-pixel text-[0.5rem] text-center tracking-widest" style={{ color: 'var(--soft-lavender)' }}>
                ✓ DELIVERED IN {deliverSecs} SEC
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={handlePickup}
                  className="btn-pixel btn-pixel-yellow font-body text-xs py-2 px-5"
                >
                  🖨 PRINT
                </button>
                <button
                  onClick={() => setPickedUp(true)}
                  className="btn-pixel font-body text-xs py-2 px-5"
                >
                  ✓ DONE
                </button>
              </div>
            </div>
          )}
          {pickedUp && (
            <div
              className="font-pixel text-[0.55rem] tracking-widest px-4 py-3 rounded text-center w-full max-w-[380px] fade-up"
              style={{
                background: 'rgba(45, 184, 88, 0.18)',
                border: '2px solid var(--green)',
                color: 'var(--green)',
              }}
            >
              ✅ ATTENDANCE MARKED — WELCOME TO EBRIGHT!
            </div>
          )}

          {/* PROPS — under the strip */}
          <div className="w-full max-w-[380px]">
            <p className="font-pixel text-[0.45rem] text-eb-yellow mb-1.5 tracking-widest">▸ PROPS</p>
            <div className="grid grid-cols-3 gap-2">
              {PROPS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProp(p.id)}
                  disabled={capturing}
                  className={`py-1 px-0.5 rounded border-eb-border-1 flex flex-col items-center transition ${
                    selectedProp === p.id
                      ? 'border-eb-yellow bg-eb-yellow/15 shadow-[0_0_8px_rgba(245,197,24,0.4)]'
                      : 'border-[#2a2a2a] hover:border-eb-red'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={p.label}
                >
                  <span className="text-sm leading-none">{p.icon}</span>
                  <span className="font-pixel text-[0.28rem] text-white/65 leading-none mt-0.5">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <canvas ref={stripCanvasRef} className="hidden" />

      {printing && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-6 max-w-md w-full text-center"
            style={{
              background: 'var(--parchment)',
              border: '2px solid var(--plum)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}
          >
            <p className="font-pixel text-[0.7rem] md:text-[0.8rem] tracking-widest mb-4"
               style={{ color: 'var(--plum)' }}>
              ▸ YOUR STRIP IS PRINTING…
            </p>
            <div
              className="h-3 rounded-full overflow-hidden mb-2"
              style={{ background: 'rgba(55, 25, 49, 0.15)', border: '1px solid var(--plum)' }}
            >
              <div
                className="h-full transition-all duration-150"
                style={{ width: `${printProgress}%`, background: 'var(--plum)' }}
              />
            </div>
            <p className="font-pixel text-[0.5rem] tracking-widest" style={{ color: 'var(--plum)' }}>
              {printProgress}%
            </p>
            <p className="text-xs mt-3 font-semibold" style={{ color: 'var(--ink-soft)' }}>
              Hold tight — your Ebright strip is on its way!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* Landscape strip template — shown before photos are captured */
function StripTemplate({ dateStr, timeStr }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Almond header (only the "Ebright" wordmark stays red) */}
      <div
        className="flex items-center justify-between px-2 py-1.5"
        style={{ background: '#ECE3BD', color: '#1A0B1F' }}
      >
        <span
          className="font-black text-base leading-none tracking-tight"
          style={{ fontFamily: BRAND_FONT, color: '#CB1B03' }}
        >
          Ebright
        </span>
        <div className="text-right leading-tight" style={{ fontFamily: BRAND_FONT, color: '#1A0B1F' }}>
          <div className="text-[0.45rem] font-semibold">{dateStr}</div>
          <div className="text-[0.4rem] font-semibold opacity-80">{timeStr}</div>
        </div>
      </div>
      {/* Two photo slots side by side */}
      <div className="flex-1 flex">
        <div className="flex-1 bg-black/10 flex items-center justify-center text-black/30 text-[0.5rem] font-semibold tracking-widest border-r border-black/15">
          PHOTO 1
        </div>
        <div className="flex-1 bg-black/10 flex items-center justify-center text-black/30 text-[0.5rem] font-semibold tracking-widest">
          PHOTO 2
        </div>
      </div>
      {/* Almond footer (logo header stays red, footer matches kiosk theme) */}
      <div
        className="text-center py-2 px-1"
        style={{ background: '#ECE3BD', color: '#1A0B1F', fontFamily: BRAND_FONT }}
      >
        <div className="font-bold text-xs leading-tight">eBright Induction Training</div>
      </div>
    </div>
  );
}
