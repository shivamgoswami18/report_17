"use client";

import { useEffect, useRef } from "react";

const AnimatedOrbit = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let angle = 0;

    const drawOrbit = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw orbits
      const orbits = [
        { radius: 180, width: 1, color: "rgba(13, 148, 136, 0.1)" },
        { radius: 220, width: 1, color: "rgba(13, 148, 136, 0.08)" },
        { radius: 260, width: 1, color: "rgba(13, 148, 136, 0.06)" },
      ];

      orbits.forEach((orbit) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbit.radius, 0, Math.PI * 2);
        ctx.strokeStyle = orbit.color;
        ctx.lineWidth = orbit.width;
        ctx.stroke();
      });

      // Draw orbiting dots
      const dots = [
        { radius: 180, speed: 0.01, size: 8, color: "#0D9488" },
        { radius: 220, speed: -0.015, size: 6, color: "#0D9488" },
        { radius: 260, speed: 0.02, size: 4, color: "#0D9488" },
      ];

      dots.forEach((dot) => {
        const x = centerX + Math.cos(angle * dot.speed) * dot.radius;
        const y = centerY + Math.sin(angle * dot.speed) * dot.radius;

        ctx.beginPath();
        ctx.arc(x, y, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = dot.color;
        ctx.fill();

        // Glow effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, dot.size * 2);
        gradient.addColorStop(0, `${dot.color}80`);
        gradient.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(x, y, dot.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      angle += 0.02;
      requestAnimationFrame(drawOrbit);
    };

    drawOrbit();

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
};

export default AnimatedOrbit;