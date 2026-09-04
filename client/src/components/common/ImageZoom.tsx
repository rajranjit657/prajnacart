import React, { useState } from 'react';

interface ImageZoomProps {
  src: string;
  alt: string;
}

export const ImageZoom: React.FC<ImageZoomProps> = ({ src, alt }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  return (
    <div
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => setIsZoomed(false)}
      onMouseMove={handleMouseMove}
      className="relative w-full h-80 sm:h-96 md:h-[420px] rounded-lg overflow-hidden bg-white flex items-center justify-center cursor-crosshair border border-gray-200"
    >
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain p-4 transition-transform duration-200"
        style={{
          transformOrigin: `${position.x}% ${position.y}%`,
          transform: isZoomed ? 'scale(2.0)' : 'scale(1)',
        }}
      />
      {isZoomed && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none">
          Lens Zoom Active (2x)
        </div>
      )}
    </div>
  );
};
