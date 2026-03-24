import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, User, ArrowRight, Tag } from "lucide-react";

const BLOG_POSTS = [
  {
    id: 1,
    title: "Investment in Property: Features to Consider",
    excerpt: "Discover the key features that make a property a great investment opportunity in today's market. From location analysis to ROI calculations, we cover everything you need to know before making your next investment decision.",
    date: "Feb 10, 2026",
    author: "Robert Anderson",
    category: "Investment",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/lxhnvltlqrEvRSjH.jpg",
  },
  {
    id: 2,
    title: "5 Tips on Choosing Communities Suitable for Families",
    excerpt: "Finding the right neighborhood for your family involves more than just the house itself. Learn about the key factors to consider when choosing a family-friendly community, from schools to safety.",
    date: "Feb 8, 2026",
    author: "Sarah Mitchell",
    category: "Lifestyle",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/yulveTYvgmigAYwy.jpg",
  },
  {
    id: 3,
    title: "5 Most Comfortable Areas for Young Professionals",
    excerpt: "Explore the top neighborhoods that offer the perfect blend of work-life balance for young professionals. From vibrant nightlife to convenient commutes, these areas have it all.",
    date: "Feb 5, 2026",
    author: "James Wilson",
    category: "Guide",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/KHTLRzKvlmszkkMa.jpg",
  },
  {
    id: 4,
    title: "Understanding Mortgage Rates in 2026",
    excerpt: "A comprehensive guide to understanding current mortgage rates, how they affect your buying power, and strategies to secure the best rate for your home purchase.",
    date: "Feb 3, 2026",
    author: "Emily Chen",
    category: "Finance",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/hRwbmvlLYhazgOgE.jpg",
  },
  {
    id: 5,
    title: "Home Staging Tips to Sell Your Property Faster",
    excerpt: "Learn professional home staging techniques that can help you sell your property faster and at a higher price. From decluttering to creating inviting spaces, these tips work wonders.",
    date: "Jan 28, 2026",
    author: "Sarah Mitchell",
    category: "Selling",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/XSpppxnFkYmtaqoJ.jpg",
  },
  {
    id: 6,
    title: "The Rise of Smart Homes: What Buyers Want",
    excerpt: "Smart home technology is becoming a must-have for modern buyers. Discover which smart features add the most value and appeal to today's tech-savvy homebuyers.",
    date: "Jan 25, 2026",
    author: "James Wilson",
    category: "Technology",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663298376632/QnRQWzbLmtVXhqUy.jpg",
  },
];

export default function Blog() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Page Header */}
      <section className="bg-[#0f172a] py-16">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Our Blog</h1>
          <p className="text-gray-400">
            <Link href="/"><span className="hover:text-primary transition-colors">Home</span></Link>
            <span className="mx-2">/</span>
            <span className="text-primary">Blog</span>
          </p>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Latest <span className="text-primary">News & Articles</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Stay updated with the latest real estate news, tips, and market insights
            </p>
          </div>

          {/* Featured Post */}
          <Card className="mb-10 overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="h-64 lg:h-auto overflow-hidden">
                <img
                  src={BLOG_POSTS[0].image}
                  alt={BLOG_POSTS[0].title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                    {BLOG_POSTS[0].category}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {BLOG_POSTS[0].date}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">{BLOG_POSTS[0].title}</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">{BLOG_POSTS[0].excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> {BLOG_POSTS[0].author}
                  </span>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white gap-2">
                    Read More <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BLOG_POSTS.slice(1).map((post) => (
              <Card key={post.id} className="group overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
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
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.author}</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{post.excerpt}</p>
                  <Button variant="ghost" className="text-primary hover:text-primary/80 p-0 h-auto font-semibold text-sm gap-1">
                    Read More <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
