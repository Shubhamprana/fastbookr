import dotenv from "dotenv";
import { Client, Permission, Role, Storage } from "node-appwrite";

dotenv.config({ path: ".env.local" });
dotenv.config();

const endpoint = process.env.APPWRITE_ENDPOINT ?? process.env.VITE_APPWRITE_ENDPOINT;
const projectId =
  process.env.APPWRITE_PROJECT_ID ?? process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const bucketId = process.env.APPWRITE_BUCKET_ID ?? "property-images";
const allowedMediaExtensions = ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov"];
const minimumMaxFileSize = 50 * 1024 * 1024;

if (!endpoint || !projectId || !apiKey) {
  throw new Error(
    "Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY in .env.local"
  );
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const storage = new Storage(client);

async function updateBucketForPublicRead() {
  const bucket = await storage.getBucket({ bucketId });

  await storage.updateBucket({
    bucketId,
    name: bucket.name,
    permissions: [Permission.read(Role.any())],
    fileSecurity: true,
    enabled: bucket.enabled,
    maximumFileSize: Math.max(bucket.maximumFileSize ?? 0, minimumMaxFileSize),
    allowedFileExtensions: Array.from(
      new Set([...(bucket.allowedFileExtensions ?? []), ...allowedMediaExtensions])
    ),
    compression: bucket.compression,
    encryption: bucket.encryption,
    antivirus: bucket.antivirus,
    transformations: bucket.transformations,
  });

  console.log(`Updated bucket '${bucketId}' for public image reads.`);
}

async function updateExistingFiles() {
  const fileList = await storage.listFiles({
    bucketId,
    total: true,
  });

  for (const file of fileList.files) {
    await storage.updateFile({
      bucketId,
      fileId: file.$id,
      name: file.name,
      permissions: [Permission.read(Role.any())],
    });
    console.log(`Updated file permissions for '${file.name}' (${file.$id})`);
  }

  console.log(`Updated ${fileList.files.length} existing file(s).`);
}

async function main() {
  await updateBucketForPublicRead();
  await updateExistingFiles();
}

main().catch(error => {
  console.error("Failed to normalize Appwrite storage permissions:", error);
  process.exitCode = 1;
});
