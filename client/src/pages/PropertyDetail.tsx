import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BedDouble, Bath, Maximize, MapPin, ChevronLeft, ChevronRight, Calendar, Tag, Building2, Share2, Heart, Phone, Mail, ArrowLeft, School, Hospital, ShoppingBag, Utensils, Trees } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapView } from "@/components/Map";
import { getPropertyVideoUrl, parsePropertyImages, PROPERTY_MEDIA_PLACEHOLDER } from "@/lib/propertyMedia";
import {
  formatAreaValue,
  getAreaLabel,
  getPropertyAdditionalDetails,
  getPropertyStats,
  usesBathroomCount,
  usesBedroomCount,
} from "@/lib/propertyDisplay";

export default function PropertyDetail() {
  const params = useParams();
  const propertyId = parseInt(params.id || "0");

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [selectedAmenity, setSelectedAmenity] = useState<string>("school");
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const { data: property, isLoading } = trpc.properties.getById.useQuery({ id: propertyId });
  const { data: platformSettings } = trpc.platformSettings.get.useQuery();
  const createInquiry = trpc.inquiries.create.useMutation({
    onSuccess: () => {
      toast.success("Inquiry sent successfully! We'll get back to you soon.");
      setInquiryForm({ name: "", email: "", phone: "", message: "" });
    },
    onError: () => {
      toast.error("Failed to send inquiry. Please try again.");
    },
  });

  const formatPrice = (price: number, listingType: string) => {
    const formatted = (price / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    });
    return listingType === "rent" || listingType === "co-living" ? `${formatted}/mo` : formatted;
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    createInquiry.mutate({ propertyId, ...inquiryForm });
  };

  // Function to search nearby places using Google Places API
  const searchNearbyPlaces = (map: google.maps.Map, location: google.maps.LatLng, type: string) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    const service = new google.maps.places.PlacesService(map);
    const request = {
      location: location,
      radius: 2000, // 2km radius
      type: type,
    };

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setNearbyPlaces(results);
        
        // Add markers for nearby places
        results.slice(0, 10).forEach((place) => {
          if (place.geometry?.location) {
            const marker = new google.maps.marker.AdvancedMarkerElement({
              map,
              position: place.geometry.location,
              title: place.name,
            });
            markersRef.current.push(marker);
          }
        });
      } else {
        setNearbyPlaces([]);
      }
    });
  };

  // Re-search when amenity type changes
  useEffect(() => {
    if (mapRef.current && property) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: property.location }, (results, status) => {
        if (status === "OK" && results && results[0] && mapRef.current) {
          const location = results[0].geometry.location;
          searchNearbyPlaces(mapRef.current, location, selectedAmenity);
        }
      });
    }
  }, [selectedAmenity, property]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading property...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Property not found</h1>
            <Link href="/properties">
              <Button className="bg-primary hover:bg-primary/90 text-white">Back to Listings</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = parsePropertyImages(property.images);
  const videoUrl = getPropertyVideoUrl(property.videoUrl);
  const hasGalleryImages = images.length > 0;
  const propertyStats = getPropertyStats(property);
  const additionalDetails = getPropertyAdditionalDetails(property);
  const hasOwnerContact = Boolean(property.ownerName || property.ownerPhone || property.ownerEmail);
  const ownerDisplayName = property.ownerName || "Property Owner";
  const ownerInitials = ownerDisplayName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "OW";

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Page Header */}
      <section className="bg-[#0f172a] py-12">
        <div className="container">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
            <Link href="/"><span className="hover:text-primary transition-colors">Home</span></Link>
            <span>/</span>
            <Link href="/properties"><span className="hover:text-primary transition-colors">Properties</span></Link>
            <span>/</span>
            <span className="text-primary">{property.title}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{property.title}</h1>
          <div className="flex items-center gap-2 text-gray-400 mt-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{property.location}</span>
          </div>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Image Gallery */}
              <div className="mb-8">
                <div className="relative h-80 md:h-[480px] rounded-2xl overflow-hidden shadow-lg">
                  {hasGalleryImages ? (
                    <img
                      src={images[currentImageIndex]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : videoUrl ? (
                    <video
                      src={videoUrl}
                      controls
                      playsInline
                      className="w-full h-full object-cover bg-black"
                    />
                  ) : (
                    <img
                      src={PROPERTY_MEDIA_PLACEHOLDER}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {images.length > 1 && hasGalleryImages && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2.5 shadow-lg transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5 text-foreground" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2.5 shadow-lg transition-colors"
                      >
                        <ChevronRight className="h-5 w-5 text-foreground" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm font-medium">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-semibold text-white ${
                      property.listingType === "sale" ? "bg-primary" : "bg-blue-500"
                    }`}>
                      {property.listingType === "sale" ? "For Sale" : property.listingType === "rent" ? "For Rent" : "Co-Living"}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors">
                      <Heart className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors">
                      <Share2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && hasGalleryImages && (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-3">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`relative h-16 md:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                          idx === currentImageIndex ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {videoUrl && hasGalleryImages && (
                  <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-3">
                      <h3 className="text-base font-semibold text-foreground">Video Tour</h3>
                      <p className="text-sm text-muted-foreground">
                        Watch a short walkthrough of this property.
                      </p>
                    </div>
                    <video
                      src={videoUrl}
                      controls
                      playsInline
                      className="w-full rounded-xl bg-black max-h-[460px]"
                    />
                  </div>
                )}
              </div>

              {/* Price & Quick Info */}
              <Card className="mb-6 border border-gray-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="text-3xl md:text-4xl font-bold text-primary">
                      {formatPrice(property.price, property.listingType)}
                    </div>
                    <div className="flex gap-2">
                      <span className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium capitalize">{property.propertyType}</span>
                      <span className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium capitalize">{property.status}</span>
                    </div>
                  </div>
                  <div className={`grid gap-4 ${propertyStats.length > 1 ? "grid-cols-3" : "grid-cols-1"}`}>
                    {propertyStats.map((item) => (
                      <div key={item.key} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        {item.key === "bedrooms" ? (
                          <BedDouble className="w-6 h-6 text-primary" />
                        ) : item.key === "bathrooms" ? (
                          <Bath className="w-6 h-6 text-primary" />
                        ) : (
                          <Maximize className="w-6 h-6 text-primary" />
                        )}
                        <div>
                          <div className="text-lg font-bold">{item.value}</div>
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="mb-6 border border-gray-100 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                </CardContent>
              </Card>

              {/* Property Details Grid */}
              <Card className="mb-6 border border-gray-100 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Property Details</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-8">
                    {[
                      { icon: Tag, label: "Property Type", value: property.propertyType },
                      { icon: Building2, label: "Listing Type", value: property.listingType === "sale" ? "For Sale" : property.listingType === "rent" ? "For Rent" : "Co-Living" },
                      { icon: MapPin, label: "City", value: property.city },
                      { icon: MapPin, label: "State", value: property.state },
                      ...(property.ownerName ? [{ icon: Building2, label: "Listed By", value: property.ownerName }] : []),
                      ...(usesBedroomCount(property.propertyType)
                        ? [
                            { icon: BedDouble, label: "Bedrooms", value: property.bedrooms },
                          ]
                        : []),
                      ...(usesBathroomCount(property.propertyType)
                        ? [{ icon: Bath, label: "Bathrooms", value: property.bathrooms }]
                        : []),
                      { icon: Maximize, label: getAreaLabel(property.propertyType), value: formatAreaValue(property) },
                      ...additionalDetails.map((item) => ({
                        icon: Building2,
                        label: item.label,
                        value: item.value,
                      })),
                      { icon: Calendar, label: "Status", value: property.status },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <item.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                          <div className="font-semibold text-foreground capitalize">{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Google Maps Location */}
              <Card className="mb-6 border border-gray-100 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Location & Nearby Amenities</h2>
                  
                  {/* Amenity Filter Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { id: "school", label: "Schools", icon: School },
                      { id: "hospital", label: "Hospitals", icon: Hospital },
                      { id: "restaurant", label: "Restaurants", icon: Utensils },
                      { id: "shopping_mall", label: "Shopping", icon: ShoppingBag },
                      { id: "park", label: "Parks", icon: Trees },
                    ].map((amenity) => (
                      <button
                        key={amenity.id}
                        onClick={() => setSelectedAmenity(amenity.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedAmenity === amenity.id
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <amenity.icon className="w-4 h-4" />
                        {amenity.label}
                      </button>
                    ))}
                  </div>

                  {/* Map */}
                  <MapView
                    className="w-full h-[400px] rounded-xl"
                    initialCenter={{ lat: 0, lng: 0 }}
                    initialZoom={14}
                    onMapReady={(map) => {
                      mapRef.current = map;
                      
                      // Geocode the property address
                      const geocoder = new google.maps.Geocoder();
                      geocoder.geocode({ address: property.location }, (results, status) => {
                        if (status === "OK" && results && results[0]) {
                          const location = results[0].geometry.location;
                          map.setCenter(location);
                          
                          // Add property marker
                          new google.maps.marker.AdvancedMarkerElement({
                            map,
                            position: location,
                            title: property.title,
                          });
                          
                          // Search for nearby places
                          searchNearbyPlaces(map, location, selectedAmenity);
                        }
                      });
                    }}
                  />

                  {/* Nearby Places List */}
                  {nearbyPlaces.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Nearby {selectedAmenity.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())} ({nearbyPlaces.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                        {nearbyPlaces.slice(0, 10).map((place, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                            <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-foreground truncate">{place.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{place.vicinity}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Contact Card */}
              <Card className="mb-6 border border-gray-100 shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">
                      {hasOwnerContact ? ownerInitials : "FB"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    {hasOwnerContact ? ownerDisplayName : platformSettings?.teamName || "Fastbookr Team"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {hasOwnerContact
                      ? "Contact the owner directly using the details below."
                      : platformSettings?.tagline || "We qualify tenants before connecting them to owners."}
                  </p>
                  <div className="space-y-2 text-sm">
                    {hasOwnerContact && property.ownerPhone && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4 text-primary" />
                        <a href={`tel:${property.ownerPhone}`} className="hover:text-primary transition-colors">
                          {property.ownerPhone}
                        </a>
                      </div>
                    )}
                    {hasOwnerContact && property.ownerEmail && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4 text-primary" />
                        <a href={`mailto:${property.ownerEmail}`} className="hover:text-primary transition-colors break-all">
                          {property.ownerEmail}
                        </a>
                      </div>
                    )}
                    {!hasOwnerContact && (
                      <>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4 text-primary" />
                          <span>{platformSettings?.contactPhone || "+91 98765 43210"}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4 text-primary" />
                          <span>{platformSettings?.contactEmail || "team@fastbookr.com"}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {hasOwnerContact && (
                    <div className="mt-5 pt-4 border-t border-gray-100 text-left">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Fastbookr Support
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4 text-primary" />
                          <span>{platformSettings?.contactPhone || "+91 98765 43210"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4 text-primary" />
                          <span className="break-all">{platformSettings?.contactEmail || "team@fastbookr.com"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inquiry Form */}
              <Card className="sticky top-24 border border-gray-100 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-1">Interested in this property?</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    {hasOwnerContact
                      ? "You can contact the owner directly using the details above, or send an inquiry through Fastbookr if you want us to assist."
                      : "Fill out the form below. We will review your request and connect you with the owner once your inquiry is qualified."}
                  </p>
                  <form onSubmit={handleSubmitInquiry} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                      <Input
                        id="name"
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                        placeholder="John Doe"
                        className="mt-1 h-11 bg-gray-50 border-gray-200"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                        placeholder="john@example.com"
                        className="mt-1 h-11 bg-gray-50 border-gray-200"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="mt-1 h-11 bg-gray-50 border-gray-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message" className="text-sm font-medium">Message *</Label>
                      <Textarea
                        id="message"
                        rows={4}
                        value={inquiryForm.message}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                        placeholder="I'm interested in this property and would like to schedule a viewing..."
                        className="mt-1 bg-gray-50 border-gray-200"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold"
                      disabled={createInquiry.isPending}
                    >
                      {createInquiry.isPending ? "Sending..." : "Send Inquiry"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
