import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;
  scaleRange?: [number, number];
  className?: string;
}

/**
 * Scroll-linked parallax layer driven strictly by GPU-composited transform (y + scale).
 * Zero layout reflows and automatic bypass under prefers-reduced-motion.
 */
export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  speed = 48,
  scaleRange = [0.97, 1.03],
  className = '',
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [scaleRange[0], 1, scaleRange[1]]);

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y, scale }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
};

interface ScrollRevealBandProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Scroll reveal band that keeps DOM content immediately visible (opacity starts at 0.9)
 * while gliding into crisp alignment without blocking interaction.
 */
export const ScrollRevealBand: React.FC<ScrollRevealBandProps> = ({
  children,
  delay = 0,
  className = '',
}) => {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0.9, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface EmberOrbCtaProps {
  label: string;
  onClick: () => void;
  eyebrow?: string;
  size?: 'md' | 'lg';
}

/**
 * Editorial unboxed arrow CTA with ambient radiating ember orb behind typography.
 */
export const EmberOrbCta: React.FC<EmberOrbCtaProps> = ({
  label,
  onClick,
  eyebrow,
  size = 'md',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative inline-flex items-center gap-4 text-left focus:outline-none"
    >
      <span
        aria-hidden="true"
        className="ember-orb-glow pointer-events-none absolute -left-4 top-1/2 h-24 w-28 -translate-y-1/2 rounded-full transition-transform duration-500 group-hover:scale-125"
      />
      <span className="relative z-10 flex flex-col">
        {eyebrow && (
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#A69B8D]">
            {eyebrow}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-2.5 font-display font-bold tracking-tight text-[#EDE3D2] transition-colors group-hover:text-[#E12D1C] ${
            size === 'lg' ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
          }`}
        >
          <span>{label}</span>
          <ArrowRight
            className="h-4 w-4 text-[#E12D1C] transition-transform duration-300 group-hover:translate-x-1.5"
            aria-hidden="true"
          />
        </span>
      </span>
    </button>
  );
};
