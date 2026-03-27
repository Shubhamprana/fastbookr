import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PropertyForm } from "@/components/PropertyForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatAppErrorMessage } from "@/lib/errors";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  asAvailableFor,
  asBalcony,
  asFurnishing,
  asGenderPreference,
  asListingType,
  asParking,
  asPlotFacing,
  asPropertyType,
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

export default function SubmitListing() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState(() => ({
    ...emptyForm,
    ownerName: user?.name ?? "",
    ownerEmail: user?.email ?? "",
  }));
  const utils = trpc.useUtils();

  const submitListing = trpc.properties.submitOwnerListing.useMutation({
    onSuccess: () => {
      toast.success("Listing submitted. Our team will review it before publishing.");
      utils.properties.getAll.invalidate();
      setLocation("/");
    },
    onError: error => {
      toast.error(formatAppErrorMessage(error, "Failed to submit listing."));
    },
  });

  const prefilled = useMemo(
    () => ({
      ...formData,
      ownerName: formData.ownerName || user?.name || "",
      ownerEmail: formData.ownerEmail || user?.email || "",
    }),
    [formData, user?.email, user?.name]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const images = JSON.parse(prefilled.images);
      const propertyType = asPropertyType(prefilled.propertyType);
      const listingType = asListingType(prefilled.listingType);
      submitListing.mutate({
        title: prefilled.title,
        description: prefilled.description,
        price: Math.round(parseFloat(prefilled.price) * 100),
        location: prefilled.location,
        city: prefilled.city,
        state: prefilled.state,
        zipCode: prefilled.zipCode || null,
        propertyType,
        listingType,
        bedrooms: Number(normalizeBedroomValue(propertyType, parseInt(prefilled.bedrooms || "0", 10))),
        bathrooms: Number(normalizeBathroomValue(propertyType, parseInt(prefilled.bathrooms || "0", 10))),
        squareFeet: parseInt(prefilled.squareFeet, 10),
        images,
        videoUrl: prefilled.videoUrl || null,
        furnishing: asFurnishing(prefilled.furnishing),
        parking: asParking(prefilled.parking),
        balcony: asBalcony(prefilled.balcony),
        availableFor: asAvailableFor(prefilled.availableFor),
        genderPreference: asGenderPreference(prefilled.genderPreference),
        foodIncluded: prefilled.foodIncluded ? prefilled.foodIncluded === "true" : null,
        attachedBathroom: prefilled.attachedBathroom ? prefilled.attachedBathroom === "true" : null,
        plotFacing: asPlotFacing(prefilled.plotFacing),
        rejectionReason: null,
        featured: false,
        approvalStatus: "pending",
        feeStatus: "open",
        ownerName: prefilled.ownerName,
        ownerEmail: prefilled.ownerEmail,
        ownerPhone: prefilled.ownerPhone,
        latitude: prefilled.latitude ? parseFloat(prefilled.latitude) : null,
        longitude: prefilled.longitude ? parseFloat(prefilled.longitude) : null,
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
              <CardTitle>Sign in to list your property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Owner submissions are protected so we can track leads and keep direct contact private until a match is qualified.
              </p>
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
          <h1 className="text-3xl font-bold">Submit Your Rental Listing</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-300">
            List your room or home for free. We review every listing, handle incoming tenant inquiries through the platform, and only connect qualified leads.
          </p>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Listing Details</CardTitle>
            </CardHeader>
            <CardContent>
              <PropertyForm
                formData={prefilled}
                onFormDataChange={setFormData}
                onSubmit={handleSubmit}
                onCancel={() => setLocation("/")}
                isEditing={false}
                isSubmitting={submitListing.isPending}
                mode="owner"
              />
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>How this works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>1. Submit your property for review.</p>
              <p>2. We approve and publish qualifying listings.</p>
              <p>3. Renters contact us through the platform, not your direct phone/email.</p>
              <p>4. We qualify the renter before passing the lead to you.</p>
              <p>5. Success-fee collection happens after a confirmed placement.</p>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}
