import React, { useState } from 'react';
import QRCode from 'qrcode.react';
import { format } from 'date-fns';

const QRGenerator = ({ courseId, sessionId }) => {
  const [qrValue, setQrValue] = useState('');
  
  // Generate QR code setiap 5 menit
  React.useEffect(() => {
    const generateQR = () => {
      const timestamp = new Date().getTime();
      const data = {
        courseId,
        sessionId,
        timestamp,
        validUntil: timestamp + 5 * 60 * 1000 // valid 5 menit
      };
      setQrValue(JSON.stringify(data));
    };

    generateQR();
    const interval = setInterval(generateQR, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [courseId, sessionId]);

  const currentTime = format(new Date(), 'HH:mm:ss');

  return (
    <div className="qr-generator">
      <h3>QR Code Presensi</h3>
      <div className="qr-container">
        <QRCode 
          value={qrValue}
          size={256}
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="qr-info">QR Code akan diperbarui setiap 5 menit</p>
      <p className="current-time">Waktu: {currentTime}</p>
    </div>
  );
};

export default QRGenerator;
