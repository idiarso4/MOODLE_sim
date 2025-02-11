import client from 'prom-client';

// Create a Registry to store metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Total requests counter
export const totalRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Active users gauge
export const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Number of currently active users'
});

// Face recognition attempts counter
export const faceRecognitionAttempts = new client.Counter({
  name: 'face_recognition_attempts_total',
  help: 'Total number of face recognition attempts',
  labelNames: ['status']
});

// QR code scans counter
export const qrCodeScans = new client.Counter({
  name: 'qr_code_scans_total',
  help: 'Total number of QR code scans',
  labelNames: ['status']
});

// Attendance records counter
export const attendanceRecords = new client.Counter({
  name: 'attendance_records_total',
  help: 'Total number of attendance records',
  labelNames: ['status', 'method']
});

// API errors counter
export const apiErrors = new client.Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['route', 'error_type']
});

// Register all metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(totalRequests);
register.registerMetric(activeUsers);
register.registerMetric(faceRecognitionAttempts);
register.registerMetric(qrCodeScans);
register.registerMetric(attendanceRecords);
register.registerMetric(apiErrors);

export { register };
