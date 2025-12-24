import React, { useState, useEffect } from 'react';
import './Images.css';
import { useAuth } from './AuthContext';
import ImagePopup from './components/ImagePopup';

interface DailyImage {
  date: string;
  url: string;
}

const Images: React.FC = () => {
  const [images, setImages] = useState<DailyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeksToShow, setWeeksToShow] = useState(4);
  const { user } = useAuth();

  useEffect(() => {
    loadImages();
  }, [user]);

  const loadImages = async () => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
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
      setLoading(false);
    }
  };

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

  const loadMoreWeeks = () => {
    setWeeksToShow((prev) => prev + 4);
  };

  const isFirstDayOfMonth = (date: Date): boolean => {
    return date.getDate() === 1;
  };

  const monthNames = [
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

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  if (loading) {
    return (
      <div className="images-container">
        <div className="loading">Resimler yükleniyor...</div>
      </div>
    );
  }

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
                {isFirstDayOfMonth(date)
                  ? `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
                  : date.getDate()}
              </div>
              {!isDayInFuture(date) && getImageForDate(date) && (
                <div className="day-image">
                  <ImagePopup
                    src={getImageForDate(date)!}
                    alt={`${date.getDate()}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={loadMoreWeeks} className="load-more-btn">
          Daha fazla yükle
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
              {getImageForDate(date) && (
                <div className="mobile-image">
                  <img src={getImageForDate(date)!} alt={`${date.getDate()}`} />
                </div>
              )}
            </div>
          ))}
        <button onClick={loadMoreWeeks} className="load-more-btn">
          Daha fazla yükle
        </button>
      </div>
    </div>
  );
};

export default Images;
