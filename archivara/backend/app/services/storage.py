import hashlib
from typing import Optional, BinaryIO, Tuple
from uuid import uuid4
import structlog

from app.core.config import settings

logger = structlog.get_logger()


class SupabaseStorageService:
    """Service for handling Supabase Storage operations"""

    def __init__(self):
        self.bucket_name = "papers"
        self.enabled = bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY)

        if self.enabled:
            try:
                from supabase import create_client, Client
                self.client: Client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SERVICE_KEY
                )
                logger.info("Supabase storage enabled")
            except Exception as e:
                logger.error("Failed to initialize Supabase client", error=str(e))
                self.enabled = False
                self.client = None
        else:
            self.client = None
            logger.warning("Supabase storage disabled - credentials not configured")

    async def upload_file(
        self,
        file_content: BinaryIO,
        file_extension: str,
        folder: str = "submissions"
    ) -> Tuple[str, str]:
        """
        Upload a file to Supabase Storage and return the URL and hash

        Args:
            file_content: File content as binary stream
            file_extension: File extension (e.g., '.pdf')
            folder: Storage folder/prefix

        Returns:
            Tuple of (file_url, file_hash)
        """
        # Read file content
        content = file_content.read()
        file_content.seek(0)  # Reset for potential re-read

        # Calculate hash
        file_hash = hashlib.sha256(content).hexdigest()

        # Generate unique filename
        file_path = f"{folder}/{uuid4()}{file_extension}"

        # If Supabase is not enabled, return placeholder
        if not self.enabled:
            logger.warning("Supabase disabled - returning placeholder URL", hash=file_hash)
            return f"/api/v1/files/{file_path}", file_hash

        try:
            # Upload to Supabase Storage
            res = self.client.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=content,
                file_options={
                    "content-type": self._get_content_type(file_extension),
                    "cache-control": "3600",
                    "upsert": "false"
                }
            )

            # Get public URL
            file_url = self.client.storage.from_(self.bucket_name).get_public_url(file_path)

            logger.info("File uploaded to Supabase", path=file_path, hash=file_hash)
            return file_url, file_hash

        except Exception as e:
            logger.error("Failed to upload file to Supabase", error=str(e))
            # Return placeholder on error
            return f"/api/v1/files/{file_path}", file_hash

    def _get_content_type(self, file_extension: str) -> str:
        """Get content type based on file extension"""
        content_types = {
            '.pdf': 'application/pdf',
            '.tex': 'application/x-tex',
            '.zip': 'application/zip',
            '.ipynb': 'application/x-ipynb+json',
            '.yaml': 'application/x-yaml',
            '.yml': 'application/x-yaml',
            '.json': 'application/json',
            '.safetensors': 'application/octet-stream'
        }
        return content_types.get(file_extension.lower(), 'application/octet-stream')


# Singleton instance - use Supabase Storage
storage_service = SupabaseStorageService()
