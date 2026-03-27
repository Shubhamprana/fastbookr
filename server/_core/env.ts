export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  appwriteEndpoint:
    process.env.APPWRITE_ENDPOINT ?? process.env.VITE_APPWRITE_ENDPOINT ?? "",
  appwriteProjectId:
    process.env.APPWRITE_PROJECT_ID ?? process.env.VITE_APPWRITE_PROJECT_ID ?? "",
  appwriteApiKey: process.env.APPWRITE_API_KEY ?? "",
  appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID ?? "",
  appwriteBucketId:
    process.env.APPWRITE_BUCKET_ID ?? "",
  appwriteUsersCollectionId: process.env.APPWRITE_USERS_COLLECTION_ID ?? "",
  appwritePropertiesCollectionId:
    process.env.APPWRITE_PROPERTIES_COLLECTION_ID ?? "",
  appwriteInquiriesCollectionId:
    process.env.APPWRITE_INQUIRIES_COLLECTION_ID ?? "",
  appwriteOwnerMessagesCollectionId:
    process.env.APPWRITE_OWNER_MESSAGES_COLLECTION_ID ?? "",
  appwritePlatformSettingsCollectionId:
    process.env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID ?? "",
  appwriteContactMessagesCollectionId:
    process.env.APPWRITE_CONTACT_MESSAGES_COLLECTION_ID ?? "",
  adminEmails: process.env.APPWRITE_ADMIN_EMAILS ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  brevoApiKey: process.env.BREVO_API_KEY ?? "",
  brevoAdminEmail: process.env.BREVO_ADMIN_EMAIL ?? "",
  brevoSenderName: process.env.BREVO_SENDER_NAME ?? "",
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL ?? "",
};
