#!/bin/bash

# Configuration
BACKUP_DIR="/backups"
POSTGRES_HOST=${POSTGRES_HOST:-"db"}
POSTGRES_USER=${POSTGRES_USER:-"postgres"}
POSTGRES_DB=${POSTGRES_DB:-"attendance"}
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${POSTGRES_DB}_${DATE}.sql.gz"
RETENTION_DAYS=7

# Create backup
echo "Creating backup: $BACKUP_FILE"
PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER $POSTGRES_DB | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully"
    
    # Delete old backups
    echo "Cleaning up old backups..."
    find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Create symlink to latest backup
    LATEST_LINK="$BACKUP_DIR/latest.sql.gz"
    ln -sf "$BACKUP_FILE" "$LATEST_LINK"
else
    echo "Backup failed"
    exit 1
fi
