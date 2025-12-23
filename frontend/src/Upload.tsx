import React, { useState } from 'react';
import './Upload.css';

const Upload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setMessage('');
    } else {
      setMessage('Lütfen bir resim dosyası seçin');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Lütfen bir resim seçin');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];

        const response = await fetch('https://api.muzac.com.tr/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: base64,
          }),
        });

        if (response.ok) {
          setMessage('Resim başarıyla yüklendi!');
          setSelectedFile(null);
          // Reset file input
          const fileInput = document.getElementById(
            'fileInput'
          ) as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        } else {
          setMessage('Yükleme başarısız oldu');
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      setMessage('Bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const today = new Date().toLocaleDateString('tr-TR');

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h1>Günlük Resim Yükle</h1>
        <p className="date">Bugün: {today}</p>

        <div className="upload-area">
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
          />

          {selectedFile && (
            <div className="preview">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="preview-image"
              />
              <p>{selectedFile.name}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="upload-btn"
          >
            {uploading ? 'Yükleniyor...' : 'Yükle'}
          </button>
        </div>

        {message && (
          <div
            className={`message ${message.includes('başarıyla') ? 'success' : 'error'}`}
          >
            {message}
          </div>
        )}

        <div className="info">
          <p>• Günde sadece bir resim yükleyebilirsiniz</p>
          <p>• Yeni resim yüklerseniz eskisi silinir</p>
          <p>• Sadece bugün için resim yükleyebilirsiniz</p>
        </div>
      </div>
    </div>
  );
};

export default Upload;
