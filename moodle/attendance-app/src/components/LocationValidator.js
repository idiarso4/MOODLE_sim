import React, { useState, useEffect } from 'react';

const LocationValidator = ({ allowedRadius, schoolLocation, onValidLocation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);

  // Fungsi untuk menghitung jarak antara dua koordinat (dalam meter)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // radius bumi dalam meter
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung di browser ini');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });

        // Hitung jarak ke lokasi sekolah
        const dist = calculateDistance(
          latitude,
          longitude,
          schoolLocation.latitude,
          schoolLocation.longitude
        );
        
        setDistance(dist);
        onValidLocation(dist <= allowedRadius);
      },
      (error) => {
        setError('Error mendapatkan lokasi: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [schoolLocation, allowedRadius, onValidLocation]);

  return (
    <div className="location-validator">
      {currentLocation && (
        <div className="location-info">
          <p>Lokasi Anda: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}</p>
          <p>Jarak ke sekolah: {distance ? `${Math.round(distance)} meter` : 'Menghitung...'}</p>
          <p className={distance <= allowedRadius ? 'valid' : 'invalid'}>
            Status: {distance <= allowedRadius ? 'Di dalam area sekolah' : 'Di luar area sekolah'}
          </p>
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default LocationValidator;
