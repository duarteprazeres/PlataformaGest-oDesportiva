#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/backup_$TIMESTAMP.sql"
CONTAINER_NAME="sports-db"
DB_USER="sports_admin"
DB_NAME="sports_management"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "Starting backup of $DB_NAME from container $CONTAINER_NAME..."
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > "$FILENAME"

if [ $? -eq 0 ]; then
  echo "Backup successful: $FILENAME"
else
  echo "Backup failed!"
  rm "$FILENAME"
  exit 1
fi

# Optional: Remove backups older than 7 days
# find "$BACKUP_DIR" -type f -name "*.sql" -mtime +7 -exec rm {} \;
