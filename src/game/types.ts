/**
 * Tipos extraídos/adaptados do BrowserQuest (Mozilla, MPL 2.0)
 * para o renderizador 2D do FireFiit.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface TileSet {
  firstgid: number;
  image: string;
  tilewidth: number;
  tileheight: number;
  tilecount: number;
  columns: number;
}

export interface MapLayer {
  name: string;
  width: number;
  height: number;
  data: number[];
}

export interface GymMapData {
  width: number;
  height: number;
  tilesize: number;
  tileset: TileSet;
  layers: MapLayer[];
  collisions: number[];
  animated: Record<string, { length: number; speed: number; index: number }>;
  zones: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  minAttribute?: keyof UserAttributes;
  minValue?: number;
  rect: { x: number; y: number; w: number; h: number };
}

export interface UserAttributes {
  strength: number;
  speed: number;
  endurance: number;
  discipline: number;
}

export interface SpriteAnimation {
  length: number;
  row: number;
}

export interface SpriteDefinition {
  id: string;
  width: number;
  height: number;
  offset_x?: number;
  offset_y?: number;
  animations: Record<string, SpriteAnimation>;
}

export interface AvatarState {
  level: number;
  attributes: UserAttributes;
  streak: number;
  hp: number;
  maxHp: number;
  stamina: number;
}

export interface RendererConfig {
  tileSize: number;
  scale: number;
  viewWidthTiles: number;
  viewHeightTiles: number;
  targetFps: number;
}

export const ORIENTATIONS = ['down', 'left', 'right', 'up'] as const;
export type Orientation = (typeof ORIENTATIONS)[number];
