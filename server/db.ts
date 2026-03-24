import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET ?? "property-images";
const adminEmails = new Set(
  (process.env.SUPABASE_ADMIN_EMAILS ?? "")
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)
);

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
  images: string;
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

function assertEnv(value: string, name: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSupabaseAdmin() {
  return createClient(
    assertEnv(supabaseUrl, "VITE_SUPABASE_URL"),
    assertEnv(supabaseServiceRoleKey, "SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function mapUser(row: Record<string, any>): AppUser {
  return {
    id: row.id,
    openId: row.id,
    email: row.email ?? null,
    name: row.name ?? null,
    role: row.role === "admin" ? "admin" : "user",
    loginMethod: row.login_method ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSignedIn: row.last_signed_in,
  };
}

function mapProperty(row: Record<string, any>): PropertyRecord {
  let normalizedImages =
    typeof row.images === "string" ? row.images : JSON.stringify(row.images ?? []);

  try {
    const parsed = JSON.parse(normalizedImages);
    if (typeof parsed === "string") {
      normalizedImages = parsed;
    }
  } catch {
    // Keep original string when it is already a plain URL or JSON array string.
  }

  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    price: Number(row.price),
    location: row.location,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code ?? null,
    propertyType: row.property_type,
    listingType: row.listing_type,
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    squareFeet: Number(row.square_feet),
    images: normalizedImages,
    featured: Boolean(row.featured),
    status: row.status,
    approvalStatus: row.approval_status ?? "pending",
    feeStatus: row.fee_status ?? "open",
    createdBy: row.created_by,
    ownerName: row.owner_name ?? null,
    ownerEmail: row.owner_email ?? null,
    ownerPhone: row.owner_phone ?? null,
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInquiry(row: Record<string, any>): InquiryRecord {
  return {
    id: Number(row.id),
    propertyId: Number(row.property_id),
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapOwnerMessage(row: Record<string, any>): OwnerMessageRecord {
  return {
    id: Number(row.id),
    propertyId: Number(row.property_id),
    senderRole: row.sender_role === "admin" ? "admin" : "owner",
    content: row.content,
    createdAt: row.created_at,
  };
}

function mapPlatformSettings(row: Record<string, any>): PlatformSettingsRecord {
  return {
    id: Number(row.id),
    teamName: row.team_name,
    tagline: row.tagline,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    updatedAt: row.updated_at,
  };
}

function mapContactMessage(row: Record<string, any>): ContactMessageRecord {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    subject: row.subject ?? null,
    message: row.message,
    status: row.status === "reviewed" || row.status === "closed" ? row.status : "new",
    createdAt: row.created_at,
  };
}

function normalizeImages(images: unknown): string {
  if (typeof images === "string") {
    return images;
  }
  return JSON.stringify(images ?? []);
}

function normalizePropertyPayload(property: Record<string, any>) {
  return {
    title: property.title,
    description: property.description,
    price: property.price,
    location: property.location,
    city: property.city,
    state: property.state,
    zip_code: property.zipCode ?? null,
    property_type: property.propertyType,
    listing_type: property.listingType,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    square_feet: property.squareFeet,
    images: normalizeImages(property.images),
    featured: Boolean(property.featured),
    status: property.status ?? "available",
    approval_status: property.approvalStatus ?? "pending",
    fee_status: property.feeStatus ?? "open",
    owner_name: property.ownerName ?? null,
    owner_email: property.ownerEmail ?? null,
    owner_phone: property.ownerPhone ?? null,
    ...(property.createdBy ? { created_by: property.createdBy } : {}),
    latitude: property.latitude ?? null,
    longitude: property.longitude ?? null,
  };
}

function inferLoginMethod(user: any): string | null {
  const provider =
    user.app_metadata?.provider ??
    user.identities?.[0]?.provider ??
    user.user_metadata?.provider;

  return typeof provider === "string" ? provider : null;
}

function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && adminEmails.has(email.toLowerCase()));
}

export async function getUserFromAccessToken(accessToken: string): Promise<AppUser | null> {
  if (!accessToken) return null;

  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error: authError,
  } = await (supabase.auth as any).getUser(accessToken);

  if (authError || !user) {
    return null;
  }

  const loginMethod = inferLoginMethod(user);
  const role: AppUser["role"] = isAdminEmail(user.email) ? "admin" : "user";

  const upsertPayload = {
    id: user.id,
    email: user.email ?? null,
    name:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : user.email ?? null,
    login_method: loginMethod,
    role,
    last_signed_in: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("users")
    .upsert(upsertPayload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to sync user with Supabase: ${error.message}`);
  }

  return mapUser(data);
}

export async function upsertUser(user: LegacyInsertUser): Promise<void> {
  await getSupabaseAdmin().from("users").upsert(
    {
      id: user.openId,
      email: user.email ?? null,
      name: user.name ?? null,
      login_method: user.loginMethod ?? null,
      role: user.role ?? "user",
      last_signed_in: user.lastSignedIn?.toISOString() ?? new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}

export async function getUserByOpenId(openId: string): Promise<AppUser | undefined> {
  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .select("*")
    .eq("id", openId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return data ? mapUser(data) : undefined;
}

function applyPropertyFilters(
  query: any,
  filters: PropertyFilters
) {
  let next: any = query;
  if (filters.city) next = next.eq("city", filters.city);
  if (filters.propertyType) next = next.eq("property_type", filters.propertyType);
  if (filters.listingType) next = next.eq("listing_type", filters.listingType);
  if (filters.minPrice !== undefined) next = next.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) next = next.lte("price", filters.maxPrice);
  if (filters.bedrooms !== undefined) next = next.gte("bedrooms", filters.bedrooms);
  if (filters.bathrooms !== undefined) next = next.gte("bathrooms", filters.bathrooms);
  return next;
}

export async function getAllProperties(): Promise<PropertyRecord[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("properties")
    .select("*")
    .eq("approval_status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch properties: ${error.message}`);
  }

  return (data ?? []).map(mapProperty);
}

export async function getFeaturedProperties(): Promise<PropertyRecord[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("properties")
    .select("*")
    .eq("featured", true)
    .eq("approval_status", "approved")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    throw new Error(`Failed to fetch featured properties: ${error.message}`);
  }

  return (data ?? []).map(mapProperty);
}

export async function getPropertyById(id: number): Promise<PropertyRecord | undefined> {
  const { data, error } = await getSupabaseAdmin()
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch property: ${error.message}`);
  }

  return data ? mapProperty(data) : undefined;
}

export async function getAdminPropertyById(id: number): Promise<PropertyRecord | undefined> {
  const { data, error } = await getSupabaseAdmin()
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch admin property: ${error.message}`);
  }

  return data ? mapProperty(data) : undefined;
}

