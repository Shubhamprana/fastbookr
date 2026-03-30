import {
  Account,
  Client,
  Databases,
  ID,
  Models,
  Permission,
  Query,
  Role,
  Storage,
} from "node-appwrite";
import { InputFile } from "node-appwrite/file";

const appwriteEndpoint =
  process.env.APPWRITE_ENDPOINT ?? process.env.VITE_APPWRITE_ENDPOINT ?? "";
const appwriteProjectId =
  process.env.APPWRITE_PROJECT_ID ?? process.env.VITE_APPWRITE_PROJECT_ID ?? "";
const appwriteApiKey = process.env.APPWRITE_API_KEY ?? "";
const appwriteDatabaseId = process.env.APPWRITE_DATABASE_ID ?? "";
const storageBucket = process.env.APPWRITE_BUCKET_ID ?? "property-images";
const collectionIds = {
  users: process.env.APPWRITE_USERS_COLLECTION_ID ?? "",
  properties: process.env.APPWRITE_PROPERTIES_COLLECTION_ID ?? "",
  inquiries: process.env.APPWRITE_INQUIRIES_COLLECTION_ID ?? "",
  ownerMessages: process.env.APPWRITE_OWNER_MESSAGES_COLLECTION_ID ?? "",
  platformSettings: process.env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID ?? "",
  contactMessages: process.env.APPWRITE_CONTACT_MESSAGES_COLLECTION_ID ?? "",
};
const collectionEnvNames = {
  users: "APPWRITE_USERS_COLLECTION_ID",
  properties: "APPWRITE_PROPERTIES_COLLECTION_ID",
  inquiries: "APPWRITE_INQUIRIES_COLLECTION_ID",
  ownerMessages: "APPWRITE_OWNER_MESSAGES_COLLECTION_ID",
  platformSettings: "APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID",
  contactMessages: "APPWRITE_CONTACT_MESSAGES_COLLECTION_ID",
} as const;
const adminEmails = new Set(
  (process.env.APPWRITE_ADMIN_EMAILS ?? "")
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)
);

const MAX_LIST_LIMIT = 5000;
const PLATFORM_SETTINGS_DOC_ID = "platform-settings";

export type AppUser = {
  id: string;
  openId?: string;
  email: string | null;
  name: string | null;
  role: "user" | "admin";
  loginMethod: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastSignedIn?: string;
};

export type PropertyRecord = {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  city: string;
  state: string;
  zipCode: string | null;
  propertyType: string;
  listingType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  areaText: string | null;
  images: string;
  videoUrl: string | null;
  furnishing: string | null;
  parking: string | null;
  balcony: string | null;
  availableFor: string | null;
  genderPreference: string | null;
  foodIncluded: boolean | null;
  attachedBathroom: boolean | null;
  plotFacing: string | null;
  rejectionReason: string | null;
  featured: boolean;
  status: string;
  approvalStatus: "pending" | "approved" | "rejected";
  feeStatus: "open" | "won" | "paid";
  createdBy: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type InquiryRecord = {
  id: number;
  propertyId: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  createdAt?: string;
};

export type OwnerMessageRecord = {
  id: number;
  propertyId: number;
  senderRole: "admin" | "owner";
  content: string;
  createdAt?: string;
};

export type PlatformSettingsRecord = {
  id: number;
  teamName: string;
  tagline: string;
  contactPhone: string;
  contactEmail: string;
  updatedAt?: string;
};

export type ContactMessageRecord = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "new" | "reviewed" | "closed";
  createdAt?: string;
};

type PropertyFilters = {
  city?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
};

type LegacyInsertUser = {
  openId: string;
  email?: string | null;
  name?: string | null;
  loginMethod?: string | null;
  role?: "user" | "admin";
  lastSignedIn?: Date;
};

type UserDocument = Models.Document & {
  email?: string | null;
  name?: string | null;
  loginMethod?: string | null;
  role?: "user" | "admin";
  lastSignedIn?: string;
};

