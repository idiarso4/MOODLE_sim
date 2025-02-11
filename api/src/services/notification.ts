import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

interface NotificationData {
  type: NotificationType;
  message: string;
}

export async function notifyTeacher(teacherId: string, data: NotificationData): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: teacherId,
        type: data.type,
        message: data.message
      }
    });
  } catch (error) {
    console.error('Notification error:', error);
  }
}
