"use client";

import { MARKETPLACE_CATEGORIES, getMarketplaceCategory } from "@/lib/marketplace/categories";

interface CategorySelectorProps {
  domain: string;
  role: string;
  onDomainChange: (domain: string) => void;
  onRoleChange: (role: string) => void;
}

/**
 * Selector de categoría del marketplace: dominio (chips) + rol de backstage
 * (solo cuando el dominio es 'esports_backstage').
 */
export function CategorySelector({ domain, role, onDomainChange, onRoleChange }: CategorySelectorProps) {
  const selected = getMarketplaceCategory(domain);

  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-black/20">
        <span className="text-xs font-mono text-white/30">{"// categoría del marketplace"}</span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {MARKETPLACE_CATEGORIES.map((c) => {
            const active = domain === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => { onDomainChange(active ? "" : c.id); if (c.id !== "esports_backstage") onRoleChange(""); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/70"
                }`}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {selected?.description && (
          <p className="text-[11px] font-mono text-white/30">{selected.description}</p>
        )}

        {/* Rol de backstage eSports */}
        {selected?.roles && (
          <div className="pt-1">
            <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest mb-2">{"// rol"}</p>
            <div className="flex flex-wrap gap-2">
              {selected.roles.map((r) => {
                const active = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onRoleChange(active ? "" : r.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      active
                        ? "bg-violet-500/20 border-violet-500/60 text-violet-300"
                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/70"
                    }`}
                  >
                    <span>{r.emoji}</span>
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
