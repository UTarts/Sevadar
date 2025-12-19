'use client';
import { useRef, useEffect } from 'react';

interface PosterCanvasProps {
  posterUrl: string;
  userName: string;
  userPhoto: string | null;
  designation?: string;
  config: {
    photoX: number;
    photoY: number;
    photoSize: number;
    nameX: number;
    nameY: number;
    nameSize: number;
    desigYOffset: number;
  };
  onDownloadReady: (url: string) => void;
}

export default function PosterCanvas({ posterUrl, userName, userPhoto, designation, config, onDownloadReady }: PosterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const generate = async () => {
      // 1. Load Background
      const bg = new Image();
      bg.crossOrigin = "anonymous";
      bg.src = posterUrl;
      await new Promise((resolve) => { bg.onload = resolve; });

      canvas.width = 1080;
      canvas.height = 1920;
      ctx.drawImage(bg, 0, 0, 1080, 1920);

      // 2. Draw User Photo
      if (userPhoto) {
        const photo = new Image();
        photo.crossOrigin = "anonymous";
        photo.src = userPhoto;
        await new Promise((resolve) => { photo.onload = resolve; });

        ctx.save();
        ctx.beginPath();
        const borderRadius = config.photoSize / 7; 
        ctx.roundRect(config.photoX, config.photoY, config.photoSize, config.photoSize, borderRadius);
        ctx.clip();
        ctx.drawImage(photo, config.photoX, config.photoY, config.photoSize, config.photoSize);
        ctx.restore();
        
        ctx.beginPath();
        ctx.roundRect(config.photoX, config.photoY, config.photoSize, config.photoSize, borderRadius);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }

      // 3. Draw Text
      ctx.fillStyle = '#ffffff'; 
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.99)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const maxWidth = config.nameX - 10; // Allow text to take up space from X to left edge

      // --- NAME SCALING ---
      let fontSize = config.nameSize;
      ctx.font = `bold ${fontSize}px Tiro Devanagari Hindi`;
      // Aggressive shrinking loop
      while (ctx.measureText(userName).width > maxWidth && fontSize > 30) {
        fontSize -= 2; // Shrink by 2px
        ctx.font = `bold ${fontSize}px Tiro Devanagari Hindi`;
      }
      ctx.fillText(userName, config.nameX, config.nameY);

      // --- DESIGNATION SCALING ---
      if (designation) {
         const desigY = config.nameY + config.desigYOffset; 
         ctx.shadowBlur = 0; 
         ctx.fillStyle = '#FFEB3B'; // Yellow
         
         let dSize = fontSize * 0.65; // Start at 65% of name size
         ctx.font = `600 ${dSize}px Poppins`;
         
         // Shrink loop for status
         while (ctx.measureText(designation).width > maxWidth && dSize > 20) {
            dSize -= 1;
            ctx.font = `600 ${dSize}px Poppins`;
         }
         ctx.fillText(designation, config.nameX, desigY);
      }

      const finalUrl = canvas.toDataURL('image/jpeg', 0.95);
      onDownloadReady(finalUrl);
    };

    generate();
  }, [posterUrl, userName, userPhoto, designation, config, onDownloadReady]);

  return <canvas ref={canvasRef} className="hidden" />;
}