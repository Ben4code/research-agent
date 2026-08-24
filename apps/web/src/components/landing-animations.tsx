'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function LandingAnimations() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Re-measure trigger positions once real fonts land; the Roboto swap
      // shifts layout below the hero and would otherwise leave scroll
      // reveals stuck at their pre-swap positions.
      document.fonts?.ready?.then(() => ScrollTrigger.refresh());
      ScrollTrigger.refresh();

      const mm = gsap.matchMedia();

      // Reduced motion: snap everything to final, visible state. No spatial
      // movement; the active-step pulse is replaced by a static ring.
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-anim]', {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          clearProps: 'transform',
        });
        gsap.set('[data-anim="term-dot"][data-active="true"]', {
          scale: 1,
        });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // ── Focal moment: the live research run in the terminal card ──
        const run = gsap.timeline({
          delay: 0.3,
          defaults: { ease: 'power3.out' },
        });

        run
          .from('[data-anim="nav"]', {
            y: -16,
            opacity: 0,
            duration: 0.5,
          })
          .from(
            '[data-anim="hero-title"]',
            { y: 28, opacity: 0, duration: 0.6, stagger: 0.12 },
            '-=0.2',
          )
          .from(
            '[data-anim="hero-marker"]',
            { scaleX: 0, transformOrigin: 'left center', duration: 0.5 },
            '-=0.35',
          )
          .from(
            '[data-anim="hero-copy"]',
            { y: 16, opacity: 0, duration: 0.5 },
            '-=0.25',
          )
          .from(
            '[data-anim="hero-cta"]',
            { y: 16, opacity: 0, duration: 0.45, stagger: 0.08 },
            '-=0.25',
          )
          .from(
            '[data-anim="hero-trust"]',
            { opacity: 0, duration: 0.4 },
            '-=0.25',
          )
          .from(
            '[data-anim="terminal"]',
            { y: 40, opacity: 0, duration: 0.7, ease: 'power3.out' },
            '-=0.2',
          )
          .from(
            '[data-anim="term-header"]',
            { y: -10, opacity: 0, duration: 0.35 },
            '<',
          );

        // Steps cascade in like a live run; the active one pulses.
        gsap.from('[data-anim="term-step"]', {
          x: -12,
          opacity: 0,
          duration: 0.45,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 1.0,
          onComplete: () => {
            gsap.to('[data-anim="term-dot"][data-active="true"]', {
              scale: 1.45,
              boxShadow: '0 0 0 6px rgba(253, 123, 65, 0.18)',
              duration: 0.9,
              yoyo: true,
              repeat: -1,
              ease: 'sine.inOut',
            });
            gsap.fromTo(
              '[data-anim="term-progress"]',
              { scaleX: 0 },
              {
                scaleX: 1,
                transformOrigin: 'left center',
                duration: 3,
                ease: 'none',
              },
            );
          },
        });

        // ── Scroll reveals: quiet, bounded, staggered ──
        // immediateRender:false keeps content visible in its default state
        // (craft floor: never hide content behind a failed script) and lets
        // ScrollTrigger own the from-state only when the trigger starts.
        const reveal = (selector: string, trigger: string, opts = {}) =>
          gsap.from(selector, {
            y: 24,
            opacity: 0,
            duration: 0.55,
            ease: 'power3.out',
            stagger: 0.08,
            immediateRender: false,
            scrollTrigger: { trigger, start: 'top 82%', once: true },
            ...opts,
          });

        reveal('[data-anim="stack-chip"]', '#stack', { stagger: 0.06 });
        reveal('[data-anim="feature-card"]', '#features');
        reveal('[data-anim="step-card"]', '#how-it-works');
        reveal('[data-anim="cta-content"]', '[data-anim="cta-section"]');
      });
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return null;
}