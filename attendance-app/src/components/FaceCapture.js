import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';

const FaceCapture = ({ onCapture }) => {
  const webcamRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading face detection models:', error);
      }
    };
    loadModels();
  }, []);

  const capture = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      try {
        // Detect face in the captured image
        const img = await faceapi.bufferToImage(imageSrc);
        const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions());
        
        if (detections) {
          onCapture(imageSrc);
        } else {
          alert('No face detected. Please try again.');
        }
      } catch (error) {
        console.error('Error during face detection:', error);
        alert('Error during face detection. Please try again.');
      }
    }
  };

  if (isLoading) {
    return <div>Loading face detection models...</div>;
  }

  return (
    <div className="face-capture">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        width={640}
        height={480}
      />
      <button onClick={capture}>Capture Photo</button>
    </div>
  );
};

export default FaceCapture;
