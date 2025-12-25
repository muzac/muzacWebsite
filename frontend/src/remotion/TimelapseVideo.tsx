import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Img } from 'remotion';

interface DailyImage {
  date: string;
  url: string;
}

interface TimelapseVideoProps {
  images: DailyImage[];
  language: 'tr' | 'en';
}

export const TimelapseVideo: React.FC<TimelapseVideoProps> = ({
  images,
  language,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const framesPerImage = fps * 5; // 5 seconds per image
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

  const opacity = interpolate(
    frame % framesPerImage,
    [0, 30, framesPerImage - 30, framesPerImage],
    [0, 1, 1, 0]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <Img
        src={currentImage.url}
        style={{
          maxWidth: '90%',
          maxHeight: '80%',
          objectFit: 'contain',
          opacity,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: 48,
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          opacity,
        }}
      >
        {formatDate(currentImage.date)}
      </div>
    </div>
  );
};
