import React, { useState, useEffect, useCallback } from 'react';
import './Images.css';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ImagePopup from '../../components/ImagePopup';

interface DailyImage {
  date: string;
  url: string;
}

const Images: React.FC = () => {
  const [images, setImages] = useState<DailyImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [weeksToShow, setWeeksToShow] = useState(4);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  const loadImages = useCallback(async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (user) {
        const token = localStorage.getItem('authToken');
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      const response = await fetch('https://api.muzac.com.tr/images', {
        headers,
      });
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setImagesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const getContinuousDays = () => {
    const today = new Date();
    const days: Date[] = [];

    // Start from Monday of current week
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + mondayOffset);

    // Generate days going backwards from current week
    for (let week = 0; week < weeksToShow; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() - week * 7 + day);
        days.push(date);
      }
    }

    return days;
  };

  const getMobileDays = () => {
    const today = new Date();
    const days: Date[] = [];

    // Generate days going backwards from today
    for (let i = 0; i < weeksToShow * 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date);
    }

    return days;
  };

  const isDayInFuture = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate > today;
  };

  const isDayInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const getImageForDate = (date: Date): string | null => {
    const dateString = date.toISOString().split('T')[0];
    const image = images.find((img) => img.date === dateString);
    return image?.url || null;
  };

  const isImageLoading = (date: Date): boolean => {
    return imagesLoading && !isDayInFuture(date);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  };

  const compressImage = (
    file: File,
    maxWidth: number = 1920,
    quality: number = 0.8
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = document.createElement('img');

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas
          .toDataURL('image/jpeg', quality)
          .split(',')[1];
        resolve(compressedBase64);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);

    try {
      // Immediately show the new image locally
      const localUrl = URL.createObjectURL(file);
      const today = new Date().toISOString().split('T')[0];
      setImages((prev) => {
        const filtered = prev.filter((img) => img.date !== today);
        return [{ date: today, url: localUrl }, ...filtered];
      });

      // Add small delay to show spinner
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Compress image before upload
      const compressedBase64 = await compressImage(file);

      const response = await fetch('https://api.muzac.com.tr/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') && {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          }),
        },
        body: JSON.stringify({ imageData: compressedBase64 }),
      });

      if (response.ok) {
        // Small delay to ensure S3 consistency
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await loadImages();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const loadMoreWeeks = () => {
    setWeeksToShow((prev) => prev + 4);
  };

  const isFirstDayOfMonth = (date: Date): boolean => {
    return date.getDate() === 1;
  };

  const monthNames = Array.from({ length: 12 }, (_, i) => t(`months.${i}`));
  const dayNames = Array.from({ length: 7 }, (_, i) => t(`days.${i}`));

  return (
    <div className="images-container">
      <div className="calendar-desktop">
        <div className="calendar-grid">
          {dayNames.map((day) => (
            <div key={day} className="day-header">
              {day}
            </div>
          ))}

          {getContinuousDays().map((date, index) => (
            <div
              key={index}
              className={`calendar-day ${
                isDayInFuture(date)
                  ? 'future-day'
                  : isDayInPast(date)
                    ? 'past-day'
                    : ''
              }`}
            >
              <div className="day-number">
                {user && isToday(date) ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      id={`upload-${index}`}
                      disabled={uploading}
                    />
                    <label
                      htmlFor={`upload-${index}`}
                      className={`upload-date-btn ${uploading ? 'disabled' : ''}`}
                      style={{ pointerEvents: uploading ? 'none' : 'auto' }}
                    >
                      {isFirstDayOfMonth(date)
                        ? `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
                        : date.getDate()}
                    </label>
                  </>
                ) : isFirstDayOfMonth(date) ? (
                  `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
                ) : (
                  date.getDate()
                )}
              </div>
              {!isDayInFuture(date) && getImageForDate(date) && !uploading && (
                <div className="day-image">
                  <ImagePopup
                    src={getImageForDate(date)!}
                    alt={`${date.getDate()}`}
                  />
                </div>
              )}
              {!isDayInFuture(date) &&
                !getImageForDate(date) &&
                isImageLoading(date) && (
                  <div className="image-loading-spinner">
                    <div className="spinner"></div>
                  </div>
                )}
              {user && isToday(date) && uploading && (
                <div className="upload-spinner">
                  <div className="spinner"></div>
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={loadMoreWeeks} className="load-more-btn">
          {t('calendar.loadMore')}
        </button>
      </div>

      <div className="calendar-mobile">
        {getMobileDays()
          .filter((date) => !isDayInFuture(date))
          .map((date, index) => (
            <div
              key={index}
              className={`mobile-day ${isDayInPast(date) ? 'past-day' : ''}`}
            >
              <div className="mobile-date">
                {date.getDate()} {monthNames[date.getMonth()]}{' '}
                {date.getFullYear()}
              </div>
              {getImageForDate(date) && !(isToday(date) && uploading) && (
                <div className="mobile-image">
                  <img src={getImageForDate(date)!} alt={`${date.getDate()}`} />
                </div>
              )}
              {!getImageForDate(date) && isImageLoading(date) && (
                <div className="image-loading-spinner">
                  <div className="spinner"></div>
                </div>
              )}
              {user && isToday(date) && (
                <div className="upload-section">
                  {uploading ? (
                    <div className="upload-spinner">
                      <div className="spinner"></div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        id={`mobile-upload-${index}`}
                        disabled={uploading}
                      />
                      <label
                        htmlFor={`mobile-upload-${index}`}
                        className={`upload-btn ${uploading ? 'disabled' : ''}`}
                        style={{ pointerEvents: uploading ? 'none' : 'auto' }}
                      >
                        📷
                      </label>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        <button onClick={loadMoreWeeks} className="load-more-btn">
          {t('calendar.loadMore')}
        </button>
      </div>
    </div>
  );
};

export default Images;
