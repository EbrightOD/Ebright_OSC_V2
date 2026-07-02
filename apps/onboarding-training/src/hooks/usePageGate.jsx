import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Page gate — pages that require an activity to be completed before
 * the user can advance call `useLockGate(done)` with their `done` boolean.
 * The BottomNav next button reads `unlocked` and is disabled until true.
 *
 * Unlock is *persistent*: once a page reaches its done=true state, the path
 * is remembered in localStorage and the gate stays unlocked on every future
 * visit to that page during this browser.
 */
const STORAGE_KEY = 'eb_unlocked_v1';

function readUnlockedSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch (_) {
    return new Set();
  }
}

function writeUnlockedSet(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch (_) { /* quota / private mode */ }
}

const PageGateContext = createContext({
  unlocked: true,
  lockReason: null,
  nextHandler: null,
  prevHandler: null,
  permanentlyUnlocked: new Set(),
  markPermanentlyUnlocked: () => {},
  setUnlocked: () => {},
  setLockReason: () => {},
  setNextHandler: () => {},
  setPrevHandler: () => {},
});

export function PageGateProvider({ children }) {
  const [unlocked, setUnlocked] = useState(true);
  const [lockReason, setLockReason] = useState(null);
  const [nextHandler, setNextHandler] = useState(null);
  const [prevHandler, setPrevHandler] = useState(null);
  const [permanentlyUnlocked, setPermanentlyUnlocked] = useState(readUnlockedSet);
  const { pathname } = useLocation();

  // On every route change, reset to unlocked. Pages with a real activity
  // call useLockGate(done) on mount which will re-lock them if `done` is
  // false AND the path hasn't been previously completed. Informational
  // pages never call useLockGate and so stay unlocked, as intended.
  useEffect(() => {
    setUnlocked(true);
    setLockReason(null);
    setNextHandler(null);
    setPrevHandler(null);
  }, [pathname]);

  const markPermanentlyUnlocked = useCallback((path) => {
    setPermanentlyUnlocked((prev) => {
      if (prev.has(path)) return prev;
      const next = new Set(prev);
      next.add(path);
      writeUnlockedSet(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      unlocked, lockReason, nextHandler, prevHandler,
      permanentlyUnlocked, markPermanentlyUnlocked,
      setUnlocked, setLockReason, setNextHandler, setPrevHandler,
    }),
    [unlocked, lockReason, nextHandler, prevHandler, permanentlyUnlocked, markPermanentlyUnlocked]
  );
  return <PageGateContext.Provider value={value}>{children}</PageGateContext.Provider>;
}

export function usePageGate() {
  return useContext(PageGateContext);
}

/**
 * Convenience hook for pages that have a single done flag.
 *   useLockGate(allScreenshotsDone, 'Upload all 6 screenshots to continue');
 *
 * When done flips to true, the current path is recorded as permanently
 * unlocked and the user will never see this page locked again.
 */
export function useLockGate(done, reason) {
  const { setUnlocked, setLockReason, permanentlyUnlocked, markPermanentlyUnlocked } = useContext(PageGateContext);
  const { pathname } = useLocation();
  const wasPermanent = useRef(permanentlyUnlocked.has(pathname));

  useEffect(() => {
    wasPermanent.current = permanentlyUnlocked.has(pathname);
  }, [permanentlyUnlocked, pathname]);

  useEffect(() => {
    const effective = !!done || wasPermanent.current;
    setUnlocked(effective);
    setLockReason(effective ? null : (reason || null));
    if (done) markPermanentlyUnlocked(pathname);
  }, [done, reason, pathname, setUnlocked, setLockReason, markPermanentlyUnlocked]);
}

/**
 * Install a custom next/prev handler for the current page. While installed,
 * the BottomNav's next/prev buttons call these instead of routing. Pass
 * `null` (or omit the hook) to fall back to default route navigation.
 */
export function useNavOverride({ onNext, onPrev } = {}) {
  const { setNextHandler, setPrevHandler } = useContext(PageGateContext);
  useEffect(() => {
    setNextHandler(() => onNext || null);
    setPrevHandler(() => onPrev || null);
    return () => {
      setNextHandler(null);
      setPrevHandler(null);
    };
  }, [onNext, onPrev, setNextHandler, setPrevHandler]);
}
