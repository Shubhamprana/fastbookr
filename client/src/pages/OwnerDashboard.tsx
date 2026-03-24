import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

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
    onError: error => {
      toast.error(error.message);
    },
  });

  const groupedMessages = useMemo(() => {
    const map = new Map<number, number>();
    (allMessages ?? []).forEach(item => {
      map.set(item.propertyId, (map.get(item.propertyId) ?? 0) + 1);
    });
    return map;
  }, [allMessages]);

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
            Track your listings, see approval status, and receive messages from admin.
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
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
                    onChange={e => setMessage(e.target.value)}
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
      <Footer />
    </div>
  );
}
