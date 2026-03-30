import { z } from "zod";

const propertyTypeValues = [
  "house",
  "apartment",
  "condo",
  "townhouse",
  "villa",
  "showroom",
  "land",
  "room",
  "studio",
  "shared-room",
  "pg/hostel",
  "independent-floor",
] as const;

const listingTypeValues = ["sale", "rent", "co-living"] as const;
const approvalStatusValues = ["pending", "approved", "rejected"] as const;
const feeStatusValues = ["open", "won", "paid"] as const;
const propertyStatusValues = ["available", "pending", "rented", "sold"] as const;
const furnishingValues = ["unfurnished", "semi-furnished", "fully-furnished"] as const;
const parkingValues = ["none", "bike", "car", "both"] as const;
const balconyValues = ["0", "1", "2", "3+"] as const;
const availableForValues = ["any", "family", "bachelors", "students", "working-professionals"] as const;
const genderPreferenceValues = ["any", "male", "female"] as const;
const plotFacingValues = [
  "north",
  "south",
  "east",
  "west",
  "north-east",
  "north-west",
  "south-east",
  "south-west",
] as const;

const propertyTypesWithoutBedrooms = new Set([
  "land",
  "showroom",
  "room",
  "shared-room",
  "studio",
  "pg/hostel",
]);

const propertyTypesWithoutBathrooms = new Set(["land"]);

function usesBedroomCount(propertyType: string) {
  return !propertyTypesWithoutBedrooms.has(propertyType);
}

function usesBathroomCount(propertyType: string) {
  return !propertyTypesWithoutBathrooms.has(propertyType);
}

const nullableString = z.string().trim().nullable().optional();
const rejectionReasonSchema = z.string().trim().max(1000).nullable().optional();

export const idInputSchema = z.object({
  id: z.number().int().positive(),
});

export const propertyIdInputSchema = z.object({
  propertyId: z.number().int().positive(),
});

export const propertySearchInputSchema = z.object({
  city: z.string().trim().min(1).optional(),
  propertyType: z.enum(propertyTypeValues).optional(),
  listingType: z.enum(listingTypeValues).optional(),
  minPrice: z.number().int().nonnegative().optional(),
  maxPrice: z.number().int().nonnegative().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
});

const basePropertySchema = z
  .object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(10, "Description must be at least 10 characters.").max(5000),
    price: z.number().int().positive(),
    location: z.string().trim().min(3).max(255),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    zipCode: z.string().trim().max(20).nullable().optional(),
    propertyType: z.enum(propertyTypeValues),
    listingType: z.enum(listingTypeValues),
    bedrooms: z.number().int().nonnegative(),
    bathrooms: z.number().int().nonnegative(),
    squareFeet: z.number().int().positive(),
    areaText: z.string().trim().min(1).max(100).nullable().optional(),
    images: z.array(z.string().url()).min(1).max(4),
    videoUrl: z.string().url().nullable().optional(),
    furnishing: z.enum(furnishingValues).nullable().optional(),
    parking: z.enum(parkingValues).nullable().optional(),
    balcony: z.enum(balconyValues).nullable().optional(),
    availableFor: z.enum(availableForValues).nullable().optional(),
    genderPreference: z.enum(genderPreferenceValues).nullable().optional(),
    foodIncluded: z.boolean().nullable().optional(),
    attachedBathroom: z.boolean().nullable().optional(),
    plotFacing: z.enum(plotFacingValues).nullable().optional(),
    rejectionReason: rejectionReasonSchema,
    featured: z.boolean().optional(),
    status: z.enum(propertyStatusValues).optional(),
    approvalStatus: z.enum(approvalStatusValues).optional(),
    feeStatus: z.enum(feeStatusValues).optional(),
    ownerName: z.string().trim().min(2).max(120).nullable().optional(),
    ownerEmail: z.string().email().nullable().optional(),
    ownerPhone: z.string().trim().min(5).max(30).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (!usesBedroomCount(value.propertyType) && value.bedrooms !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bedrooms"],
        message: `${value.propertyType} listings should not include bedroom count.`,
      });
    }

    if (usesBedroomCount(value.propertyType) && value.bedrooms < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bedrooms"],
        message: "Bedroom count must be at least 1 for this property type.",
      });
    }

    if (!usesBathroomCount(value.propertyType) && value.bathrooms !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bathrooms"],
        message: `${value.propertyType} listings should not include bathroom count.`,
      });
    }

    if (usesBathroomCount(value.propertyType) && value.bathrooms < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bathrooms"],
        message: "Bathroom count must be at least 1 for this property type.",
      });
    }

    if (!value.ownerName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ownerName"],
        message: "Owner name is required.",
      });
    }

    if (!value.ownerEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ownerEmail"],
        message: "Owner email is required.",
      });
    }

    if (!value.ownerPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ownerPhone"],
        message: "Owner phone is required.",
      });
    }

    if (value.approvalStatus === "rejected" && !value.rejectionReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectionReason"],
        message: "Rejection reason is required for rejected listings.",
      });
    }
  });

