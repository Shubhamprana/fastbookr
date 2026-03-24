import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const { data: platformSettings } = trpc.platformSettings.get.useQuery();
  const createContactMessage = trpc.contactMessages.create.useMutation({
    onSuccess: () => {
      toast.success("Message sent successfully. Our team will review it shortly.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    createContactMessage.mutate(form);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Page Header */}
      <section className="bg-[#0f172a] py-16">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Contact Us</h1>
          <p className="text-gray-400">
            <Link href="/"><span className="hover:text-primary transition-colors">Home</span></Link>
            <span className="mx-2">/</span>
            <span className="text-primary">Contact</span>
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: MapPin, title: "Our Office", line1: "Sector 17 Business Hub", line2: "Chandigarh, India" },
              { icon: Phone, title: "Phone", line1: platformSettings?.contactPhone || "+91 98765 43210", line2: "Mon - Sat support" },
              { icon: Mail, title: "Email", line1: platformSettings?.contactEmail || "agent@realestatepro.com", line2: "We reply to qualified requests" },
              { icon: Clock, title: "Working Hours", line1: "Mon - Fri: 9AM - 6PM", line2: "Sat: 10AM - 4PM" },
            ].map((item, i) => (
              <Card key={i} className="group text-center p-6 border border-gray-100 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                  <item.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.line1}</p>
                <p className="text-sm text-muted-foreground">{item.line2}</p>
              </Card>
            ))}
          </div>

          {/* Contact Form + Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Form */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Send Us a Message</h2>
                <p className="text-muted-foreground mb-6">
                  Have a question or need assistance? Fill out the form below and we'll get back to you shortly.
                </p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Full Name *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="John Doe"
                        className="mt-1 h-11 bg-gray-50 border-gray-200"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email Address *</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="john@example.com"
                        className="mt-1 h-11 bg-gray-50 border-gray-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Phone Number</Label>
                      <Input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="mt-1 h-11 bg-gray-50 border-gray-200"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Subject</Label>
                      <Input
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="How can we help?"
                        className="mt-1 h-11 bg-gray-50 border-gray-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Message *</Label>
                    <Textarea
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us more about your inquiry..."
                      className="mt-1 bg-gray-50 border-gray-200"
                      required
                    />
                  </div>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold gap-2"
                      disabled={createContactMessage.isPending}
                    >
                      <Send className="w-4 h-4" />
                    {createContactMessage.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <div className="rounded-2xl overflow-hidden shadow-lg bg-gray-200 min-h-[400px] flex items-center justify-center">
              <div className="text-center p-8">
                <MapPin className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Our Location</h3>
                <p className="text-muted-foreground text-sm">
                  Sector 17 Business Hub<br />
                  Chandigarh, India
                </p>
                <p className="text-muted-foreground text-xs mt-4">
                  Map integration available upon request
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
