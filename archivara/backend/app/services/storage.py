import hashlib
import io
from typing import Optional, BinaryIO, Tuple
from uuid import uuid4
import aioboto3
from botocore.exceptions import ClientError
import structlog

from app.core.config import settings


logger = structlog.get_logger()


class S3StorageService:
    """Service for handling S3 storage operations"""

    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        self.enabled = bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY)

        if self.enabled:
            self.session = aioboto3.Session(
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            self.endpoint_url = settings.S3_ENDPOINT_URL  # For MinIO in local dev
        else:
            self.session = None
            self.endpoint_url = None
            logger.warning("S3 storage disabled - AWS credentials not configured")
    
    async def upload_file(
        self,
        file_content: BinaryIO,
        file_extension: str,
        folder: str = "papers"
    ) -> Tuple[str, str]:
        """
        Upload a file to S3 and return the URL and hash

        Args:
            file_content: File content as binary stream
            file_extension: File extension (e.g., '.pdf')
            folder: S3 folder/prefix

        Returns:
            Tuple of (file_url, file_hash)
        """
        # Read file content
        content = file_content.read()
        file_content.seek(0)  # Reset for potential re-read

        # Calculate hash
        file_hash = hashlib.sha256(content).hexdigest()

        # Generate unique filename
        file_key = f"{folder}/{uuid4()}{file_extension}"

        # If S3 is not enabled, return placeholder
        if not self.enabled:
            logger.warning("S3 disabled - returning placeholder URL", hash=file_hash)
            return f"/api/v1/files/{file_key}", file_hash

        try:
            async with self.session.client('s3', endpoint_url=self.endpoint_url) as s3:
                # Upload file with public-read ACL
                await s3.put_object(
                    Bucket=self.bucket_name,
                    Key=file_key,
                    Body=content,
                    ContentType=self._get_content_type(file_extension),
                    ACL='public-read'  # Make file publicly accessible
                )

                # Generate URL
                if self.endpoint_url:
                    # MinIO or custom endpoint
                    file_url = f"{self.endpoint_url}/{self.bucket_name}/{file_key}"
                else:
                    # AWS S3
                    file_url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"

                logger.info("File uploaded to S3", key=file_key, hash=file_hash)
                return file_url, file_hash

        except ClientError as e:
            logger.error("Failed to upload file to S3", error=str(e))
            raise
    
    async def download_file(self, file_key: str) -> bytes:
        """Download a file from S3"""
        try:
            async with self.session.client('s3', endpoint_url=self.endpoint_url) as s3:
                response = await s3.get_object(Bucket=self.bucket_name, Key=file_key)
                async with response['Body'] as stream:
                    return await stream.read()
        except ClientError as e:
            logger.error("Failed to download file from S3", key=file_key, error=str(e))
            raise
    
    async def delete_file(self, file_key: str) -> bool:
        """Delete a file from S3"""
        try:
            async with self.session.client('s3', endpoint_url=self.endpoint_url) as s3:
                await s3.delete_object(Bucket=self.bucket_name, Key=file_key)
                logger.info("File deleted from S3", key=file_key)
                return True
        except ClientError as e:
            logger.error("Failed to delete file from S3", key=file_key, error=str(e))
            return False
    
    async def generate_presigned_url(
        self,
        file_key: str,
        expiration: int = 3600
    ) -> Optional[str]:
        """Generate a presigned URL for temporary access"""
        try:
            async with self.session.client('s3', endpoint_url=self.endpoint_url) as s3:
                url = await s3.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': file_key},
                    ExpiresIn=expiration
                )
                return url
        except ClientError as e:
            logger.error("Failed to generate presigned URL", key=file_key, error=str(e))
            return None
    
    async def create_bucket_if_not_exists(self):
        """Create the S3 bucket if it doesn't exist (useful for local dev)"""
        try:
            async with self.session.client('s3', endpoint_url=self.endpoint_url) as s3:
                try:
                    await s3.head_bucket(Bucket=self.bucket_name)
                    logger.info("S3 bucket exists", bucket=self.bucket_name)
                except ClientError as e:
                    if e.response['Error']['Code'] == '404':
                        await s3.create_bucket(Bucket=self.bucket_name)
                        logger.info("Created S3 bucket", bucket=self.bucket_name)
                    else:
                        raise
        except ClientError as e:
            logger.error("Failed to check/create S3 bucket", error=str(e))
            raise
    
    def _get_content_type(self, file_extension: str) -> str:
        """Get content type based on file extension"""
        content_types = {
            '.pdf': 'application/pdf',
            '.zip': 'application/zip',
            '.ipynb': 'application/x-ipynb+json',
            '.yaml': 'application/x-yaml',
            '.yml': 'application/x-yaml',
            '.json': 'application/json',
            '.safetensors': 'application/octet-stream'
        }
        return content_types.get(file_extension.lower(), 'application/octet-stream')


# Singleton instance
storage_service = S3StorageService() 