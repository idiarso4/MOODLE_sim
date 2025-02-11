import { PrismaClient } from '@prisma/client';
import { AuditLogService } from '../services/auditLog';

const prisma = new PrismaClient();
const auditLogService = new AuditLogService(prisma);

describe('AuditLogService', () => {
  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create an audit log entry', async () => {
    const logData = {
      userId: 'test-user-id',
      action: 'LOGIN',
      resource: 'AUTH',
      details: { ip: '127.0.0.1' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-user-agent'
    };

    const log = await auditLogService.create(logData);

    expect(log).toBeDefined();
    expect(log.userId).toBe(logData.userId);
    expect(log.action).toBe(logData.action);
    expect(log.resource).toBe(logData.resource);
    expect(log.ipAddress).toBe(logData.ipAddress);
    expect(log.userAgent).toBe(logData.userAgent);
  });

  it('should get audit logs by user ID', async () => {
    const userId = 'test-user-id';
    const logData = {
      userId,
      action: 'LOGIN',
      resource: 'AUTH',
      details: { ip: '127.0.0.1' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-user-agent'
    };

    await auditLogService.create(logData);
    await auditLogService.create({
      ...logData,
      action: 'LOGOUT'
    });

    const logs = await auditLogService.getByUserId(userId);

    expect(logs).toHaveLength(2);
    expect(logs[0].userId).toBe(userId);
    expect(logs[1].userId).toBe(userId);
  });

  it('should get audit logs by resource', async () => {
    const resource = 'AUTH';
    const logData = {
      userId: 'test-user-id',
      action: 'LOGIN',
      resource,
      details: { ip: '127.0.0.1' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-user-agent'
    };

    await auditLogService.create(logData);
    await auditLogService.create({
      ...logData,
      userId: 'another-user-id'
    });

    const logs = await auditLogService.getByResource(resource);

    expect(logs).toHaveLength(2);
    expect(logs[0].resource).toBe(resource);
    expect(logs[1].resource).toBe(resource);
  });

  it('should get audit logs by action', async () => {
    const action = 'LOGIN';
    const logData = {
      userId: 'test-user-id',
      action,
      resource: 'AUTH',
      details: { ip: '127.0.0.1' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-user-agent'
    };

    await auditLogService.create(logData);
    await auditLogService.create({
      ...logData,
      userId: 'another-user-id'
    });

    const logs = await auditLogService.getByAction(action);

    expect(logs).toHaveLength(2);
    expect(logs[0].action).toBe(action);
    expect(logs[1].action).toBe(action);
  });

  it('should get audit logs by time range', async () => {
    const logData = {
      userId: 'test-user-id',
      action: 'LOGIN',
      resource: 'AUTH',
      details: { ip: '127.0.0.1' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-user-agent'
    };

    await auditLogService.create(logData);
    
    const startTime = new Date(Date.now() - 1000); // 1 second ago
    const endTime = new Date(Date.now() + 1000); // 1 second from now

    const logs = await auditLogService.getByTimeRange(startTime, endTime);

    expect(logs).toHaveLength(1);
    expect(logs[0].timestamp).toBeInstanceOf(Date);
    expect(logs[0].timestamp.getTime()).toBeGreaterThan(startTime.getTime());
    expect(logs[0].timestamp.getTime()).toBeLessThan(endTime.getTime());
  });
});
