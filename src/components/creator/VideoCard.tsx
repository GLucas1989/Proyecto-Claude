import Image from "next/image";
import { Video } from "@/types";
import { ExternalLink } from "lucide-react";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const date = new Date(video.publishedAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-lg overflow-hidden border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-200"
    >
      <div className="relative aspect-video overflow-hidden">
        <Image src={video.thumbnail} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-red-600 rounded-full p-3">
            <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      </div>
      <div className="p-3">
        <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-primary transition-colors leading-snug">{video.title}</h4>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-white/40">{date}</span>
          <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-white/60 transition-colors" />
        </div>
      </div>
    </a>
  );
}
