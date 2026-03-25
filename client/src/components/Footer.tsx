import { Link } from "wouter";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Footer() {
  const [email, setEmail] = useState("");
  const { data: platformSettings } = trpc.platformSettings.get.useQuery();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("Thank you for subscribing!");
      setEmail("");
    }
  };

  return (
    <footer className="bg-[#0f172a] text-white">
      {/* Main Footer */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </div>
              <span className="text-xl font-bold">
                <span className="text-primary">FAST</span>BOOKR
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              We help you find the perfect property that matches your lifestyle and budget. Our expert team is dedicated to making your real estate journey seamless.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                  onClick={(e) => { e.preventDefault(); toast.info("Social media link coming soon"); }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: "Home", href: "/" },
                { label: "Properties", href: "/properties" },
                { label: "About Us", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Contact", href: "/contact" },
                { label: "FAQ", href: "/faq" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center gap-2">
                      <ArrowRight className="w-3 h-3" />
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-5">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-gray-400 text-sm">Sector 17 Business Hub, Chandigarh, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span className="text-gray-400 text-sm">{platformSettings?.contactPhone || "+91 98765 43210"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span className="text-gray-400 text-sm">{platformSettings?.contactEmail || "team@fastbookr.com"}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-5">Newsletter</h4>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to our newsletter for the latest property listings and real estate news.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/10 text-white placeholder:text-gray-500 focus:border-primary"
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Fastbookr. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-gray-300 text-sm" onClick={(e) => e.preventDefault()}>
                Privacy Policy
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-300 text-sm" onClick={(e) => e.preventDefault()}>
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
