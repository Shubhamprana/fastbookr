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
          required
        />
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
          <Select value={formData.propertyType} onValueChange={(v) => updateField('propertyType', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="condo">Condo</SelectItem>
              <SelectItem value="townhouse">Townhouse</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="bedrooms">Bedrooms *</Label>
          <Input
            id="bedrooms"
            type="number"
            value={formData.bedrooms}
            onChange={(e) => updateField('bedrooms', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="bathrooms">Bathrooms *</Label>
          <Input
            id="bathrooms"
            type="number"
            value={formData.bathrooms}
            onChange={(e) => updateField('bathrooms', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="squareFeet">Square Feet *</Label>
          <Input
            id="squareFeet"
            type="number"
            value={formData.squareFeet}
            onChange={(e) => updateField('squareFeet', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Image Upload Section */}
      <div>
        <Label>Property Images *</Label>
        <ImageUploader
          images={imageUrls}
          onImagesChange={handleImagesChange}
        />
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
