from supabase import create_client, Client
from dotenv import load_dotenv
import os
from pathlib import Path
from typing import Optional, Dict, List
import mimetypes

# Load environment variables
load_dotenv()

class SupabaseVideoManager:
    
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.bucket_name = os.getenv("BUCKET_NAME", "videos")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
    
    def _get_content_type(self, file_path: str) -> str:
        mime_type, _ = mimetypes.guess_type(file_path)
        return mime_type or 'video/mp4'
    
    def upload_video(
        self, 
        file_path: str, 
        destination_path: Optional[str] = None,
        folder: Optional[str] = None,
        upsert: bool = False
    ) -> Dict:

        try:
            # Validate file
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
            
            # Get file info
            file_size = os.path.getsize(file_path)
            file_name = os.path.basename(file_path)
            
            # Construct destination path
            if destination_path is None:
                if folder:
                    destination_path = f"{folder}/{file_name}"
                else:
                    destination_path = file_name
            
            # Read file
            with open(file_path, 'rb') as f:
                video_data = f.read()
            
            # Get content type
            content_type = self._get_content_type(file_path)
            
            print(f"📤 Uploading {file_name} ({file_size / (1024*1024):.2f} MB)...")
            
            # Upload to Supabase
            file_options = {
                "content-type": content_type,
                "upsert": str(upsert).lower()
            }
            
            response = self.client.storage.from_(self.bucket_name).upload(
                path=destination_path,
                file=video_data,
                file_options=file_options
            )
            
            # Get public URL
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(destination_path)
            
            print(f"✅ Upload successful!")
            
            return {
                "success": True,
                "file_name": file_name,
                "destination_path": destination_path,
                "public_url": public_url,
                "file_size": file_size,
                "content_type": content_type
            }
            
        except Exception as e:
            print(f"❌ Upload failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def upload_multiple_videos(
        self, 
        file_paths: List[str], 
        folder: Optional[str] = None
    ) -> List[Dict]:
        results = []
        for file_path in file_paths:
            result = self.upload_video(file_path, folder=folder)
            results.append(result)
        return results
    
    def list_videos(self, folder: str = "", limit: int = 100) -> List[Dict]:
        try:
            files = self.client.storage.from_(self.bucket_name).list(
                path=folder,
                options={"limit": limit}
            )
            print(f"📂 Found {len(files)} file(s)")
            return files
        except Exception as e:
            print(f"❌ Error listing files: {str(e)}")
            return []
    
    def download_video(self, remote_path: str, local_path: str) -> bool:
        try:
            video_data = self.client.storage.from_(self.bucket_name).download(remote_path)
            
            # Create directories if needed
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            with open(local_path, 'wb') as f:
                f.write(video_data)
            
            print(f"✅ Downloaded: {local_path}")
            return True
            
        except Exception as e:
            print(f"❌ Download failed: {str(e)}")
            return False
    
    def delete_video(self, remote_path: str) -> bool:
        try:
            self.client.storage.from_(self.bucket_name).remove([remote_path])
            print(f"✅ Deleted: {remote_path}")
            return True
        except Exception as e:
            print(f"❌ Delete failed: {str(e)}")
            return False
    
    def get_public_url(self, remote_path: str) -> str:
        return self.client.storage.from_(self.bucket_name).get_public_url(remote_path)
    
    def get_signed_url(self, remote_path: str, expires_in: int = 3600) -> Optional[str]:
        try:
            result = self.client.storage.from_(self.bucket_name).create_signed_url(
                remote_path, 
                expires_in
            )
            return result['signedURL']
        except Exception as e:
            print(f"❌ Error creating signed URL: {str(e)}")
            return None
    
    def move_video(self, from_path: str, to_path: str) -> bool:
        try:
            self.client.storage.from_(self.bucket_name).move(from_path, to_path)
            print(f"✅ Moved: {from_path} → {to_path}")
            return True
        except Exception as e:
            print(f"❌ Move failed: {str(e)}")
            return False
    
    def create_bucket(self, bucket_name: str, public: bool = True) -> bool:
        try:
            self.client.storage.create_bucket(
                bucket_name,
                options={"public": public}
            )
            print(f"✅ Bucket created: {bucket_name}")
            return True
        except Exception as e:
            print(f"❌ Bucket creation failed: {str(e)}")
            return False


# Example usage
if __name__ == "__main__":
    # Initialize manager
    manager = SupabaseVideoManager()
    
    # Upload a video
    print("\n=== Upload Video ===")
    result = manager.upload_video(
        file_path="path/to/your/video.mp4",
        folder="uploads"
    )
    
    if result["success"]:
        print(f"URL: {result['public_url']}")
        print(f"Size: {result['file_size'] / (1024*1024):.2f} MB")
    
    # List videos
    print("\n=== List Videos ===")
    videos = manager.list_videos(folder="uploads")
    for video in videos:
        print(f"  📹 {video['name']}")
    
    # Get signed URL
    print("\n=== Get Signed URL ===")
    signed_url = manager.get_signed_url("uploads/video.mp4", expires_in=7200)
    if signed_url:
        print(f"Temporary URL: {signed_url}")
