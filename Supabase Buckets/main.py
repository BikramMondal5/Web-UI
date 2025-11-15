from supabase_video_advanced import SupabaseVideoManager

# Initialize manager
manager = SupabaseVideoManager()

# Upload the video
print("Starting upload...")
result = manager.upload_video(
    file_path="output/short_4.mp4",
    folder="uploads3"
)

if result["success"]:
    print("\n" + "="*60)
    print("✅ VIDEO UPLOADED SUCCESSFULLY!")
    print("="*60)
    print(f"📹 File: {result['file_name']}")
    print(f"📦 Size: {result['file_size'] / (1024*1024):.2f} MB")
    print(f"📍 Path: {result['destination_path']}")
    print(f"🌐 Public URL: {result['public_url']}")
    print("="*60)
else:
    print(f"\n❌ Upload failed: {result['error']}")
