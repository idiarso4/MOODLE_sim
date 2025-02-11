import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

export interface AuditLogData {
  userId: string;
  action: string;
  resource: string;
  details: any;
  ipAddress: string;
  userAgent: string;
}

export class AuditLogService {
  constructor(private prisma: PrismaClient) {}

  async create(data: AuditLogData) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  async getByUserId(userId: string) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' }
    });
  }

  async getByResource(resource: string) {
    return this.prisma.auditLog.findMany({
      where: { resource },
      orderBy: { timestamp: 'desc' }
    });
  }

  async getByAction(action: string) {
    return this.prisma.auditLog.findMany({
      where: { action },
      orderBy: { timestamp: 'desc' }
    });
  }

  async getByTimeRange(startDate: Date, endDate: Date) {
    return this.prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { timestamp: 'desc' }
    });
  }

  async createFromRequest(req: Request, action: string, resource: string, details: any = {}) {
    const userId = (req.user as any)?.id || 'anonymous';
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.create({
      userId,
      action,
      resource,
      details,
      ipAddress,
      userAgent
    });
  }

  async getLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = filters;

    const where: any = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          user: true
        }
      })
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

// Export singleton instance
export const auditLogService = new AuditLogService(new PrismaClient());
