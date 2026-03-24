import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Users, Award, Home, Globe, CheckCircle, Star } from "lucide-react";

const TEAM = [
  { name: "Robert Anderson", role: "CEO & Founder", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/hRwbmvlLYhazgOgE.jpg" },
  { name: "Sarah Mitchell", role: "Head of Sales", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/XSpppxnFkYmtaqoJ.jpg" },
  { name: "James Wilson", role: "Lead Agent", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/KHTLRzKvlmszkkMa.jpg" },
  { name: "Emily Chen", role: "Marketing Director", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/yulveTYvgmigAYwy.jpg" },
];

const VALUES = [
  { icon: CheckCircle, title: "Transparency", desc: "We believe in honest, transparent communication throughout the entire property journey." },
  { icon: Star, title: "Excellence", desc: "We strive for excellence in every interaction, ensuring the highest quality service." },
  { icon: Users, title: "Client-First", desc: "Our clients are at the heart of everything we do. Your satisfaction is our priority." },
  { icon: Globe, title: "Innovation", desc: "We leverage the latest technology to provide a seamless real estate experience." },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Page Header */}
      <section className="bg-[#0f172a] py-16">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">About Us</h1>
          <p className="text-gray-400">
            <Link href="/"><span className="hover:text-primary transition-colors">Home</span></Link>
            <span className="mx-2">/</span>
            <span className="text-primary">About</span>
          </p>
        </div>
      </section>

      {/* About Intro */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/QnRQWzbLmtVXhqUy.jpg"
                alt="Modern building"
                className="rounded-2xl w-full h-[420px] object-cover shadow-lg"
              />
              <div className="absolute -bottom-6 -right-6 bg-primary text-white rounded-2xl p-6 shadow-lg hidden md:block">
                <div className="text-3xl font-bold">15+</div>
                <div className="text-sm">Years Experience</div>
              </div>
            </div>
            <div>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Who We Are</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-5">
                We Help You Find the <span className="text-primary">Right Rental Match</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-5">
                RealEstate Pro is a property platform built to connect renters with verified listings and help owners receive better quality inquiries.
                We focus on making rental discovery simpler, faster, and more reliable for Indian cities.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Our team combines listing review, inquiry management, and owner coordination so users can avoid low-quality leads and confusing follow-up.
                The goal is simple: better rental discovery for tenants and better lead quality for owners.
              </p>
              <div className="grid grid-cols-2 gap-6 mb-8">
                {[
                  { icon: Home, label: "6,836+", sub: "Properties Listed" },
                  { icon: Users, label: "324+", sub: "Happy Clients" },
                  { icon: Award, label: "106+", sub: "Expert Agents" },
                  { icon: Globe, label: "80+", sub: "Cities Covered" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-foreground">{stat.label}</div>
                      <div className="text-xs text-muted-foreground">{stat.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Our Values</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-3">
              What <span className="text-primary">Drives Us</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our core values guide every decision we make and every service we provide
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value, i) => (
              <Card key={i} className="group text-center p-8 hover:shadow-lg hover:border-primary/30 transition-all duration-300 border border-gray-100">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                  <value.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{value.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Our Team</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-3">
              Meet Our <span className="text-primary">Experts</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our dedicated team of professionals is here to help you every step of the way
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member, i) => (
              <Card key={i} className="group overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="h-64 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-5 text-center">
                  <h3 className="font-bold text-foreground">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Find the Right Rental?
          </h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Browse listings, send an inquiry, or submit your own property and let the platform handle the matching flow.
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
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
