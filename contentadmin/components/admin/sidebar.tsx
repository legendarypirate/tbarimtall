"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Users, Settings, Clock, ShoppingCart, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

const links = [
  { href: "/admin", label: "Хянах самбар", icon: Home },
  { 
    href: "/admin/users", 
    label: "Хэрэглэгч", 
    icon: Users,
    children: [
      { href: "/admin/users/list", label: "Хэрэглэгчдийн жагсаалт" },
      { href: "/admin/users/income-request", label: "Орлогын хүсэлт" },
    ]
  },
  { 
    href: "/admin/product", 
    label: "Бүтээгдэхүүн", 
    icon: ShoppingCart,
    children: [
      { href: "/admin/product/new", label: "New" },
      { href: "/admin/product/all", label: "All" },
      { href: "/admin/product/cancelled", label: "Cancelled" },
      { href: "/admin/product/deleted", label: "Deleted" },
    ]
  },
  { 
    href: "/admin/settings", 
    label: "Тохиргоо", 
    icon: Settings,
    children: [
      { href: "/admin/settings/category", label: "Category" },
      { href: "/admin/settings/banner-manage", label: "Banner Manage" },
      { href: "/admin/settings/role-access", label: "Role Access" },
      { href: "/admin/settings/membership", label: "Membership" },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // This ensures we only render after component is mounted on client
  useEffect(() => {
    setIsMounted(true);
    // Auto-expand menu if current path matches a child
    links.forEach((link) => {
      if (link.children && pathname?.startsWith(link.href)) {
        setExpandedMenus((prev) => {
          if (!prev.includes(link.href)) {
            return [...prev, link.href];
          }
          return prev;
        });
      }
    });
  }, [pathname]);

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) =>
      prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href]
    );
  };

  // Show loading state during initial hydration
  if (!isMounted) {
    return (
      <aside className="w-64 bg-background border-r p-4 flex flex-col">
        <h1 className="text-lg font-bold mb-6">Admin Panel</h1>
        <nav className="flex flex-col gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <div
              key={href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition",
                "bg-muted text-muted-foreground animate-pulse"
              )}
            >
              <Icon className="w-4 h-4" />
              <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
            </div>
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-background border-r p-4 flex flex-col">
      <h1 className="text-lg font-bold mb-6">Admin Panel</h1>
      <nav className="flex flex-col gap-2">
        {links.map(({ href, label, icon: Icon, children }) => {
          const isExpanded = expandedMenus.includes(href);
          const isActive = pathname === href || (href !== "/admin" && pathname?.startsWith(href));
          
          return (
            <div key={href}>
              <div className="flex items-center">
                {children ? (
                  <button
                    onClick={() => toggleMenu(href)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition flex-1",
                      isActive
                        ? "bg-muted text-primary" 
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" /> 
                    {label}
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    ) : (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                ) : (
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition flex-1",
                      isActive
                        ? "bg-muted text-primary" 
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" /> 
                    {label}
                  </Link>
                )}
              </div>
              {children && isExpanded && (
                <div className="ml-4 mt-1 flex flex-col gap-1">
                  {children.map((child) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition",
                          isChildActive
                            ? "bg-muted text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}