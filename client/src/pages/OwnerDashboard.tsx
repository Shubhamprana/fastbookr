import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PropertyForm } from "@/components/PropertyForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAppErrorMessage } from "@/lib/errors";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import {
  asAvailableFor,
  asBalcony,
  asFurnishing,
  asGenderPreference,
  asListingType,
  asParking,
  asPlotFacing,
  asPropertyType,
  deriveAreaNumericValue,
  normalizeAreaText,
  normalizeBathroomValue,
  normalizeBedroomValue,
} from "@/lib/propertyDisplay";

const emptyForm = {
  title: "",
  description: "",
  price: "",
  location: "",
  city: "",
  state: "",
  zipCode: "",
  propertyType: "house",
  listingType: "rent",
  bedrooms: "",
  bathrooms: "",
  squareFeet: "",
  images: "[]",
  videoUrl: "",
  furnishing: "",
  parking: "",
  balcony: "",
  availableFor: "",
  genderPreference: "",
  foodIncluded: "",
  attachedBathroom: "",
  plotFacing: "",
  rejectionReason: "",
  featured: "0",
  approvalStatus: "pending",
  feeStatus: "open",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  latitude: "",
  longitude: "",
};

function normalizeImages(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
    }
    if (typeof parsed === "string" && parsed.trim()) {
      return [parsed];
    }
  } catch {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

export default function OwnerDashboard() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: listings, isLoading } = trpc.properties.getMine.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: allMessages } = trpc.ownerMessages.getMine.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const utils = trpc.useUtils();

  const propertyId = selectedPropertyId ?? listings?.[0]?.id ?? null;
  const { data: propertyMessages } = trpc.ownerMessages.getByProperty.useQuery(
    { propertyId: propertyId ?? 0 },
    { enabled: Boolean(propertyId) && isAuthenticated }
  );

  const sendMessage = trpc.ownerMessages.create.useMutation({
    onSuccess: () => {
      toast.success("Message sent to admin");
      setMessage("");
      utils.ownerMessages.getMine.invalidate();
      if (propertyId) {
        utils.ownerMessages.getByProperty.invalidate({ propertyId });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateListing = trpc.properties.updateOwnerListing.useMutation({
    onSuccess: () => {
      toast.success("Listing updated and sent back for review.");
      setEditingProperty(null);
      setIsEditDialogOpen(false);
      setFormData(emptyForm);
      utils.properties.getMine.invalidate();
      utils.properties.getAll.invalidate();
      utils.properties.getAdminAll.invalidate();
    },
    onError: (error) => {
      toast.error(formatAppErrorMessage(error, "Failed to update your listing."));
    },
  });

  const deleteListing = trpc.properties.deleteOwnerListing.useMutation({
    onSuccess: () => {
      toast.success("Listing deleted.");
      utils.properties.getMine.invalidate();
      utils.properties.getAll.invalidate();
      utils.properties.getAdminAll.invalidate();
    },
    onError: (error) => {
      toast.error(formatAppErrorMessage(error, "Failed to delete your listing."));
    },
  });

  const groupedMessages = useMemo(() => {
    const map = new Map<number, number>();
    (allMessages ?? []).forEach((item) => {
      map.set(item.propertyId, (map.get(item.propertyId) ?? 0) + 1);
    });
    return map;
  }, [allMessages]);

  const handleEdit = (listing: any) => {
    setEditingProperty(listing);
    setFormData({
      title: listing.title,
      description: listing.description,
      price: (listing.price / 100).toString(),
      location: listing.location,
      city: listing.city,
      state: listing.state,
      zipCode: listing.zipCode || "",
      propertyType: listing.propertyType,
      listingType: listing.listingType,
      bedrooms: String(listing.bedrooms ?? ""),
      bathrooms: String(listing.bathrooms ?? ""),
      squareFeet: listing.areaText || String(listing.squareFeet ?? ""),
      images: JSON.stringify(normalizeImages(listing.images)),
      videoUrl: listing.videoUrl || "",
      furnishing: listing.furnishing || "",
      parking: listing.parking || "",
      balcony: listing.balcony || "",
      availableFor: listing.availableFor || "",
      genderPreference: listing.genderPreference || "",
      foodIncluded:
        typeof listing.foodIncluded === "boolean" ? String(listing.foodIncluded) : "",
      attachedBathroom:
        typeof listing.attachedBathroom === "boolean" ? String(listing.attachedBathroom) : "",
      plotFacing: listing.plotFacing || "",
      rejectionReason: listing.rejectionReason || "",
      featured: "0",
      approvalStatus: "pending",
      feeStatus: listing.feeStatus || "open",
      ownerName: listing.ownerName || "",
      ownerEmail: listing.ownerEmail || "",
      ownerPhone: listing.ownerPhone || "",
      latitude: listing.latitude?.toString() || "",
      longitude: listing.longitude?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (listingId: number) => {
    if (!window.confirm("Delete this listing permanently? This will also remove its uploaded media.")) {
      return;
    }

    deleteListing.mutate({ id: listingId });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProperty) {
      return;
    }

    try {
      const images = JSON.parse(formData.images);
      const propertyType = asPropertyType(formData.propertyType);
      const listingType = asListingType(formData.listingType);

      updateListing.mutate({
        id: editingProperty.id,
        title: formData.title,
        description: formData.description,
        price: Math.round(parseFloat(formData.price) * 100),
        location: formData.location,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode || null,
        propertyType,
        listingType,
        bedrooms: Number(normalizeBedroomValue(propertyType, parseInt(formData.bedrooms || "0", 10))),
        bathrooms: Number(normalizeBathroomValue(propertyType, parseInt(formData.bathrooms || "0", 10))),
        squareFeet: deriveAreaNumericValue(formData.squareFeet),
        areaText: normalizeAreaText(formData.squareFeet),
        images,
        videoUrl: formData.videoUrl || null,
        furnishing: asFurnishing(formData.furnishing),
        parking: asParking(formData.parking),
        balcony: asBalcony(formData.balcony),
        availableFor: asAvailableFor(formData.availableFor),
        genderPreference: asGenderPreference(formData.genderPreference),
        foodIncluded: formData.foodIncluded ? formData.foodIncluded === "true" : null,
        attachedBathroom: formData.attachedBathroom ? formData.attachedBathroom === "true" : null,
        plotFacing: asPlotFacing(formData.plotFacing),
        rejectionReason: null,
        featured: false,
        approvalStatus: "pending",
        feeStatus: "open",
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      });
    } catch {
      toast.error("Please check your images and numeric fields.");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24">
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <CardTitle>Sign in to view your owner dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/auth")}>Go to Sign In</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="bg-[#0f172a] py-12 text-white">
        <div className="container">
          <h1 className="text-3xl font-bold">Owner Dashboard</h1>
          <p className="mt-2 text-sm text-gray-300">
            Track your listings, edit or delete your own properties, and respond to admin messages.
          </p>
        </div>
      </section>

      <section className="container py-10">
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <CardTitle>My Listings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading listings...</div>
                ) : listings && listings.length > 0 ? (
                  listings.map((listing: any) => (
                    <div
                      key={listing.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="font-semibold">{listing.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {listing.city}, {listing.state}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="capitalize" variant="outline">
                            {listing.approvalStatus}
                          </Badge>
                          <Badge className="capitalize" variant="secondary">
                            Fee: {listing.feeStatus}
                          </Badge>
                          <Badge className="capitalize" variant="outline">
                            {groupedMessages.get(listing.id) ?? 0} messages
                          </Badge>
                        </div>
                      </div>
                      {listing.approvalStatus === "rejected" && listing.rejectionReason && (
                        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                          <span className="font-medium">Rejection reason:</span> {listing.rejectionReason}
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => handleEdit(listing)}>
                          Edit Listing
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(listing.id)}
                          disabled={deleteListing.isPending}
                        >
                          Delete Listing
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Editing a listing sends it back to pending review so changes can be checked before republishing.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      You have not submitted any listings yet.
                    </p>
                    <Link href="/submit-listing">
                      <Button>Submit a Listing</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Select Listing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {listings?.map((listing: any) => (
                    <button
                      key={listing.id}
                      onClick={() => setSelectedPropertyId(listing.id)}
                      className={`w-full rounded-lg border p-3 text-left ${
                        propertyId === listing.id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="font-medium">{listing.title}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {listing.approvalStatus}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message Thread</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-lg border p-4">
                    {propertyMessages && propertyMessages.length > 0 ? (
                      propertyMessages.map((item: any) => (
                        <div
                          key={item.id}
                          className={`rounded-lg p-3 text-sm ${
                            item.senderRole === "admin"
                              ? "bg-muted"
                              : "bg-primary/10"
                          }`}
                        >
                          <div className="mb-1 font-medium capitalize">{item.senderRole}</div>
                          <div>{item.content}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No messages yet for this listing.
                      </div>
                    )}
                  </div>

                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Send a message to admin about this listing..."
                    rows={4}
                  />
                  <Button
                    disabled={!propertyId || !message.trim() || sendMessage.isPending}
                    onClick={() => {
                      if (!propertyId) return;
                      sendMessage.mutate({
                        propertyId,
                        content: message.trim(),
                      });
                    }}
                  >
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
          </DialogHeader>
          <PropertyForm
            formData={formData}
            onFormDataChange={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingProperty(null);
              setFormData(emptyForm);
            }}
            isEditing={Boolean(editingProperty)}
            isSubmitting={updateListing.isPending}
            mode="owner"
          />
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
