"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { data } from "@/constant/routes";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

type NavItem = {
  title: string;
  url: string;
  icon?: React.ComponentType;
  isActive?: boolean;
  items?: NavItem[];
};

type BreadcrumbItemType = {
  title: string;
  url: string;
};

// Tạo Map lookup nhanh
function createRouteMap(navItems: NavItem[]): Map<string, string> {
  const routeMap = new Map<string, string>();

  function traverse(items: NavItem[]) {
    for (const item of items) {
      if (item.url && item.url !== "#") {
        routeMap.set(item.url, item.title);
      }
      if (item.items) {
        traverse(item.items);
      }
    }
  }

  traverse(navItems);
  return routeMap;
}

// Format slug thành tiêu đề
function formatTitle(slug: string): string {
  const specialCases: Record<string, string> = {
    "top-imdb": "Top IMDb",
    "phim-18": "Phim 18+",
    "tv-shows": "TV Shows",
  };

  if (specialCases[slug]) {
    return specialCases[slug];
  }

  return slug
    .split("-")
    .map((word) =>
      word.toUpperCase() === word && word.length <= 4
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function getBreadcrumbs(pathname: string): BreadcrumbItemType[] {
  const routeMap = createRouteMap([
    ...(data.navMain as NavItem[]),
    ...(data.navSecondary as NavItem[]),
  ]);

  const breadcrumbs: BreadcrumbItemType[] = [
    { title: "Trang chủ", url: "/" }, // Home luôn ở đầu
  ];

  if (pathname === "/") {
    return breadcrumbs;
  }

  const segments = pathname.split("/").filter(Boolean);
  let currentPath = "";

  for (const segment of segments) {
    currentPath += "/" + segment;
    let title = routeMap.get(currentPath);
    if (!title) {
      const decoded = decodeURIComponent(segment);
      title = formatTitle(decoded);
    }
    breadcrumbs.push({ title, url: currentPath });
  }

  return breadcrumbs;
}

export default function AppBreadcrumb() {
  const pathname = usePathname();
  const breadcrumbs = useMemo(() => getBreadcrumbs(pathname), [pathname]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          const slug = crumb.url.split("/").filter(Boolean).pop(); // lấy slug cuối

          return (
            <React.Fragment key={crumb.url}>
              <BreadcrumbItem>
                {isLast ? (
                  // Endpoint cuối luôn là page text
                  <BreadcrumbPage className="font-bold">
                    {crumb.url === "/" ? (
                      <Home className="w-4 h-4" />
                    ) : (
                      crumb.title
                    )}
                  </BreadcrumbPage>
                ) : crumb.url === "/" ? (
                  // Home có link
                  <BreadcrumbLink asChild>
                    <Link href="/">
                      <Home className="w-4 h-4" />
                    </Link>
                  </BreadcrumbLink>
                ) : (slug === "danh-muc" || slug === "phim" || slug === "the-loai" || slug === "quoc-gia") ? (
                  // Danh mục chỉ là text, không link
                  <span>{crumb.title}</span>
                ) : (
                  // Các breadcrumb còn lại có link
                  <BreadcrumbLink asChild>
                    <Link href={crumb.url}>{crumb.title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
