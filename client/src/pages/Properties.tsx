import { useState, useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPropertyStats } from "@/lib/propertyDisplay";
import {
  Search, BedDouble, Bath, Maximize, MapPin, Heart, X, Grid3X3, List
} from "lucide-react";

export default function Properties() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);

  const [propertyType, setPropertyType] = useState(params.get("propertyType") || "all");
  const [listingType, setListingType] = useState(params.get("listingType") || "all");
  const [city, setCity] = useState(params.get("city") || "all");
  const [minBeds, setMinBeds] = useState("all");
  const [minBaths, setMinBaths] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const queryInput = useMemo(() => {
    const input: any = {};
    if (propertyType !== "all") input.propertyType = propertyType;
    if (listingType !== "all") input.listingType = listingType;
    if (city !== "all") input.city = city;
    if (minBeds !== "all") input.bedrooms = parseInt(minBeds);
    if (minBaths !== "all") input.bathrooms = parseInt(minBaths);
    return input;
  }, [propertyType, listingType, city, minBeds, minBaths]);

  const { data: properties, isLoading } = trpc.properties.search.useQuery(queryInput);

  const formatPrice = (price: number) =>
    (price / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 });

  const parseImages = (images: string) => {
    try { const p = JSON.parse(images); return Array.isArray(p) ? p : []; } catch { return []; }
  };

  const clearFilters = () => {
    setPropertyType("all");
    setListingType("all");
    setCity("all");
    setMinBeds("all");
    setMinBaths("all");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Page Header */}
      <section className="bg-[#0f172a] py-16">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Property Listings</h1>
          <p className="text-gray-400">
            <Link href="/"><span className="hover:text-primary transition-colors">Home</span></Link>
            <span className="mx-2">/</span>
            <span className="text-primary">Properties</span>
          </p>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container">
          {/* Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={listingType} onValueChange={setListingType}>
                <SelectTrigger className="w-[140px] h-10 bg-gray-50">
                  <SelectValue placeholder="Listing Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sale">For Sale</SelectItem>
                  <SelectItem value="rent">For Rent</SelectItem>
                  <SelectItem value="co-living">Co-Living</SelectItem>
                </SelectContent>
              </Select>

              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="w-[140px] h-10 bg-gray-50">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="room">Room</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="shared-room">Shared Room</SelectItem>
                  <SelectItem value="pg/hostel">PG / Hostel</SelectItem>
                  <SelectItem value="independent-floor">Independent Floor</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="showroom">Showroom</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>

              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-[140px] h-10 bg-gray-50">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Bengaluru">Bengaluru</SelectItem>
                  <SelectItem value="Pune">Pune</SelectItem>
                  <SelectItem value="Gurugram">Gurugram</SelectItem>
                </SelectContent>
              </Select>

              <Select value={minBeds} onValueChange={setMinBeds}>
                <SelectTrigger className="w-[120px] h-10 bg-gray-50">
                  <SelectValue placeholder="Beds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Beds</SelectItem>
                  <SelectItem value="1">1+ Beds</SelectItem>
                  <SelectItem value="2">2+ Beds</SelectItem>
                  <SelectItem value="3">3+ Beds</SelectItem>
                  <SelectItem value="4">4+ Beds</SelectItem>
                  <SelectItem value="5">5+ Beds</SelectItem>
                </SelectContent>
              </Select>

              <Select value={minBaths} onValueChange={setMinBaths}>
                <SelectTrigger className="w-[120px] h-10 bg-gray-50">
                  <SelectValue placeholder="Baths" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Baths</SelectItem>
                  <SelectItem value="1">1+ Baths</SelectItem>
                  <SelectItem value="2">2+ Baths</SelectItem>
                  <SelectItem value="3">3+ Baths</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1" />

              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground gap-1">
                <X className="w-4 h-4" /> Clear
              </Button>

              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-primary text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-primary text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-muted-foreground text-sm">
              Showing <span className="font-semibold text-foreground">{properties?.length || 0}</span> properties
            </p>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-52 bg-gray-200" />
                  <CardContent className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-5 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties?.map((property: any) => {
                const images = parseImages(property.images);
                const mainImage = images[0] || "https://placehold.co/600x400/e2e8f0/94a3b8?text=Property";
                const stats = getPropertyStats(property);
                return (
                  <Link key={property.id} href={`/properties/${property.id}`}>
                    <Card className="group overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer">
                      <div className="relative h-52 overflow-hidden">
                        <img src={mainImage} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-3 left-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${property.listingType === "sale" ? "bg-primary" : "bg-blue-500"}`}>
                            {property.listingType === "sale" ? "For Sale" : property.listingType === "rent" ? "For Rent" : "Co-Living"}
                          </span>
                        </div>
                        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <Heart className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span className="truncate">{property.city}, {property.state}</span>
                        </div>
                        <h3 className="font-semibold text-foreground mb-3 truncate group-hover:text-primary transition-colors">{property.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
                          {stats.map((item) => (
                            <span key={item.key} className="flex items-center gap-1">
                              {item.key === "bedrooms" ? (
                                <BedDouble className="w-4 h-4" />
                              ) : item.key === "bathrooms" ? (
                                <Bath className="w-4 h-4" />
                              ) : (
                                <Maximize className="w-4 h-4" />
                              )}{" "}
                              {item.value}
                              {item.key !== "squareFeet" ? "" : ` ${item.shortLabel}`}
                            </span>
                          ))}
                        </div>
                        <div className="pt-3 border-t border-gray-100">
                          <span className="text-lg font-bold text-primary">{formatPrice(property.price)}</span>
                          {property.listingType === "rent" && <span className="text-xs text-muted-foreground ml-1">/month</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {properties?.map((property: any) => {
                const images = parseImages(property.images);
                const mainImage = images[0] || "https://placehold.co/600x400/e2e8f0/94a3b8?text=Property";
                const stats = getPropertyStats(property);
                return (
                  <Link key={property.id} href={`/properties/${property.id}`}>
                    <Card className="group overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <div className="flex flex-col md:flex-row">
                        <div className="relative w-full md:w-80 h-52 md:h-auto overflow-hidden shrink-0">
                          <img src={mainImage} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${property.listingType === "sale" ? "bg-primary" : "bg-blue-500"}`}>
                            {property.listingType === "sale" ? "For Sale" : "For Rent"}
                          </span>
                        </div>
                        <CardContent className="p-6 flex flex-col justify-between flex-1">
                          <div>
                            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              <span>{property.location}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{property.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{property.description}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5 text-sm text-muted-foreground flex-wrap">
                              {stats.map((item) => (
                                <span key={item.key} className="flex items-center gap-1">
                                  {item.key === "bedrooms" ? (
                                    <BedDouble className="w-4 h-4" />
                                  ) : item.key === "bathrooms" ? (
                                    <Bath className="w-4 h-4" />
                                  ) : (
                                    <Maximize className="w-4 h-4" />
                                  )}{" "}
                                  {item.value} {item.shortLabel}
                                </span>
                              ))}
                            </div>
                            <span className="text-xl font-bold text-primary">{formatPrice(property.price)}</span>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {properties?.length === 0 && !isLoading && (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No properties found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your filters to see more results</p>
              <Button onClick={clearFilters} className="bg-primary hover:bg-primary/90 text-white">Clear All Filters</Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
