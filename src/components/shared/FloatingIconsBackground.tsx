
'use client';

import { Sparkle, Crown, Brain, FlaskConical, Target, Dumbbell, Zap, Lightbulb } from 'lucide-react';
import { useEffect, useState } from 'react';

const iconComponentsList = [
  Sparkle,
  Crown,
  Brain,
  FlaskConical,
  Target,
  Dumbbell,
  Zap,
  Lightbulb,
];
const NUM_ICONS = 20; // Number of icons to display

interface FloatingIcon {
  id: number;
  IconComponent: React.ElementType;
  style: React.CSSProperties;
}

const FloatingIconsBackground = () => {
  const [floatingIcons, setFloatingIcons] = useState<FloatingIcon[]>([]);

  useEffect(() => {
    const generateIcons = () => {
      const newIcons: FloatingIcon[] = [];
      for (let i = 0; i < NUM_ICONS; i++) {
        const IconComponent = iconComponentsList[Math.floor(Math.random() * iconComponentsList.length)];
        const size = Math.random() * 20 + 15; // 15px to 35px
        const duration = Math.random() * 15 + 10; // Animation duration: 10s to 25s
        const delay = Math.random() * duration; // Stagger start times up to the duration
        const initialY = Math.random() * 90 + 5; // Vertical position: 5% to 95% to avoid edges

        newIcons.push({
          id: i,
          IconComponent,
          style: {
            position: 'absolute',
            top: `${initialY}%`,
            left: '0px', // Initial horizontal anchor, transform will handle actual position
            transform: 'translateX(-150px)', // Start further left than icon width
            width: `${size}px`,
            height: `${size}px`,
            animationName: 'floatAcrossViewport',
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            opacity: Math.random() * 0.2 + 0.05, // Base opacity: 0.05 to 0.25
            color: 'hsl(var(--primary) / 0.5)', // Use primary theme color with 50% alpha
          },
        });
      }
      setFloatingIcons(newIcons);
    };

    generateIcons();
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {floatingIcons.map(({ id, IconComponent, style }) => (
        <IconComponent key={id} style={style} />
      ))}
    </div>
  );
};

export default FloatingIconsBackground;
