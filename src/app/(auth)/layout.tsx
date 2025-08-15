import { ModeToggle } from "@/components/mode-toggle";
import { MoveLeftIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background h-screen w-screen flex flex-col gap-6 p-6">
      <div className="flex justify-between w-full top-6 left-6 right-6">
        <Link href="/" className="flex justify-center items-center gap-2">
          <MoveLeftIcon />
          <span className="text-lg font-bold">Qtiful Movie</span>
        </Link>
        <ModeToggle />
      </div>
      <div className="w-full h-full flex justify-center items-center">
        {children}
      </div>
    </div>
  );
}