type PropertyDocument = Models.Document & {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  city: string;
  state: string;
  zipCode?: string | null;
  propertyType: string;
  listingType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  images: string;
  featured: boolean;
  status: string;
  approvalStatus: "pending" | "approved" | "rejected";
  createdBy: string;
  extra?: string | null;
};

type InquiryDocument = Models.Document & {
  id: number;
  propertyId: number;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  status: string;
};

type OwnerMessageDocument = Models.Document & {
  id: number;
  propertyId: number;
  senderRole: "admin" | "owner";
  content: string;
};

type PlatformSettingsDocument = Models.Document & {
  id: number;
  teamName: string;
  tagline: string;
  contactPhone: string;
  contactEmail: string;
};

type ContactMessageDocument = Models.Document & {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: "new" | "reviewed" | "closed";
};

function assertEnv(value: string, name: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalCollectionId(name: keyof typeof collectionIds) {
  return collectionIds[name];
}

function requireCollectionId(name: keyof typeof collectionIds) {
  return assertEnv(collectionIds[name], collectionEnvNames[name]);
}

function getAppwriteAdminClient() {
  return new Client()
    .setEndpoint(assertEnv(appwriteEndpoint, "APPWRITE_ENDPOINT"))
    .setProject(assertEnv(appwriteProjectId, "APPWRITE_PROJECT_ID"))
    .setKey(assertEnv(appwriteApiKey, "APPWRITE_API_KEY"));
}

function getAppwriteUserClient(jwt: string) {
  return new Client()
    .setEndpoint(assertEnv(appwriteEndpoint, "APPWRITE_ENDPOINT"))
    .setProject(assertEnv(appwriteProjectId, "APPWRITE_PROJECT_ID"))
    .setJWT(jwt);
}

function getDatabases() {
  return new Databases(getAppwriteAdminClient());
}

function getPublicFileUrl(fileId: string) {
  const endpoint = assertEnv(appwriteEndpoint, "APPWRITE_ENDPOINT").replace(/\/+$/, "");
  const projectId = assertEnv(appwriteProjectId, "APPWRITE_PROJECT_ID");
  const bucketId = assertEnv(storageBucket, "APPWRITE_BUCKET_ID");
  const url = new URL(
    `${endpoint}/storage/buckets/${encodeURIComponent(bucketId)}/files/${encodeURIComponent(
      fileId
    )}/view`
  );
  url.searchParams.set("project", projectId);
  return url.toString();
}

function normalizeImages(images: unknown): string {
  if (typeof images === "string") {
    return images;
  }
  return JSON.stringify(images ?? []);
}

function parseImageUrls(images: unknown): string[] {
  if (Array.isArray(images)) {
    return images.filter((value): value is string => typeof value === "string" && value.length > 0);
  }

  if (typeof images !== "string" || !images.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string" && value.length > 0)
      : typeof parsed === "string"
        ? [parsed]
        : [];
  } catch {
    return images
      .split(",")
      .map(value => value.trim())
      .filter(Boolean);
  }
}

function toNullableBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return null;
}

