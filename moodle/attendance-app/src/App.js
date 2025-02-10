import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import QrReader from 'react-qr-reader';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const webcamRef = useRef(null);
  const [mode, setMode] = useState('face'); // 'face' or 'qr'
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }),
        error => console.error('Error getting location:', error)
      );
    }
  }, []);

  const syncOfflineData = async () => {
    if (offlineQueue.length > 0) {
      toast.info('Syncing offline data...');
      for (const data of offlineQueue) {
        try {
          await axios.post('http://localhost:3000/mark-attendance', data);
        } catch (error) {
          console.error('Sync error:', error);
        }
      }
      setOfflineQueue([]);
      toast.success('Offline data synced successfully!');
    }
  };

  const handleAttendance = async (data) => {
    const attendanceData = {
      ...data,
      location,
      timestamp: new Date().toISOString(),
      course_id: '1',
      session_id: new Date().toISOString()
    };

    if (!isOnline) {
      setOfflineQueue([...offlineQueue, attendanceData]);
      toast.warning('Offline mode: Data will sync when online');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/mark-attendance', attendanceData);
      setStatus(response.data.message);
      toast.success('Attendance marked successfully!');
      
      // Notify teacher/class admin
      await axios.post('http://localhost:3000/notify', {
        type: 'attendance',
        student_id: response.data.student_id,
        status: 'present'
      });
    } catch (error) {
      setStatus('Error: ' + error.message);
      toast.error('Failed to mark attendance');
    }
    setLoading(false);
  };

  const captureFace = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    await handleAttendance({ 
      type: 'face',
      image: imageSrc.split(',')[1]
    });
  };

  const handleQrScan = async (data) => {
    if (data) {
      await handleAttendance({
        type: 'qr',
        qr_data: data
      });
    }
  };

  return (
    <div className="container">
      <h1>SMK Presensi System</h1>
      
      <div className="mode-switch">
        <button 
          onClick={() => setMode('face')}
          className={mode === 'face' ? 'active' : ''}
        >
          Face Recognition
        </button>
        <button 
          onClick={() => setMode('qr')}
          className={mode === 'qr' ? 'active' : ''}
        >
          QR Code
        </button>
      </div>

      <div className="status-bar">
        <span className={isOnline ? 'online' : 'offline'}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {location && (
          <span className="location">
            Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </span>
        )}
      </div>

      <div className="camera-container">
        {mode === 'face' ? (
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="webcam"
          />
        ) : (
          <QrReader
            delay={300}
            onError={(error) => toast.error(error.message)}
            onScan={handleQrScan}
            className="qr-reader"
          />
        )}
      </div>

      {mode === 'face' && (
        <button 
          onClick={captureFace}
          disabled={loading}
          className="capture-btn"
        >
          {loading ? 'Processing...' : 'Ambil Presensi'}
        </button>
      )}

      {status && (
        <div className="status-message">
          {status}
        </div>
      )}

      {offlineQueue.length > 0 && (
        <div className="offline-queue">
          Pending offline records: {offlineQueue.length}
        </div>
      )}

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;
