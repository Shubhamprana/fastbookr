import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();
  const [location] = useLocation();

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: "List Property", href: "/submit-listing" },
    { label: "Map Search", href: "/map-search" },
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <header className="bg-[#0f172a] text-white sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-primary">FAST</span>BOOKR
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.href)
                      ? "text-primary"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
            {isAuthenticated && user?.role === "admin" && (
              <Link href="/admin">
                <span className="px-4 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </span>
              </Link>
            )}
            {isAuthenticated && (
              <Link href="/owner-dashboard">
                <span className="px-4 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white transition-colors">
                  My Listings
                </span>
              </Link>
            )}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/10 gap-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{user?.name || "Account"}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {user?.role === "admin" && (
                    <Link href="/admin">
                      <DropdownMenuItem>Dashboard</DropdownMenuItem>
                    </Link>
                  )}
                  <Link href="/owner-dashboard">
                    <DropdownMenuItem>My Listings</DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10 text-sm"
                  onClick={() => void login()}
                >
                    Sign In
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90 text-white text-sm px-5"
                  onClick={() => void login()}
                >
                    Register
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0f172a] border-t border-white/10 pb-4">
          <nav className="container flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`block px-4 py-3 text-sm font-medium rounded-lg ${
                    isActive(link.href)
                      ? "text-primary bg-white/5"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </span>
              </Link>
            ))}
            {isAuthenticated && user?.role === "admin" && (
              <Link href="/admin">
                <span
                  className="block px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </span>
              </Link>
            )}
            {isAuthenticated && (
              <Link href="/owner-dashboard">
                <span
                  className="block px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  My Listings
                </span>
              </Link>
            )}
            <div className="flex gap-2 mt-2 px-4">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  onClick={() => logout()}
                >
                  Sign Out
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    onClick={() => void login()}
                  >
                      Sign In
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90 text-white"
                    onClick={() => void login()}
                  >
                      Register
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
