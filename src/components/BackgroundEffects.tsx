import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  maxOpacity: number;
  pulseSpeed: number;
  color: string;
}

export const BackgroundEffects: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Color palette of magical Hogwarts dust (Gold, Amber, Emerald, Azure)
    const particleColors = [
      'rgba(255, 216, 117,', // Gold
      'rgba(200, 170, 110,', // Antique brass
      'rgba(255, 140, 60,',  // Gryffindor spark
      'rgba(82, 183, 136,',  // Slytherin emerald
      'rgba(96, 165, 250,',  // Ravenclaw sapphire
    ];

    const count = Math.min(45, Math.floor((width * height) / 25000));
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.8,
        speedY: -(Math.random() * 0.4 + 0.1), // gentle rise upwards
        speedX: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.5 + 0.1,
        maxOpacity: Math.random() * 0.4 + 0.3,
        pulseSpeed: Math.random() * 0.015 + 0.005,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY;
        p.x += p.speedX;

        // Pulse opacity
        p.opacity += p.pulseSpeed;
        if (p.opacity > p.maxOpacity || p.opacity < 0.05) {
          p.pulseSpeed = -p.pulseSpeed;
        }

        // Wrap around borders
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Draw soft glowing particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${Math.max(0, Math.min(1, p.opacity))})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 216, 117, 0.4)';
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Canvas for floating starlight particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />

      {/* Atmospheric Aurora Orbs */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-red-900/15 via-amber-700/10 to-transparent blur-3xl animate-breathing" />
      <div className="absolute top-1/2 -right-40 w-[450px] h-[450px] rounded-full bg-gradient-to-bl from-emerald-950/20 via-teal-900/10 to-transparent blur-3xl animate-breathing" style={{ animationDelay: '-2s' }} />
      <div className="absolute -bottom-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-blue-950/25 via-indigo-900/10 to-transparent blur-3xl animate-breathing" style={{ animationDelay: '-1s' }} />
    </div>
  );
};
