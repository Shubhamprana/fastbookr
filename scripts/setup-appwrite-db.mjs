import dotenv from "dotenv";
import { Client, Databases } from "node-appwrite";

dotenv.config({ path: ".env.local" });
dotenv.config();

const endpoint = process.env.APPWRITE_ENDPOINT ?? process.env.VITE_APPWRITE_ENDPOINT;
const projectId =
  process.env.APPWRITE_PROJECT_ID ?? process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  throw new Error(
    "Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY in .env.local"
  );
}

const databaseId = "fastbookr";

const collections = [
  {
    id: "users",
    name: "Users",
    attributes: [
      { key: "email", type: "string", size: 320, required: false },
      { key: "name", type: "string", size: 128, required: false },
      { key: "loginMethod", type: "string", size: 64, required: false },
      { key: "role", type: "string", size: 16, required: true },
      { key: "lastSignedIn", type: "string", size: 64, required: false },
    ],
  },
  {
    id: "properties",
    name: "Properties",
    recreate: true,
    attributes: [
      { key: "id", type: "integer", required: true },
      { key: "title", type: "string", size: 255, required: true },
      { key: "description", type: "string", size: 3000, required: true },
      { key: "price", type: "integer", required: true },
      { key: "location", type: "string", size: 255, required: true },
      { key: "city", type: "string", size: 100, required: true },
      { key: "state", type: "string", size: 100, required: true },
      { key: "zipCode", type: "string", size: 20, required: false },
      { key: "propertyType", type: "string", size: 50, required: true },
      { key: "listingType", type: "string", size: 50, required: true },
      { key: "bedrooms", type: "integer", required: true },
      { key: "bathrooms", type: "integer", required: true },
      { key: "squareFeet", type: "integer", required: true },
      { key: "images", type: "string", size: 2500, required: true },
      { key: "featured", type: "boolean", required: true },
      { key: "status", type: "string", size: 20, required: true },
      {
        key: "approvalStatus",
        type: "string",
        size: 20,
        required: true,
      },
      { key: "createdBy", type: "string", size: 36, required: true },
      { key: "extra", type: "string", size: 1000, required: false },
    ],
  },
  {
    id: "inquiries",
    name: "Inquiries",
    attributes: [
      { key: "id", type: "integer", required: true },
      { key: "propertyId", type: "integer", required: true },
      { key: "name", type: "string", size: 255, required: true },
      { key: "email", type: "string", size: 320, required: true },
      { key: "phone", type: "string", size: 50, required: false },
      { key: "message", type: "string", size: 10000, required: true },
      { key: "status", type: "string", size: 20, required: true },
    ],
  },
  {
    id: "owner_messages",
    name: "Owner Messages",
    attributes: [
      { key: "id", type: "integer", required: true },
      { key: "propertyId", type: "integer", required: true },
      { key: "senderRole", type: "string", size: 20, required: true },
      { key: "content", type: "string", size: 10000, required: true },
    ],
  },
  {
    id: "platform_settings",
    name: "Platform Settings",
    attributes: [
      { key: "id", type: "integer", required: true },
      { key: "teamName", type: "string", size: 255, required: true },
      { key: "tagline", type: "string", size: 1000, required: true },
      { key: "contactPhone", type: "string", size: 50, required: true },
      { key: "contactEmail", type: "string", size: 320, required: true },
    ],
  },
  {
    id: "contact_messages",
    name: "Contact Messages",
    attributes: [
      { key: "id", type: "integer", required: true },
      { key: "name", type: "string", size: 255, required: true },
      { key: "email", type: "string", size: 320, required: true },
      { key: "phone", type: "string", size: 50, required: false },
      { key: "subject", type: "string", size: 255, required: false },
      { key: "message", type: "string", size: 10000, required: true },
      { key: "status", type: "string", size: 20, required: true },
    ],
  },
];

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function ensureDatabase() {
  try {
    await databases.get({ databaseId });
    console.log(`Database '${databaseId}' already exists`);
  } catch {
    await databases.create({ databaseId, name: "Fastbookr", enabled: true });
    console.log(`Created database '${databaseId}'`);
  }
}

async function ensureCollection(collection) {
  try {
    await databases.getCollection({ databaseId, collectionId: collection.id });

    if (collection.recreate) {
      await databases.deleteCollection({ databaseId, collectionId: collection.id });
      console.log(`Recreated collection '${collection.id}' with lean schema`);
      await databases.createCollection({
        databaseId,
        collectionId: collection.id,
        name: collection.name,
        enabled: true,
        documentSecurity: false,
      });
      return;
    }

    console.log(`Collection '${collection.id}' already exists`);
  } catch {
    await databases.createCollection({
      databaseId,
      collectionId: collection.id,
      name: collection.name,
      enabled: true,
      documentSecurity: false,
    });
    console.log(`Created collection '${collection.id}'`);
  }
}

async function ensureAttribute(collectionId, attribute) {
  try {
    await databases.getAttribute({
      databaseId,
      collectionId,
      key: attribute.key,
    });
    console.log(`Attribute '${collectionId}.${attribute.key}' already exists`);
    return;
  } catch {
    // Create it below.
  }

  if (attribute.type === "string") {
    await databases.createStringAttribute({
      databaseId,
      collectionId,
      key: attribute.key,
      size: attribute.size,
      required: attribute.required,
    });
  } else if (attribute.type === "integer") {
    await databases.createIntegerAttribute({
      databaseId,
      collectionId,
      key: attribute.key,
      required: attribute.required,
    });
  } else if (attribute.type === "boolean") {
    await databases.createBooleanAttribute({
      databaseId,
      collectionId,
      key: attribute.key,
      required: attribute.required,
    });
  } else if (attribute.type === "float") {
    await databases.createFloatAttribute({
      databaseId,
      collectionId,
      key: attribute.key,
      required: attribute.required,
    });
  } else {
    throw new Error(`Unsupported attribute type '${attribute.type}'`);
  }

  console.log(`Created attribute '${collectionId}.${attribute.key}'`);
}

async function main() {
  await ensureDatabase();

  for (const collection of collections) {
    await ensureCollection(collection);
    for (const attribute of collection.attributes) {
      await ensureAttribute(collection.id, attribute);
    }
  }

  console.log("Appwrite database setup complete.");
  console.log(
    JSON.stringify(
      {
        APPWRITE_DATABASE_ID: databaseId,
        APPWRITE_USERS_COLLECTION_ID: "users",
        APPWRITE_PROPERTIES_COLLECTION_ID: "properties",
        APPWRITE_INQUIRIES_COLLECTION_ID: "inquiries",
        APPWRITE_OWNER_MESSAGES_COLLECTION_ID: "owner_messages",
        APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID: "platform_settings",
        APPWRITE_CONTACT_MESSAGES_COLLECTION_ID: "contact_messages",
      },
      null,
      2
    )
  );
}

main().catch(error => {
  console.error("Failed to provision Appwrite database:", error);
  process.exitCode = 1;
});
