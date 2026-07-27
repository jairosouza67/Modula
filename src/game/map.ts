import type { GymMapData, Zone } from "./types";

export async function loadMap(url: string): Promise<GymMapData> {
  const res = await fetch(url);
  const data = (await res.json()) as GymMapData;
  return data;
}

// Gera um mapa procedural do ginásio FireFiit em formato BrowserQuest-like.
export function generateGymMap(): GymMapData {
  const W = 42;
  const H = 30;
  const tilesize = 16;
  const total = W * H;

  // Tile IDs do BrowserQuest tilesheet (exemplos aproximados)
  const T = {
    VOID: 0,
    FLOOR_LIGHT: 2,
    FLOOR_DARK: 3,
    MAT_GREEN: 5,
    MAT_RED: 6,
    MAT_BLUE: 7,
    MAT_DARK: 8,
    WALL_TOP: 40,
    WALL: 41,
    WALL_BOTTOM: 42,
    DOOR: 60,
    WATER: 100,
    WATER_DEEP: 101,
    TRACK: 20,
  };

  const ground = new Array(total).fill(T.FLOOR_LIGHT);
  const objects = new Array(total).fill(0);
  const collisions: number[] = [];

  const set = (layer: number[], x: number, y: number, id: number, block = false) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    layer[y * W + x] = id;
    if (block) collisions.push(y * W + x);
  };

  const fillRect = (
    layer: number[],
    x: number,
    y: number,
    w: number,
    h: number,
    id: number,
    block = false,
  ) => {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        set(layer, xx, yy, id, block);
      }
    }
  };

  // Paredes externas
  fillRect(objects, 0, 0, W, 1, T.WALL_TOP, true);
  fillRect(objects, 0, H - 1, W, 1, T.WALL_BOTTOM, true);
  fillRect(objects, 0, 0, 1, H, T.WALL, true);
  fillRect(objects, W - 1, 0, 1, H, T.WALL, true);

  // Zona de Musculação (topo-esquerdo)
  fillRect(ground, 2, 2, 17, 12, T.MAT_DARK);
  for (let x = 4; x < 17; x += 3) {
    set(objects, x, 4, T.WALL, true); // rack de peso
    set(objects, x, 6, T.WALL, true);
  }

  // Zona de Cardio (topo-direito)
  fillRect(ground, 22, 2, 18, 12, T.MAT_BLUE);
  for (let x = 24; x < 38; x += 4) {
    set(objects, x, 5, T.TRACK, false);
    set(objects, x, 8, T.TRACK, false);
  }

  // Piscina (inferior-direito)
  fillRect(ground, 24, 18, 16, 10, T.WATER);
  for (let x = 25; x < 39; x++) {
    for (let y = 19; y < 27; y++) {
      set(ground, x, y, T.WATER_DEEP, false);
    }
  }

  // Arena central / Boss (centro)
  fillRect(ground, 14, 13, 14, 10, T.MAT_RED);
  fillRect(objects, 14, 13, 14, 1, T.WALL, true);
  fillRect(objects, 14, 22, 14, 1, T.WALL, true);
  fillRect(objects, 14, 13, 1, 10, T.WALL, true);
  fillRect(objects, 27, 13, 1, 10, T.WALL, true);
  set(objects, 20, 18, 0); // entrada aberta

  // Vestiário / Spawn (inferior-esquerdo)
  fillRect(ground, 2, 18, 16, 10, T.MAT_GREEN);
  set(objects, 8, 24, T.DOOR, false);

  const zones: Zone[] = [
    {
      id: "musculacao",
      name: "Musculação",
      color: "#ef4444",
      minAttribute: "strength",
      minValue: 5,
      rect: { x: 2, y: 2, w: 17, h: 12 },
    },
    {
      id: "cardio",
      name: "Cardio",
      color: "#3b82f6",
      minAttribute: "endurance",
      minValue: 5,
      rect: { x: 22, y: 2, w: 18, h: 12 },
    },
    {
      id: "natacao",
      name: "Natação",
      color: "#06b6d4",
      minAttribute: "speed",
      minValue: 10,
      rect: { x: 24, y: 18, w: 16, h: 10 },
    },
    {
      id: "boss",
      name: "Arena do Boss",
      color: "#7f1d1d",
      rect: { x: 14, y: 13, w: 14, h: 10 },
    },
    {
      id: "vestiario",
      name: "Vestiário",
      color: "#22c55e",
      rect: { x: 2, y: 18, w: 16, h: 10 },
    },
  ];

  return {
    width: W,
    height: H,
    tilesize,
    tileset: {
      firstgid: 1,
      image: "tilesheet.png",
      tilewidth: 16,
      tileheight: 16,
      tilecount: 256,
      columns: 16,
    },
    layers: [
      { name: "ground", width: W, height: H, data: ground },
      { name: "objects", width: W, height: H, data: objects },
    ],
    collisions,
    animated: {
      "100": { length: 4, speed: 12, index: 100 },
      "101": { length: 4, speed: 12, index: 101 },
    },
    zones,
  };
}
