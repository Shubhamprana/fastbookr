import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search, Home as HomeIcon, Building2, Castle, Landmark, Building, Warehouse, DoorOpen, BedDouble,
  Bath, Maximize, MapPin, ArrowRight, Phone, FileText, Eye, Handshake, CheckCircle,
  Star, ChevronLeft, ChevronRight, Heart
} from "lucide-react";
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete";
import { getPropertyStats } from "@/lib/propertyDisplay";

// Image constants
const HERO_BG = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80";
const CITY_IMAGES = [
  { name: "Chandigarh", properties: 245, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/yFIfauIXnbyxjHuM.jpg" },
  { name: "Delhi", properties: 189, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/vgKfjuUFAVRKLVcn.jpg" },
  { name: "Mumbai", properties: 312, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/RXbErSHgKthxTpBJ.jpg" },
  { name: "Bengaluru", properties: 156, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/NWvSgLdXPLoMfpUj.jpg" },
];
const ABOUT_IMAGE = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/QnRQWzbLmtVXhqUy.jpg";
const BLOG_POSTS = [
  {
    title: "Investment in Property: Features to Consider",
    date: "Feb 10, 2026",
    category: "Investment",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/lxhnvltlqrEvRSjH.jpg",
    excerpt: "Discover the key features that make a property a great investment opportunity in today's market.",
  },
  {
    title: "5 Tips on Choosing Communities Suitable for Families",
    date: "Feb 8, 2026",
    category: "Lifestyle",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/yulveTYvgmigAYwy.jpg",
    excerpt: "Finding the right neighborhood for your family involves more than just the house itself.",
  },
  {
    title: "5 Most Comfortable Areas for Young Professionals",
    date: "Feb 5, 2026",
    category: "Guide",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/KHTLRzKvlmszkkMa.jpg",
    excerpt: "Explore the top neighborhoods that offer the perfect blend of work-life balance.",
  },
];

const PROPERTY_TYPES = [
  { icon: HomeIcon, label: "House", count: 24 },
  { icon: Building2, label: "Apartment", count: 18 },
  { icon: Castle, label: "Villa", count: 12 },
  { icon: Landmark, label: "Commercial", count: 8 },
  { icon: Building, label: "Townhouse", count: 15 },
  { icon: Warehouse, label: "Loft", count: 6 },
  { icon: DoorOpen, label: "Office", count: 10 },
  { icon: BedDouble, label: "Room", count: 22 },
  { icon: Building2, label: "Studio", count: 14 },
  { icon: BedDouble, label: "Shared Room", count: 9 },
  { icon: HomeIcon, label: "PG / Hostel", count: 11 },
  { icon: Building, label: "Independent Floor", count: 7 },
];

const HOW_IT_WORKS = [
  { icon: Search, title: "Browse Listings", desc: "Explore verified rooms, studios, flats, and rental homes in your preferred city." },
  { icon: Phone, title: "Send Inquiry", desc: "Contact our team through the listing form so we can understand your requirement." },
  { icon: Eye, title: "Get Shortlisted", desc: "We screen the request and shortlist suitable options before sharing the lead." },
  { icon: Handshake, title: "Visit Property", desc: "Schedule visits with the owner once your inquiry is qualified." },
  { icon: CheckCircle, title: "Move In", desc: "Finalize the rental and complete the move-in process with our support." },
];

const TESTIMONIALS = [
  { name: "Aman Verma", role: "Tenant", text: "Fastbookr helped me find a rental within my budget without wasting time on fake or outdated listings. The team was quick and practical.", rating: 5 },
  { name: "Neha Arora", role: "Property Owner", text: "I listed my flat and started getting qualified tenant leads instead of random calls. That made the platform useful from day one.", rating: 5 },
  { name: "Priya Sharma", role: "First-time Renter", text: "As a first-time renter, I was nervous about the process. The team guided me at every step and helped me shortlist the right apartment quickly.", rating: 5 },
];

const FAQ_ITEMS = [
  { q: "Can I find a rental within my budget?", a: "Yes. You can filter by city, property type, and rental budget to narrow the listings quickly. We focus on practical rental options such as rooms, studios, PG/hostel, and apartments." },
  { q: "How do owners list their property here?", a: "Owners can submit their room, flat, studio, or house through the listing form. Our team reviews each submission before it goes live so renters see better quality listings." },
  { q: "How long does the rental process usually take?", a: "It depends on the city, owner response, and tenant documents, but qualified renters can often move from inquiry to property visit within a few days." },
  { q: "Do you offer virtual property tours?", a: "Yes! We offer virtual tours for most of our listed properties. You can explore properties from the comfort of your home before scheduling an in-person visit." },
  { q: "What charges are involved in renting through the platform?", a: "Rental charges depend on the property and city. If there are any platform or owner-side charges, they should be communicated clearly before the deal is finalized." },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("sale");
  const [propertyType, setPropertyType] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<{ lat: number; lng: number } | null>(null);
  const [listingTab, setListingTab] = useState("sale");
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const { data: featuredProperties } = trpc.properties.getFeatured.useQuery();
  const { data: allProperties } = trpc.properties.search.useQuery({});

  const popularProperties = useMemo(() => {
    if (!allProperties) return [];
    return allProperties
      .filter((p: any) => listingTab === "all" || p.listingType === listingTab)
      .slice(0, 8);
  }, [allProperties, listingTab]);

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    });
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (activeTab !== "all") params.set("listingType", activeTab);
    if (propertyType !== "all") params.set("propertyType", propertyType);
    if (locationFilter) params.set("location", locationFilter);
    if (selectedPlace) {
      params.set("lat", selectedPlace.lat.toString());
      params.set("lng", selectedPlace.lng.toString());
    }
    setLocation(`/properties?${params.toString()}`);
  };

  const parseImages = (images: string) => {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Property Card Component
  const PropertyCard = ({ property, featured = false }: { property: any; featured?: boolean }) => {
    const images = parseImages(property.images);
    const mainImage = images[0] || "https://placehold.co/600x400/e2e8f0/94a3b8?text=Property";
    const stats = getPropertyStats(property);
    return (
      <Link href={`/properties/${property.id}`}>
        <Card className={`group overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer ${featured ? "" : ""}`}>
          <div className={`relative overflow-hidden ${featured ? "h-64" : "h-52"}`}>
            <img
              src={mainImage}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                property.listingType === "sale" ? "bg-primary" : "bg-blue-500"
              }`}>
                {property.listingType === "sale" ? "For Sale" : property.listingType === "rent" ? "For Rent" : "Co-Living"}
              </span>
            </div>
            <button
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <Heart className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <CardContent className="p-5">
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="truncate">{property.city}, {property.state}</span>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-3 truncate group-hover:text-primary transition-colors">
              {property.title}
            </h3>
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
                  {item.value} {item.shortLabel}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-lg font-bold text-primary">{formatPrice(property.price)}</span>
              {property.listingType === "rent" && <span className="text-xs text-muted-foreground">/month</span>}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <section className="relative bg-gradient-to-b from-[#f0fdf9] to-white py-20 lg:py-28">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-5">
            Find the right <span className="text-primary">rental space</span>
            <br />for your next move
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
            Browse rooms, studios, PGs, apartments, and independent floors across major Indian cities.
          </p>

          {/* Search Box */}
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            {/* Tabs */}
            <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
              {[
                { key: "sale", label: "Sale" },
                { key: "co-living", label: "Co-Living" },
                { key: "rent", label: "Rent" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    activeTab === tab.key
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="h-12 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="room">Room</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="shared-room">Shared Room</SelectItem>
                  <SelectItem value="pg/hostel">PG / Hostel</SelectItem>
                  <SelectItem value="independent-floor">Independent Floor</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                </SelectContent>
              </Select>

              <PlacesAutocomplete
                value={locationFilter}
                onChange={setLocationFilter}
                onPlaceSelect={(place) => {
                  setLocationFilter(place.address);
                  setSelectedPlace({ lat: place.lat, lng: place.lng });
                }}
                placeholder="Search location..."
                className="h-12 bg-gray-50 border-gray-200"
              />

              <Button onClick={handleSearch} className="h-12 bg-primary hover:bg-primary/90 text-white text-base font-semibold gap-2">
                <Search className="w-5 h-5" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROPERTY TYPES ===== */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Discover the <span className="text-primary">Property Types</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore different property categories to find exactly what you're looking for
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            {PROPERTY_TYPES.map((type) => (
              <Link key={type.label} href={`/properties?propertyType=${type.label.toLowerCase()}`}>
                <Card className="group text-center p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer border border-gray-100">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <type.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{type.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{type.count} Properties</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PROPERTIES ===== */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Explore the <span className="text-primary">Featured</span>
                <br />Properties
              </h2>
              <p className="text-muted-foreground">Hand-picked properties for you</p>
            </div>
            <Link href="/properties">
              <Button variant="outline" className="mt-4 md:mt-0 border-primary text-primary hover:bg-primary hover:text-white gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties?.slice(0, 3).map((property: any) => (
              <PropertyCard key={property.id} property={property} featured />
            ))}
          </div>
        </div>
      </section>

      {/* ===== POPULAR LISTING ===== */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Popular <span className="text-primary">Listing</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Browse our most popular property listings
            </p>
            {/* Tabs */}
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              {[
                { key: "sale", label: "For Sale" },
                { key: "rent", label: "For Rent" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setListingTab(tab.key)}
                  className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
                    listingTab === tab.key
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {popularProperties.map((property: any) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
          {popularProperties.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No properties found in this category.</p>
          )}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              How It <span className="text-primary">Works</span>
            </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
              A practical process for renters and property owners
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                  <step.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AVAILABLE CITIES ===== */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              We Are Available in <span className="text-primary">Many Cities</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore properties in the most popular cities across the country
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CITY_IMAGES.map((city) => (
              <Link key={city.name} href={`/properties?city=${encodeURIComponent(city.name)}`}>
                <div className="group relative rounded-2xl overflow-hidden h-72 cursor-pointer">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-5 left-5 text-white">
                    <h3 className="text-xl font-bold">{city.name}</h3>
                    <p className="text-sm text-white/80">{city.properties} Properties</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WELCOME / ABOUT ===== */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src={ABOUT_IMAGE}
                alt="Modern property"
                className="rounded-2xl w-full h-[400px] object-cover shadow-lg"
              />
              <div className="absolute -bottom-6 -right-6 bg-primary text-white rounded-2xl p-6 shadow-lg hidden md:block">
                <div className="text-3xl font-bold">15+</div>
                <div className="text-sm">Years Experience</div>
              </div>
            </div>
            <div>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">About Us</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-5">
                Welcome to <span className="text-primary">Fastbookr</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We are a property platform focused on helping renters discover verified spaces and helping owners receive qualified tenant leads.
                With on-ground rental experience and product-led workflows, our team makes the search, screening, and listing process simpler.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Whether you are looking for a room in Chandigarh, a studio in Delhi, or an apartment in Bengaluru,
                we help reduce noise and connect serious renters with approved listings.
              </p>
              <Link href="/about">
                <Button className="bg-primary hover:bg-primary/90 text-white gap-2 px-6">
                  Learn More <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS COUNTER ===== */}
      <section className="bg-primary py-16">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { number: "6,836", label: "Properties Listed" },
              { number: "324", label: "Happy Clients" },
              { number: "106", label: "Expert Agents" },
              { number: "80+", label: "Cities Covered" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-extrabold mb-2">{stat.number}</div>
                <div className="text-white/80 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Testimonials</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-3">
                Satisfied <span className="text-primary">Clients</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Hear what our clients have to say about their experience with Fastbookr
              </p>
            </div>
            <div>
              <Card className="p-8 border border-gray-100 shadow-lg relative">
                <div className="flex gap-1 mb-4">
                  {[...Array(TESTIMONIALS[testimonialIdx].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed mb-6 text-lg italic">
                  "{TESTIMONIALS[testimonialIdx].text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">
                      {TESTIMONIALS[testimonialIdx].name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{TESTIMONIALS[testimonialIdx].name}</div>
                    <div className="text-sm text-muted-foreground">{TESTIMONIALS[testimonialIdx].role}</div>
                  </div>
                </div>
                {/* Navigation */}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setTestimonialIdx((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1))}
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setTestimonialIdx((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1))}
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="bg-primary py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="container text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Let’s Find Your Next Rental
          </h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Browse verified listings or submit your property to start receiving qualified tenant inquiries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/properties">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold px-8">
                Browse Properties
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8">
                Contact Us
              </Button>
            </Link>
            <Link href="/submit-listing">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8">
                List Your Property
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== BLOG / NEWS ===== */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              News from <span className="text-primary">Fastbookr</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Stay updated with the latest real estate news and insights
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BLOG_POSTS.map((post, i) => (
              <Link key={i} href="/blog">
                <Card className="group overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground mb-2">{post.date}</p>
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Find answers to common questions about our services
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {FAQ_ITEMS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-white rounded-xl border border-gray-100 px-6 shadow-sm">
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
