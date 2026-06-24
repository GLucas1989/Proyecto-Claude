'use client';
import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface GameCardBannerProps {
  logoUrl?: string | null;
  name: string;
  emoji: string;
  active: boolean;
  comingSoon?: boolean;
}

export function GameCardBanner({ logoUrl, name, emoji, active, comingSoon }: GameCardBannerProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative w-full py-3 px-4 flex justify-center bg-black/20">
      {logoUrl && !imgError ? (
        <div className="relative w-4/5 aspect-[460/215]">
          <Image
            src={logoUrl}
            alt={name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 80vw, 320px"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center w-4/5 aspect-[460/215]">
          <span className="text-5xl leading-none">{emoji}</span>
        </div>
      )}
      <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
        {comingSoon && (
          <Badge variant="lang" className="flex items-center gap-1 text-[10px]">
            <Clock className="h-2.5 w-2.5" />
            Próximamente
          </Badge>
        )}
        {active && (
          <Badge variant="casual" className="font-semibold text-[10px]">
            <span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Activo
          </Badge>
        )}
      </div>
    </div>
  );
}
