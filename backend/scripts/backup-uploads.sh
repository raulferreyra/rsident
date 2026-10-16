#!/usr/bin/env bash
set -euo pipefail

# Run from any directory. Override UPLOADS_DIR/BACKUP_DIR/RETENTION_DAYS as needed.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
UPLOADS_DIR="${UPLOADS_DIR:-$BACKEND_DIR/uploads}"
BACKUP_DIR="${BACKUP_DIR:-$BACKEND_DIR/backups/uploads}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

if [[ ! -d "$UPLOADS_DIR" ]]; then
  echo "Uploads directory does not exist: $UPLOADS_DIR" >&2
  exit 1
fi
mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="$BACKUP_DIR/uploads-$STAMP.tar.gz"

# Archive relative paths to make restoration predictable.
tar -C "$(dirname "$UPLOADS_DIR")" -czf "$ARCHIVE" "$(basename "$UPLOADS_DIR")"
sha256sum "$ARCHIVE" > "$ARCHIVE.sha256"
find "$BACKUP_DIR" -type f \( -name 'uploads-*.tar.gz' -o -name 'uploads-*.tar.gz.sha256' \) -mtime "+$RETENTION_DAYS" -delete

echo "Backup created: $ARCHIVE"
echo "Checksum: $ARCHIVE.sha256"
