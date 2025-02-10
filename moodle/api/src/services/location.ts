import { Class } from '@prisma/client';

interface Location {
  latitude: number;
  longitude: number;
}

export function validateLocation(location: Location, classData: Class): boolean {
  // TODO: Implement actual location validation logic
  // This is a mock implementation that always returns true
  return true;
}
