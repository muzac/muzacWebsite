import React, { useState, useEffect } from 'react';
import './Images.css';

interface DailyImage {
  date: string;
  url: string;
}

const Images: React.FC = () => {
  const [images, setImages] = useState<DailyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadImages();
  }, [currentMonth]);

  const loadImages = async () => {
    try {
      const response = await fetch('https://api.muzac.com.tr/images');
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      days.push(dayDate);
    }

    return days;
  };

  const isDayInFuture = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const getImageForDate = (date: Date): string | null => {
    const dateString = date.toISOString().split('T')[0];
    const image = images.find((img) => img.date === dateString);
    return image?.url || null;
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);

      // Don't allow navigation to future months
      const today = new Date();
      if (
        newDate.getFullYear() > today.getFullYear() ||
        (newDate.getFullYear() === today.getFullYear() &&
          newDate.getMonth() > today.getMonth())
      ) {
        return prev;
      }

      return newDate;
    });
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

  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  const today = new Date();
  const isCurrentMonth =
    currentMonth.getFullYear() === today.getFullYear() &&
    currentMonth.getMonth() === today.getMonth();
  const canNavigateForward = !isCurrentMonth;

  if (loading) {
    return (
      <div className="images-container">
        <div className="loading">Resimler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="images-container">
      <div className="calendar-header">
        <button onClick={() => navigateMonth(-1)} className="nav-btn">
          ‹
        </button>
        <h2>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button
          onClick={() => navigateMonth(1)}
          className={`nav-btn ${!canNavigateForward ? 'disabled' : ''}`}
          disabled={!canNavigateForward}
        >
          ›
        </button>
      </div>

      <div className="calendar-desktop">
        <div className="calendar-grid">
          {dayNames.map((day) => (
            <div key={day} className="day-header">
              {day}
            </div>
          ))}

          {getDaysInMonth(currentMonth).map((date, index) => (
            <div
              key={index}
              className={`calendar-day ${date && isDayInFuture(date) ? 'future-day' : ''}`}
            >
              {date && (
                <>
                  <div className="day-number">{date.getDate()}</div>
                  {!isDayInFuture(date) && getImageForDate(date) && (
                    <div className="day-image">
                      <img
                        src={getImageForDate(date)!}
                        alt={`${date.getDate()}`}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="calendar-mobile">
        {getDaysInMonth(currentMonth)
          .filter((date) => date !== null && !isDayInFuture(date))
          .reverse()
          .map((date, index) => (
            <div key={index} className="mobile-day">
              <div className="mobile-date">
                {date!.getDate()} {monthNames[date!.getMonth()]}
              </div>
              {getImageForDate(date!) && (
                <div className="mobile-image">
                  <img
                    src={getImageForDate(date!)!}
                    alt={`${date!.getDate()}`}
                  />
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default Images;
