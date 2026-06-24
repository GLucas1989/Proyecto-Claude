"use client";

import { CreatorFilters, ContentType, MTGFormat, Language } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface CreatorFiltersProps {
  filters: CreatorFilters;
  onFiltersChange: (filters: CreatorFilters) => void;
  availableFilters?: string[];
}

const defaultFilters: CreatorFilters = { search: "", contentType: "", format: "", language: "" };

export function CreatorFiltersBar({ filters, onFiltersChange, availableFilters = [] }: CreatorFiltersProps) {
  const hasActiveFilters = filters.search || filters.contentType || filters.format || filters.language;

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          placeholder="Buscar creador..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-primary/50"
        />
      </div>
      <Select value={filters.contentType || "all"} onValueChange={(v) => onFiltersChange({ ...filters, contentType: v === "all" ? "" : (v as ContentType) })}>
        <SelectTrigger className="w-full sm:w-[170px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Tipo de contenido" /></SelectTrigger>
        <SelectContent className="bg-zinc-900 border-white/10 text-white">
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="competitive">Competitivo</SelectItem>
          <SelectItem value="casual">Casual / Fun</SelectItem>
          <SelectItem value="draft">Draft / Limited</SelectItem>
          <SelectItem value="lore">Lore / Explicativo</SelectItem>
        </SelectContent>
      </Select>
      {availableFilters.includes("format") && (
        <Select value={filters.format || "all"} onValueChange={(v) => onFiltersChange({ ...filters, format: v === "all" ? "" : (v as MTGFormat) })}>
          <SelectTrigger className="w-full sm:w-[150px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Formato" /></SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10 text-white">
            <SelectItem value="all">Todos los formatos</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="explorer">Explorer</SelectItem>
            <SelectItem value="alchemy">Alchemy</SelectItem>
            <SelectItem value="historic">Historic</SelectItem>
            <SelectItem value="brawl">Brawl</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Select value={filters.language || "all"} onValueChange={(v) => onFiltersChange({ ...filters, language: v === "all" ? "" : (v as Language) })}>
        <SelectTrigger className="w-full sm:w-[140px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Idioma" /></SelectTrigger>
        <SelectContent className="bg-zinc-900 border-white/10 text-white">
          <SelectItem value="all">Todos los idiomas</SelectItem>
          <SelectItem value="es">🇪🇸 Español</SelectItem>
          <SelectItem value="en">🇺🇸 English</SelectItem>
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={() => onFiltersChange(defaultFilters)} className="text-white/50 hover:text-white hover:bg-white/10 shrink-0">
          <X className="h-4 w-4 mr-1" />Limpiar
        </Button>
      )}
    </div>
  );
}
