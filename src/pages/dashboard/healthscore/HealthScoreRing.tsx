import { useEffect, useState } from 'react';

interface Props {
  score: number;
  month: string;
}

function getScoreInfo(score: number) {
  if (score >= 91) return { label: 'Excellent', color: '#3B82F6', ring: 'stroke-blue-400' };
  if (score >= 76) return { label: 'Healthy', color: '#10B981', ring: 'stroke-emerald-400' };
  if (score >= 61) return { label: 'Moderate', color: '#F59E0B', ring: 'stroke-yellow-400' };
  if (score >= 41) return { label: 'At Risk', color: '#FF6B00', ring: 'stroke-orange-500' };
  return { label: 'Critical', color: '#EF4444', ring: 'stroke-red-500' };
}

export default function HealthScoreRing({ score, month }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const info = getScoreInfo(score);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;

  useEffect(() => {
    let frame = 0;
    const duration = 60;
    const step = () => {
      frame++;
      const t = Math.min(frame / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(eased * score));
      if (frame < duration) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [score]);

  return (
    <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center">
      <div className="relative w-56 h-56">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#1f1f1f" strokeWidth="10" />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            className={info.ring}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold" style={{ color: info.color }}>{animatedScore}</span>
          <span className="text-sm text-gray-500">/100</span>
          <span className="text-sm font-semibold mt-1" style={{ color: info.color }}>{info.label}</span>
        </div>
      </div>
      <p className="text-white font-semibold mt-4">MyDesignNexus</p>
      <p className="text-gray-500 text-sm">{month}</p>
    </div>
  );
}
