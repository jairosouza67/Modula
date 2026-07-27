import { useEffect, useRef, useState } from "react";
import { generateGymMap } from "@/game/map";
import { Renderer } from "@/game/renderer";
import type { AvatarState, Orientation } from "@/game/types";

interface GameCanvasProps {
  avatarState: AvatarState;
  activeBoss?: boolean;
  onZoneEnter?: (zoneId: string) => void;
}

export function GameCanvas({ avatarState, activeBoss, onZoneEnter }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const map = generateGymMap();
    const renderer = new Renderer(canvas, map, avatarState, onZoneEnter, {
      scale: 3,
      viewWidthTiles: 13,
      viewHeightTiles: 8,
    });

    renderer.resize(window.innerWidth, Math.min(window.innerHeight * 0.45, 420));
    renderer
      .loadAssets()
      .then(() => {
        renderer.start();
        rendererRef.current = renderer;
        setReady(true);
      })
      .catch(() => setReady(true));

    const handleResize = () => {
      renderer.resize(window.innerWidth, Math.min(window.innerHeight * 0.45, 420));
    };
    window.addEventListener("resize", handleResize);

    return () => {
      renderer.stop();
      window.removeEventListener("resize", handleResize);
    };
  }, [onZoneEnter]);

  useEffect(() => {
    rendererRef.current?.updateState(avatarState);
  }, [avatarState]);

  const handleMove = (direction: Orientation) => {
    const map: Record<Orientation, [number, number]> = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0],
    };
    const [dx, dy] = map[direction];
    rendererRef.current?.moveAvatar(dx, dy);
  };

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full touch-none block rounded-b-2xl border-b border-border/30 bg-black"
        style={{ imageRendering: "pixelated" }}
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-primary text-sm font-semibold">
          Carregando arena...
        </div>
      )}

      {/* D-pad */}
      <div className="absolute bottom-3 right-3 grid grid-cols-3 gap-1 opacity-80">
        <div />
        <button
          aria-label="cima"
          onClick={() => handleMove("up")}
          className="w-10 h-10 rounded-lg bg-background/80 border border-border text-primary active:scale-95"
        >
          ▲
        </button>
        <div />
        <button
          aria-label="esquerda"
          onClick={() => handleMove("left")}
          className="w-10 h-10 rounded-lg bg-background/80 border border-border text-primary active:scale-95"
        >
          ◀
        </button>
        <button
          aria-label="baixo"
          onClick={() => handleMove("down")}
          className="w-10 h-10 rounded-lg bg-background/80 border border-border text-primary active:scale-95"
        >
          ▼
        </button>
        <button
          aria-label="direita"
          onClick={() => handleMove("right")}
          className="w-10 h-10 rounded-lg bg-background/80 border border-border text-primary active:scale-95"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
