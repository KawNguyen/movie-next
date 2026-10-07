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
import { useMovieName } from "@/hooks/use-movie-name";

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

function formatTitle(slug: string): string {
  const specialCases: Record<string, string> = {
    "top-imdb": "Top IMDb",
    "phim-18": "Phim 18+",
    "tv-shows": "TV Shows",
    "danh-muc": "Danh mục",
    "the-loai": "Thể loại",
    "quoc-gia": "Quốc gia",
  };

  if (specialCases[slug]) {
    return specialCases[slug];
  }

  return slug
    .split("-")
    .map((word) =>
      word.toUpperCase() === word && word.length <= 4
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function getBreadcrumbs(pathname: string): BreadcrumbItemType[] {
  const routeMap = createRouteMap([
    ...(data.navMain as NavItem[]),
    ...(data.navSecondary as NavItem[]),
  ]);

  const breadcrumbs: BreadcrumbItemType[] = [{ title: "Trang chủ", url: "/" }];

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

  const movieSlug = pathname.startsWith("/phim/")
    ? (pathname.split("/").filter(Boolean).pop() ?? null)
    : null;

  const movieName = useMovieName(movieSlug);

  const displayBreadcrumbs = useMemo(() => {
    if (!movieName || !movieSlug) {
      return breadcrumbs;
    }

    return breadcrumbs.map((breadcrumb) => {
      if (breadcrumb.url === `/phim/${movieSlug}`) {
        return {
          ...breadcrumb,
          title: movieName,
        };
      }

      return breadcrumb;
    });
  }, [breadcrumbs, movieName, movieSlug]);

  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList>
        {displayBreadcrumbs.map((crumb, idx) => {
          const isLast = idx === displayBreadcrumbs.length - 1;

          const slug = crumb.url.split("/").filter(Boolean).pop();

          return (
            <React.Fragment key={crumb.url}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-bold">
                    {crumb.url === "/" ? (
                      <div className="flex items-center gap-2">
                        <Home className="size-4" /> Trang chủ
                      </div>
                    ) : (
                      crumb.title
                    )}
                  </BreadcrumbPage>
                ) : crumb.url === "/" ? (
                  <BreadcrumbLink asChild>
                    <Link href="/">
                      <Home className="size-4" />
                    </Link>
                  </BreadcrumbLink>
                ) : slug === "danh-muc" ||
                  slug === "phim" ||
                  slug === "the-loai" ||
                  slug === "quoc-gia" ? (
                  <span>{crumb.title}</span>
                ) : (
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
