import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Img } from 'remotion';

interface DailyImage {
  date: string;
  url: string;
}

interface TimelapseVideoProps {
  images: DailyImage[];
  language: 'tr' | 'en';
  backgroundColor: string;
  transitionType: 'fade' | 'slide' | 'none';
  imageDuration: number;
}

export const TimelapseVideo: React.FC<TimelapseVideoProps> = ({
  images,
  language,
  backgroundColor,
  transitionType,
  imageDuration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const framesPerImage = fps * imageDuration;
  const currentImageIndex = Math.floor(frame / framesPerImage);
  const currentImage = images[currentImageIndex];

  if (!currentImage) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'tr') {
      const months = [
        'Ocak',
        'Şubat',
        'Mart',
        'Nisan',
        'Mayıs',
        'Haziran',
        'Temmuz',
        'Ağustos',
        'Eylül',
        'Ekim',
        'Kasım',
        'Aralık',
      ];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  let opacity = 1;
  let translateX = 0;

  if (transitionType === 'fade') {
    opacity = interpolate(
      frame % framesPerImage,
      [0, 30, framesPerImage - 30, framesPerImage],
      [0, 1, 1, 0]
    );
  } else if (transitionType === 'slide') {
    translateX = interpolate(
      frame % framesPerImage,
      [0, 30, framesPerImage - 30, framesPerImage],
      [-100, 0, 0, 100]
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        background: `linear-gradient(135deg, ${backgroundColor}00, ${backgroundColor}ff)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at center, transparent 0%, ${backgroundColor}22 100%)`,
        }}
      />
      <Img
        src={currentImage.url}
        style={{
          maxWidth: '85%',
          maxHeight: '75%',
          objectFit: 'contain',
          opacity,
          transform: `translateX(${translateX}%) scale(${opacity * 0.1 + 0.9})`,
          borderRadius: '12px',
          boxShadow: `0 20px 60px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.1)`,
          filter: 'brightness(1.05) contrast(1.02)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 40,
          right: 40,
          color: 'white',
          fontSize: 42,
          fontWeight: '600',
          textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)',
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          padding: '12px 24px',
          borderRadius: '24px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '0.5px',
        }}
      >
        {formatDate(currentImage.date)}
      </div>
    </div>
  );
};
