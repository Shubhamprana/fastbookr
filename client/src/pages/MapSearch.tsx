import { useState, useRef, useCallback, useEffect } from "react";
import { MapView } from "@/components/Map";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PropertyCoverMedia } from "@/components/PropertyCoverMedia";
import { MapPin, Bed, Bath, Maximize, X, Search, Navigation, List, Map as MapIcon } from "lucide-react";
import { Link } from "wouter";
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete";
import { getPropertyStats } from "@/lib/propertyDisplay";

interface GeocodedProperty {
  property: any;
  position: google.maps.LatLng;
}

export default function MapSearch() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [geocodedProperties, setGeocodedProperties] = useState<GeocodedProperty[]>([]);
  const [nearbyProperties, setNearbyProperties] = useState<any[]>([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(10); // km
  const [showListView, setShowListView] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const searchCircleRef = useRef<google.maps.Circle | null>(null);

  const { data: properties, isLoading } = trpc.properties.getAll.useQuery();

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    });
  };

  // Calculate distance between two points in km
  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter properties near search location
  const filterNearbyProperties = useCallback(
    (center: { lat: number; lng: number }, radius: number) => {
      if (geocodedProperties.length === 0) return;

      const nearby = geocodedProperties
        .map((gp) => {
          const distance = getDistance(
            center.lat,
            center.lng,
            gp.position.lat(),
            gp.position.lng()
          );
          return { ...gp, distance };
        })
        .filter((gp) => gp.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      setNearbyProperties(
        nearby.map((gp) => ({
          ...gp.property,
          distance: gp.distance,
        }))
      );

      // Highlight nearby markers
      markers.forEach((marker) => {
        const pos = marker.position as google.maps.LatLngLiteral;
        if (pos) {
          const dist = getDistance(center.lat, center.lng, pos.lat, pos.lng);
          const content = marker.content as HTMLElement;
          if (content) {
            if (dist <= radius) {
              content.style.opacity = "1";
              content.style.transform = "scale(1)";
            } else {
              content.style.opacity = "0.4";
              content.style.transform = "scale(0.8)";
            }
          }
        }
      });

      // Draw search radius circle
      if (searchCircleRef.current) {
        searchCircleRef.current.setMap(null);
      }
      if (mapRef.current) {
        searchCircleRef.current = new google.maps.Circle({
          map: mapRef.current,
          center,
          radius: radius * 1000,
          fillColor: "#00D084",
          fillOpacity: 0.08,
          strokeColor: "#00D084",
          strokeOpacity: 0.3,
          strokeWeight: 2,
        });
      }
    },
    [geocodedProperties, markers]
  );

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback(
    (place: { address: string; lat: number; lng: number }) => {
      const center = { lat: place.lat, lng: place.lng };
      setSearchCenter(center);

      if (mapRef.current) {
        mapRef.current.panTo(center);
        mapRef.current.setZoom(13);
      }

      filterNearbyProperties(center, searchRadius);
    },
    [filterNearbyProperties, searchRadius]
  );

  // Update nearby when radius changes
  useEffect(() => {
    if (searchCenter) {
      filterNearbyProperties(searchCenter, searchRadius);
    }
  }, [searchRadius, searchCenter, filterNearbyProperties]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchLocation("");
    setSearchCenter(null);
    setNearbyProperties([]);
    if (searchCircleRef.current) {
      searchCircleRef.current.setMap(null);
      searchCircleRef.current = null;
    }
    // Reset marker opacity
    markers.forEach((marker) => {
      const content = marker.content as HTMLElement;
      if (content) {
        content.style.opacity = "1";
        content.style.transform = "scale(1)";
      }
    });
    // Reset map view
    if (mapRef.current && geocodedProperties.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      geocodedProperties.forEach((gp) => bounds.extend(gp.position));
      mapRef.current.fitBounds(bounds);
    }
  }, [markers, geocodedProperties]);

  const handleMapReady = async (map: google.maps.Map) => {
    mapRef.current = map;

    if (!properties || properties.length === 0) return;

    setIsGeocoding(true);
    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();

    markers.forEach((marker) => {
      marker.map = null;
    });
    setMarkers([]);

    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
    const newGeocoded: GeocodedProperty[] = [];

    for (const property of properties) {
      try {
        const result = await geocoder.geocode({ address: property.location });
        if (result.results[0]) {
          const position = result.results[0].geometry.location;

          const priceTag = document.createElement("div");
          priceTag.className =
            "bg-primary text-white px-3 py-1.5 rounded-full font-semibold text-sm shadow-lg cursor-pointer hover:scale-110 transition-all";
          priceTag.textContent = formatPrice(property.price);

          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position,
            content: priceTag,
            title: property.title,
          });

          marker.addListener("click", () => {
            setSelectedProperty(property);
            map.panTo(position);
          });

          newMarkers.push(marker);
          newGeocoded.push({ property, position });
          bounds.extend(position);
        }
      } catch (error) {
        console.error(`Failed to geocode: ${property.title}`, error);
      }
    }

    setMarkers(newMarkers);
    setGeocodedProperties(newGeocoded);
    setIsGeocoding(false);

    if (newMarkers.length > 0) {
      map.fitBounds(bounds);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 relative">
        <div className="h-[calc(100vh-80px)] relative flex">
          {/* Sidebar list view */}
          {showListView && (
            <div className="w-96 h-full overflow-y-auto bg-white border-r z-10 shrink-0">
              <div className="p-4 border-b sticky top-0 bg-white z-10">
                <h3 className="font-bold text-lg">
                  {searchCenter
                    ? `${nearbyProperties.length} Properties Nearby`
                    : `All Properties (${properties?.length || 0})`}
                </h3>
              </div>
              <div className="divide-y">
                {(searchCenter ? nearbyProperties : properties || []).map((property: any) => (
                  (() => {
                    const stats = getPropertyStats(property);
                    return (
                  <div
                    key={property.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedProperty?.id === property.id ? "bg-primary/5 border-l-4 border-primary" : ""
                    }`}
                    onClick={() => setSelectedProperty(property)}
                  >
                    <div className="flex gap-3">
                      <PropertyCoverMedia
                        property={property}
                        className="w-24 h-20 object-cover rounded-lg shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{property.title}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{property.city}, {property.state}</span>
                        </p>
                        <p className="text-primary font-bold text-sm mt-1">
                          {formatPrice(property.price)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                          {stats.map((item) => (
                            <span key={item.key} className="flex items-center gap-1">
                              {item.key === "bedrooms" ? (
                                <Bed className="w-3 h-3" />
                              ) : item.key === "bathrooms" ? (
                                <Bath className="w-3 h-3" />
                              ) : (
                                <Maximize className="w-3 h-3" />
                              )}{" "}
                              {item.value} {item.shortLabel}
                            </span>
                          ))}
                        </div>
                        {property.distance !== undefined && (
                          <p className="text-xs text-primary font-medium mt-1">
                            <Navigation className="w-3 h-3 inline mr-1" />
                            {property.distance.toFixed(1)} km away
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                    );
                  })()
                ))}
                {searchCenter && nearbyProperties.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No properties found nearby</p>
                    <p className="text-sm mt-1">Try increasing the search radius or searching a different area</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="flex-1 relative">
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading properties...</p>
                </div>
              </div>
            ) : (
              <MapView
                className="w-full h-full"
                initialCenter={{ lat: 37.7749, lng: -122.4194 }}
                initialZoom={10}
                onMapReady={handleMapReady}
              />
            )}

            {/* Search Bar Overlay */}
            <div className="absolute top-4 left-4 right-4 z-20">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-2xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <PlacesAutocomplete
                        value={searchLocation}
                        onChange={setSearchLocation}
                        onPlaceSelect={handlePlaceSelect}
                        placeholder="Search location to find nearby properties..."
                        className="border-0 shadow-none focus-visible:ring-0 text-base"
                      />
                    </div>
                    {searchCenter && (
                      <button
                        onClick={clearSearch}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Clear search"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>

                  {/* Radius selector - shown when search is active */}
                  {searchCenter && (
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Radius:</span>
                      {[5, 10, 25, 50].map((r) => (
                        <button
                          key={r}
                          onClick={() => setSearchRadius(r)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            searchRadius === r
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {r} km
                        </button>
                      ))}
                      <div className="ml-auto text-xs font-medium text-primary">
                        {nearbyProperties.length} found
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Toggle List View */}
            <button
              onClick={() => setShowListView(!showListView)}
              className="absolute bottom-20 left-4 bg-white px-4 py-2.5 rounded-lg shadow-lg z-10 flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              {showListView ? (
                <>
                  <MapIcon className="w-4 h-4" /> Hide List
                </>
              ) : (
                <>
                  <List className="w-4 h-4" /> Show List
                </>
              )}
            </button>

            {/* Selected Property Card */}
            {selectedProperty && !showListView && (
              (() => {
                const stats = getPropertyStats(selectedProperty);
                return (
              <Card className="absolute bottom-20 left-4 w-96 shadow-2xl z-10">
                <div className="relative">
                  <button
                    onClick={() => setSelectedProperty(null)}
                    className="absolute top-2 right-2 z-10 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="relative h-40 overflow-hidden rounded-t-lg">
                    <PropertyCoverMedia
                      property={selectedProperty}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {selectedProperty.listingType === "sale" ? "For Sale" : "For Rent"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {selectedProperty.title}
                    </h3>
                    <div className="flex items-center text-muted-foreground text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {selectedProperty.location}
                    </div>
                    <div className="text-xl font-bold text-primary mb-3">
                      {formatPrice(selectedProperty.price)}
                    </div>
                    <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground flex-wrap">
                      {stats.map((item) => (
                        <span key={item.key} className="flex items-center gap-1">
                          {item.key === "bedrooms" ? (
                            <Bed className="w-4 h-4" />
                          ) : item.key === "bathrooms" ? (
                            <Bath className="w-4 h-4" />
                          ) : (
                            <Maximize className="w-4 h-4" />
                          )}{" "}
                          {item.value} {item.shortLabel}
                        </span>
                      ))}
                    </div>
                    <Link href={`/properties/${selectedProperty.id}`}>
                      <Button className="w-full">View Full Details</Button>
                    </Link>
                  </div>
                </div>
              </Card>
                );
              })()
            )}

            {/* Info Box */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg z-10">
              <p className="text-sm font-medium text-foreground">
                {isGeocoding
                  ? "Loading property locations..."
                  : searchCenter
                  ? `${nearbyProperties.length} properties within ${searchRadius}km`
                  : `${properties?.length || 0} properties available`}
                {" "}• Click price tags for details
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
