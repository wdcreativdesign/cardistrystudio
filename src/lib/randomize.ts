import type { CardSettings } from '@/types'

/* ── Card dimensions (must match Card3D.tsx) ─────────────────────── */
const MM     = 3.2 / 85.7
const CARD_W = 85.7 * MM   // = 3.2
const CARD_H = 54.0 * MM   // ≈ 2.016

/* ── Base X positions per slot (must match CardScene.tsx) ───────── */
const BASE_X: Record<number, number[]> = {
  1: [0],
  2: [-1.4, 1.4],
  3: [-2.8, 0, 2.8],
}

/* ── Thresholds ─────────────────────────────────────────────────── */
const DEG2RAD  = Math.PI / 180
const Z_CLEAR  = 0.32   // posZ gap above which cards are depth-separated (can't intersect)
const XY_GAP   = 0.10   // extra safety margin in XY (world units)

/* ── Helpers ─────────────────────────────────────────────────────── */
function rnd(a: number, b: number) {
  return a + Math.random() * (b - a)
}

type Pose = {
  rotX: number; rotY: number; rotZ: number
  zoom: number
  posX: number; posY: number; posZ: number
  autoRotate: false
}

/**
 * Half-extents of a card projected onto the XY world plane.
 * Uses the separating-axis theorem projected onto X and Y axes.
 * Uses the worst-case card dimension (CARD_W) to stay conservative
 * regardless of the card's actual orientation setting.
 * (rotZ ignored — bounded to ±12° which changes dims by <3%)
 */
function halfExtents(p: Pose): { hx: number; hy: number } {
  return {
    hx: (p.zoom * CARD_W * Math.abs(Math.cos(p.rotY * DEG2RAD))) / 2,
    hy: (p.zoom * CARD_W * Math.abs(Math.cos(p.rotX * DEG2RAD))) / 2,
  }
}

/**
 * Returns true if any two cards in `poses` visually intersect.
 * A pair is safe if:
 *   - they are depth-separated (|ΔposZ| > Z_CLEAR), OR
 *   - they do not overlap on the X axis, OR
 *   - they do not overlap on the Y axis
 */
function hasCollision(poses: Pose[], count: number): boolean {
  const bases = BASE_X[count]!
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const a = poses[i], b = poses[j]

      // Depth-separated — physically impossible to intersect
      if (Math.abs(a.posZ - b.posZ) > Z_CLEAR) continue

      const wx_a = bases[i] + a.posX
      const wx_b = bases[j] + b.posX
      const ea = halfExtents(a), eb = halfExtents(b)

      const overlapX = Math.abs(wx_a - wx_b) < ea.hx + eb.hx + XY_GAP
      const overlapY = Math.abs(a.posY  - b.posY)  < ea.hy + eb.hy + XY_GAP

      if (overlapX && overlapY) return true
    }
  }
  return false
}

/* ── Pose generator ─────────────────────────────────────────────── */
function genPose(slotIdx: number, count: number, style: number): Pose {
  const zoom = rnd(0.88, 1.12)
  const posX = rnd(-0.26, 0.26)
  const posY = rnd(-0.40, 0.40)
  const posZ = rnd(-0.40, 0.40)
  const rotX = rnd(-18, 18)
  const rotZ = rnd(-12, 12)

  let rotY: number

  if (count === 1) {
    rotY = rnd(-60, 60)

  } else if (count === 2) {
    if (style < 0.35) {
      // Fan outward — each card angles away from the other
      rotY = slotIdx === 0 ? rnd(-58, -18) : rnd(18, 58)
    } else if (style < 0.65) {
      // Fan inward — cards angle toward each other
      rotY = slotIdx === 0 ? rnd(18, 52) : rnd(-52, -18)
    } else {
      // Free / dynamic
      rotY = rnd(-65, 65)
    }

  } else {
    // 3 cards
    if (style < 0.38) {
      // Symmetric fan: left tilts left, center near-flat, right tilts right
      const anchors = [-38, 0, 38] as const
      rotY = anchors[slotIdx as 0 | 1 | 2] + rnd(-14, 14)
    } else if (style < 0.68) {
      // Cascade: all cards at similar angle, staggered heights/depths
      const baseAngle = rnd(-35, 35)
      rotY = baseAngle + slotIdx * rnd(-8, 8)
    } else {
      // Dynamic: outer cards lean outward, center is free
      if      (slotIdx === 0) rotY = rnd(-65, -15)
      else if (slotIdx === 1) rotY = rnd(-48,  48)
      else                    rotY = rnd( 15,  65)
    }
  }

  return { rotX, rotY, rotZ, zoom, posX, posY, posZ, autoRotate: false as const }
}

/* ── Fallback guaranteed-safe layouts ───────────────────────────── */
function fallbackPoses(count: number): Partial<CardSettings>[] {
  if (count === 1) return [
    { rotX: -12, rotY:  28, rotZ:  4, zoom: 1.0,  posX: 0, posY:  0,    posZ:  0,    autoRotate: false },
  ]
  if (count === 2) return [
    { rotX: -10, rotY: -38, rotZ: -6, zoom: 0.95, posX: 0, posY:  0.15, posZ:  0.22, autoRotate: false },
    { rotX:  10, rotY:  38, rotZ:  6, zoom: 0.95, posX: 0, posY: -0.15, posZ: -0.22, autoRotate: false },
  ]
  return [
    { rotX:  -8, rotY: -42, rotZ: -5, zoom: 0.90, posX: 0, posY:  0.22, posZ:  0.28, autoRotate: false },
    { rotX:   4, rotY:   6, rotZ:  2, zoom: 0.90, posX: 0, posY:  0,    posZ:  0,    autoRotate: false },
    { rotX:  -6, rotY:  42, rotZ:  5, zoom: 0.90, posX: 0, posY: -0.22, posZ: -0.28, autoRotate: false },
  ]
}

/* ── Public API ─────────────────────────────────────────────────── */
/**
 * Generate `count` collision-free random poses for a multi-card composition.
 * Returns one Partial<CardSettings> per card (pose fields only — finish,
 * edgeColor, images, bgColor etc. are left for the caller to preserve).
 */
export function randomizePoses(count: 1 | 2 | 3): Partial<CardSettings>[] {
  if (count === 1) {
    return [genPose(0, 1, 0)]
  }

  const MAX_ATTEMPTS = 90
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const style = Math.random()
    const poses = Array.from({ length: count }, (_, i) => genPose(i, count, style))
    if (!hasCollision(poses, count)) {
      return poses
    }
  }

  // Should almost never reach here — just in case
  return fallbackPoses(count)
}
