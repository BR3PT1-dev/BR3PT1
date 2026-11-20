import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { BarpaLogo3D } from './BarpaLogo3D';

interface BarpaRoamingChatbotProps {
  visible: boolean;
  rightReserved: number;
  bottomReserved: number;
  onOpenChat: () => void;
}

interface Point2D {
  x: number;
  y: number;
}

export const BarpaRoamingChatbot: React.FC<BarpaRoamingChatbotProps> = ({
  visible,
  rightReserved,
  bottomReserved,
  onOpenChat,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);
  const rightReservedRef = useRef(rightReserved);
  rightReservedRef.current = rightReserved;
  const bottomReservedRef = useRef(bottomReserved);
  bottomReservedRef.current = bottomReserved;

  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [bubbleOnLeft, setBubbleOnLeft] = useState(false);
  const bubbleOnLeftRef = useRef(false);

  useEffect(() => {
    if (!visible) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let elapsed = 0;
    let lastTime = performance.now();

    const computeWaypoints = (): Point2D[] => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const elWidth = wrapperRef.current?.offsetWidth || 228;
      const elHeight = wrapperRef.current?.offsetHeight || 66;
      const leftX = 20;
      const topY = 144; // Clears top-left rack info badge cleanly
      const maxRightX = Math.max(leftX, vw - rightReservedRef.current - elWidth - 16);
      const maxBottomY = Math.max(topY + 20, vh - bottomReservedRef.current - elHeight - 14);

      if (vw < 640) {
        const mobY = Math.max(120, vh - bottomReservedRef.current - elHeight - 12);
        const mobRightX = Math.max(leftX, vw - elWidth - 16);
        return [
          { x: mobRightX, y: mobY },
          { x: leftX, y: mobY },
        ];
      }

      // Perimeter patrol around the open viewport ("rondando pela app"):
      // Bottom-left -> Top-left -> Top-right (left of drawer) -> Bottom-right (left of drawer)
      return [
        { x: leftX, y: maxBottomY },
        { x: leftX, y: topY },
        { x: maxRightX, y: 74 },
        { x: maxRightX, y: maxBottomY },
      ];
    };

    // Glide-and-dwell interpolation: pauses 2.2s at each stop so users can effortlessly click, then glides 3.2s to the next
    const DWELL_SEC = 2.2;
    const MOVE_SEC = 3.2;
    const LEG_SEC = DWELL_SEC + MOVE_SEC;

    const sampleGlideAndDwell = (pts: Point2D[], timeSec: number): Point2D => {
      const count = pts.length;
      if (count <= 1) return pts[0] ?? { x: 20, y: 144 };
      const totalCycle = count * LEG_SEC;
      const cycleTime = ((timeSec % totalCycle) + totalCycle) % totalCycle;
      const legIdx = Math.floor(cycleTime / LEG_SEC);
      const legTime = cycleTime - legIdx * LEG_SEC;

      const from = pts[legIdx % count];
      const to = pts[(legIdx + 1) % count];
      if (legTime <= DWELL_SEC) {
        return from;
      }
      const frac = Math.min(1, (legTime - DWELL_SEC) / MOVE_SEC);
      const smooth = frac * frac * (3 - 2 * frac);
      return {
        x: from.x + (to.x - from.x) * smooth,
        y: from.y + (to.y - from.y) * smooth,
      };
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const pts = computeWaypoints();
      if (reduceMotion) {
        const home = pts[pts.length - 1] ?? { x: 20, y: 144 };
        if (wrapperRef.current) {
          wrapperRef.current.style.transform = `translate3d(${Math.round(home.x)}px, ${Math.round(home.y)}px, 0)`;
        }
        if (!bubbleOnLeftRef.current) {
          bubbleOnLeftRef.current = true;
          setBubbleOnLeft(true);
        }
        return;
      }

      if (!pausedRef.current) {
        elapsed += dt;
      }

      const pos = sampleGlideAndDwell(pts, elapsed);
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
      }

      // Orient the speech bubble inward relative to available horizontal workspace
      const availableWidth = Math.max(320, window.innerWidth - rightReservedRef.current);
      const elWidth = wrapperRef.current?.offsetWidth || 228;
      const centerX = pos.x + elWidth * 0.5;
      const shouldBeLeft = centerX > availableWidth * 0.52;
      if (shouldBeLeft !== bubbleOnLeftRef.current) {
        bubbleOnLeftRef.current = shouldBeLeft;
        setBubbleOnLeft(shouldBeLeft);
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={wrapperRef}
      data-testid="barpa-roaming-chatbot"
      onPointerEnter={() => {
        pausedRef.current = true;
      }}
      onPointerLeave={() => {
        pausedRef.current = false;
      }}
      onFocus={() => {
        pausedRef.current = true;
      }}
      onBlur={() => {
        pausedRef.current = false;
      }}
      style={{ transform: 'translate3d(20px, 600px, 0)' }}
      className="fixed left-0 top-0 z-40 will-change-transform select-none"
    >
      <div
        className={`flex items-center gap-2.5 ${
          bubbleOnLeft ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Roaming Animated 3D Orange 'b' Trigger */}
        <button
          type="button"
          onClick={onOpenChat}
          aria-label="Abrir chatbot Suporte barpa IA"
          className="group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#f26522]/55 bg-[#16191f]/95 shadow-[0_12px_32px_rgba(0,0,0,0.55)] transition-transform duration-200 hover:scale-105 hover:border-[#f26522] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f26522]"
        >
          <BarpaLogo3D size={56} />
        </button>

        {/* Speech Bubble: "Precisa de ajuda?" */}
        {!bubbleDismissed && (
          <div className="relative flex items-center gap-2 rounded-xl border border-[#343b4a] bg-[#16191f]/95 px-3.5 py-2 text-left shadow-[0_10px_28px_rgba(0,0,0,0.5)]">
            <button
              type="button"
              onClick={onOpenChat}
              className="flex flex-col text-left focus-visible:outline-none"
            >
              <span className="text-xs font-bold text-white whitespace-nowrap">
                Precisa de ajuda?
              </span>
              <span className="text-[10px] font-medium text-[#f26522] whitespace-nowrap">
                Suporte barpa IA
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setBubbleDismissed(true);
              }}
              aria-label="Ocultar balão de ajuda"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#8b93a5] transition-colors hover:bg-[#252a35] hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
