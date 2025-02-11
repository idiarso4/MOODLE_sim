import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const MultiFaceDetection = ({ onDetection }) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState([]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsModelLoaded(true);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!isModelLoaded) return;

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };
    startVideo();
  }, [isModelLoaded]);

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

    setDetectedFaces(resizedDetections);
    onDetection(resizedDetections);
  };

  useEffect(() => {
    if (!isModelLoaded) return;
    const interval = setInterval(detectFaces, 100);
    return () => clearInterval(interval);
  }, [isModelLoaded]);

  return (
    <div className="face-detection">
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          muted
          width="720"
          height="560"
          onPlay={detectFaces}
        />
        <canvas ref={canvasRef} className="face-canvas" />
      </div>
      <div className="detection-info">
        <p>Wajah Terdeteksi: {detectedFaces.length}</p>
        {detectedFaces.map((face, index) => (
          <div key={index} className="face-box">
            <span>Siswa #{index + 1}</span>
            <span>Confidence: {Math.round(face.detection.score * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiFaceDetection;
