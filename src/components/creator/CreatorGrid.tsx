"use client";

import { useState } from "react";
import { Creator, CreatorFilters } from "@/types";
import { CreatorCard } from "./CreatorCard";
import { CreatorFiltersBar } from "./CreatorFilters";
import { Users } from "lucide-react";

interface CreatorGridProps {
  creators: Creator[];
  gameSlug: string;
  availableFilters?: string[];
}

const defaultFilters: CreatorFilters = { search: "", contentType: "", format: "", language: "" };

export function CreatorGrid({ creators, gameSlug, availableFilters = [] }: CreatorGridProps) {
  const [filters, setFilters] = useState<CreatorFilters>(defaultFilters);

  const filtered = creators.filter((creator) => {
    if (filters.search && !creator.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.contentType && !creator.contentType.includes(filters.contentType)) return false;
    if (filters.format && !creator.formats?.includes(filters.format)) return false;
    if (filters.language && !creator.languages.includes(filters.language)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <CreatorFiltersBar filters={filters} onFiltersChange={setFilters} availableFilters={availableFilters} />
      <div className="flex items-center gap-2 text-sm text-white/40">
        <Users className="h-4 w-4" />
        <span>{filtered.length} creador{filtered.length !== 1 ? "es" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</span>
      </div>
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((creator) => (<CreatorCard key={creator.id} creator={creator} gameSlug={gameSlug} />))}
        </div>
      ) : (
        <div className="text-center py-16 text-white/40">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No se encontraron creadores con esos filtros.</p>
          <p className="text-sm mt-1">Prueba ajustando los filtros.</p>
        </div>
      )}
    </div>
  );
}
