# MOODLE Attendance System

A modern attendance management system built with security and efficiency in mind. This system leverages facial recognition for automated attendance tracking in educational institutions.

## Features

- 👤 Facial Recognition-based Attendance
- 📊 Real-time Attendance Dashboard
- 📱 Mobile-Responsive Interface
- 📋 Comprehensive Reports Generation
- 🔒 Secure User Authentication
- 📝 Audit Logging
- 💾 Automated Database Backups

## Technology Stack

### Backend
- Node.js with TypeScript
- Express.js for RESTful API
- Prisma ORM for database operations
- PostgreSQL for data storage
- face-api.js for facial recognition
- JWT for secure authentication
- bcrypt for password hashing

### Frontend
- React with TypeScript
- Ant Design for UI components
- Axios for API communication
- React Query for state management

### DevOps & Infrastructure
- Docker for containerization
- Docker Compose for multi-container orchestration
- GitHub Actions for CI/CD (if configured)

## Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation and sanitization
- ✅ Comprehensive audit logging
- ✅ Secure backup management
- ✅ CORS protection
- ✅ Environment-based configuration

## Installation & Setup

### Prerequisites
- Docker Desktop
- Node.js 16+
- npm or yarn

### Environment Setup
1. Clone the repository
2. Create a `.env` file based on `.env.example`
3. Configure your environment variables (see Configuration section)

### Development Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Docker Setup
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down
```

## Default Credentials

### Application Access
- URL: http://localhost:8080
- Admin Username: admin
- Admin Password: admin_password

### Database Management (PHPMyAdmin)
- URL: http://localhost:8081
- Username: root
- Password: moodle_root_password

## Data Management

### Backup
Data is persisted in Docker volumes:
- `moodle_data`: Application files
- `moodledb_data`: Database files

The system includes automated backup functionality with encryption support.

## Development Guidelines

- Follow TypeScript best practices
- Write unit tests for new features
- Use conventional commits
- Document API endpoints
- Follow security best practices

## API Documentation

API documentation is available at `/api/docs` when running in development mode.

## Security Considerations

1. Always change default credentials in production
2. Use strong passwords
3. Keep dependencies updated
4. Enable HTTPS in production
5. Regularly backup data
6. Monitor audit logs
7. Follow security best practices

## Support

For support and bug reports, please create an issue in the repository.

## License

This project is proprietary and confidential.
