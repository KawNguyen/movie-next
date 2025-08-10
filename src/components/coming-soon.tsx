"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Construction, Home, ArrowLeft } from "lucide-react";

interface ComingSoonProps {
  title?: string;
  description?: string;
  featureName?: string;
}

export default function ComingSoon({
  title = "Sắp Ra Mắt",
  description = "Tính năng này đang được phát triển và sẽ sớm có mặt. Hãy quay lại sau nhé!",
  featureName,
}: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <Construction className="w-10 h-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {featureName && (
              <span className="font-medium text-foreground">{featureName}</span>
            )}
            {featureName && <br />}
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Về Trang Chủ
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay Lại
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Cảm ơn bạn đã kiên nhẫn! 🚀
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
