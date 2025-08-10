import { MoveLeftIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex justify-center items-center gap-2">
          <MoveLeftIcon />
          <span className="text-lg font-bold">Qtiful Movie</span>
        </Link>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
