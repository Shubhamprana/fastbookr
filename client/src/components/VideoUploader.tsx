import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  account,
  APPWRITE_BUCKET_ID,
  getPublicStorageFileUrl,
  ID,
  storage,
} from "@/lib/appwrite";
import { Film, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Permission, Role } from "appwrite";

const MAX_VIDEO_SIZE_MB = 50;
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

function formatVideoUploadError(error: unknown, fileName: string) {
  const message =
    error && typeof error === "object" && "message" in error && typeof error.message === "string"
      ? error.message
      : "Upload failed.";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("network") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("fetch")
  ) {
    return `Failed to upload ${fileName}: network issue detected. Please check your connection and try again.`;
  }

  if (
    normalized.includes("general_unauthorized_scope") ||
    normalized.includes("not authorized") ||
    normalized.includes("unauthorized") ||
    normalized.includes("missing scope")
  ) {
    return `Failed to upload ${fileName}: your account is not allowed to upload videos right now. Please sign in again and retry.`;
  }

  if (
    normalized.includes("storage_invalid_file_size") ||
    normalized.includes("file size not allowed") ||
    normalized.includes("maximum allowed file size") ||
    normalized.includes("file too large")
  ) {
    return `Failed to upload ${fileName}: this video is too large. Please upload a video under ${MAX_VIDEO_SIZE_MB}MB.`;
  }

  if (
    normalized.includes("storage_file_type_unsupported") ||
    normalized.includes("file type not allowed") ||
    normalized.includes("invalid mime type")
  ) {
    return `Failed to upload ${fileName}: only MP4, WebM, and MOV videos are supported.`;
  }

  return `Failed to upload ${fileName}: upload could not be completed. Please try again.`;
}

interface VideoUploaderProps {
  videoUrl: string;
  onVideoChange: (url: string) => void;
}

export function VideoUploader({ videoUrl, onVideoChange }: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      setUploadProgress(0);
      if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
        const message = "Please upload an MP4, WebM, or MOV video.";
        setUploadError(message);
        toast.error(message);
        return;
      }

      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        const message = `Video must be ${MAX_VIDEO_SIZE_MB}MB or smaller.`;
        setUploadError(message);
        toast.error(message);
        return;
      }

      setUploading(true);
      setStatusText("Preparing video upload...");

      try {
        await account.get();
        setStatusText("Uploading video...");

        const result = await storage.createFile({
          bucketId: APPWRITE_BUCKET_ID,
          fileId: ID.unique(),
          file,
          permissions: [Permission.read(Role.any())],
          onProgress: progress => {
            setUploadProgress(Math.round(progress.progress));
          },
        });

        onVideoChange(getPublicStorageFileUrl(result.$id));
        toast.success(`Uploaded ${file.name}`);
      } catch (error: any) {
        const message = formatVideoUploadError(error, file.name);
        setUploadError(message);
        toast.error(message);
      } finally {
        setUploading(false);
        setUploadProgress(0);
        setStatusText(null);
      }
    },
    [onVideoChange]
  );

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-primary/50 hover:bg-gray-50"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              handleFile(file);
              e.target.value = "";
            }
          }}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {statusText ?? "Uploading video..."}
              {uploadProgress > 0 ? ` ${uploadProgress}%` : ""}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Click to upload one short property video</p>
            <p className="text-xs text-muted-foreground">
              Supports MP4, WebM, MOV up to {MAX_VIDEO_SIZE_MB}MB
            </p>
          </div>
        )}
      </div>

      {videoUrl ? (
        <div className="rounded-lg border bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Film className="h-4 w-4 text-primary" />
              <span>Property walkthrough video</span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onVideoChange("")}>
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
          <video src={videoUrl} controls className="w-full rounded-lg bg-black max-h-72" />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Film className="h-4 w-4" />
          <span>No video uploaded yet. Add one short walkthrough if you have it.</span>
        </div>
      )}

      {uploadError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {uploadError}
        </div>
      )}
    </div>
  );
}
