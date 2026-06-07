export type Finish = 'metallic' | 'plastic' | 'matte' | 'chrome' | 'satin' | 'holographic' | 'rubber' | 'glossy'
export type Orientation = 'horizontal' | 'vertical'
export type CameraMode = 'perspective' | 'isometric'

export type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'difference'
  | 'exclusion'

export interface ImageLayer {
  id:        string
  name:      string
  image:     string      // data URL
  blendMode: BlendMode   // canvas globalCompositeOperation
  opacity:   number      // 0–100
}

export interface CardSettings {
  rotX: number           // degrés: -90 → 90
  rotY: number           // degrés: -180 → 180
  rotZ: number           // degrés: -45 → 45
  zoom: number           // 0.6 → 2.2
  posX: number           // décalage X en unités monde
  posY: number           // décalage Y en unités monde
  posZ: number           // décalage Z en unités monde
  finish: Finish
  orientation: Orientation
  edgeColor: string      // couleur de la tranche (hex)
  cardColor: string      // couleur de fond de la carte (face avant + arrière)
  frontLayers: ImageLayer[]  // couches face avant (index 0 = bas)
  backLayers:  ImageLayer[]  // couches face arrière
  autoRotate: boolean
  lightIntensity: number     // 0 → 2
  lightAngle: number         // 0 → 360° — rotation key light autour de la carte
  envIntensity: number       // 0 → 3 — multiplicateur global env map (reflets)
  shadowOpacity: number      // 0 → 1
  shadowBlur: number         // 0 → 8
  bgColor: string | 'transparent'  // hex ou 'transparent'
  cameraFov:  number         // 10 → 90°, default 42 — scene-level
  cameraMode: CameraMode     // 'perspective' | 'isometric' — scene-level
}

export interface CardPage {
  id: string
  name: string
  settings: CardSettings
}

export interface Workspace {
  id:           string
  name:         string
  displayCount: 1 | 2 | 3
  pages:        CardPage[]
  activePageId: string
}

export interface SavedPose {
  id:         string
  name:       string
  rotX:       number
  rotY:       number
  rotZ:       number
  zoom:       number
  posX:       number
  posY:       number
  posZ:       number
  autoRotate: boolean
}

export interface FinishConfig {
  label: string
  metalness: number
  roughness: number
  envMapIntensity: number
  edgeColor: string
  clearcoat: number
  clearcoatRoughness: number
}

export const FINISH_CONFIGS: Record<Finish, FinishConfig> = {
  metallic: {
    label: 'Metallic',
    metalness: 0.95,
    roughness: 0.08,
    envMapIntensity: 3.5,
    edgeColor: '#b0b0b8',
    clearcoat: 0.5,
    clearcoatRoughness: 0.05,
  },
  chrome: {
    label: 'Chrome',
    metalness: 1.0,
    roughness: 0.0,
    envMapIntensity: 6.0,
    edgeColor: '#c8c8d0',
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
  },
  plastic: {
    label: 'Plastic',
    metalness: 0.0,
    roughness: 0.22,
    envMapIntensity: 1.2,
    edgeColor: '#f0f0f0',
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  },
  satin: {
    label: 'Satin',
    metalness: 0.1,
    roughness: 0.5,
    envMapIntensity: 1.0,
    edgeColor: '#e0e0e0',
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
  },
  glossy: {
    label: 'Glossy',
    metalness: 0.0,
    roughness: 0.0,
    envMapIntensity: 2.5,
    edgeColor: '#ffffff',
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
  },
  holographic: {
    label: 'Holographic',
    metalness: 1.0,
    roughness: 0.05,
    envMapIntensity: 8.0,
    edgeColor: '#c8b8f0',
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
  },
  matte: {
    label: 'Matte',
    metalness: 0.0,
    roughness: 0.95,
    envMapIntensity: 0.1,
    edgeColor: '#e8e8e8',
    clearcoat: 0.0,
    clearcoatRoughness: 1.0,
  },
  rubber: {
    label: 'Rubber',
    metalness: 0.0,
    roughness: 1.0,
    envMapIntensity: 0.0,
    edgeColor: '#1a1a1a',
    clearcoat: 0.0,
    clearcoatRoughness: 1.0,
  },
}
