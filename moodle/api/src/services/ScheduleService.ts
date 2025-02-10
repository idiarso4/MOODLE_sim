import { PrismaClient, Schedule, Session } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { generateQRCode } from '../utils/qrcode';

const prisma = new PrismaClient();

export class ScheduleService {
    async createSchedule(data: {
        classId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }): Promise<Schedule> {
        // Validate class exists
        const existingClass = await prisma.class.findUnique({
            where: { id: data.classId }
        });

        if (!existingClass) {
            throw new NotFoundError('Class not found');
        }

        // Validate time format and range
        if (!this.isValidTimeFormat(data.startTime) || !this.isValidTimeFormat(data.endTime)) {
            throw new ValidationError('Invalid time format. Use HH:mm');
        }

        return await prisma.schedule.create({
            data,
            include: {
                class: true
            }
        });
    }

    async generateSessions(scheduleId: string, startDate: Date, endDate: Date): Promise<Session[]> {
        const schedule = await prisma.schedule.findUnique({
            where: { id: scheduleId }
        });

        if (!schedule) {
            throw new NotFoundError('Schedule not found');
        }

        const sessions = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            if (currentDate.getDay() === schedule.dayOfWeek) {
                const session = await prisma.session.create({
                    data: {
                        scheduleId,
                        date: currentDate,
                        qrCode: await generateQRCode({
                            scheduleId,
                            date: currentDate.toISOString()
                        })
                    }
                });
                sessions.push(session);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return sessions;
    }

    async updateSchedule(
        id: string,
        data: {
            dayOfWeek?: number;
            startTime?: string;
            endTime?: string;
        }
    ): Promise<Schedule> {
        const schedule = await prisma.schedule.findUnique({
            where: { id }
        });

        if (!schedule) {
            throw new NotFoundError('Schedule not found');
        }

        if (data.startTime && !this.isValidTimeFormat(data.startTime)) {
            throw new ValidationError('Invalid start time format');
        }

        if (data.endTime && !this.isValidTimeFormat(data.endTime)) {
            throw new ValidationError('Invalid end time format');
        }

        return await prisma.schedule.update({
            where: { id },
            data,
            include: {
                class: true,
                sessions: {
                    where: {
                        date: {
                            gte: new Date()
                        }
                    }
                }
            }
        });
    }

    private isValidTimeFormat(time: string): boolean {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }
}
