/**
 * ─── ROADMAP ──────────────────────────────────────────────────────────────
 * Modifie ce fichier pour mettre à jour la liste des features à venir.
 * Chaque section a un titre et une liste d'items.
 * status: 'soon' | 'planned' | 'in-progress'
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface RoadmapItem {
  label: string
  status: 'in-progress' | 'soon' | 'planned'
}

export interface RoadmapSection {
  title: string
  items: RoadmapItem[]
}

export const ROADMAP: RoadmapSection[] = [
  {
    title: 'Coming soon',
    items: [
      { label: 'Materials customisation',       status: 'soon' },
    ],
  },
  {
    title: 'In the works',
    items: [
      { label: 'Chip choice',            status: 'in-progress' },
      { label: 'Animated card flip',            status: 'in-progress' },
    ],
  },
  {
    title: 'Planned',
    items: [
      { label: 'Video export',       status: 'planned' },
      { label: 'Workspaces',       status: 'planned' },
    ],
  },
]
