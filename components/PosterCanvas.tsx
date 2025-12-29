'use client';
import { useEffect, useRef } from 'react';

interface PosterCanvasProps {
  posterUrl: string;
  userName: string;
  designation: string;
  userVillage: string;
  userPhoto: string | null;
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
  isAdmin?: boolean;
}

export default function PosterCanvas({ 
  posterUrl, userName, designation, userVillage, userPhoto, config, onDownloadReady, isAdmin = false 
}: PosterCanvasProps) {
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const generate = async () => {
      // 1. Load Background
      const mainImage = new Image();
      mainImage.crossOrigin = "anonymous";
      mainImage.src = posterUrl;
      await new Promise((resolve) => { mainImage.onload = resolve; });

      canvas.width = 1080;
      canvas.height = 1920;
      ctx.drawImage(mainImage, 0, 0, 1080, 1920);

      // --- ADMIN MODE ---
      if (isAdmin) {
        const adminFooter = new Image();
        adminFooter.src = '/posters/admin_footer.webp';
        adminFooter.crossOrigin = "anonymous";
        
        adminFooter.onload = () => {
            const aspectRatio = adminFooter.height / adminFooter.width;
            const drawWidth = canvas.width;
            const drawHeight = drawWidth * aspectRatio;

            // --- CONTROL: Move Footer Up/Down ---
            // Higher number = Higher up on screen
            const footerBottomOffset = 1; 
            
            const y = canvas.height - drawHeight - footerBottomOffset;
            ctx.drawImage(adminFooter, 0, y, drawWidth, drawHeight);
            onDownloadReady(canvas.toDataURL('image/jpeg', 0.9));
        };
        adminFooter.onerror = () => onDownloadReady(canvas.toDataURL('image/jpeg', 0.9));
    }

      // --- NORMAL USER MODE (Your Exact Placement Logic) ---
      else {
          // 2. Draw User Photo (Square with Rounded Corners)
          if (userPhoto) {
              const photo = new Image();
              photo.crossOrigin = "anonymous";
              photo.src = userPhoto;
              await new Promise((resolve) => { photo.onload = resolve; });

              ctx.save();
              ctx.beginPath();
              // Use YOUR exact config logic
              const borderRadius = config.photoSize / 7; 
              ctx.roundRect(config.photoX, config.photoY, config.photoSize, config.photoSize, borderRadius);
              ctx.clip();
              ctx.drawImage(photo, config.photoX, config.photoY, config.photoSize, config.photoSize);
              ctx.restore();
              
              // Border
              ctx.beginPath();
              ctx.roundRect(config.photoX, config.photoY, config.photoSize, config.photoSize, borderRadius);
              ctx.lineWidth = 6;
              ctx.strokeStyle = '#ffffff';
              ctx.stroke();
          }

          // 3. Draw Text
          ctx.textAlign = 'right'; // Your mapping relies on Right Align
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.99)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          // Align based on nameX (Right side of text area)
          const maxWidth = config.nameX - 10; 

          // --- NAME SCALING ---
          ctx.fillStyle = '#ffffff'; 
          let fontSize = config.nameSize;
          ctx.font = `bold ${fontSize}px "Tiro Devanagari Hindi", sans-serif`;
          
          while (ctx.measureText(userName).width > maxWidth && fontSize > 30) {
            fontSize -= 2; 
            ctx.font = `bold ${fontSize}px "Tiro Devanagari Hindi", sans-serif`;
          }
          ctx.fillText(userName, config.nameX, config.nameY);

          // --- DESIGNATION + VILLAGE SCALING ---
          // Combine them with a comma
          let fullStatus = designation || '';
          if (designation && userVillage) fullStatus = `${designation}, ${userVillage}`;
          else if (!designation && userVillage) fullStatus = userVillage;

          if (fullStatus) {
             const desigY = config.nameY + config.desigYOffset; 
             ctx.shadowBlur = 0; 
             ctx.fillStyle = '#FFEB3B'; // Yellow
             
             let dSize = fontSize * 0.65; // Start at 65% of name size
             ctx.font = `600 ${dSize}px Poppins, sans-serif`;
             
             while (ctx.measureText(fullStatus).width > maxWidth && dSize > 20) {
                dSize -= 1;
                ctx.font = `600 ${dSize}px Poppins, sans-serif`;
             }
             ctx.fillText(fullStatus, config.nameX, desigY);
          }

          onDownloadReady(canvas.toDataURL('image/jpeg', 0.95));
      }
    };

    generate();
  }, [posterUrl, userName, designation, userVillage, userPhoto, config, isAdmin]);

  return <canvas ref={canvasRef} className="hidden" />;
}