function sanitizeExtraPropertyDetails(property: Record<string, any>) {
  const propertyType = property.propertyType;
  const listingType = property.listingType;
  const usesFurnishing = propertyType !== "land";
  const usesParking = ["house", "apartment", "condo", "townhouse", "villa", "independent-floor"].includes(propertyType);
  const usesBalcony = ["house", "apartment", "condo", "townhouse", "villa", "independent-floor", "studio"].includes(propertyType);
  const usesAvailableFor = listingType === "rent" || listingType === "co-living";
  const usesGenderPreference = ["room", "shared-room", "pg/hostel"].includes(propertyType);
  const usesFoodIncluded = propertyType === "pg/hostel";
  const usesAttachedBathroom = ["room", "shared-room", "studio", "pg/hostel"].includes(propertyType);
  const usesPlotFacing = propertyType === "land";

  return {
    furnishing: usesFurnishing ? property.furnishing ?? null : null,
    parking: usesParking ? property.parking ?? null : null,
    balcony: usesBalcony ? property.balcony ?? null : null,
    availableFor: usesAvailableFor ? property.availableFor ?? null : null,
    genderPreference: usesGenderPreference ? property.genderPreference ?? null : null,
    foodIncluded: usesFoodIncluded ? toNullableBoolean(property.foodIncluded) : null,
    attachedBathroom: usesAttachedBathroom ? toNullableBoolean(property.attachedBathroom) : null,
    plotFacing: usesPlotFacing ? property.plotFacing ?? null : null,
    rejectionReason: property.approvalStatus === "rejected" ? property.rejectionReason ?? null : null,
  };
}

function getStorage() {
  return new Storage(getAppwriteAdminClient());
}

function extractFileIdFromMediaUrl(url: string | null | undefined) {
  if (!url) return null;
  const match = url.match(/\/files\/([^/]+)\/view/i);
  return match?.[1] ?? null;
}

async function cleanupMediaUrls(urls: string[]) {
  const fileIds = Array.from(
    new Set(
      urls
        .map(extractFileIdFromMediaUrl)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (fileIds.length === 0) return;

  const storage = getStorage();
  for (const fileId of fileIds) {
    try {
      await storage.deleteFile({
        bucketId: assertEnv(storageBucket, "APPWRITE_BUCKET_ID"),
        fileId,
      });
    } catch (error) {
      console.warn(`[Storage] Failed to delete unused media ${fileId}:`, error);
    }
  }
}

function buildNumericId() {
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return Number(`${Date.now()}${suffix}`);
}

function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && adminEmails.has(email.toLowerCase()));
}

function mapUser(doc: UserDocument): AppUser {
  return {
    id: doc.$id,
    openId: doc.$id,
    email: doc.email ?? null,
    name: doc.name ?? null,
    role: doc.role === "admin" ? "admin" : "user",
    loginMethod: doc.loginMethod ?? null,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
    lastSignedIn: doc.lastSignedIn ?? doc.$updatedAt,
  };
}

