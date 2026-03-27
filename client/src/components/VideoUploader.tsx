import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Film, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

const MAX_VIDEO_SIZE_MB = 30;
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

interface VideoUploaderProps {
  videoUrl: string;
  onVideoChange: (url: string) => void;
}

export function VideoUploader({ videoUrl, onVideoChange }: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadVideo = trpc.upload.video.useMutation();

  const handleFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
        const message = "Please upload an MP4, WebM, or MOV video.";
        setUploadError(message);
        toast.error(message);
        return;
      }

      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        const message = `Video must be ${MAX_VIDEO_SIZE_MB}MB or smaller.`;
        setUploadError(message);
        toast.error(message);
        return;
      }

      setUploading(true);

      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const result = await uploadVideo.mutateAsync({
          base64,
          filename: file.name,
          contentType: file.type,
        });

        onVideoChange(result.url);
        toast.success(`Uploaded ${file.name}`);
      } catch (error: any) {
        const message = `Failed to upload ${file.name}: ${error.message}`;
        setUploadError(message);
        toast.error(message);
      } finally {
        setUploading(false);
      }
    },
    [onVideoChange, uploadVideo]
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
            <p className="text-sm text-muted-foreground">Uploading video...</p>
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
