"use client";

import { BookOpen, Swords, Trophy, ChevronRight } from "lucide-react";
import type { PublicationType } from "@/types/database";

export type TemplateId = "guide_basic" | "build_sheet" | "tier_list";

interface Template {
  id: TemplateId;
  type: PublicationType;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  accent: string;
  border: string;
  bg: string;
  preview: string;
  markdown: string;
}

const TEMPLATES: Template[] = [
  {
    id: "guide_basic",
    type: "GUIDE",
    label: "Guía Táctica",
    sublabel: "Texto + imágenes estructuradas",
    icon: <BookOpen className="h-6 w-6" />,
    accent: "text-cyan-400",
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    bg: "bg-cyan-500/[0.03] hover:bg-cyan-500/[0.06]",
    preview: `# Título de la Guía\n> Resumen en una línea\n\n## Introducción\n## Mecánicas clave\n## Conclusión`,
    markdown: `# Título de tu Guía

> **TL;DR:** Una frase que resuma el contenido de la guía.

---

## Introducción

Explica el contexto y para quién es esta guía (nivel, parche, etc.).

## Mecánicas Clave

### Mecánica 1

Descripción detallada con ejemplos.

\`\`\`
Ejemplo de combo o secuencia de habilidades
\`\`\`

### Mecánica 2

Descripción con capturas o diagramas si aplica.

## Estrategia Paso a Paso

1. **Paso 1** — Descripción
2. **Paso 2** — Descripción
3. **Paso 3** — Descripción

## Errores Comunes

- ❌ Error frecuente y por qué evitarlo
- ❌ Otro error común

## Conclusión

Resumen de los puntos más importantes y recomendación final.

---
*Publicado en CREATORS S-HUB · Parche X.X*
`,
  },
  {
    id: "build_sheet",
    type: "BUILD",
    label: "Hoja de Build",
    sublabel: "Stats, equipo y rotación",
    icon: <Swords className="h-6 w-6" />,
    accent: "text-violet-400",
    border: "border-violet-500/20 hover:border-violet-500/40",
    bg: "bg-violet-500/[0.03] hover:bg-violet-500/[0.06]",
    preview: `# Build: Nombre\n| Slot | Item |\n|------|------|\n| Arma | ... |`,
    markdown: `# Build: [Nombre del Personaje / Clase]

> **Rol:** DPS / Tank / Support · **Dificultad:** ⭐⭐⭐☆☆ · **Parche:** X.X

---

## Estadísticas Objetivo

| Stat        | Valor mínimo | Valor ideal |
|-------------|:------------:|:-----------:|
| Vida        | 15,000       | 20,000+     |
| Daño        | 5,000        | 8,000+      |
| Resistencia | 40%          | 55%+        |

## Equipamiento

| Slot       | Item                | Alternativa        |
|------------|---------------------|--------------------|
| Cabeza     | [Nombre del casco]  | [Alternativa]      |
| Pecho      | [Nombre del pecho]  | [Alternativa]      |
| Arma       | [Nombre del arma]   | [Alternativa]      |
| Accesorio  | [Nombre]            | [Alternativa]      |

## Rotación de Habilidades

\`\`\`
Apertura:       Skill A → Skill B → Ultimate
Mantenimiento:  Skill C → Skill A → Skill B
Emergencia:     Defensive → Heal → Reposicionamiento
\`\`\`

## Puntos de Habilidad Recomendados

1. **Prioridad máxima** — [Habilidad]
2. **Prioridad alta** — [Habilidad]
3. **Último punto** — [Habilidad pasiva]

## Notas del Autor

Consideraciones específicas, counters o sinergias de equipo.

---
*Build verificada en Parche X.X · CREATORS S-HUB*
`,
  },
  {
    id: "tier_list",
    type: "TIER_LIST",
    label: "Tier List",
    sublabel: "Ranking con justificación",
    icon: <Trophy className="h-6 w-6" />,
    accent: "text-orange-400",
    border: "border-orange-500/20 hover:border-orange-500/40",
    bg: "bg-orange-500/[0.03] hover:bg-orange-500/[0.06]",
    preview: `# Tier List — Parche X\n**S+** God tier\n**A** Muy fuerte\n**B** Viable`,
    markdown: `# Tier List — [Categoría] · Parche X.X

> **Criterio:** Eficiencia en ranked / Meta actual / Win rate

---

## S+ — God Tier

> Dominantes en el meta. Pick o ban obligatorio.

- **[Campeón/Clase]** — Razón breve
- **[Campeón/Clase]** — Razón breve

## A — Muy Fuerte

> Opciones sólidas con matchups favorables.

- **[Nombre]** — Contexto de uso ideal

## B — Viable

> Funcionan bien en manos expertas o composiciones específicas.

- **[Nombre]** — Cuándo usarlos

## C — Situacional

- **[Nombre]** — Caso de uso único

## D — Evitar en Meta Actual

- **[Nombre]** — Por qué está aquí

---

## Metodología

Explica brevemente en qué te basas: horas jugadas, estadísticas externas, torneos, etc.

---
*Tier list válida para Parche X.X · CREATORS S-HUB*
`,
  },
];

interface TemplateSelectorProps {
  onSelect: (id: TemplateId, markdown: string, type: PublicationType) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <p className="text-[10px] font-mono text-cyan-500/60 tracking-widest mb-2 uppercase">
          {"// ugc_workspace › seleccionar_plantilla"}
        </p>
        <h1 className="text-2xl font-bold text-white">
          ¿Qué tipo de contenido vas a crear?
        </h1>
        <p className="text-sm text-white/35 mt-2 font-mono">
          Cada plantilla inyecta una estructura Markdown optimizada para la web.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl.id, tpl.markdown, tpl.type)}
            className={`group text-left rounded-2xl border p-5 transition-all duration-200 ${tpl.border} ${tpl.bg}`}
          >
            <div className={`mb-4 ${tpl.accent}`}>{tpl.icon}</div>
            <p className={`text-sm font-bold font-mono ${tpl.accent} mb-0.5`}>{tpl.label}</p>
            <p className="text-xs text-white/35 mb-4">{tpl.sublabel}</p>
            <pre className="text-[9px] font-mono text-white/20 bg-black/30 rounded-lg p-2.5 leading-relaxed whitespace-pre-wrap overflow-hidden max-h-20 border border-white/5">
              {tpl.preview}
            </pre>
            <div className={`flex items-center gap-1 mt-4 text-[10px] font-mono font-bold ${tpl.accent} group-hover:gap-2 transition-all`}>
              Usar plantilla <ChevronRight className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => onSelect("guide_basic", "", "GUIDE")}
          className="text-xs font-mono text-white/20 hover:text-white/50 transition-colors underline underline-offset-4"
        >
          Empezar desde Markdown en blanco →
        </button>
      </div>
    </div>
  );
}