export async function searchProperties(filters: PropertyFilters) {
  let query = getSupabaseAdmin()
    .from("properties")
    .select("*")
    .eq("approval_status", "approved");

  query = applyPropertyFilters(query, filters);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to search properties: ${error.message}`);
  }

  return (data ?? []).map(mapProperty);
}

export async function getAdminProperties(filters: PropertyFilters = {}) {
  let query = getSupabaseAdmin().from("properties").select("*");
  query = applyPropertyFilters(query, filters);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to search properties: ${error.message}`);
  }

  return (data ?? []).map(mapProperty);
}

export async function getOwnerProperties(ownerId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("properties")
    .select("*")
    .eq("created_by", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch owner properties: ${error.message}`);
  }

  return (data ?? []).map(mapProperty);
}

export async function createProperty(property: Record<string, any>) {
  const { data, error } = await getSupabaseAdmin()
    .from("properties")
    .insert(normalizePropertyPayload(property))
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create property: ${error.message}`);
  }

  return mapProperty(data);
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
  const { data, error } = await getSupabaseAdmin()
    .from("properties")
    .update(normalizePropertyPayload(property))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update property: ${error.message}`);
  }

  return mapProperty(data);
}

export async function deleteProperty(id: number) {
  const { error } = await getSupabaseAdmin().from("properties").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete property: ${error.message}`);
  }

  return { success: true } as const;
}

