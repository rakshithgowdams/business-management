import { useEffect, useRef, useState } from 'react';
import type { SectionAnimation } from '../../lib/websiteBuilder/types';

interface Props {
  animation: SectionAnimation;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const TRANSFORM_MAP: Record<string, string> = {
  fadeUp: 'translateY(40px)',
  fadeDown: 'translateY(-40px)',
  fadeLeft: 'translateX(40px)',
  fadeRight: 'translateX(-40px)',
  zoomIn: 'scale(0.92)',
  zoomOut: 'scale(1.08)',
  slideUp: 'translateY(60px)',
  slideDown: 'translateY(-60px)',
  flipLeft: 'rotateY(-15deg)',
  flipUp: 'rotateX(-15deg)',
  bounce: 'translateY(30px)',
  fadeIn: 'none',
  none: 'none',
};

export default function AnimatedSection({ animation, children, className, id }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const type = animation?.type || 'fadeUp';
  const duration = animation?.duration ?? 600;
  const delay = animation?.delay ?? 0;
  const easing = animation?.easing || 'ease-out';

  useEffect(() => {
    if (type === 'none') { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [type]);

  const transform = TRANSFORM_MAP[type] || TRANSFORM_MAP.fadeUp;

  const style: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : transform,
    transition: visible ? `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms` : 'none',
    perspective: type.startsWith('flip') ? '1000px' : undefined,
  };

  return (
    <div ref={ref} id={id} style={style} className={className}>
      {children}
    </div>
  );
}
