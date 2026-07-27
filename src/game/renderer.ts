import type {
  AvatarState,
  GymMapData,
  Orientation,
  RendererConfig,
  SpriteDefinition,
  Vec2,
} from "./types";

const DEFAULT_CONFIG: RendererConfig = {
  tileSize: 16,
  scale: 2,
  viewWidthTiles: 15,
  viewHeightTiles: 9,
  targetFps: 60,
};

class Sprite {
  name: string;
  scale: number;
  isLoaded = false;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  animations: SpriteDefinition["animations"];

  constructor(name: string, scale: number, def: SpriteDefinition) {
    this.name = name;
    this.scale = scale;
    this.width = def.width;
    this.height = def.height;
    this.offsetX = def.offset_x ?? -16;
    this.offsetY = def.offset_y ?? -16;
    this.animations = def.animations;
    this.image = new Image();
    this.image.src = `/game/sprites/${this.scale}/${def.id}.png`;
    this.image.onload = () => {
      this.isLoaded = true;
    };
  }

  currentFrame(animationName: string, index: number) {
    const anim = this.animations[animationName];
    if (!anim) return { x: 0, y: 0 };
    return {
      x: this.width * (index % anim.length),
      y: this.height * anim.row,
    };
  }

  getFrameCount(animationName: string) {
    return this.animations[animationName]?.length ?? 1;
  }
}

class Camera {
  x = 0;
  y = 0;
  gridX = 0;
  gridY = 0;
  gridW = 0;
  gridH = 0;

  constructor(
    private renderer: Renderer,
    private tileSize: number,
  ) {
    this.rescale();
  }

  rescale() {
    const factor = 1;
    this.gridW = this.renderer.config.viewWidthTiles * factor;
    this.gridH = this.renderer.config.viewHeightTiles * factor;
  }

  setGridPosition(x: number, y: number) {
    this.gridX = x;
    this.gridY = y;
    this.x = x * this.tileSize;
    this.y = y * this.tileSize;
  }

  lookAt(entity: Vec2) {
    const r = this.renderer;
    this.x = Math.round(
      entity.x - Math.floor(this.gridW / 2) * r.config.tileSize,
    );
    this.y = Math.round(
      entity.y - Math.floor(this.gridH / 2) * r.config.tileSize,
    );
    this.gridX = Math.floor(this.x / r.config.tileSize);
    this.gridY = Math.floor(this.y / r.config.tileSize);
  }

  forEachVisiblePosition(callback: (x: number, y: number) => void) {
    const extra = 1;
    for (let y = this.gridY - extra; y < this.gridY + this.gridH + extra; y++) {
      for (let x = this.gridX - extra; x < this.gridX + this.gridW + extra; x++) {
        callback(x, y);
      }
    }
  }
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private tilesetImage: HTMLImageElement | null = null;
  private sprites: Map<string, Sprite> = new Map();
  private animationFrame = 0;
  private lastTime = 0;
  private avatarAnimation = "idle_down";
  private avatarFrameIndex = 0;
  private avatarAnimTime = 0;
  private avatarPos: Vec2 = { x: 0, y: 0 };
  private avatarOrientation: Orientation = "down";
  private bossPulse = 0;
  private running = false;

  config: RendererConfig;

  constructor(
    private canvas: HTMLCanvasElement,
    private map: GymMapData,
    private avatarState: AvatarState,
    private onZoneEnter?: (zoneId: string) => void,
    options: Partial<RendererConfig> = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not supported");
    this.ctx = ctx;
    this.camera = new Camera(this, this.config.tileSize);
    this.avatarPos = this.findSpawnPosition();
    this.camera.lookAt(this.worldPos(this.avatarPos));
  }

  async loadAssets() {
    await this.loadTileset();
    await this.loadSprite("avatar");
  }

