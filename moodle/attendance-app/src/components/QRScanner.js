import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';

const QRScanner = ({ onSuccess }) => {
  const [error, setError] = useState(null);

  const handleScan = async (data) => {
    if (data) {
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/attendance/qr`, {
          qrData: data,
          timestamp: new Date().toISOString()
        });
        
        if (response.data.success) {
          onSuccess(response.data);
        }
      } catch (err) {
        setError('Failed to process QR code');
        console.error('QR scan error:', err);
      }
    }
  };

  const handleError = (err) => {
    setError('Error accessing camera');
    console.error(err);
  };

  return (
    <div className="qr-scanner">
      <QrReader
        delay={300}
        onError={handleError}
        onScan={handleScan}
        style={{ width: '100%' }}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default QRScanner;
