import Link from "next/link";
import {
  BookOpen, Swords, Trophy, Eye, Edit3,
  PlusCircle, FileText,
} from "lucide-react";
import type { UserPublication, PublicationStatus, PublicationType } from "@/types/database";

const TYPE_CONFIG: Record<PublicationType, { icon: React.ReactNode; label: string; color: string }> = {
  GUIDE:     { icon: <BookOpen className="h-3 w-3" />,  label: "Guía",      color: "text-cyan-400"   },
  BUILD:     { icon: <Swords className="h-3 w-3" />,    label: "Build",     color: "text-violet-400" },
  TIER_LIST: { icon: <Trophy className="h-3 w-3" />,    label: "Tier List", color: "text-orange-400" },
};

const STATUS_CONFIG: Record<PublicationStatus, { label: string; dot: string; text: string }> = {
  DRAFT:          { label: "Borrador",   dot: "bg-white/20",    text: "text-white/40"    },
  PENDING_REVIEW: { label: "En revisión",dot: "bg-amber-400",   text: "text-amber-400"   },
  PUBLISHED:      { label: "Publicada",  dot: "bg-green-400",   text: "text-green-400"   },
  ARCHIVED:       { label: "Archivada",  dot: "bg-white/10",    text: "text-white/25"    },
};

interface MyPublicationsListProps {
  publications: UserPublication[];
}

export function MyPublicationsList({ publications }: MyPublicationsListProps) {
  if (publications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.015] p-12 flex flex-col items-center text-center gap-5">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl border border-white/8 bg-white/[0.03]">
          <FileText className="h-6 w-6 text-white/20" />
        </div>
        <div>
          <p className="text-sm font-bold text-white/50 mb-1">Sin publicaciones todavía</p>
          <p className="text-xs font-mono text-white/25 max-w-xs">
            Compartí tu conocimiento con la comunidad. Guías, builds y tier lists que ayuden a otros jugadores.
          </p>
        </div>
        <Link
          href="/ugc/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono font-bold text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          Crear mi primera guía profesional
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
        <p className="text-[10px] font-mono text-white/25 uppercase tracking-[0.3em]">
          {"// mis publicaciones"} <span className="text-white/15 ml-2">{publications.length}</span>
        </p>
        <Link
          href="/ugc/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/8 text-[10px] font-mono font-bold text-cyan-400 hover:bg-cyan-500/15 transition-all"
        >
          <PlusCircle className="h-3 w-3" /> Nueva
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-[9px] text-white/20 uppercase tracking-widest px-5 py-2.5 font-normal">Título</th>
              <th className="text-left text-[9px] text-white/20 uppercase tracking-widest px-3 py-2.5 font-normal hidden sm:table-cell">Juego</th>
              <th className="text-left text-[9px] text-white/20 uppercase tracking-widest px-3 py-2.5 font-normal hidden md:table-cell">Tipo</th>
              <th className="text-left text-[9px] text-white/20 uppercase tracking-widest px-3 py-2.5 font-normal">Estado</th>
              <th className="text-right text-[9px] text-white/20 uppercase tracking-widest px-3 py-2.5 font-normal hidden sm:table-cell">Vistas</th>
              <th className="text-right text-[9px] text-white/20 uppercase tracking-widest px-5 py-2.5 font-normal">Acción</th>
            </tr>
          </thead>
          <tbody>
            {publications.map((pub, i) => {
              const type   = TYPE_CONFIG[pub.type];
              const status = STATUS_CONFIG[pub.status];
              return (
                <tr
                  key={pub.id}
                  className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${
                    i === publications.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  {/* Title */}
                  <td className="px-5 py-3.5 max-w-[200px]">
                    <p className="text-white/70 truncate leading-tight">{pub.title}</p>
                    {pub.is_premium && (
                      <span className="text-[9px] text-violet-400/60">✦ premium</span>
                    )}
                  </td>

                  {/* Game */}
                  <td className="px-3 py-3.5 hidden sm:table-cell">
                    <span className="text-white/30">{pub.game_slug}</span>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-3.5 hidden md:table-cell">
                    <span className={`flex items-center gap-1 ${type.color}`}>
                      {type.icon} {type.label}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3.5">
                    <span className={`flex items-center gap-1.5 ${status.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>

                  {/* Views */}
                  <td className="px-3 py-3.5 text-right hidden sm:table-cell">
                    <span className="flex items-center justify-end gap-1 text-white/25">
                      <Eye className="h-3 w-3" /> {pub.views_count.toLocaleString("es")}
                    </span>
                  </td>

                  {/* Edit */}
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/ugc/${pub.id}/edit`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/8 bg-white/[0.03] text-white/40 hover:text-white/70 hover:border-white/15 transition-all"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span className="hidden sm:inline">Editar</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
