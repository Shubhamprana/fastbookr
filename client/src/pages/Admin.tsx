import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Eye, Check, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { PropertyForm } from "@/components/PropertyForm";
import { formatAppErrorMessage } from "@/lib/errors";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
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
  getPropertyStats,
  normalizeBathroomValue,
  normalizeBedroomValue,
} from "@/lib/propertyDisplay";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [selectedMessagePropertyId, setSelectedMessagePropertyId] = useState<number | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [platformForm, setPlatformForm] = useState({
    teamName: "",
    tagline: "",
    contactPhone: "",
    contactEmail: "",
  });
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "house",
    listingType: "sale",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    images: "",
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
    approvalStatus: "approved",
    feeStatus: "open",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    latitude: "",
    longitude: "",
  });

  const utils = trpc.useUtils();
  const { data: properties, isLoading } = trpc.properties.getAdminAll.useQuery();
  const { data: inquiries, isLoading: inquiriesLoading } = trpc.inquiries.getAll.useQuery();
  const { data: contactMessages, isLoading: contactMessagesLoading } = trpc.contactMessages.getAll.useQuery();
  const { data: platformSettings } = trpc.platformSettings.get.useQuery();
  const messagePropertyId = selectedMessagePropertyId ?? properties?.[0]?.id ?? null;
  const { data: propertyMessages } = trpc.ownerMessages.getByProperty.useQuery(
    { propertyId: messagePropertyId ?? 0 },
    { enabled: Boolean(messagePropertyId) }
  );
  
  const createProperty = trpc.properties.create.useMutation({
    onSuccess: () => {
      toast.success("Property created successfully");
      utils.properties.getAll.invalidate();
      utils.properties.getAdminAll.invalidate();
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(formatAppErrorMessage(error, "Failed to create property."));
    },
  });

  const updateProperty = trpc.properties.update.useMutation({
    onSuccess: () => {
      toast.success("Property updated successfully");
      utils.properties.getAll.invalidate();
      utils.properties.getAdminAll.invalidate();
      setEditingProperty(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(formatAppErrorMessage(error, "Failed to update property."));
    },
  });

  const updateApproval = trpc.properties.updateApprovalStatus.useMutation({
    onSuccess: () => {
      toast.success("Listing status updated");
      utils.properties.getAll.invalidate();
      utils.properties.getAdminAll.invalidate();
    },
    onError: (error) => {
      toast.error(formatAppErrorMessage(error, "Failed to update listing status."));
    },
  });

  const deleteProperty = trpc.properties.delete.useMutation({
    onSuccess: () => {
      toast.success("Property deleted successfully");
      utils.properties.getAll.invalidate();
      utils.properties.getAdminAll.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to delete property: " + error.message);
    },
  });

  const updateInquiryStatus = trpc.inquiries.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Inquiry updated");
      utils.inquiries.getAll.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update inquiry: " + error.message);
    },
  });

  const sendOwnerMessage = trpc.ownerMessages.create.useMutation({
    onSuccess: () => {
      toast.success("Message sent to owner");
      setAdminMessage("");
      utils.ownerMessages.getByProperty.invalidate({ propertyId: messagePropertyId ?? 0 });
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
    },
  });

  useEffect(() => {
    if (!platformSettings) return;
    setPlatformForm({
      teamName: platformSettings.teamName,
      tagline: platformSettings.tagline,
      contactPhone: platformSettings.contactPhone,
      contactEmail: platformSettings.contactEmail,
    });
  }, [platformSettings]);

  const updatePlatformSettings = trpc.platformSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Platform contact details updated");
      utils.platformSettings.get.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update contact details: " + error.message);
    },
  });

  const updateContactMessageStatus = trpc.contactMessages.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Contact message updated");
      utils.contactMessages.getAll.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update contact message: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      location: "",
      city: "",
      state: "",
      zipCode: "",
      propertyType: "house",
      listingType: "sale",
      bedrooms: "",
      bathrooms: "",
      squareFeet: "",
      images: "",
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
      approvalStatus: "approved",
      feeStatus: "open",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      latitude: "",
      longitude: "",
    });
  };

  const handleEdit = (property: any) => {
    setEditingProperty(property);
    setFormData({
      title: property.title,
      description: property.description,
      price: (property.price / 100).toString(),
      location: property.location,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode || "",
      propertyType: property.propertyType,
      listingType: property.listingType,
      bedrooms: property.bedrooms.toString(),
      bathrooms: property.bathrooms.toString(),
      squareFeet: property.squareFeet.toString(),
      images: typeof property.images === "string" ? property.images : JSON.stringify(property.images),
      videoUrl: property.videoUrl || "",
      furnishing: property.furnishing || "",
      parking: property.parking || "",
      balcony: property.balcony || "",
      availableFor: property.availableFor || "",
      genderPreference: property.genderPreference || "",
      foodIncluded:
        typeof property.foodIncluded === "boolean" ? String(property.foodIncluded) : "",
      attachedBathroom:
        typeof property.attachedBathroom === "boolean" ? String(property.attachedBathroom) : "",
      plotFacing: property.plotFacing || "",
      rejectionReason: property.rejectionReason || "",
      featured: property.featured ? "1" : "0",
      approvalStatus: property.approvalStatus || "pending",
      feeStatus: property.feeStatus || "open",
      ownerName: property.ownerName || "",
      ownerEmail: property.ownerEmail || "",
      ownerPhone: property.ownerPhone || "",
      latitude: property.latitude?.toString() || "",
      longitude: property.longitude?.toString() || "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const images = JSON.parse(formData.images);
      const propertyType = asPropertyType(formData.propertyType);
      const listingType = asListingType(formData.listingType);
      const approvalStatus = formData.approvalStatus as "pending" | "approved" | "rejected";
      const feeStatus = formData.feeStatus as "open" | "won" | "paid";
      
      const propertyData = {
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
        squareFeet: parseInt(formData.squareFeet),
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
        rejectionReason: formData.approvalStatus === "rejected" ? formData.rejectionReason || null : null,
        featured: formData.featured === "1",
        approvalStatus,
        feeStatus,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      if (editingProperty) {
        updateProperty.mutate({ id: editingProperty.id, ...propertyData });
      } else {
        createProperty.mutate(propertyData);
      }
    } catch (error) {
      toast.error("Invalid JSON format for images");
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this property?")) {
      deleteProperty.mutate({ id });
    }
  };

  const handleApprovalChange = (property: any, approvalStatus: "approved" | "rejected") => {
    const rejectionReason =
      approvalStatus === "rejected"
        ? window.prompt("Why is this listing being rejected? This will be shown to the owner.", property.rejectionReason || "")
        : null;

    if (approvalStatus === "rejected" && !rejectionReason?.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }

    updateApproval.mutate({
      id: property.id,
      rejectionReason: approvalStatus === "rejected" ? rejectionReason : null,
      approvalStatus,
    });
  };

  const handleInquiryStatusChange = (
    inquiry: any,
    status: "new" | "contacted" | "closed"
  ) => {
    updateInquiryStatus.mutate({
      id: inquiry.id,
      status,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-secondary mb-4">Please Sign In</h1>
          <p className="text-muted-foreground mb-4">You need to be signed in to access the admin panel.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-secondary mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    });
  };

  const handleCancel = () => {
    setEditingProperty(null);
    setIsAddDialogOpen(false);
    resetForm();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Page Header */}
      <section className="bg-[#0f172a] py-12">
        <div className="container">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your property listings</p>
        </div>
      </section>

      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary mb-2">Property Management</h1>
              <p className="text-muted-foreground">Manage all property listings</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Property</DialogTitle>
                </DialogHeader>
                <PropertyForm
                  formData={formData}
                  onFormDataChange={setFormData}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isEditing={false}
                  isSubmitting={createProperty.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="properties" className="space-y-4">
          <TabsList>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="contact-leads">Contact Leads</TabsTrigger>
            <TabsTrigger value="messages">Owner Messages</TabsTrigger>
            <TabsTrigger value="contact">Platform Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle>All Properties ({properties?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading properties...</div>
                ) : properties && properties.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Beds/Baths</TableHead>
                          <TableHead>Approval</TableHead>
                          <TableHead>Lead Fee</TableHead>
                          <TableHead>Featured</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {properties.map((property) => (
                          <TableRow key={property.id}>
                            <TableCell className="font-medium">{property.title}</TableCell>
                            <TableCell className="capitalize">{property.propertyType}</TableCell>
                            <TableCell>{formatPrice(property.price)}</TableCell>
                            <TableCell>{property.city}, {property.state}</TableCell>
                            <TableCell>
                              {getPropertyStats(property)
                                .filter((item) => item.key !== "squareFeet")
                                .map((item) => `${item.value} ${item.shortLabel}`)
                                .join(" • ") || "-"}
                            </TableCell>
                            <TableCell className="capitalize">{property.approvalStatus}</TableCell>
                            <TableCell className="capitalize">{property.feeStatus}</TableCell>
                            <TableCell>{property.featured ? "Yes" : "No"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setLocation(`/properties/${property.id}`)}
                                  title="Preview listing"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {property.approvalStatus !== "approved" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleApprovalChange(property, "approved")}
                                    title="Approve listing"
                                  >
                                    <Check className="h-4 w-4 text-emerald-600" />
                                  </Button>
                                )}
                                {property.approvalStatus !== "rejected" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleApprovalChange(property, "rejected")}
                                    title="Reject listing"
                                  >
                                    <X className="h-4 w-4 text-amber-600" />
                                  </Button>
                                )}
                                <Dialog open={editingProperty?.id === property.id} onOpenChange={(open) => {
                                  if (!open) {
                                    setEditingProperty(null);
                                    resetForm();
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(property)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Edit Property</DialogTitle>
                                    </DialogHeader>
                                    <PropertyForm
                                      formData={formData}
                                      onFormDataChange={setFormData}
                                      onSubmit={handleSubmit}
                                      onCancel={handleCancel}
                                      isEditing={true}
                                      isSubmitting={updateProperty.isPending}
                                    />
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(property.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No properties found. Add your first property to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inquiries">
            <Card>
              <CardHeader>
                <CardTitle>All Inquiries ({inquiries?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {inquiriesLoading ? (
                  <div className="text-center py-8">Loading inquiries...</div>
                ) : inquiries && inquiries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>Lead</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inquiries.map((inquiry: any) => (
                          <TableRow key={inquiry.id}>
                            <TableCell>#{inquiry.propertyId}</TableCell>
                            <TableCell>
                              <div className="font-medium">{inquiry.name}</div>
                              <div className="text-xs text-muted-foreground">{inquiry.email}</div>
                            </TableCell>
                            <TableCell>{inquiry.phone || "-"}</TableCell>
                            <TableCell className="max-w-xs truncate">{inquiry.message}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  inquiry.status === "closed"
                                    ? "default"
                                    : inquiry.status === "contacted"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="capitalize"
                              >
                                {inquiry.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {inquiry.createdAt
                                ? new Date(inquiry.createdAt).toLocaleDateString()
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {inquiry.status !== "contacted" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleInquiryStatusChange(inquiry, "contacted")}
                                  >
                                    Mark Contacted
                                  </Button>
                                )}
                                {inquiry.status !== "closed" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleInquiryStatusChange(inquiry, "closed")}
                                  >
                                    Close
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No inquiries have been received yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact-leads">
            <Card>
              <CardHeader>
                <CardTitle>Contact Form Messages ({contactMessages?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {contactMessagesLoading ? (
                  <div className="text-center py-8">Loading contact messages...</div>
                ) : contactMessages && contactMessages.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contactMessages.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.email}</TableCell>
                            <TableCell>{item.phone || "-"}</TableCell>
                            <TableCell>{item.subject || "-"}</TableCell>
                            <TableCell className="max-w-xs truncate">{item.message}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.status === "closed"
                                    ? "default"
                                    : item.status === "reviewed"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="capitalize"
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {item.status !== "reviewed" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateContactMessageStatus.mutate({ id: item.id, status: "reviewed" })}
                                  >
                                    Mark Reviewed
                                  </Button>
                                )}
                                {item.status !== "closed" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateContactMessageStatus.mutate({ id: item.id, status: "closed" })}
                                  >
                                    Close
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No contact form messages yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Select Property</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {properties?.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => setSelectedMessagePropertyId(property.id)}
                      className={`w-full rounded-lg border p-3 text-left ${
                        messagePropertyId === property.id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="font-medium">{property.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {property.ownerName || "Owner"} · {property.ownerEmail || "No email"}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-lg border p-4">
                    {propertyMessages && propertyMessages.length > 0 ? (
                      propertyMessages.map((item: any) => (
                        <div
                          key={item.id}
                          className={`rounded-lg p-3 text-sm ${
                            item.senderRole === "admin" ? "bg-primary/10" : "bg-muted"
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
                        No messages for this property yet.
                      </div>
                    )}
                  </div>

                  <Textarea
                    value={adminMessage}
                    onChange={e => setAdminMessage(e.target.value)}
                    placeholder="Send a message to the property owner..."
                    rows={4}
                  />
                  <Button
                    disabled={!messagePropertyId || !adminMessage.trim() || sendOwnerMessage.isPending}
                    onClick={() => {
                      if (!messagePropertyId) return;
                      sendOwnerMessage.mutate({
                        propertyId: messagePropertyId,
                        content: adminMessage.trim(),
                      });
                    }}
                  >
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Platform Contact Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4 max-w-2xl"
                  onSubmit={(e) => {
                    e.preventDefault();
                    updatePlatformSettings.mutate({
                      teamName: platformForm.teamName.trim(),
                      tagline: platformForm.tagline.trim(),
                      contactPhone: platformForm.contactPhone.trim(),
                      contactEmail: platformForm.contactEmail.trim(),
                    });
                  }}
                >
                  <div>
                    <label className="text-sm font-medium text-foreground">Team Name</label>
                    <Input
                      value={platformForm.teamName}
                      onChange={(e) => setPlatformForm((current) => ({ ...current, teamName: e.target.value }))}
                      placeholder="Fastbookr Team"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Tagline</label>
                    <Textarea
                      value={platformForm.tagline}
                      onChange={(e) => setPlatformForm((current) => ({ ...current, tagline: e.target.value }))}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-foreground">Contact Phone</label>
                      <Input
                        value={platformForm.contactPhone}
                        onChange={(e) => setPlatformForm((current) => ({ ...current, contactPhone: e.target.value }))}
                        placeholder="+91 98765 43210"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Contact Email</label>
                      <Input
                        type="email"
                        value={platformForm.contactEmail}
                        onChange={(e) => setPlatformForm((current) => ({ ...current, contactEmail: e.target.value }))}
                        placeholder="team@fastbookr.com"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    These details are shown on the public property page, footer, and contact page.
                  </div>
                  <div>
                    <Button
                      type="submit"
                      disabled={
                        updatePlatformSettings.isPending ||
                        !platformForm.teamName.trim() ||
                        !platformForm.tagline.trim() ||
                        !platformForm.contactPhone.trim() ||
                        !platformForm.contactEmail.trim()
                      }
                    >
                      Save Contact Details
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
