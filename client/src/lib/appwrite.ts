import { Account, Client, ID, OAuthProvider } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

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

export { ID, OAuthProvider };
