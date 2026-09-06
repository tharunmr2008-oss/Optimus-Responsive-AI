import { useEffect, useRef, useState } from 'react';

/**
 * Premium AI "Splash Cursor" for OPTIMUS PRIME.
 *
 * Engineered with high-performance direct DOM manipulation (zero React re-renders on mousemove):
 * 1. Core Glowing Cursor (Tiny bright central dot + translucent ring)
 * 2. Liquid Magnetic Follow (Fluid organic secondary spotlight with spring physics)
 * 3. Click Splash Effect (Concentric expanding energy ripples + soft particle burst + flash)
 * 4. Magnetic Button Attraction (Gentle optical pull toward button center)
 * 5. Special AI Resonance (Energetic dual-tone reticle for AI elements)
 * 6. Disappearing Motion Trail (Lightweight decaying points visible during swift motion)
 * 7. Mobile & Reduced-Motion Safe (Gracefully disabled on touch devices)
 */
export function CustomCursor() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const ringReticleRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const splashContainerRef = useRef<HTMLDivElement | null>(null);

  // Recycled trail dot DOM refs
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // 1. Touch device check (Coarse pointer)
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    if (isCoarse) {
      setIsTouchDevice(true);
      return;
    }

    // 2. Reduced motion check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(prefersReducedMotion);

    document.body.classList.add('custom-cursor-active');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let prevMouseX = mouseX;
    let prevMouseY = mouseY;
    let currentSpeed = 0;

    // Spring physics coordinates for the secondary spotlight
    let glowX = mouseX;
    let glowY = mouseY;
    let glowVx = 0;
    let glowVy = 0;

    // Reticle coordinates with smooth lerp
    let ringX = mouseX;
    let ringY = mouseY;

    // Magnetic button pull offset
    let magneticOffsetX = 0;
    let magneticOffsetY = 0;

    // Interaction states stored in refs to avoid React re-renders
    let isHovering = false;
    let isButton = false;
    let isCard = false;
    let isAIElement = false;
    let isMouseDown = false;
    let isInsideWindow = false;

    // Circular trail history buffer (5 points)
    const trailPositions = Array.from({ length: 5 }, () => ({ x: mouseX, y: mouseY, opacity: 0 }));

    let animationFrameId: number;
    let splashCounter = 0;

    // Mouse Move Handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isInsideWindow) {
        isInsideWindow = true;
        if (containerRef.current) containerRef.current.style.opacity = '1';
      }

      // Check hovered element hierarchy
      const target = e.target as HTMLElement | null;
      if (target) {
        // Special AI element check
        const aiEl = target.closest(
          '[data-ai-element="true"], #hero-enter-experience-btn, #hero-title, #ai-conversation, #emotion-camera, #current-emotion-card, #chat-send-btn'
        );
        isAIElement = Boolean(aiEl);

        // Clickable interactive element check
        const interactiveEl = target.closest(
          'button, a, input, textarea, select, [role="button"], .btn-interactive, .interactive-element'
        );
        isHovering = Boolean(interactiveEl);

        // Button check for magnetic pull
        const btnEl = target.closest('button, [role="button"], .btn-interactive') as HTMLElement | null;
        isButton = Boolean(btnEl);

        if (btnEl) {
          const rect = btnEl.getBoundingClientRect();
          const btnCenterX = rect.left + rect.width / 2;
          const btnCenterY = rect.top + rect.height / 2;
          // Calculate subtle magnetic pull vector (max 10px offset)
          const pullFactor = 0.2;
          const rawDx = (btnCenterX - mouseX) * pullFactor;
          const rawDy = (btnCenterY - mouseY) * pullFactor;
          magneticOffsetX = Math.max(-10, Math.min(10, rawDx));
          magneticOffsetY = Math.max(-10, Math.min(10, rawDy));
        } else {
          magneticOffsetX = 0;
          magneticOffsetY = 0;
        }

        // Card element check
        const cardEl = target.closest('.glass-panel, .glass-panel-glow, [data-card="true"]');
        isCard = Boolean(cardEl) && !isHovering && !isAIElement;
      }
    };

    // Mouse Down (Click Splash Trigger)
    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX - 3}px, ${mouseY - 3}px, 0) scale(0.6)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX - 22}px, ${ringY - 22}px, 0) scale(0.85)`;
      }

      // Trigger Click Splash Animation
      createClickSplash(e.clientX, e.clientY, isAIElement);
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX - 3}px, ${mouseY - 3}px, 0) scale(1)`;
      }
    };

    const handleMouseLeave = () => {
      isInsideWindow = false;
      if (containerRef.current) containerRef.current.style.opacity = '0';
    };

    const handleMouseEnter = () => {
      isInsideWindow = true;
      if (containerRef.current) containerRef.current.style.opacity = '1';
    };

    // Create Click Splash Effect (Ripples + Particle Burst + Center Flash)
    const createClickSplash = (cx: number, cy: number, isAI: boolean) => {
      if (prefersReducedMotion || !splashContainerRef.current) return;

      const splashId = ++splashCounter;
      const splashNode = document.createElement('div');
      splashNode.className = 'absolute pointer-events-none';
      splashNode.style.left = `${cx}px`;
      splashNode.style.top = `${cy}px`;
      splashNode.style.zIndex = '9999';

      const ringColor1 = isAI ? 'rgba(56, 189, 248, 0.7)' : 'rgba(168, 85, 247, 0.7)';
      const ringColor2 = isAI ? 'rgba(129, 140, 248, 0.5)' : 'rgba(99, 102, 241, 0.5)';
      const shockwaveColor = isAI ? 'rgba(56, 189, 248, 0.35)' : 'rgba(139, 92, 246, 0.35)';

      // 1. Center Radiant Flash
      const flash = document.createElement('div');
      flash.className = 'absolute rounded-full pointer-events-none';
      flash.style.width = '36px';
      flash.style.height = '36px';
      flash.style.background = isAI
        ? 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(56,189,248,0.7) 40%, transparent 70%)'
        : 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(165,180,252,0.6) 40%, transparent 70%)';
      flash.style.animation = 'splash-flash 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      splashNode.appendChild(flash);

      // 2. Expanding Ring 1 (Fast, crisp)
      const ring1 = document.createElement('div');
      ring1.className = 'absolute rounded-full border pointer-events-none';
      ring1.style.width = '96px';
      ring1.style.height = '96px';
      ring1.style.borderColor = ringColor1;
      ring1.style.borderWidth = '1.5px';
      ring1.style.boxShadow = isAI ? '0 0 15px rgba(56,189,248,0.4)' : '0 0 15px rgba(168,85,247,0.4)';
      ring1.style.animation = 'splash-ripple-fast 0.45s cubic-bezier(0.1, 0.8, 0.2, 1) forwards';
      splashNode.appendChild(ring1);

      // 3. Expanding Ring 2 (Broader, softer)
      const ring2 = document.createElement('div');
      ring2.className = 'absolute rounded-full border pointer-events-none';
      ring2.style.width = '140px';
      ring2.style.height = '140px';
      ring2.style.borderColor = ringColor2;
      ring2.style.borderWidth = '1px';
      ring2.style.animation = 'splash-ripple-outer 0.55s cubic-bezier(0.12, 0.8, 0.2, 1) 0.04s forwards';
      splashNode.appendChild(ring2);

      // 4. Expanding Ring 3 (Outer subtle shockwave)
      const ring3 = document.createElement('div');
      ring3.className = 'absolute rounded-full border pointer-events-none';
      ring3.style.width = '180px';
      ring3.style.height = '180px';
      ring3.style.borderColor = shockwaveColor;
      ring3.style.borderWidth = '1px';
      ring3.style.animation = 'splash-ripple-shockwave 0.65s cubic-bezier(0.15, 0.85, 0.25, 1) 0.08s forwards';
      splashNode.appendChild(ring3);

      // 5. Burst of Soft Particles (6-8 radial sparks)
      const particleCount = isAI ? 8 : 6;
      const particleColors = isAI
        ? ['#38bdf8', '#818cf8', '#c084fc', '#ffffff']
        : ['#c084fc', '#818cf8', '#a5b4fc', '#ffffff'];

      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'absolute rounded-full pointer-events-none';

        // Calculate radial direction with organic jitter
        const baseAngle = (i / particleCount) * Math.PI * 2;
        const angle = baseAngle + (Math.random() - 0.5) * 0.4;
        const distance = (isAI ? 38 : 30) + Math.random() * 24;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const size = 3 + Math.random() * 2.5;
        const color = particleColors[i % particleColors.length];

        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.backgroundColor = color;
        p.style.boxShadow = `0 0 6px ${color}`;
        p.style.setProperty('--tx', `${tx}px`);
        p.style.setProperty('--ty', `${ty}px`);
        p.style.animation = `splash-particle-fly 0.48s cubic-bezier(0.12, 0.8, 0.25, 1) forwards`;

        splashNode.appendChild(p);
      }

      splashContainerRef.current.appendChild(splashNode);

      // Clean up DOM node after animation finishes (680ms)
      setTimeout(() => {
        if (splashNode.parentNode) {
          splashNode.parentNode.removeChild(splashNode);
        }
      }, 700);
    };

    // Attach native event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Main 60/120fps Animation Loop with Spring Damping and Interpolation
    const animate = () => {
      // 1. Calculate instant mouse speed
      const dx = mouseX - prevMouseX;
      const dy = mouseY - prevMouseY;
      const instantSpeed = Math.hypot(dx, dy);
      currentSpeed += (instantSpeed - currentSpeed) * 0.25;
      prevMouseX = mouseX;
      prevMouseY = mouseY;

      // 2. Liquid Magnetic Glow Physics (Spring-damped secondary follow)
      const glowStiffness = 0.08;
      const glowDamping = 0.76;
      glowVx += (mouseX - glowX) * glowStiffness;
      glowVy += (mouseY - glowY) * glowStiffness;
      glowVx *= glowDamping;
      glowVy *= glowDamping;
      glowX += glowVx;
      glowY += glowVy;

      // 3. Ring Reticle Physics (Crisp responsive lerp with magnetic pull)
      const targetRingX = mouseX + magneticOffsetX;
      const targetRingY = mouseY + magneticOffsetY;
      const ringLerp = isHovering ? 0.28 : 0.22;
      ringX += (targetRingX - ringX) * ringLerp;
      ringY += (targetRingY - ringY) * ringLerp;

      // 4. Update Core Dot Position
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX - 3}px, ${mouseY - 3}px, 0)${
          isMouseDown ? ' scale(0.6)' : isHovering ? ' scale(1.25)' : ' scale(1)'
        }`;
      }

      // 5. Update Reticle Ring Position and Dimensions
      if (ringRef.current) {
        // Base ring diameter calculation
        let ringRadius = 16; // 32px diameter
        let ringBorder = 'rgba(165, 180, 252, 0.45)';
        let ringBg = 'rgba(99, 102, 241, 0.04)';
        let ringShadow = 'none';

        if (isAIElement) {
          ringRadius = 26; // 52px diameter
          ringBorder = 'rgba(56, 189, 248, 0.75)';
          ringBg = 'rgba(56, 189, 248, 0.1)';
          ringShadow = '0 0 20px rgba(56, 189, 248, 0.35), inset 0 0 10px rgba(168, 85, 247, 0.25)';
        } else if (isButton) {
          ringRadius = 22; // 44px diameter
          ringBorder = 'rgba(192, 132, 252, 0.7)';
          ringBg = 'rgba(168, 85, 247, 0.12)';
          ringShadow = '0 0 16px rgba(168, 85, 247, 0.3)';
        } else if (isHovering) {
          ringRadius = 20; // 40px diameter
          ringBorder = 'rgba(129, 140, 248, 0.65)';
          ringBg = 'rgba(99, 102, 241, 0.08)';
          ringShadow = '0 0 12px rgba(99, 102, 241, 0.25)';
        } else if (isCard) {
          ringRadius = 18; // 36px diameter
          ringBorder = 'rgba(165, 180, 252, 0.4)';
          ringBg = 'rgba(99, 102, 241, 0.03)';
        }

        const size = ringRadius * 2;
        ringRef.current.style.width = `${size}px`;
        ringRef.current.style.height = `${size}px`;
        ringRef.current.style.borderColor = ringBorder;
        ringRef.current.style.backgroundColor = ringBg;
        ringRef.current.style.boxShadow = ringShadow;
        ringRef.current.style.transform = `translate3d(${ringX - ringRadius}px, ${ringY - ringRadius}px, 0)`;
      }

      // 6. Update Ambient Liquid Glow Spotlight
      if (spotlightRef.current) {
        const glowRadius = isAIElement ? 130 : isCard ? 140 : isHovering ? 120 : 110;
        spotlightRef.current.style.width = `${glowRadius * 2}px`;
        spotlightRef.current.style.height = `${glowRadius * 2}px`;
        spotlightRef.current.style.transform = `translate3d(${glowX - glowRadius}px, ${glowY - glowRadius}px, 0)`;

        if (isAIElement) {
          spotlightRef.current.style.background =
            'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(139, 92, 246, 0.12) 35%, transparent 70%)';
        } else if (isButton) {
          spotlightRef.current.style.background =
            'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, rgba(99, 102, 241, 0.1) 40%, transparent 70%)';
        } else if (isCard) {
          spotlightRef.current.style.background =
            'radial-gradient(circle, rgba(99, 102, 241, 0.14) 0%, rgba(139, 92, 246, 0.06) 45%, transparent 70%)';
        } else {
          spotlightRef.current.style.background =
            'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.04) 50%, transparent 70%)';
        }
      }

      // 7. Disappearing Mouse Motion Trail (Decaying lightweight points)
      if (!prefersReducedMotion) {
        // Update trail position array with decaying follow
        let prevX = mouseX;
        let prevY = mouseY;
        const trailSpeedMultiplier = Math.min(1, Math.max(0, (currentSpeed - 1.5) / 12));

        for (let i = 0; i < trailPositions.length; i++) {
          const pt = trailPositions[i];
          const followRate = 0.45 - i * 0.06;
          pt.x += (prevX - pt.x) * followRate;
          pt.y += (prevY - pt.y) * followRate;
          prevX = pt.x;
          prevY = pt.y;

          // Target opacity decays sharply if mouse stops
          const baseAlpha = (1 - i / trailPositions.length) * 0.45;
          const targetAlpha = baseAlpha * trailSpeedMultiplier;
          pt.opacity += (targetAlpha - pt.opacity) * 0.25;

          const dotEl = trailRefs.current[i];
          if (dotEl) {
            const scale = (1 - i * 0.16) * (isAIElement ? 1.2 : 1);
            dotEl.style.transform = `translate3d(${pt.x - 2}px, ${pt.y - 2}px, 0) scale(${scale})`;
            dotEl.style.opacity = `${pt.opacity.toFixed(3)}`;
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      document.body.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (isTouchDevice) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 opacity-0"
      aria-hidden="true"
    >
      {/* 1. Liquid Magnetic Follow: Soft Ambient Spotlight Glow */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 rounded-full pointer-events-none will-change-transform transition-all duration-300"
      />

      {/* 2. Disappearing Mouse Motion Trail (5 Recycled Lightweight DOM Dots) */}
      {!reducedMotion && (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`trail-${i}`}
              ref={(el) => {
                trailRefs.current[i] = el;
              }}
              className="cursor-trail absolute top-0 left-0 w-1 h-1 rounded-full pointer-events-none will-change-transform bg-indigo-300 shadow-[0_0_6px_#818cf8]"
              style={{ opacity: 0 }}
            />
          ))}
        </>
      )}

      {/* 3. Concentric Reticle Ring (Fluid Magnetic Reticle) */}
      <div
        ref={ringRef}
        className="absolute top-0 left-0 rounded-full pointer-events-none border will-change-transform transition-colors duration-200 ease-out flex items-center justify-center backdrop-blur-[0.5px]"
      >
        {/* Subtle AI reticle cross-hair ticks inside ring */}
        <div
          ref={ringReticleRef}
          className="w-full h-full relative flex items-center justify-center opacity-40"
        >
          <div className="absolute w-[2px] h-1.5 bg-white/60 top-0 left-1/2 -translate-x-1/2 rounded-full" />
          <div className="absolute w-[2px] h-1.5 bg-white/60 bottom-0 left-1/2 -translate-x-1/2 rounded-full" />
          <div className="absolute h-[2px] w-1.5 bg-white/60 left-0 top-1/2 -translate-y-1/2 rounded-full" />
          <div className="absolute h-[2px] w-1.5 bg-white/60 right-0 top-1/2 -translate-y-1/2 rounded-full" />
        </div>
      </div>

      {/* 4. Core Pointer Dot (Small Elegant Glowing Core) */}
      <div
        ref={dotRef}
        className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full pointer-events-none will-change-transform bg-white shadow-[0_0_8px_#ffffff,0_0_14px_#818cf8]"
      />

      {/* 5. Click Splash Energy Container (Mount point for expanding ripples & particle bursts) */}
      <div ref={splashContainerRef} className="absolute inset-0 pointer-events-none" />
    </div>
  );
}
