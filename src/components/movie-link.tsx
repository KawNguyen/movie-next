"use client";

import Link from "next/link";

import { setMovieName } from "@/lib/movie-session";

interface MovieLinkProps {
  href: string;
  slug: string;
  name: string;
  className?: string;
  children: React.ReactNode;
}

export default function MovieLink({
  href,
  slug,
  name,
  className,
  children,
}: MovieLinkProps) {
  return (
    <Link
      href={href}
      onClick={() => {
        setMovieName(slug, name);
      }}
      className={className}
    >
      {children}
    </Link>
  );
}