export async function createInquiry(inquiry: Record<string, any>) {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiries")
    .insert({
      property_id: inquiry.propertyId,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone ?? null,
      message: inquiry.message,
      status: inquiry.status ?? "new",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create inquiry: ${error.message}`);
  }

  return mapInquiry(data);
}

export async function getInquiriesByProperty(propertyId: number) {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiries")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch inquiries: ${error.message}`);
  }

  return (data ?? []).map(mapInquiry);
}

export async function getAllInquiries() {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch inquiries: ${error.message}`);
  }

  return (data ?? []).map(mapInquiry);
}

export async function getOwnerMessages(ownerId: string) {
  const ownerProperties = await getOwnerProperties(ownerId);
  const propertyIds = ownerProperties.map((property: PropertyRecord) => property.id);

  if (propertyIds.length === 0) {
    return [] as OwnerMessageRecord[];
  }

  const { data, error } = await getSupabaseAdmin()
    .from("owner_messages")
    .select("*")
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch owner messages: ${error.message}`);
  }

  return (data ?? []).map(mapOwnerMessage);
}

export async function getPropertyMessages(propertyId: number) {
  const { data, error } = await getSupabaseAdmin()
    .from("owner_messages")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch property messages: ${error.message}`);
  }

  return (data ?? []).map(mapOwnerMessage);
}

export async function createOwnerMessage(input: {
  propertyId: number;
  senderRole: "admin" | "owner";
  content: string;
}) {
  const { data, error } = await getSupabaseAdmin()
    .from("owner_messages")
    .insert({
      property_id: input.propertyId,
      sender_role: input.senderRole,
      content: input.content,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create owner message: ${error.message}`);
  }

  return mapOwnerMessage(data);
}

export async function getPlatformSettings() {
  const { data, error } = await getSupabaseAdmin()
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch platform settings: ${error.message}`);
  }

  if (!data) {
    return {
      id: 1,
      teamName: "RealEstate Pro Match Team",
      tagline: "We qualify tenants before connecting them to owners.",
      contactPhone: "+1 (555) 123-4567",
      contactEmail: "agent@realestatepro.com",
    } satisfies PlatformSettingsRecord;
  }

  return mapPlatformSettings(data);
}

export async function upsertPlatformSettings(input: {
  teamName: string;
  tagline: string;
  contactPhone: string;
  contactEmail: string;
}) {
  const { data, error } = await getSupabaseAdmin()
    .from("platform_settings")
    .upsert(
      {
        id: 1,
        team_name: input.teamName,
        tagline: input.tagline,
        contact_phone: input.contactPhone,
        contact_email: input.contactEmail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update platform settings: ${error.message}`);
  }

  return mapPlatformSettings(data);
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}) {
  const { data, error } = await getSupabaseAdmin()
    .from("contact_messages")
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      subject: input.subject ?? null,
      message: input.message,
      status: "new",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create contact message: ${error.message}`);
  }

  return mapContactMessage(data);
}

export async function getAllContactMessages() {
  const { data, error } = await getSupabaseAdmin()
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch contact messages: ${error.message}`);
  }

  return (data ?? []).map(mapContactMessage);
}

export async function updateContactMessageStatus(
  id: number,
  status: "new" | "reviewed" | "closed"
) {
  const { data, error } = await getSupabaseAdmin()
    .from("contact_messages")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update contact message: ${error.message}`);
  }

  return mapContactMessage(data);
}

export async function updateInquiryStatus(id: number, status: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiries")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update inquiry: ${error.message}`);
  }

  return mapInquiry(data);
}

export async function uploadPropertyImage(
  key: string,
  data: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(storageBucket)
    .upload(key, data, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: publicData } = supabase.storage.from(storageBucket).getPublicUrl(key);

  return {
    key,
    url: publicData.publicUrl,
  };
}
