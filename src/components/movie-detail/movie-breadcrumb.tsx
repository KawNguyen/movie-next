"use client";

import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

interface MovieBreadcrumbProps {
  movieName: string;
}

export function MovieBreadcrumb({ movieName }: MovieBreadcrumbProps) {
  return (
    <Breadcrumb className="relative z-10">
      <BreadcrumbList>
        <BreadcrumbItem>
          <Home className="size-4" />
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        <BreadcrumbItem>Phim</BreadcrumbItem>

        <BreadcrumbSeparator />

        <BreadcrumbItem>
          <BreadcrumbPage className="line-clamp-1 font-semibold">
            {movieName}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
