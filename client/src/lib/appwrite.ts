import { Account, Client, ID, OAuthProvider, Storage } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID ?? "property-images";

if (!endpoint || !projectId) {
  console.warn(
    "Appwrite environment variables are missing. Set VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID."
  );
}

export const appwriteClient = new Client();

if (endpoint) {
  appwriteClient.setEndpoint(endpoint);
}

if (projectId) {
  appwriteClient.setProject(projectId);
}

export const account = new Account(appwriteClient);
export const storage = new Storage(appwriteClient);
export const APPWRITE_BUCKET_ID = bucketId;

export function getPublicStorageFileUrl(fileId: string) {
  if (!endpoint || !projectId) {
    throw new Error("Appwrite environment variables are missing.");
  }

  const normalizedEndpoint = endpoint.replace(/\/+$/, "");
  const url = new URL(
    `${normalizedEndpoint}/storage/buckets/${encodeURIComponent(bucketId)}/files/${encodeURIComponent(fileId)}/view`
  );
  url.searchParams.set("project", projectId);
  return url.toString();
}

export { ID, OAuthProvider };
