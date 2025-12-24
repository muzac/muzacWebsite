import React, { useState } from 'react';
import './ImagePopup.css';

interface ImagePopupProps {
  src: string;
  alt: string;
}

const ImagePopup: React.FC<ImagePopupProps> = ({ src, alt }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => setIsOpen(true)}
        className="calendar-image"
      />
      {isOpen && (
        <div className="popup-overlay" onClick={() => setIsOpen(false)}>
          <div className="popup-content">
            <button className="popup-close" onClick={() => setIsOpen(false)}>
              ×
            </button>
            <img src={src} alt={alt} className="popup-image" />
          </div>
        </div>
      )}
    </>
  );
};

export default ImagePopup;
