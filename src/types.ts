export type Finish = 'metallic' | 'plastic' | 'matte'
export type Orientation = 'horizontal' | 'vertical'

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
  frontImage: string | null  // data URL PNG
  backImage: string | null   // data URL PNG
  autoRotate: boolean
  lightIntensity: number     // 0 → 2
  bgColor: string | 'transparent'  // hex ou 'transparent'
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
    metalness: 0.96,
    roughness: 0.04,
    envMapIntensity: 3.2,
    edgeColor: '#b0b0b8',
    clearcoat: 0.6,
    clearcoatRoughness: 0.03,
  },
  plastic: {
    label: 'Plastic',
    metalness: 0.04,
    roughness: 0.28,
    envMapIntensity: 1.0,
    edgeColor: '#f0f0f0',
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
  },
  matte: {
    label: 'Matte',
    metalness: 0.0,
    roughness: 0.88,
    envMapIntensity: 0.18,
    edgeColor: '#e8e8e8',
    clearcoat: 0.04,
    clearcoatRoughness: 0.6,
  },
}
