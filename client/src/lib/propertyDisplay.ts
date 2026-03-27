export const propertyTypeValues = [
  "house",
  "apartment",
  "condo",
  "townhouse",
  "villa",
  "land",
  "room",
  "studio",
  "shared-room",
  "pg/hostel",
  "independent-floor",
] as const;

export const listingTypeValues = ["sale", "rent", "co-living"] as const;
export const furnishingValues = ["unfurnished", "semi-furnished", "fully-furnished"] as const;
export const parkingValues = ["none", "bike", "car", "both"] as const;
export const balconyValues = ["0", "1", "2", "3+"] as const;
export const availableForValues = [
  "any",
  "family",
  "bachelors",
  "students",
  "working-professionals",
] as const;
export const genderPreferenceValues = ["any", "male", "female"] as const;
export const plotFacingValues = [
  "north",
  "south",
  "east",
  "west",
  "north-east",
  "north-west",
  "south-east",
  "south-west",
] as const;

export type PropertyType = (typeof propertyTypeValues)[number];
export type ListingType = (typeof listingTypeValues)[number];
export type Furnishing = (typeof furnishingValues)[number];
export type Parking = (typeof parkingValues)[number];
export type Balcony = (typeof balconyValues)[number];
export type AvailableFor = (typeof availableForValues)[number];
export type GenderPreference = (typeof genderPreferenceValues)[number];
export type PlotFacing = (typeof plotFacingValues)[number];

type PropertyWithCoreFields = {
  propertyType?: string | null;
  listingType?: string | null;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  squareFeet?: number | string | null;
  furnishing?: string | null;
  parking?: string | null;
  balcony?: string | null;
  availableFor?: string | null;
  genderPreference?: string | null;
  foodIncluded?: boolean | string | null;
  attachedBathroom?: boolean | string | null;
  plotFacing?: string | null;
  rejectionReason?: string | null;
};

const PROPERTY_TYPES_WITHOUT_BEDROOMS = new Set<PropertyType>([
  "land",
  "room",
  "shared-room",
  "studio",
  "pg/hostel",
]);

const PROPERTY_TYPES_WITHOUT_BATHROOMS = new Set<PropertyType>(["land"]);

export function asPropertyType(value: string): PropertyType {
  return (propertyTypeValues as readonly string[]).includes(value)
    ? (value as PropertyType)
    : "house";
}

export function asListingType(value: string): ListingType {
  return (listingTypeValues as readonly string[]).includes(value)
    ? (value as ListingType)
    : "rent";
}

export function asFurnishing(value: string | null | undefined): Furnishing | null {
  if (!value) return null;
  return (furnishingValues as readonly string[]).includes(value) ? (value as Furnishing) : null;
}

export function asParking(value: string | null | undefined): Parking | null {
  if (!value) return null;
  return (parkingValues as readonly string[]).includes(value) ? (value as Parking) : null;
}

export function asBalcony(value: string | null | undefined): Balcony | null {
  if (!value) return null;
  return (balconyValues as readonly string[]).includes(value) ? (value as Balcony) : null;
}

export function asAvailableFor(value: string | null | undefined): AvailableFor | null {
  if (!value) return null;
  return (availableForValues as readonly string[]).includes(value)
    ? (value as AvailableFor)
    : null;
}

export function asGenderPreference(value: string | null | undefined): GenderPreference | null {
  if (!value) return null;
  return (genderPreferenceValues as readonly string[]).includes(value)
    ? (value as GenderPreference)
    : null;
}

export function asPlotFacing(value: string | null | undefined): PlotFacing | null {
  if (!value) return null;
  return (plotFacingValues as readonly string[]).includes(value)
    ? (value as PlotFacing)
    : null;
}

export function isLandProperty(propertyType?: string | null) {
  return propertyType === "land";
}

export function usesBedroomCount(propertyType?: string | null) {
  return !PROPERTY_TYPES_WITHOUT_BEDROOMS.has((propertyType ?? "house") as PropertyType);
}

export function usesBathroomCount(propertyType?: string | null) {
  return !PROPERTY_TYPES_WITHOUT_BATHROOMS.has((propertyType ?? "house") as PropertyType);
}

export function getAreaLabel(propertyType?: string | null) {
  if (isLandProperty(propertyType)) return "Plot Area";
  if (propertyType === "room" || propertyType === "shared-room" || propertyType === "studio" || propertyType === "pg/hostel") {
    return "Carpet Area";
  }
  return "Built-up Area";
}

export function getAreaShortLabel(propertyType?: string | null) {
  return isLandProperty(propertyType) ? "sq ft" : "sqft";
}

export function hasBedroomBathroomFields(propertyType?: string | null) {
  return usesBedroomCount(propertyType) || usesBathroomCount(propertyType);
}

