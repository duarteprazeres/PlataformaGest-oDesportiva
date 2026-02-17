# Disaster Recovery Plan

This document outlines the procedures for recovering the sports management platform in the event of data loss or system failure.

## 1. Backup Restoration (Standard)

Use this method to restore from a daily logical backup (`.sql` file).

**Prerequisites:**
- Access to the backup file (locally or in cloud storage).
- `restore_db.sh` script.
- Running Docker container `sports-db`.

**Steps:**
1.  Locate the backup file:
    ```bash
    ls -l ./backups
    ```
2.  Run the restore script:
    ```bash
    npm run db:restore -- ./backups/backup_YYYYMMDD_HHMMSS.sql
    ```
3.  Verify data integrity by logging into the application or querying the database.

## 2. Point-in-Time Recovery (PITR)

Use this method if you need to restore to a specific timestamp (e.g., right before an accidental `DROP TABLE`). **Requires configured WAL Archiving (see `wal-archiving.md`).**

**Steps:**
1.  **Stop the database**: `docker stop sports-db`.
2.  **Restore Base Backup**: Restore the file system level backup (or base backup) taken *before* the target time.
3.  **Configure `recovery.signal`**: Create a file named `recovery.signal` in the data directory.
4.  **Configure `postgresql.conf`**:
    ```ini
    restore_command = 'cp /path/to/archive/%f %p' # Command to retrieve WAL files
    recovery_target_time = '2023-10-27 12:00:00'   # Target timestamp
    ```
5.  **Start the database**: `docker start sports-db`. Postgres will replay WAL logs up to the target time.
6.  **Verify**: Check logs for recovery completion.

## 3. Application Failure

If the backend server fails to start:
1.  **Check Logs**:
    ```bash
    cat apps/backend/logs/error.log
    docker logs sports-backend
    ```
2.  **Check Health**:
    ```bash
    curl http://localhost:3000/health
    ```
3.  **Restart Services**:
    ```bash
    docker-compose restart
    npm run backend:start
    ```

## 4. Connectivity Issues (E.g. Docker Paused)

If `ERR_CONNECTION_REFUSED` or database timeout occurs:
1.  Check Docker status: `docker ps`.
2.  If Docker is paused or stopped, restart it.
3.  Restart containers: `docker-compose up -d postgres redis`.
