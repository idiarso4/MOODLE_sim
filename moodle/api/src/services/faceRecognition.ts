import * as faceapi from 'face-api.js';
import { Canvas, Image } from 'canvas';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Load models
const modelPath = path.join(process.cwd(), 'models');

// Initialize face-api
faceapi.env.monkeyPatch({ Canvas, Image });

interface FaceDetectionResult {
  faceDetected: boolean;
  confidence?: number;
  landmarks?: any;
  descriptor?: Float32Array;
  error?: string;
}

interface VerificationResult {
  isMatch: boolean;
  confidence: number;
  error?: string;
}

export class FaceRecognitionService {
  private static instance: FaceRecognitionService;
  private modelsLoaded: boolean = false;

  private constructor() {}

  public static getInstance(): FaceRecognitionService {
    if (!FaceRecognitionService.instance) {
      FaceRecognitionService.instance = new FaceRecognitionService();
    }
    return FaceRecognitionService.instance;
  }

  private async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;

    try {
      await Promise.all([
        faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
        faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath)
      ]);
      this.modelsLoaded = true;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load face recognition models: ${error.message}`);
      }
      throw error;
    }
  }

  public async detectFace(imageBuffer: Buffer): Promise<FaceDetectionResult> {
    try {
      await this.loadModels();

      // Load image
      const img = await faceapi.bufferToImage(imageBuffer);
      
      // Detect face
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return {
          faceDetected: false,
          error: 'No face detected in the image'
        };
      }

      return {
        faceDetected: true,
        confidence: detection.detection.score,
        landmarks: detection.landmarks,
        descriptor: detection.descriptor
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          faceDetected: false,
          error: `Face detection failed: ${error.message}`
        };
      }
      return {
        faceDetected: false,
        error: 'Face detection failed with unknown error'
      };
    }
  }

  public async verifyFace(
    storedDescriptor: Float32Array,
    newImageBuffer: Buffer
  ): Promise<VerificationResult> {
    try {
      await this.loadModels();

      // Detect face in new image
      const detection = await this.detectFace(newImageBuffer);

      if (!detection.faceDetected || !detection.descriptor) {
        return {
          isMatch: false,
          confidence: 0,
          error: detection.error || 'No face detected in the new image'
        };
      }

      // Calculate distance between face descriptors
      const distance = faceapi.euclideanDistance(
        storedDescriptor,
        detection.descriptor
      );

      // Convert distance to similarity score (0-1)
      const similarity = 1 - Math.min(distance, 1);
      const threshold = 0.6; // Adjust this threshold based on your needs

      return {
        isMatch: similarity > threshold,
        confidence: similarity
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          isMatch: false,
          confidence: 0,
          error: `Face verification failed: ${error.message}`
        };
      }
      return {
        isMatch: false,
        confidence: 0,
        error: 'Face verification failed with unknown error'
      };
    }
  }

  public async uploadImage(imageBuffer: Buffer): Promise<string> {
    try {
      // Detect face first
      const detection = await this.detectFace(imageBuffer);

      if (!detection.faceDetected) {
        throw new Error(detection.error || 'No face detected in the image');
      }

      // Generate unique filename
      const filename = `${uuidv4()}.jpg`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'faces');
      const filepath = path.join(uploadDir, filename);

      // Ensure upload directory exists
      await fs.mkdir(uploadDir, { recursive: true });

      // Save image
      await fs.writeFile(filepath, imageBuffer);

      // Save face descriptor to database
      if (detection.descriptor) {
        await prisma.faceDescriptor.create({
          data: {
            filename,
            descriptor: Array.from(detection.descriptor),
            confidence: detection.confidence || 0
          }
        });
      }

      return filename;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload face image: ${error.message}`);
      }
      throw error;
    }
  }

  public async getFaceDescriptor(filename: string): Promise<Float32Array | null> {
    try {
      const descriptor = await prisma.faceDescriptor.findUnique({
        where: { filename }
      });

      if (!descriptor) {
        return null;
      }

      return new Float32Array(descriptor.descriptor as number[]);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get face descriptor: ${error.message}`);
      }
      throw error;
    }
  }
}