export function getPropertyTypeGuidance(propertyType?: string | null) {
  switch (propertyType) {
    case "land":
      return "Land listings only need plot area and location details.";
    case "room":
      return "Room listings focus on bathroom count and carpet area. Bedroom count is skipped.";
    case "shared-room":
      return "Shared-room listings focus on bathroom count and carpet area. Bedroom count is skipped.";
    case "studio":
      return "Studio listings use bathroom count and carpet area. Bedroom count is skipped.";
    case "pg/hostel":
      return "PG and hostel listings use bathroom count and carpet area. Bedroom count is skipped.";
    default:
      return "Full-home listings use bedrooms, bathrooms, and built-up area.";
  }
}

export function usesFurnishingField(propertyType?: string | null) {
  return !isLandProperty(propertyType);
}

export function usesParkingField(propertyType?: string | null) {
  return ["house", "apartment", "condo", "townhouse", "villa", "independent-floor"].includes(
    propertyType ?? ""
  );
}

export function usesBalconyField(propertyType?: string | null) {
  return ["house", "apartment", "condo", "townhouse", "villa", "independent-floor", "studio"].includes(
    propertyType ?? ""
  );
}

export function usesAvailableForField(listingType?: string | null) {
  return listingType === "rent" || listingType === "co-living";
}

export function usesGenderPreferenceField(propertyType?: string | null) {
  return ["room", "shared-room", "pg/hostel"].includes(propertyType ?? "");
}

export function usesFoodIncludedField(propertyType?: string | null) {
  return propertyType === "pg/hostel";
}

export function usesAttachedBathroomField(propertyType?: string | null) {
  return ["room", "shared-room", "studio", "pg/hostel"].includes(propertyType ?? "");
}

export function usesPlotFacingField(propertyType?: string | null) {
  return propertyType === "land";
}

export function normalizeBedroomValue(propertyType: string | null | undefined, value: string | number) {
  return usesBedroomCount(propertyType) ? value : 0;
}

export function normalizeBathroomValue(propertyType: string | null | undefined, value: string | number) {
  return usesBathroomCount(propertyType) ? value : 0;
}

export function getPropertyStats(property: PropertyWithCoreFields) {
  const stats: Array<{
    key: "bedrooms" | "bathrooms" | "squareFeet";
    value: string | number;
    label: string;
    shortLabel: string;
  }> = [];

  if (usesBedroomCount(property.propertyType)) {
    stats.push({
      key: "bedrooms",
      value: Number(property.bedrooms ?? 0),
      label: "Bedrooms",
      shortLabel: "Beds",
    });
  }

  if (usesBathroomCount(property.propertyType)) {
    stats.push({
      key: "bathrooms",
      value: Number(property.bathrooms ?? 0),
      label: "Bathrooms",
      shortLabel: "Baths",
    });
  }

  stats.push({
    key: "squareFeet",
    value: Number(property.squareFeet ?? 0).toLocaleString(),
    label: getAreaLabel(property.propertyType),
    shortLabel: getAreaShortLabel(property.propertyType),
  });

  return stats;
}

function normalizeBooleanLabel(value: boolean | string | null | undefined) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === "1" || value === "true") return "Yes";
  if (value === "0" || value === "false") return "No";
  return null;
}

export function getPropertyAdditionalDetails(property: PropertyWithCoreFields) {
  const details: Array<{ label: string; value: string }> = [];

  if (usesFurnishingField(property.propertyType) && property.furnishing) {
    details.push({ label: "Furnishing", value: property.furnishing });
  }
  if (usesParkingField(property.propertyType) && property.parking) {
    details.push({ label: "Parking", value: property.parking });
  }
  if (usesBalconyField(property.propertyType) && property.balcony) {
    details.push({ label: "Balcony", value: property.balcony });
  }
  if (usesAvailableForField(property.listingType) && property.availableFor) {
    details.push({ label: "Suitable For", value: property.availableFor });
  }
  if (usesGenderPreferenceField(property.propertyType) && property.genderPreference) {
    details.push({ label: "Gender Preference", value: property.genderPreference });
  }
  if (usesFoodIncludedField(property.propertyType)) {
    const label = normalizeBooleanLabel(property.foodIncluded);
    if (label) details.push({ label: "Food Included", value: label });
  }
  if (usesAttachedBathroomField(property.propertyType)) {
    const label = normalizeBooleanLabel(property.attachedBathroom);
    if (label) details.push({ label: "Attached Bathroom", value: label });
  }
  if (usesPlotFacingField(property.propertyType) && property.plotFacing) {
    details.push({ label: "Plot Facing", value: property.plotFacing });
  }
  if (property.rejectionReason) {
    details.push({ label: "Rejection Reason", value: property.rejectionReason });
  }

  return details;
}
