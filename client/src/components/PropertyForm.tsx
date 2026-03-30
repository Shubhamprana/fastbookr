import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { MapView } from "@/components/Map";
import { ImageUploader } from "@/components/ImageUploader";
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete";
import { VideoUploader } from "@/components/VideoUploader";
import {
  getAreaLabel,
  getPropertyTypeGuidance,
  normalizeBathroomValue,
  normalizeBedroomValue,
  usesAttachedBathroomField,
  usesAvailableForField,
  usesBalconyField,
  usesBathroomCount,
  usesBedroomCount,
  usesFoodIncludedField,
  usesFurnishingField,
  usesGenderPreferenceField,
  usesParkingField,
  usesPlotFacingField,
} from "@/lib/propertyDisplay";

interface PropertyFormData {
  title: string;
  description: string;
  price: string;
  location: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  listingType: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  images: string;
  videoUrl: string;
  furnishing: string;
  parking: string;
  balcony: string;
  availableFor: string;
  genderPreference: string;
  foodIncluded: string;
  attachedBathroom: string;
  plotFacing: string;
  rejectionReason: string;
  featured: string;
  approvalStatus: string;
  feeStatus: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  latitude: string;
  longitude: string;
}

interface PropertyFormProps {
  formData: PropertyFormData;
  onFormDataChange: (data: PropertyFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
  isSubmitting: boolean;
  mode?: "admin" | "owner";
}

export function PropertyForm({
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isEditing,
  isSubmitting,
  mode = "admin",
}: PropertyFormProps) {
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapMarker, setMapMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const showBedroomField = usesBedroomCount(formData.propertyType);
  const showBathroomField = usesBathroomCount(formData.propertyType);
  const showFurnishingField = usesFurnishingField(formData.propertyType);
  const showParkingField = usesParkingField(formData.propertyType);
  const showBalconyField = usesBalconyField(formData.propertyType);
  const showAvailableForField = usesAvailableForField(formData.listingType);
  const showGenderPreferenceField = usesGenderPreferenceField(formData.propertyType);
  const showFoodIncludedField = usesFoodIncludedField(formData.propertyType);
  const showAttachedBathroomField = usesAttachedBathroomField(formData.propertyType);
  const showPlotFacingField = usesPlotFacingField(formData.propertyType);
  const areaLabel = getAreaLabel(formData.propertyType);
  const propertyTypeGuidance = getPropertyTypeGuidance(formData.propertyType);

  // Parse images from JSON string to array
  const imageUrls: string[] = (() => {
    try {
      const parsed = JSON.parse(formData.images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const updateField = useCallback((field: keyof PropertyFormData, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  }, [formData, onFormDataChange]);

  const handlePropertyTypeChange = useCallback((value: string) => {
    onFormDataChange({
      ...formData,
      propertyType: value,
      bedrooms: normalizeBedroomValue(value, formData.bedrooms).toString(),
      bathrooms: normalizeBathroomValue(value, formData.bathrooms).toString(),
      parking: usesParkingField(value) ? formData.parking : "",
      balcony: usesBalconyField(value) ? formData.balcony : "",
      genderPreference: usesGenderPreferenceField(value) ? formData.genderPreference : "",
      foodIncluded: usesFoodIncludedField(value) ? formData.foodIncluded : "",
      attachedBathroom: usesAttachedBathroomField(value) ? formData.attachedBathroom : "",
      plotFacing: usesPlotFacingField(value) ? formData.plotFacing : "",
      furnishing: usesFurnishingField(value) ? formData.furnishing : "",
    });
  }, [formData, onFormDataChange]);

  const handleImagesChange = useCallback((newImages: string[]) => {
    onFormDataChange({ ...formData, images: JSON.stringify(newImages) });
  }, [formData, onFormDataChange]);

  const handlePlaceSelect = useCallback((place: { address: string; city: string; state: string; zipCode: string; lat: number; lng: number }) => {
    onFormDataChange({
      ...formData,
      location: place.address,
      city: place.city,
      state: place.state,
      zipCode: place.zipCode,
      latitude: place.lat.toString(),
      longitude: place.lng.toString(),
    });

    // Update map marker if map is visible
    if (mapRef.current && place.lat && place.lng) {
      mapRef.current.panTo({ lat: place.lat, lng: place.lng });
      mapRef.current.setZoom(15);

      if (mapMarker) {
        mapMarker.map = null;
      }

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: place.lat, lng: place.lng },
        gmpDraggable: true,
      });

      marker.addListener("dragend", () => {
        const pos = marker.position as google.maps.LatLngLiteral;
        if (pos) {
          reverseGeocode(pos.lat, pos.lng);
        }
      });

      setMapMarker(marker);
    }
  }, [formData, onFormDataChange, mapMarker]);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const result = results[0];
        let city = "";
        let state = "";
        let zipCode = "";
        
        result.address_components.forEach((component) => {
          if (component.types.includes("locality")) {
            city = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            state = component.short_name;
          }
          if (component.types.includes("postal_code")) {
            zipCode = component.long_name;
          }
        });
        
        onFormDataChange({
          ...formData,
          location: result.formatted_address,
          city,
          state,
          zipCode,
          latitude: lat.toString(),
          longitude: lng.toString(),
        });
      }
    });
  }, [formData, onFormDataChange]);

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Example: 3BHK apartment with balcony near metro station"
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Write at least 10 characters so the listing is descriptive enough for renters and buyers.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (INR) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => updateField('price', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="propertyType">Property Type *</Label>
          <Select value={formData.propertyType} onValueChange={handlePropertyTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="condo">Condo</SelectItem>
              <SelectItem value="townhouse">Townhouse</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="showroom">Showroom</SelectItem>
              <SelectItem value="land">Land</SelectItem>
              <SelectItem value="room">Room</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="shared-room">Shared Room</SelectItem>
              <SelectItem value="pg/hostel">PG / Hostel</SelectItem>
              <SelectItem value="independent-floor">Independent Floor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{propertyTypeGuidance}</p>

      <div className="grid grid-cols-2 gap-4">
        {showFurnishingField && (
          <div>
            <Label htmlFor="furnishing">Furnishing</Label>
            <Select value={formData.furnishing || "na"} onValueChange={(v) => updateField("furnishing", v === "na" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select furnishing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="na">Not specified</SelectItem>
                <SelectItem value="unfurnished">Unfurnished</SelectItem>
                <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                <SelectItem value="fully-furnished">Fully Furnished</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {showAvailableForField && (
          <div>
            <Label htmlFor="availableFor">Suitable For</Label>
            <Select value={formData.availableFor || "na"} onValueChange={(v) => updateField("availableFor", v === "na" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="na">Not specified</SelectItem>
                <SelectItem value="any">Anyone</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="bachelors">Bachelors</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="working-professionals">Working Professionals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {(showParkingField || showBalconyField || showGenderPreferenceField || showFoodIncludedField || showAttachedBathroomField || showPlotFacingField) && (
        <div className="grid grid-cols-2 gap-4">
          {showParkingField && (
            <div>
              <Label htmlFor="parking">Parking</Label>
              <Select value={formData.parking || "na"} onValueChange={(v) => updateField("parking", v === "na" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="na">Not specified</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {showBalconyField && (
            <div>
              <Label htmlFor="balcony">Balcony</Label>
              <Select value={formData.balcony || "na"} onValueChange={(v) => updateField("balcony", v === "na" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select balcony count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="na">Not specified</SelectItem>
                  <SelectItem value="0">No balcony</SelectItem>
                  <SelectItem value="1">1 balcony</SelectItem>
                  <SelectItem value="2">2 balconies</SelectItem>
                  <SelectItem value="3+">3+ balconies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {showGenderPreferenceField && (
            <div>
              <Label htmlFor="genderPreference">Gender Preference</Label>
              <Select value={formData.genderPreference || "na"} onValueChange={(v) => updateField("genderPreference", v === "na" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="na">Not specified</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {showFoodIncludedField && (
            <div>
              <Label htmlFor="foodIncluded">Food Included</Label>
              <Select value={formData.foodIncluded || "na"} onValueChange={(v) => updateField("foodIncluded", v === "na" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="na">Not specified</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {showAttachedBathroomField && (
            <div>
              <Label htmlFor="attachedBathroom">Attached Bathroom</Label>
              <Select value={formData.attachedBathroom || "na"} onValueChange={(v) => updateField("attachedBathroom", v === "na" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="na">Not specified</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {showPlotFacingField && (
            <div>
              <Label htmlFor="plotFacing">Plot Facing</Label>
              <Select value={formData.plotFacing || "na"} onValueChange={(v) => updateField("plotFacing", v === "na" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select facing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="na">Not specified</SelectItem>
                  <SelectItem value="north">North</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                  <SelectItem value="north-east">North-East</SelectItem>
                  <SelectItem value="north-west">North-West</SelectItem>
                  <SelectItem value="south-east">South-East</SelectItem>
                  <SelectItem value="south-west">South-West</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="listingType">Listing Type *</Label>
          <Select value={formData.listingType} onValueChange={(v) => updateField('listingType', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">For Sale</SelectItem>
              <SelectItem value="rent">For Rent</SelectItem>
              <SelectItem value="co-living">Co-Living</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {mode === "admin" && (
          <div>
            <Label htmlFor="featured">Featured</Label>
            <Select value={formData.featured} onValueChange={(v) => updateField('featured', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No</SelectItem>
                <SelectItem value="1">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {mode === "admin" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="approvalStatus">Approval Status</Label>
            <Select value={formData.approvalStatus} onValueChange={(v) => updateField("approvalStatus", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="feeStatus">Success Fee Status</Label>
            <Select value={formData.feeStatus} onValueChange={(v) => updateField("feeStatus", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {mode === "admin" && formData.approvalStatus === "rejected" && (
        <div>
          <Label htmlFor="rejectionReason">Rejection Reason</Label>
          <Textarea
            id="rejectionReason"
            rows={3}
            value={formData.rejectionReason}
            onChange={(e) => updateField("rejectionReason", e.target.value)}
            placeholder="Explain why this listing was rejected so the owner can fix it."
          />
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Owner Contact Details</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="ownerName">Owner Name *</Label>
            <Input
              id="ownerName"
              value={formData.ownerName}
              onChange={(e) => updateField("ownerName", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="ownerEmail">Owner Email *</Label>
            <Input
              id="ownerEmail"
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => updateField("ownerEmail", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="ownerPhone">Owner Phone *</Label>
            <Input
              id="ownerPhone"
              value={formData.ownerPhone}
              onChange={(e) => updateField("ownerPhone", e.target.value)}
              required
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          These details stay private. Public listing pages continue to show platform-managed contact only.
        </p>
      </div>

      {/* Location with Google Places Autocomplete */}
      <div>
        <Label htmlFor="location">Full Address *</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <PlacesAutocomplete
              id="location"
              value={formData.location}
              onChange={(val) => updateField('location', val)}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Start typing an address..."
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowMapPicker(!showMapPicker)}
            className="shrink-0"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {showMapPicker ? "Hide Map" : "Pick on Map"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Type to search for locations with Google suggestions, or pick on map
        </p>
      </div>

      {showMapPicker && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-muted-foreground mb-3">
            Click on the map to set the property location. The marker can be dragged to adjust.
          </p>
          <MapView
            className="w-full h-[300px] rounded-lg"
            initialCenter={{ lat: 37.7749, lng: -122.4194 }}
            initialZoom={12}
            onMapReady={(map) => {
              mapRef.current = map;
              
              map.addListener("click", (e: google.maps.MapMouseEvent) => {
                if (e.latLng) {
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();
                  
                  if (mapMarker) {
                    mapMarker.map = null;
                  }
                  
                  const marker = new google.maps.marker.AdvancedMarkerElement({
                    map,
                    position: { lat, lng },
                    gmpDraggable: true,
                  });
                  
                  marker.addListener("dragend", () => {
                    const pos = marker.position as google.maps.LatLngLiteral;
                    if (pos) {
                      reverseGeocode(pos.lat, pos.lng);
                    }
                  });
                  
                  setMapMarker(marker);
                  reverseGeocode(lat, lng);
                }
              });
            }}
          />
          {formData.latitude && formData.longitude && (
            <div className="mt-3 p-3 bg-white rounded-lg border">
              <p className="text-sm font-medium text-foreground">Selected Location:</p>
              <p className="text-xs text-muted-foreground mt-1">
                Lat: {formData.latitude}, Lng: {formData.longitude}
              </p>
              {formData.location && (
                <p className="text-xs text-muted-foreground mt-1">
                  Address: {formData.location}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateField('city', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => updateField('state', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="zipCode">Zip Code</Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => updateField('zipCode', e.target.value)}
          />
        </div>
      </div>

      <div className={`grid gap-4 ${(showBedroomField || showBathroomField) ? "grid-cols-3" : "grid-cols-1"}`}>
        {showBedroomField && (
            <div>
              <Label htmlFor="bedrooms">Bedrooms *</Label>
              <Input
                id="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={(e) => updateField('bedrooms', e.target.value)}
                required={showBedroomField}
              />
            </div>
        )}
        {showBathroomField && (
            <div>
              <Label htmlFor="bathrooms">Bathrooms *</Label>
              <Input
                id="bathrooms"
                type="number"
                value={formData.bathrooms}
                onChange={(e) => updateField('bathrooms', e.target.value)}
                required={showBathroomField}
              />
            </div>
        )}
        <div>
          <Label htmlFor="squareFeet">{areaLabel} *</Label>
          <Input
            id="squareFeet"
            type="text"
            value={formData.squareFeet}
            onChange={(e) => updateField('squareFeet', e.target.value)}
            placeholder="Examples: 1200 sq ft, 2 bigha, 300*200"
            required
          />
        </div>
      </div>
      {(!showBedroomField || !showBathroomField) && (
        <p className="text-xs text-muted-foreground">
          Fields that do not apply to this property type are automatically skipped.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        You can enter area in your preferred format, like `1200 sq ft`, `2 bigha`, or `300*200`.
      </p>

      {/* Image Upload Section */}
      <div>
        <Label>Property Images *</Label>
        <ImageUploader
          images={imageUrls}
          onImagesChange={handleImagesChange}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Add up to 4 images for the listing. The first uploaded image is used as the cover across cards and search results.
        </p>
      </div>

      <div>
        <Label>Short Property Video</Label>
        <VideoUploader
          videoUrl={formData.videoUrl}
          onVideoChange={(url) => updateField("videoUrl", url)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Optional. Add one short walkthrough video. Images appear in the gallery and cards, while the video shows on the property details page.
        </p>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isEditing ? "Update" : mode === "owner" ? "Submit Listing" : "Create"} Property
        </Button>
      </div>
    </form>
  );
}
