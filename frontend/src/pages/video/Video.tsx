import React, { useState, useEffect } from 'react';
import { Player } from '@remotion/player';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { TimelapseVideoComponent } from '../../remotion/TimelapseVideo';
import './Video.css';

interface DailyImage {
  date: string;
  url: string;
}

interface RenderProgress {
  overallProgress?: number;
  outputFile?: string;
  done?: boolean;
}

const Video: React.FC = () => {
  const [images, setImages] = useState<DailyImage[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [transitionType, setTransitionType] = useState<
    'fade' | 'slide' | 'none'
  >('fade');
  const [imageDuration, setImageDuration] = useState(3);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(
    null
  );
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const apiUrl = process.env.REACT_APP_API_URL || 'https://api.muzac.com.tr';

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    // Auto-select all images in date range when dates change
    const dateRangeImages = images.filter((img) => {
      const imgDate = new Date(img.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return imgDate >= start && imgDate <= end;
    });
    const dateRangeDates = new Set<string>(
      dateRangeImages.map((img) => img.date)
    );
    setSelectedImages(dateRangeDates);
  }, [images, startDate, endDate]);

  const loadImages = async () => {
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

      const response = await fetch(`${apiUrl}/images`, {
        headers,
      });
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  const getFilteredImages = () => {
    return images
      .filter((img) => {
        const imgDate = new Date(img.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return (
          imgDate >= start && imgDate <= end && selectedImages.has(img.date)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const toggleImageSelection = (date: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(date)) {
      newSelected.delete(date);
    } else {
      newSelected.add(date);
    }
    setSelectedImages(newSelected);
  };

  const getDateRangeImages = () => {
    return images
      .filter((img) => {
        const imgDate = new Date(img.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return imgDate >= start && imgDate <= end;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const renderVideoOnServer = async () => {
    if (!user) return;

    setIsRendering(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/video/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          images: getFilteredImages(),
          language,
          backgroundColor,
          transitionType,
          imageDuration,
        }),
      });

      const data = await response.json();
      if (data.renderId) {
        pollRenderStatus(data.renderId, data.outName);
      }
    } catch (error) {
      console.error('Error rendering video:', error);
      setIsRendering(false);
    }
  };

  const pollRenderStatus = async (renderId: string, outName?: string) => {
    const token = localStorage.getItem('authToken');
    try {
      const url = `${apiUrl}/video/status/${renderId}${outName ? `?outName=${encodeURIComponent(outName)}` : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const progress = await response.json();
      setRenderProgress(progress);

      if (progress.done) {
        setIsRendering(false);
        // Auto-download when complete
        if (progress.outputFile) {
          const link = document.createElement('a');
          link.href = progress.outputFile;
          link.download = 'timelapse.mp4';
          link.click();
        }
      } else {
        setTimeout(() => pollRenderStatus(renderId, outName), 2000);
      }
    } catch (error) {
      console.error('Error polling render status:', error);
      setIsRendering(false);
    }
  };

  return (
    <div className="video-container">
      <div className="video-player-section">
        {getFilteredImages().length > 0 ? (
          <Player
            component={TimelapseVideoComponent}
            durationInFrames={getFilteredImages().length * (30 * imageDuration)}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            style={{
              width: '100%',
              height: 'auto',
              aspectRatio: '16/9',
            }}
            inputProps={{
              images: getFilteredImages(),
              language,
              backgroundColor,
              transitionType,
              imageDuration,
            }}
            controls
          />
        ) : (
          <div
            className="no-images-message"
            style={{
              width: '100%',
              height: '450px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000',
              color: 'white',
              fontSize: '18px',
              borderRadius: '8px',
            }}
          >
            {t('video.noImages')}
          </div>
        )}
      </div>

      <div className="video-controls">
        <div className="video-options">
          <div className="input-group">
            <label>{t('video.backgroundColor')}</label>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>{t('video.transition')}</label>
            <select
              value={transitionType}
              onChange={(e) =>
                setTransitionType(e.target.value as 'fade' | 'slide' | 'none')
              }
            >
              <option value="fade">{t('video.fade')}</option>
              <option value="slide">{t('video.slide')}</option>
              <option value="none">{t('video.none')}</option>
            </select>
          </div>
          <div className="input-group">
            <label>
              {t('video.duration')} ({imageDuration}s)
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={imageDuration}
              onChange={(e) => setImageDuration(Number(e.target.value))}
            />
          </div>
        </div>

        {user && (
          <div className="render-section">
            <button
              onClick={renderVideoOnServer}
              disabled={isRendering || getFilteredImages().length === 0}
              className="render-button"
            >
              {isRendering ? t('video.generating') : t('video.generate')}
            </button>
            {renderProgress && (
              <div className="render-progress">
                <p>
                  Progress:{' '}
                  {Math.round((renderProgress.overallProgress || 0) * 100)}%
                </p>
                {renderProgress.outputFile && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = renderProgress.outputFile!;
                      link.download = 'timelapse.mp4';
                      link.click();
                    }}
                    className="download-button"
                  >
                    {t('video.download')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="date-inputs">
          <div className="input-group">
            <label>{t('video.startDate')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>{t('video.endDate')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {getDateRangeImages().length > 0 && (
        <div className="preview-section">
          <h3>
            {t('video.preview')} ({getFilteredImages().length}{' '}
            {t('video.images')})
          </h3>
          <div className="image-preview">
            {getDateRangeImages().map((img) => (
              <div key={img.date} className="preview-item">
                <input
                  type="checkbox"
                  checked={selectedImages.has(img.date)}
                  onChange={() => toggleImageSelection(img.date)}
                  className="image-checkbox"
                />
                <img src={img.url} alt={img.date} className="thumbnail" />
                <span>{img.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Video;
