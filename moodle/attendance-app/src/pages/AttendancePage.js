import React, { useState } from 'react';
import FaceCapture from '../components/FaceCapture';
import QRScanner from '../components/QRScanner';
import LocationValidator from '../components/LocationValidator';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

const AttendancePage = () => {
  const [isValidLocation, setIsValidLocation] = useState(false);
  const [attendanceMethod, setAttendanceMethod] = useState('face');
  const [attendanceStatus, setAttendanceStatus] = useState(null);

  // Konfigurasi lokasi sekolah (ganti dengan koordinat sekolah yang sebenarnya)
  const schoolLocation = {
    latitude: -6.2088, // Contoh koordinat
    longitude: 106.8456
  };

  const handleAttendanceSuccess = (data) => {
    setAttendanceStatus({
      success: true,
      message: `Presensi berhasil pada ${new Date().toLocaleTimeString()}`,
      method: attendanceMethod
    });
  };

  const handleAttendanceError = (error) => {
    setAttendanceStatus({
      success: false,
      message: error.message || 'Gagal melakukan presensi',
      method: attendanceMethod
    });
  };

  return (
    <div className="attendance-page">
      <h1>Presensi</h1>
      
      {/* Validator Lokasi */}
      <LocationValidator
        schoolLocation={schoolLocation}
        allowedRadius={100} // radius dalam meter
        onValidLocation={setIsValidLocation}
      />

      {isValidLocation ? (
        <Tabs>
          <TabList>
            <Tab onClick={() => setAttendanceMethod('face')}>Face Recognition</Tab>
            <Tab onClick={() => setAttendanceMethod('qr')}>QR Code</Tab>
          </TabList>

          <TabPanel>
            <FaceCapture
              onCapture={handleAttendanceSuccess}
              onError={handleAttendanceError}
            />
          </TabPanel>
          
          <TabPanel>
            <QRScanner
              onSuccess={handleAttendanceSuccess}
              onError={handleAttendanceError}
            />
          </TabPanel>
        </Tabs>
      ) : (
        <div className="location-warning">
          Anda harus berada dalam radius sekolah untuk melakukan presensi
        </div>
      )}

      {/* Status Presensi */}
      {attendanceStatus && (
        <div className={`attendance-status ${attendanceStatus.success ? 'success' : 'error'}`}>
          {attendanceStatus.message}
        </div>
      )}

      <style jsx>{`
        .attendance-page {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .location-warning {
          background-color: #fff3cd;
          color: #856404;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }

        .attendance-status {
          margin-top: 20px;
          padding: 15px;
          border-radius: 4px;
        }

        .attendance-status.success {
          background-color: #d4edda;
          color: #155724;
        }

        .attendance-status.error {
          background-color: #f8d7da;
          color: #721c24;
        }

        @media (max-width: 768px) {
          .attendance-page {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default AttendancePage;