export const ownerPropertyInputSchema = basePropertySchema.safeExtend({
  featured: z.boolean().default(false),
  approvalStatus: z.enum(approvalStatusValues).default("pending"),
  feeStatus: z.enum(feeStatusValues).default("open"),
});

export const ownerPropertyUpdateInputSchema = ownerPropertyInputSchema.safeExtend({
  id: z.number().int().positive(),
});

export const adminPropertyInputSchema = basePropertySchema.safeExtend({
  featured: z.boolean(),
  approvalStatus: z.enum(approvalStatusValues),
  feeStatus: z.enum(feeStatusValues),
  status: z.enum(propertyStatusValues).default("available"),
});

export const adminPropertyUpdateInputSchema = adminPropertyInputSchema.safeExtend({
  id: z.number().int().positive(),
});

export const propertyApprovalUpdateInputSchema = z
  .object({
    id: z.number().int().positive(),
    approvalStatus: z.enum(approvalStatusValues),
    rejectionReason: rejectionReasonSchema,
  })
  .superRefine((value, ctx) => {
    if (value.approvalStatus === "rejected" && !value.rejectionReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectionReason"],
        message: "Rejection reason is required for rejected listings.",
      });
    }
  });

export const mediaUploadInputSchema = z.object({
  base64: z.string().min(1),
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(100),
});

export const imageUploadInputSchema = mediaUploadInputSchema.superRefine((value, ctx) => {
  if (!value.contentType.startsWith("image/")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contentType"],
      message: "Only image uploads are allowed here.",
    });
  }
});

export const videoUploadInputSchema = mediaUploadInputSchema.superRefine((value, ctx) => {
  if (!value.contentType.startsWith("video/")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contentType"],
      message: "Only video uploads are allowed here.",
    });
  }
});

export const inquiryCreateInputSchema = z.object({
  propertyId: z.number().int().positive(),
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  phone: nullableString,
  message: z.string().trim().min(5).max(5000),
  status: z.string().trim().min(1).max(30).optional(),
});

export const inquiryStatusUpdateInputSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["new", "contacted", "closed"]),
});

export const ownerMessageCreateInputSchema = z.object({
  propertyId: z.number().int().positive(),
  content: z.string().trim().min(1).max(5000),
});

export const platformSettingsInputSchema = z.object({
  teamName: z.string().trim().min(2).max(255),
  tagline: z.string().trim().min(2).max(1000),
  contactPhone: z.string().trim().min(5).max(30),
  contactEmail: z.string().email(),
});

export const contactMessageCreateInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  phone: nullableString,
  subject: nullableString,
  message: z.string().trim().min(5).max(5000),
});

export const contactMessageStatusUpdateInputSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["new", "reviewed", "closed"]),
});
