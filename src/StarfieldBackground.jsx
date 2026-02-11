import { useEffect, useRef } from 'react';
import './StarfieldBackground.css';

function StarfieldBackground() {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize stars (50-80 stars)
    const starCount = Math.floor(Math.random() * 31) + 50; // 50-80 stars
    starsRef.current = [];

    for (let i = 0; i < starCount; i++) {
      starsRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1 + 1, // 1-2px
        vx: (Math.random() - 0.5) * 1.75, // Random velocity x
        vy: (Math.random() - 0.5) * 1.75, // Random velocity y
        wobbleX: 0,
        wobbleY: 0,
        wobbleSpeed: Math.random() * 0.02 + 0.01, // Subtle wobble speed
        wobbleAmount: Math.random() * 0.3 + 0.1, // Wobble amplitude
      });
    }

    // Animation loop with posterized effect (update every 100ms)
    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateRef.current;

      // Only update positions every 100ms (posterized effect)
      if (deltaTime >= 100) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        starsRef.current.forEach(star => {
          // Update wobble effect
          star.wobbleX += star.wobbleSpeed;
          star.wobbleY += star.wobbleSpeed * 0.7; // Slightly different phase

          // Calculate wobble offset
          const wobbleOffsetX = Math.sin(star.wobbleX) * star.wobbleAmount;
          const wobbleOffsetY = Math.cos(star.wobbleY) * star.wobbleAmount;

          // Update position with velocity and wobble
          star.x += star.vx + wobbleOffsetX;
          star.y += star.vy + wobbleOffsetY;

          // Bounce off edges
          if (star.x <= 0 || star.x >= canvas.width) {
            star.vx = -star.vx;
            star.x = Math.max(0, Math.min(canvas.width, star.x));
          }
          if (star.y <= 0 || star.y >= canvas.height) {
            star.vy = -star.vy;
            star.y = Math.max(0, Math.min(canvas.height, star.y));
          }

          // Draw star (tiny, no glow)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
          ctx.fill();
        });

        lastUpdateRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield-canvas" />;
}

export default StarfieldBackground;