  private loadTileset(): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `/game/tilesheet.png`;
      img.onload = () => {
        this.tilesetImage = img;
        resolve();
      };
      img.onerror = () => resolve();
    });
  }

  private async loadSprite(name: string): Promise<void> {
    const def: SpriteDefinition = await fetch(`/game/sprites/${name}.json`).then((r) =>
      r.json(),
    );
    const sprite = new Sprite(name, this.config.scale, def);
    this.sprites.set(name, sprite);
    return new Promise((resolve) => {
      const check = () => {
        if (sprite.isLoaded) resolve();
        else setTimeout(check, 16);
      };
      check();
    });
  }

  start() {
    this.running = true;
    this.loop(0);
  }

  stop() {
    this.running = false;
  }

  updateState(state: AvatarState) {
    this.avatarState = state;
  }

  setActiveBoss(active: boolean) {
    // pulsing handled in drawBoss
  }

  setAvatarPosition(pos: Vec2) {
    this.avatarPos = pos;
    this.camera.lookAt(this.worldPos(pos));
  }

  moveAvatar(dx: number, dy: number) {
    const next: Vec2 = { x: this.avatarPos.x + dx, y: this.avatarPos.y + dy };
    if (this.isWalkable(next)) {
      this.avatarPos = next;
      this.avatarOrientation =
        dx > 0 ? "right" : dx < 0 ? "left" : dy > 0 ? "down" : "up";
      this.avatarAnimation = `walk_${this.avatarOrientation}`;
      this.camera.lookAt(this.worldPos(next));
      this.checkZoneEntry();
    }
  }

  private findSpawnPosition(): Vec2 {
    // Procura chão (tile != 0 e não colisão) próximo ao centro inferior
    const layer = this.map.layers.find((l) => l.name === "ground");
    if (!layer) return { x: 5, y: 5 };

    for (let y = this.map.height - 2; y > 0; y--) {
      for (let x = Math.floor(this.map.width / 2) - 3; x < this.map.width / 2 + 3; x++) {
        const idx = y * this.map.width + x;
        if (layer.data[idx] && !this.map.collisions.includes(idx)) {
          return { x, y };
        }
      }
    }
    return { x: 5, y: 5 };
  }

  private worldPos(gridPos: Vec2): Vec2 {
    return {
      x: gridPos.x * this.config.tileSize,
      y: gridPos.y * this.config.tileSize,
    };
  }

  private isWalkable(pos: Vec2): boolean {
    if (
      pos.x < 0 ||
      pos.y < 0 ||
      pos.x >= this.map.width ||
      pos.y >= this.map.height
    )
      return false;
    const idx = pos.y * this.map.width + pos.x;
    return !this.map.collisions.includes(idx);
  }

  private checkZoneEntry() {
    if (!this.onZoneEnter) return;
    const zone = this.map.zones.find((z) =>
      this.avatarPos.x >= z.rect.x &&
      this.avatarPos.x < z.rect.x + z.rect.w &&
      this.avatarPos.y >= z.rect.y &&
      this.avatarPos.y < z.rect.y + z.rect.h,
    );
    if (zone) {
      this.onZoneEnter(zone.id);
    }
  }

  private loop = (time: number) => {
    if (!this.running) return;
    const dt = time - this.lastTime;
    if (dt >= 1000 / this.config.targetFps) {
      this.update(time);
      this.draw();
      this.lastTime = time;
    }
    requestAnimationFrame(this.loop);
  };

  private update(time: number) {
    this.animationFrame++;

    // Avatar animation
    if (time - this.avatarAnimTime > 120) {
      this.avatarFrameIndex++;
      this.avatarAnimTime = time;
    }

    // Auto-idle
    if (!this.avatarAnimation.startsWith("walk")) {
      this.avatarAnimation = `idle_${this.avatarOrientation}`;
    }

    // Boss pulse
    this.bossPulse = (Math.sin(time / 300) + 1) / 2;
  }

  private draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.tilesetImage) return;

    this.drawMap();
    this.drawZones();
    this.drawBossArena();
    this.drawAvatar();
  }

  private drawMap() {
    if (!this.tilesetImage) return;
    const tilesetColumns = Math.floor(
      this.tilesetImage.width / this.map.tileset.tilewidth,
    );

    for (const layer of this.map.layers) {
      this.camera.forEachVisiblePosition((x, y) => {
        if (x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) return;
        const tileId = layer.data[y * this.map.width + x];
        if (!tileId) return;

        const finalTileId = this.resolveAnimatedTile(tileId);
        const srcX = ((finalTileId - 1) % tilesetColumns) * this.map.tileset.tilewidth;
        const srcY =
          Math.floor((finalTileId - 1) / tilesetColumns) * this.map.tileset.tileheight;

        const screenX = (x - this.camera.gridX) * this.config.tileSize * this.config.scale;
        const screenY = (y - this.camera.gridY) * this.config.tileSize * this.config.scale;

        this.ctx.drawImage(
          this.tilesetImage,
          srcX,
          srcY,
          this.map.tileset.tilewidth,
          this.map.tileset.tileheight,
          screenX,
          screenY,
          this.config.tileSize * this.config.scale,
          this.config.tileSize * this.config.scale,
        );
      });
    }
  }

  private resolveAnimatedTile(tileId: number): number {
    const key = String(tileId);
    const anim = this.map.animated[key];
    if (!anim) return tileId;
    const frame = Math.floor(this.animationFrame / anim.speed) % anim.length;
    return anim.index + frame;
  }

  private drawZones() {
    for (const zone of this.map.zones) {
      const x = (zone.rect.x - this.camera.gridX) * this.config.tileSize * this.config.scale;
      const y = (zone.rect.y - this.camera.gridY) * this.config.tileSize * this.config.scale;
      const w = zone.rect.w * this.config.tileSize * this.config.scale;
      const h = zone.rect.h * this.config.tileSize * this.config.scale;

      this.ctx.save();
      this.ctx.globalAlpha = 0.08;
      this.ctx.fillStyle = zone.color;
      this.ctx.fillRect(x, y, w, h);

      // Zone name
      this.ctx.globalAlpha = 0.7;
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "10px sans-serif";
      this.ctx.fillText(zone.name, x + 4, y + 12);
      this.ctx.restore();
    }
  }

  private drawBossArena() {
    const boss = this.map.zones.find((z) => z.id === "boss");
    if (!boss) return;

    const cx =
      (boss.rect.x + boss.rect.w / 2 - this.camera.gridX) *
      this.config.tileSize *
      this.config.scale;
    const cy =
      (boss.rect.y + boss.rect.h / 2 - this.camera.gridY) *
      this.config.tileSize *
      this.config.scale;
    const radius = 18 + this.bossPulse * 8;

    this.ctx.save();
    this.ctx.globalAlpha = 0.3 + this.bossPulse * 0.3;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "#ef4444";
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawAvatar() {
    const sprite = this.sprites.get("avatar");
    if (!sprite || !sprite.isLoaded) return;

    const levelStage = Math.min(3, Math.floor((this.avatarState.level - 1) / 7));
    const animationName = `${levelStage}_${this.avatarOrientation}`;
    const frame = sprite.currentFrame(animationName, this.avatarFrameIndex);
    const count = sprite.getFrameCount(animationName);
    if (this.avatarFrameIndex >= count) this.avatarFrameIndex = 0;

    const screenX =
      (this.avatarPos.x - this.camera.gridX) * this.config.tileSize * this.config.scale +
      sprite.offsetX * this.config.scale;
    const screenY =
      (this.avatarPos.y - this.camera.gridY) * this.config.tileSize * this.config.scale +
      sprite.offsetY * this.config.scale;

    // Aura streak
    if (this.avatarState.streak >= 7) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.25 + this.bossPulse * 0.15;
      this.ctx.beginPath();
      this.ctx.arc(
        screenX + (sprite.width * this.config.scale) / 2,
        screenY + (sprite.height * this.config.scale) / 2,
        22,
        0,
        Math.PI * 2,
      );
      this.ctx.fillStyle = this.avatarState.streak >= 30 ? "#f59e0b" : "#3b82f6";
      this.ctx.fill();
      this.ctx.restore();
    }

    this.ctx.drawImage(
      sprite.image,
      frame.x,
      frame.y,
      sprite.width,
      sprite.height,
      screenX,
      screenY,
      sprite.width * this.config.scale,
      sprite.height * this.config.scale,
    );
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = false;
    this.camera.rescale();
  }
}
