import { PrismaClient, Session } from '@prisma/client';

const prisma = new PrismaClient();

export async function validateQRCode(qrCode: string): Promise<Session | null> {
  try {
    const session = await prisma.session.findFirst({
      where: {
        qrCode,
        status: 'ACTIVE'
      },
      include: {
        schedule: {
          include: {
            class: true
          }
        }
      }
    });

    return session;
  } catch (error) {
    console.error('QR code validation error:', error);
    return null;
  }
}
