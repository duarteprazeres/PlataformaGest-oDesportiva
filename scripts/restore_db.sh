#!/bin/bash

# Configuration
CONTAINER_NAME="sports-db"
DB_USER="sports_admin"
DB_NAME="sports_management"

if [ -z "$1" ]; then
  echo "Usage: ./restore_db.sh <backup_file>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file '$BACKUP_FILE' not found!"
  exit 1
fi

echo "WARNING: This will overwrite the database '$DB_NAME' in container '$CONTAINER_NAME'."
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 1
fi

echo "Restoring database from $BACKUP_FILE..."

# Drop and recreate database to ensure clean restore (optional, careful with connections)
# docker exec -t $CONTAINER_NAME dropdb -U $DB_USER $DB_NAME
# docker exec -t $CONTAINER_NAME createdb -U $DB_USER $DB_NAME

# Restore
cat "$BACKUP_FILE" | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME

if [ $? -eq 0 ]; then
  echo "Restore successful!"
else
  echo "Restore failed!"
  exit 1
fi