function mapProperty(doc: PropertyDocument): PropertyRecord {
  let normalizedImages = doc.images;
  let extra: Record<string, any> = {};

  try {
    const parsed = JSON.parse(normalizedImages);
    if (typeof parsed === "string") {
      normalizedImages = parsed;
    }
  } catch {
    // Keep original string if it is already a URL or JSON array string.
  }

  try {
    extra = typeof doc.extra === "string" ? JSON.parse(doc.extra) : {};
  } catch {
    extra = {};
  }

  return {
    id: Number(doc.id),
    title: doc.title,
    description: doc.description,
    price: Number(doc.price),
    location: doc.location,
    city: doc.city,
    state: doc.state,
    zipCode: doc.zipCode ?? null,
    propertyType: doc.propertyType,
    listingType: doc.listingType,
    bedrooms: Number(doc.bedrooms),
    bathrooms: Number(doc.bathrooms),
    squareFeet: Number(doc.squareFeet),
    areaText: extra.areaText ?? null,
    images: normalizedImages,
    videoUrl: extra.videoUrl ?? null,
    furnishing: extra.furnishing ?? null,
    parking: extra.parking ?? null,
    balcony: extra.balcony ?? null,
    availableFor: extra.availableFor ?? null,
    genderPreference: extra.genderPreference ?? null,
    foodIncluded: typeof extra.foodIncluded === "boolean" ? extra.foodIncluded : null,
    attachedBathroom: typeof extra.attachedBathroom === "boolean" ? extra.attachedBathroom : null,
    plotFacing: extra.plotFacing ?? null,
    rejectionReason: extra.rejectionReason ?? null,
    featured: Boolean(doc.featured),
    status: doc.status,
    approvalStatus: doc.approvalStatus ?? "pending",
    feeStatus: extra.feeStatus ?? "open",
    createdBy: doc.createdBy,
    ownerName: extra.ownerName ?? null,
    ownerEmail: extra.ownerEmail ?? null,
    ownerPhone: extra.ownerPhone ?? null,
    latitude: extra.latitude ?? null,
    longitude: extra.longitude ?? null,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}

function mapInquiry(doc: InquiryDocument): InquiryRecord {
  return {
    id: Number(doc.id),
    propertyId: Number(doc.propertyId),
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? null,
    message: doc.message,
    status: doc.status,
    createdAt: doc.$createdAt,
  };
}

function mapOwnerMessage(doc: OwnerMessageDocument): OwnerMessageRecord {
  return {
    id: Number(doc.id),
    propertyId: Number(doc.propertyId),
    senderRole: doc.senderRole,
    content: doc.content,
    createdAt: doc.$createdAt,
  };
}

function mapPlatformSettings(doc: PlatformSettingsDocument): PlatformSettingsRecord {
  return {
    id: Number(doc.id),
    teamName: doc.teamName,
    tagline: doc.tagline,
    contactPhone: doc.contactPhone,
    contactEmail: doc.contactEmail,
    updatedAt: doc.$updatedAt,
  };
}

function mapContactMessage(doc: ContactMessageDocument): ContactMessageRecord {
  return {
    id: Number(doc.id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? null,
    subject: doc.subject ?? null,
    message: doc.message,
    status: doc.status,
    createdAt: doc.$createdAt,
  };
}

async function listDocuments<T extends Models.Document>(
  collectionId: string,
  queries: string[] = []
) {
  const response = await getDatabases().listDocuments<T>({
    databaseId: assertEnv(appwriteDatabaseId, "APPWRITE_DATABASE_ID"),
    collectionId,
    queries,
  });

  return response.documents;
}

async function getDocumentByField<T extends Models.Document>(
  collectionId: string,
  field: string,
  value: string | number | boolean
) {
  const documents = await listDocuments<T>(collectionId, [
    Query.equal(field, value),
    Query.limit(1),
  ]);

  return documents[0];
}

async function upsertDocument<T extends Models.Document>(
  collectionId: string,
  documentId: string,
  data: Record<string, any>
) {
  const databases = getDatabases();
  const databaseId = assertEnv(appwriteDatabaseId, "APPWRITE_DATABASE_ID");

  try {
    return await databases.updateDocument<T>({
      databaseId,
      collectionId,
      documentId,
      data: data as any,
    });
  } catch {
    return databases.createDocument<T>({
      databaseId,
      collectionId,
      documentId,
      data: data as any,
    });
  }
}

function normalizePropertyPayload(property: Record<string, any>) {
  const extraDetails = sanitizeExtraPropertyDetails(property);
  return {
    title: property.title,
    description: property.description,
    price: Number(property.price),
    location: property.location,
    city: property.city,
    state: property.state,
    zipCode: property.zipCode ?? null,
    propertyType: property.propertyType,
    listingType: property.listingType,
    bedrooms: Number(property.bedrooms),
    bathrooms: Number(property.bathrooms),
    squareFeet: Number(property.squareFeet),
    images: normalizeImages(property.images),
    featured: Boolean(property.featured),
    status: property.status ?? "available",
    approvalStatus: property.approvalStatus ?? "pending",
    createdBy: property.createdBy,
    extra: JSON.stringify({
      feeStatus: property.feeStatus ?? "open",
      ownerName: property.ownerName ?? null,
      ownerEmail: property.ownerEmail ?? null,
      ownerPhone: property.ownerPhone ?? null,
      latitude: property.latitude ?? null,
      longitude: property.longitude ?? null,
      videoUrl: property.videoUrl ?? null,
      areaText: property.areaText ?? null,
      ...extraDetails,
    }),
  };
}

async function inferLoginMethod(account: Account) {
  try {
    const identities = await account.listIdentities();
    return identities.identities?.[0]?.provider ?? null;
  } catch {
    return null;
  }
}

export async function getUserFromAccessToken(accessToken: string): Promise<AppUser | null> {
  if (!accessToken) return null;

  try {
    const account = new Account(getAppwriteUserClient(accessToken));
    const currentUser = await account.get();
    const loginMethod = await inferLoginMethod(account);
    const role: AppUser["role"] = isAdminEmail(currentUser.email) ? "admin" : "user";
    const usersCollectionId = optionalCollectionId("users");

    if (usersCollectionId) {
      const syncedUser = await upsertDocument<UserDocument>(usersCollectionId, currentUser.$id, {
        email: currentUser.email ?? null,
        name: currentUser.name || currentUser.email || null,
        loginMethod,
        role,
        lastSignedIn: new Date().toISOString(),
      });
      return mapUser(syncedUser);
    }

    return {
      id: currentUser.$id,
      openId: currentUser.$id,
      email: currentUser.email ?? null,
      name: currentUser.name || currentUser.email || null,
      role,
      loginMethod,
      createdAt: currentUser.$createdAt,
      updatedAt: currentUser.$updatedAt,
      lastSignedIn: currentUser.$updatedAt,
    };
  } catch {
    return null;
  }
}

export async function upsertUser(user: LegacyInsertUser): Promise<void> {
  const usersCollectionId = requireCollectionId("users");

  await upsertDocument<UserDocument>(usersCollectionId, user.openId, {
    email: user.email ?? null,
    name: user.name ?? null,
    loginMethod: user.loginMethod ?? null,
    role: user.role ?? (isAdminEmail(user.email) ? "admin" : "user"),
    lastSignedIn: (user.lastSignedIn ?? new Date()).toISOString(),
  });
}

export async function getUserByOpenId(openId: string): Promise<AppUser | undefined> {
  const usersCollectionId = requireCollectionId("users");

  try {
    const document = await getDatabases().getDocument<UserDocument>({
      databaseId: assertEnv(appwriteDatabaseId, "APPWRITE_DATABASE_ID"),
      collectionId: usersCollectionId,
      documentId: openId,
    });
    return mapUser(document);
  } catch {
    return undefined;
  }
}

export async function getAllProperties(): Promise<PropertyRecord[]> {
  const documents = await listDocuments<PropertyDocument>(requireCollectionId("properties"), [
    Query.equal("approvalStatus", "approved"),
    Query.orderDesc("$createdAt"),
    Query.limit(MAX_LIST_LIMIT),
  ]);

  return documents.map(mapProperty);
}

export async function getFeaturedProperties(): Promise<PropertyRecord[]> {
  const documents = await listDocuments<PropertyDocument>(requireCollectionId("properties"), [
    Query.equal("featured", true),
    Query.equal("approvalStatus", "approved"),
    Query.orderDesc("$createdAt"),
    Query.limit(6),
  ]);

  return documents.map(mapProperty);
}

export async function getPropertyById(id: number): Promise<PropertyRecord | undefined> {
  const document = await getDocumentByField<PropertyDocument>(
    requireCollectionId("properties"),
    "id",
    id
  );

  if (!document || document.approvalStatus !== "approved") {
    return undefined;
  }

  return mapProperty(document);
}

export async function getAdminPropertyById(id: number): Promise<PropertyRecord | undefined> {
  const document = await getDocumentByField<PropertyDocument>(
    requireCollectionId("properties"),
    "id",
    id
  );

  return document ? mapProperty(document) : undefined;
}

export async function searchProperties(filters: PropertyFilters) {
  const queries = [Query.equal("approvalStatus", "approved"), Query.orderDesc("$createdAt")];

  if (filters.city) queries.push(Query.equal("city", filters.city));
  if (filters.propertyType) queries.push(Query.equal("propertyType", filters.propertyType));
  if (filters.listingType) queries.push(Query.equal("listingType", filters.listingType));
  if (filters.minPrice !== undefined) queries.push(Query.greaterThanEqual("price", filters.minPrice));
  if (filters.maxPrice !== undefined) queries.push(Query.lessThanEqual("price", filters.maxPrice));
  if (filters.bedrooms !== undefined) queries.push(Query.greaterThanEqual("bedrooms", filters.bedrooms));
  if (filters.bathrooms !== undefined) {
    queries.push(Query.greaterThanEqual("bathrooms", filters.bathrooms));
  }

  queries.push(Query.limit(MAX_LIST_LIMIT));

  const documents = await listDocuments<PropertyDocument>(requireCollectionId("properties"), queries);
  return documents.map(mapProperty);
}

export async function getAdminProperties(filters: PropertyFilters = {}) {
  const queries = [Query.orderDesc("$createdAt"), Query.limit(MAX_LIST_LIMIT)];

  if (filters.city) queries.push(Query.equal("city", filters.city));
  if (filters.propertyType) queries.push(Query.equal("propertyType", filters.propertyType));
  if (filters.listingType) queries.push(Query.equal("listingType", filters.listingType));
  if (filters.minPrice !== undefined) queries.push(Query.greaterThanEqual("price", filters.minPrice));
  if (filters.maxPrice !== undefined) queries.push(Query.lessThanEqual("price", filters.maxPrice));
  if (filters.bedrooms !== undefined) queries.push(Query.greaterThanEqual("bedrooms", filters.bedrooms));
  if (filters.bathrooms !== undefined) {
    queries.push(Query.greaterThanEqual("bathrooms", filters.bathrooms));
  }

  const documents = await listDocuments<PropertyDocument>(requireCollectionId("properties"), queries);
  return documents.map(mapProperty);
}

export async function getOwnerProperties(ownerId: string) {
  const documents = await listDocuments<PropertyDocument>(requireCollectionId("properties"), [
    Query.equal("createdBy", ownerId),
    Query.orderDesc("$createdAt"),
    Query.limit(MAX_LIST_LIMIT),
  ]);

  return documents.map(mapProperty);
}

export async function createProperty(property: Record<string, any>) {
  const id = Number(property.id ?? buildNumericId());
  const document = await getDatabases().createDocument<PropertyDocument>({
    databaseId: assertEnv(appwriteDatabaseId, "APPWRITE_DATABASE_ID"),
    collectionId: requireCollectionId("properties"),
    documentId: ID.unique(),
    data: {
      id,
      ...normalizePropertyPayload(property),
    },
  });

  return mapProperty(document);
}

export async function createOwnerListing(property: Record<string, any>) {
  return createProperty({
    ...property,
    approvalStatus: "pending",
    feeStatus: "open",
    featured: false,
  });
}

export async function updateProperty(id: number, property: Record<string, any>) {
  const existing = await getDocumentByField<PropertyDocument>(
    requireCollectionId("properties"),
    "id",
    id
  );

  if (!existing) {
    throw new Error(`Property ${id} not found`);
  }

  const existingProperty = mapProperty(existing);
  const previousMediaUrls = [
    ...parseImageUrls(existingProperty.images),
    ...(existingProperty.videoUrl ? [existingProperty.videoUrl] : []),
  ];

  const document = await getDatabases().updateDocument<PropertyDocument>({
    databaseId: assertEnv(appwriteDatabaseId, "APPWRITE_DATABASE_ID"),
    collectionId: requireCollectionId("properties"),
    documentId: existing.$id,
    data: {
      id,
      ...normalizePropertyPayload({
        ...existingProperty,
        ...property,
        createdBy: property.createdBy ?? property.created_by ?? existing.createdBy,
      }),
    },
  });

  const updatedProperty = mapProperty(document);
  const nextMediaUrls = [
    ...parseImageUrls(updatedProperty.images),
    ...(updatedProperty.videoUrl ? [updatedProperty.videoUrl] : []),
  ];
  const removedMediaUrls = previousMediaUrls.filter(url => !nextMediaUrls.includes(url));
  await cleanupMediaUrls(removedMediaUrls);

  return updatedProperty;
}

export async function deleteProperty(id: number) {
  const existing = await getDocumentByField<PropertyDocument>(
    requireCollectionId("properties"),
    "id",
    id
  );

  if (!existing) {
    throw new Error(`Property ${id} not found`);
  }

  const existingProperty = mapProperty(existing);

  await getDatabases().deleteDocument({
    databaseId: assertEnv(appwriteDatabaseId, "APPWRITE_DATABASE_ID"),
    collectionId: requireCollectionId("properties"),
    documentId: existing.$id,
  });

  await cleanupMediaUrls([
    ...parseImageUrls(existingProperty.images),
    ...(existingProperty.videoUrl ? [existingProperty.videoUrl] : []),
  ]);

  return { success: true } as const;
}

export async function createInquiry(inquiry: Record<string, any>) {
  const document = await getDatabases().createDocument<InquiryDocument>({
    databaseId: assertEnv(appwriteDatabaseId, "APPWRITE_DATABASE_ID"),
    collectionId: requireCollectionId("inquiries"),
    documentId: ID.unique(),
    data: {
      id: buildNumericId(),
      propertyId: Number(inquiry.propertyId),
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone ?? null,
      message: inquiry.message,
      status: inquiry.status ?? "new",
    },
  });

  return mapInquiry(document);
}

export async function getInquiriesByProperty(propertyId: number) {
  const documents = await listDocuments<InquiryDocument>(requireCollectionId("inquiries"), [
    Query.equal("propertyId", propertyId),
    Query.orderDesc("$createdAt"),
    Query.limit(MAX_LIST_LIMIT),
  ]);

  return documents.map(mapInquiry);
}

export async function getAllInquiries() {
  const documents = await listDocuments<InquiryDocument>(requireCollectionId("inquiries"), [
    Query.orderDesc("$createdAt"),
    Query.limit(MAX_LIST_LIMIT),
  ]);

  return documents.map(mapInquiry);
}

export async function getOwnerMessages(ownerId: string) {
  const ownerProperties = await getOwnerProperties(ownerId);
  const propertyIds = ownerProperties.map(property => property.id);

  if (propertyIds.length === 0) {
    return [] as OwnerMessageRecord[];
  }

  const documents = await listDocuments<OwnerMessageDocument>(
    requireCollectionId("ownerMessages"),
    [Query.equal("propertyId", propertyIds), Query.orderDesc("$createdAt"), Query.limit(MAX_LIST_LIMIT)]
  );

  return documents.map(mapOwnerMessage);
}

export async function getPropertyMessages(propertyId: number) {
  const documents = await listDocuments<OwnerMessageDocument>(
    requireCollectionId("ownerMessages"),
    [Query.equal("propertyId", propertyId), Query.orderDesc("$createdAt"), Query.limit(MAX_LIST_LIMIT)]
  );

  return documents.map(mapOwnerMessage);
}

export async function createOwnerMessage(input: {
  propertyId: number;
  senderRole: "admin" | "owner";
  content: string;
}) {
  const document = await getDatabases().createDocument<OwnerMessageDocument>({
    databaseId: assertEnv(appwriteDatabaseId, "APPWRITE_DATABASE_ID"),
    collectionId: requireCollectionId("ownerMessages"),
    documentId: ID.unique(),
    data: {
      id: buildNumericId(),
      propertyId: Number(input.propertyId),
      senderRole: input.senderRole,
      content: input.content,
    },
  });

  return mapOwnerMessage(document);
}

export async function getPlatformSettings() {
  const collectionId = requireCollectionId("platformSettings");
  const databaseId = assertEnv(appwriteDatabaseId, "APPWRITE_DATABASE_ID");

  try {
    const document = await getDatabases().getDocument<PlatformSettingsDocument>({
      databaseId,
      collectionId,
      documentId: PLATFORM_SETTINGS_DOC_ID,
    });
    return mapPlatformSettings(document);
  } catch {
    return {
      id: 1,
      teamName: "Fastbookr Team",
      tagline: "We qualify tenants before connecting them to owners.",
      contactPhone: "+1 (555) 123-4567",
      contactEmail: "team@fastbookr.com",
    } satisfies PlatformSettingsRecord;
  }
}

export async function upsertPlatformSettings(input: {
  teamName: string;
  tagline: string;
  contactPhone: string;
  contactEmail: string;
}) {
  const document = await upsertDocument<PlatformSettingsDocument>(
    requireCollectionId("platformSettings"),
    PLATFORM_SETTINGS_DOC_ID,
    {
      id: 1,
      teamName: input.teamName,
      tagline: input.tagline,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
    }
  );

  return mapPlatformSettings(document);
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}) {
  const document = await getDatabases().createDocument<ContactMessageDocument>({
    databaseId: assertEnv(appwriteDatabaseId, "APPWRITE_DATABASE_ID"),
    collectionId: requireCollectionId("contactMessages"),
    documentId: ID.unique(),
    data: {
      id: buildNumericId(),
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      subject: input.subject ?? null,
      message: input.message,
      status: "new",
    },
  });

  return mapContactMessage(document);
}

export async function getAllContactMessages() {
  const documents = await listDocuments<ContactMessageDocument>(
    requireCollectionId("contactMessages"),
    [Query.orderDesc("$createdAt"), Query.limit(MAX_LIST_LIMIT)]
  );

  return documents.map(mapContactMessage);
}

export async function updateContactMessageStatus(
  id: number,
  status: "new" | "reviewed" | "closed"
) {
  const existing = await getDocumentByField<ContactMessageDocument>(
    requireCollectionId("contactMessages"),
    "id",
    id
  );

  if (!existing) {
    throw new Error(`Contact message ${id} not found`);
  }

  const document = await getDatabases().updateDocument<ContactMessageDocument>({
    databaseId: assertEnv(appwriteDatabaseId, "APPWRITE_DATABASE_ID"),
    collectionId: requireCollectionId("contactMessages"),
    documentId: existing.$id,
    data: { status },
  });

  return mapContactMessage(document);
}

export async function updateInquiryStatus(id: number, status: string) {
  const existing = await getDocumentByField<InquiryDocument>(
    requireCollectionId("inquiries"),
    "id",
    id
  );

  if (!existing) {
    throw new Error(`Inquiry ${id} not found`);
  }

  const document = await getDatabases().updateDocument<InquiryDocument>({
    databaseId: assertEnv(appwriteDatabaseId, "APPWRITE_DATABASE_ID"),
    collectionId: requireCollectionId("inquiries"),
    documentId: existing.$id,
    data: { status },
  });

  return mapInquiry(document);
}

async function uploadPropertyMedia(
  key: string,
  data: Buffer,
  _contentType: string
): Promise<{ key: string; url: string }> {
  const fileId = ID.unique();
  const fileName = key.split("/").pop() || `${fileId}.jpg`;
  const storage = new Storage(getAppwriteAdminClient());

  await storage.createFile({
    bucketId: assertEnv(storageBucket, "APPWRITE_BUCKET_ID"),
    fileId,
    file: InputFile.fromBuffer(data, fileName),
    permissions: [Permission.read(Role.any())],
  });

  return {
    key: fileId,
    url: getPublicFileUrl(fileId),
  };
}

export async function uploadPropertyImage(
  key: string,
  data: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  return uploadPropertyMedia(key, data, contentType);
}

export async function uploadPropertyVideo(
  key: string,
  data: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  return uploadPropertyMedia(key, data, contentType);
}
