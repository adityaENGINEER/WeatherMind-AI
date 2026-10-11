import React, { useEffect, useRef } from 'react';

interface AtmosphericBackdropProps {
  atmosphere: 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'fog';
  isDay: boolean;
  reducedMotion?: boolean;
}

export const AtmosphericBackdrop: React.FC<AtmosphericBackdropProps> = ({
  atmosphere,
  isDay,
  reducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particles system
    const particleCount = atmosphere === 'rain' ? 120 : atmosphere === 'snow' ? 80 : 35;
    const particles: Array<{
      x: number;
      y: number;
      speedY: number;
      speedX: number;
      size: number;
      opacity: number;
      length?: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speedY: atmosphere === 'rain' ? Math.random() * 8 + 12 : atmosphere === 'snow' ? Math.random() * 1.5 + 0.8 : Math.random() * 0.4 + 0.1,
        speedX: atmosphere === 'rain' ? -1 : atmosphere === 'snow' ? Math.sin(i) * 0.5 : Math.random() * 0.2 - 0.1,
        size: atmosphere === 'snow' ? Math.random() * 2.5 + 1 : Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        length: atmosphere === 'rain' ? Math.random() * 15 + 10 : undefined,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (atmosphere === 'rain') {
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.4)';
        ctx.lineWidth = 1.2;
        for (const p of particles) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2, p.y + (p.length || 15));
          ctx.stroke();

          p.y += p.speedY;
          p.x += p.speedX;
          if (p.y > height) {
            p.y = -20;
            p.x = Math.random() * width;
          }
        }
      } else if (atmosphere === 'snow') {
        for (const p of particles) {
          ctx.fillStyle = `rgba(240, 249, 255, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.speedY;
          p.x += Math.sin(p.y * 0.02) * 0.8;
          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        }
      } else {
        // Starlight or subtle ambient atmospheric orbs
        for (const p of particles) {
          ctx.fillStyle = isDay
            ? `rgba(250, 204, 21, ${p.opacity * 0.45})` // Warm golden sunlight dust in daytime
            : `rgba(191, 219, 254, ${p.opacity * 0.5})`; // Silver-blue starlight in navy night
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.speedY;
          p.x += p.speedX;
          if (p.y > height) p.y = 0;
          if (p.x > width) p.x = 0;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [atmosphere, isDay, reducedMotion]);

  // Determine ambient lighting gradient based on atmospheric condition and day/night
  const getGradientOverlay = () => {
    if (isDay) {
      if (atmosphere === 'thunderstorm') {
        return 'from-amber-300/50 via-yellow-200/50 to-[#FEF9E7]';
      }
      if (atmosphere === 'rain') {
        return 'from-amber-200/50 via-yellow-100/55 to-[#FEF9E7]';
      }
      if (atmosphere === 'snow') {
        return 'from-amber-200/40 via-yellow-100/50 to-[#FEF9E7]';
      }
      if (atmosphere === 'fog') {
        return 'from-amber-200/35 via-yellow-100/50 to-[#FEF9E7]';
      }
      // Clear or clouds daytime: Full vibrant warm golden yellow theme
      return 'from-amber-300/70 via-yellow-200/60 to-[#FEF9E7]';
    }

    // Night theme: Deep dark navy-blue and midnight dark atmosphere across entire website
    if (atmosphere === 'thunderstorm') {
      return 'from-[#140E33] via-[#050B1C] to-[#020510]';
    }
    if (atmosphere === 'rain') {
      return 'from-[#0B1E3F] via-[#040C20] to-[#020510]';
    }
    if (atmosphere === 'snow') {
      return 'from-[#0D1B36] via-[#050A1A] to-[#020510]';
    }
    if (atmosphere === 'fog') {
      return 'from-[#0E1524] via-[#050A1A] to-[#020510]';
    }
    return 'from-[#08183B] via-[#040C20] to-[#020510]';
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Background base dynamic ambient gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${getGradientOverlay()} transition-colors duration-1000`} />

      {/* Primary solar radiant yellow halo in Day, deep navy blue in Night */}
      <div
        className="absolute -top-28 left-1/2 -translate-x-1/2 w-[850px] h-[550px] rounded-full blur-[140px] pointer-events-none transition-all duration-1000"
        style={{
          background: isDay
            ? 'radial-gradient(circle, rgba(251, 191, 36, 0.75) 0%, rgba(245, 158, 11, 0.45) 45%, rgba(254, 240, 138, 0.25) 70%, transparent 85%)' // Rich golden yellow sunlight beam
            : 'radial-gradient(circle, rgba(29, 78, 216, 0.45) 0%, rgba(30, 58, 138, 0.25) 50%, transparent 80%)', // Deep moonlit navy blue
        }}
      />

      {/* Atmospheric radial secondary glows */}
      <div
        className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full blur-[130px] pointer-events-none opacity-60 transition-all duration-1000"
        style={{
          background: isDay
            ? 'radial-gradient(circle, rgba(252, 211, 77, 0.7) 0%, rgba(245, 158, 11, 0.35) 50%, transparent 80%)'
            : 'radial-gradient(circle, rgba(30, 58, 138, 0.6) 0%, rgba(15, 23, 42, 0.3) 60%, transparent 80%)',
        }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[520px] h-[520px] rounded-full blur-[150px] pointer-events-none opacity-45 transition-all duration-1000"
        style={{
          background: isDay
            ? 'radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, rgba(253, 230, 138, 0.3) 55%, transparent 75%)'
            : atmosphere === 'rain'
              ? 'radial-gradient(circle, rgba(14, 165, 233, 0.45) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(30, 58, 138, 0.5) 0%, transparent 70%)',
        }}
      />

      {/* Lightweight canvas particle layer */}
      {!reducedMotion && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
        />
      )}
    </div>
  );
};
