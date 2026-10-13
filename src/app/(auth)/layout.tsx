import { MoveLeftIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { GalaxyBackground } from "@/components/galaxy-background";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    // "dark" ép toàn bộ vùng này dùng token màu tối của shadcn,
    // nên form, input, card bên trong luôn đọc được trên nền thiên hà.
    <div className="dark text-foreground relative isolate flex h-screen w-screen flex-col gap-6 overflow-hidden p-6">
      <GalaxyBackground />

      <div className="relative z-10 flex w-full justify-between">
        <Link href="/" className="flex items-center justify-center gap-2">
          <MoveLeftIcon />
          <span className="text-lg font-bold">Qtiful Movie</span>
        </Link>
      </div>

      <div className="relative z-10 flex h-full w-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}