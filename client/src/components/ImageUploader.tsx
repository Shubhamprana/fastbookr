import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatAppErrorMessage } from "@/lib/errors";
import { prepareImageForUpload } from "@/lib/imageUpload";
import { MAX_PROPERTY_IMAGE_UPLOAD_MB } from "@shared/const";
import { toast } from "sonner";

const MAX_IMAGE_COUNT = 4;
const RETRYABLE_UPLOAD_PATTERNS = [
  "failed to fetch",
  "networkerror",
  "network request failed",
  "timeout",
  "temporarily unavailable",
  "502",
  "503",
  "504",
];

function shouldRetryUpload(error: unknown) {
  const message = formatAppErrorMessage(error, "Upload failed.").toLowerCase();
  return RETRYABLE_UPLOAD_PATTERNS.some(pattern => message.includes(pattern));
}

async function delay(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

function formatImageUploadError(error: unknown, fileName: string) {
  const rawMessage = formatAppErrorMessage(error, "Upload failed.");

  if (
    rawMessage.includes("is not valid JSON") &&
    rawMessage.includes('"Request')
  ) {
    return `Failed to upload ${fileName}: the image is too large for the current upload flow. Please use an image under ${MAX_PROPERTY_IMAGE_UPLOAD_MB}MB.`;
  }

  return `Failed to upload ${fileName}: ${rawMessage}`;
}

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function ImageUploader({ images, onImagesChange }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = trpc.upload.image.useMutation();

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setUploadError(null);
    const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      const message = "Please select image files only";
      setUploadError(message);
      toast.error(message);
      return;
    }

    const availableSlots = Math.max(MAX_IMAGE_COUNT - images.length, 0);

    if (availableSlots === 0) {
      const message = `You can upload up to ${MAX_IMAGE_COUNT} images per property.`;
      setUploadError(message);
      toast.error(message);
      return;
    }

    if (fileArray.length > availableSlots) {
      const message = `Only ${availableSlots} image slot${availableSlots > 1 ? "s" : ""} left for this property.`;
      setUploadError(message);
      toast.error(message);
    }

    const limitedFiles = fileArray.slice(0, availableSlots);

    setUploading(prev => prev + limitedFiles.length);
    setStatusText("Preparing images for upload...");
    const nextImages = [...images];

    for (const file of limitedFiles) {
      try {
        setStatusText(`Optimizing ${file.name}...`);
        const prepared = await prepareImageForUpload(file);
        setStatusText(`Uploading ${file.name}...`);

        let result: Awaited<ReturnType<typeof uploadImage.mutateAsync>>;

        try {
          result = await uploadImage.mutateAsync({
            base64: prepared.base64,
            filename: file.name,
            contentType: prepared.contentType,
          });
        } catch (error) {
          if (!shouldRetryUpload(error)) {
            throw error;
          }

          setStatusText(`Retrying ${file.name}...`);
          await delay(800);
          result = await uploadImage.mutateAsync({
            base64: prepared.base64,
            filename: file.name,
            contentType: prepared.contentType,
          });
        }

        nextImages.push(result.url);
        onImagesChange([...nextImages]);
        if (prepared.didOptimize) {
          toast.success(`Uploaded ${file.name} after optimizing it for mobile upload`);
          continue;
        }
        toast.success(`Uploaded ${file.name}`);
      } catch (error: any) {
        const message = formatImageUploadError(error, file.name);
        setUploadError(message);
        toast.error(message);
      } finally {
        setUploading(prev => prev - 1);
      }
    }

    setStatusText(null);
  }, [images, onImagesChange, uploadImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  return (
    <div className="space-y-3">
      {/* Drag and drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
              e.target.value = ""; // Reset so same file can be selected again
            }
          }}
        />
        
        {uploading > 0 ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {statusText ?? `Uploading ${uploading} image${uploading > 1 ? "s" : ""}...`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag & drop images here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Upload up to {MAX_IMAGE_COUNT} images. Large photos are automatically optimized before upload.
            </p>
          </div>
        )}
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border bg-gray-50">
              <img
                src={url}
                alt={`Property image ${index + 1}`}
                className="w-full h-24 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "";
                  (e.target as HTMLImageElement).className = "w-full h-24 bg-gray-200 flex items-center justify-center";
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-xs text-center py-0.5">
                  Cover
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span>No images uploaded yet. You can add up to {MAX_IMAGE_COUNT} images and the first one will be the cover photo.</span>
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
