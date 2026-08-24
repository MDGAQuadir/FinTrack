#!/bin/bash
# ==============================================================================
# FinTrack Production Automated Database Backup Script
# Creates timestamped, gzip-compressed PostgreSQL dumps with retention management.
# ==============================================================================

set -e

# Configuration
DB_NAME="${POSTGRES_DB:-fintrack}"
DB_USER="${POSTGRES_USER:-gulamabdulquadir}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-/Users/gulamabdulquadir/A Big News/FinTrack/backups}"
RETENTION_DAYS=7

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/fintrack_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "🐘 [FinTrack Backup] Starting automated backup for database '${DB_NAME}'..."

# Execute pg_dump with gzip compression
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --no-owner --clean --if-exists | gzip > "${BACKUP_FILE}"

if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
    FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✅ [FinTrack Backup] Backup completed successfully: ${BACKUP_FILE} (${FILE_SIZE})"
else
    echo "❌ [FinTrack Backup] Backup failed or generated an empty file!"
    exit 1
fi

# Apply 7-day retention policy
echo "🧹 [FinTrack Backup] Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "fintrack_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -exec rm -f {} \;
echo "✨ [FinTrack Backup] Retention cleanup completed."
