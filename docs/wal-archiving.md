# PostgreSQL WAL Archiving Configuration

Write-Ahead Logging (WAL) archiving allows for Point-in-Time Recovery (PITR), ensuring minimal data loss in case of disaster.

## Configuration Steps

1.  **Modify `postgresql.conf`**
    You need to update the PostgreSQL configuration file. If running in Docker, you may need to mount a custom config file or pass command-line arguments.

    ```ini
    # Enable WAL archiving
    wal_level = replica
    archive_mode = on
    
    # Command to archive WAL files to a safe location (e.g., S3, local directory)
    # Example: Copy to a local directory (ensure permission)
    archive_command = 'test ! -f /var/lib/postgresql/data/archive/%f && cp %p /var/lib/postgresql/data/archive/%f'
    
    # Example: Upload to S3 (requires AWS CLI installed in container)
    # archive_command = 'aws s3 cp %p s3://my-bucket/wal-archive/%f'
    ```

2.  **Restart PostgreSQL**
    Changes to `postgresql.conf` require a restart.
    ```bash
    docker restart sports-db
    ```

3.  **Verify Archiving**
    Check the PostgreSQL logs or the destination directory to ensure WAL files are being created and archived.

## Storage Considerations
- **Retention**: WAL files can grow rapidly. Set up a lifecycle policy (e.g., S3 Lifecycle Rules) to delete old WAL files that are older than your oldest base backup.
- **Security**: Encrypt WAL files at rest if copying to cloud storage.
