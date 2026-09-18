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

    const count = Math.min(60, Math.floor((width * height) / 20000));
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.8,
        speedY: -(Math.random() * 0.45 + 0.12), // gentle rise upwards like embers
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.15,
        maxOpacity: Math.random() * 0.45 + 0.4,
        pulseSpeed: Math.random() * 0.018 + 0.006,
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
        if (p.opacity > p.maxOpacity || p.opacity < 0.08) {
          p.pulseSpeed = -p.pulseSpeed;
        }

        // Wrap around borders
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Draw soft glowing particle with halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${Math.max(0, Math.min(1, p.opacity))})`;
        ctx.shadowBlur = p.size > 2 ? 12 : 6;
        ctx.shadowColor = 'rgba(255, 216, 117, 0.6)';
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
      {/* Canvas for floating starlight particles & magic embers */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />

      {/* Atmospheric Multi-House Magical Aurora Orbs */}
      {/* Top Center: Warm Hogwarts Candlelit Hall Glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full bg-gradient-to-b from-amber-600/20 via-yellow-700/10 to-transparent blur-3xl animate-breathing" />

      {/* Top Left: Gryffindor Royal Crimson Velvet Nebula */}
      <div className="absolute -top-20 -left-20 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-red-800/22 via-purple-950/15 to-transparent blur-3xl animate-breathing" style={{ animationDelay: '-1.5s' }} />

      {/* Middle Right: Slytherin Emerald Lagoon Mist */}
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-emerald-800/20 via-teal-950/15 to-transparent blur-3xl animate-breathing" style={{ animationDelay: '-3s' }} />

      {/* Bottom Left: Ravenclaw Deep Sapphire Cosmic Aura */}
      <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-800/22 via-indigo-950/15 to-transparent blur-3xl animate-breathing" style={{ animationDelay: '-2s' }} />

      {/* Bottom Right: Hufflepuff Golden Hearth Ambiance */}
      <div className="absolute -bottom-28 -right-28 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-amber-700/18 via-yellow-900/10 to-transparent blur-3xl animate-breathing" style={{ animationDelay: '-0.5s' }} />

      {/* Vignette Shadow Frame to Make Center Cards Stand Out */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(3,1,6,0.75)_100%)]" />
    </div>
  );
};
