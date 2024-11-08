import {
  EasingType,
  HudVisibility,
  Player,
  system,
  Vector2,
  Vector3,
  world,
} from "@minecraft/server";
import { getScenes, Scene } from "./scene";
import { snakeCase } from "change-case-all";

export function isUniqueSceneId(id: string): boolean {
  return getScenes(world).find((scene: Scene) => scene.id === id) === undefined;
}

function displayVec3(vec: Vector3): string {
  return `${vec.x} ${vec.y} ${vec.z}`;
}

function displayVec2(vec: Vector2): string {
  return `${vec.x} ${vec.y}`;
}

function easeTypeToSnakeCase(easingType: EasingType): string {
  return snakeCase(easingType);
}

export async function printExport(player: Player, scene: Scene) {
  const { keyframes } = scene;
  let easeTime = 0.0;
  let cmdBlockType: "impulse" | "chain" = "impulse";
  player.sendMessage(`§aScene ${scene.id}§r`);
  for (const keyframe of keyframes) {
    switch (cmdBlockType) {
      case "impulse":
        player.sendMessage("§6Command Block (Impulse)§r");
        break;
      case "chain":
        player.sendMessage(
          `§sCommand Block (Chain) [Tick Delay ${easeTime * 20}]§r`,
        );
    }
    if (keyframe.visibleHud) {
      player.sendMessage("/hud @? reset");
    } else {
      player.sendMessage("/hud @? hide");
    }

    player.sendMessage(
      `/camera @? set minecraft:free ease ${easeTime} ${easeTypeToSnakeCase(keyframe.ease.easeType!)} pos ${displayVec3(keyframe.pos)} rot ${displayVec2(keyframe.rot)}`,
    );

    player.sendMessage("---");
    cmdBlockType = "chain";
    easeTime = keyframe.ease.easeTime ?? 5.0;
  }
  player.sendMessage("/hud @? reset");
  player.sendMessage(`§sCommand Block (Chain) [Tick Delay ${easeTime * 20}]§r`);
}

export async function playScene(player: Player, scene: Scene) {
  const { keyframes } = scene;
  let easeTime = 0.0;
  for (const keyframe of keyframes) {
    if (keyframe.visibleHud) {
      player.onScreenDisplay.setHudVisibility(HudVisibility.Reset);
    } else {
      player.onScreenDisplay.setHudVisibility(HudVisibility.Hide);
    }

    player.camera.setCamera("minecraft:free", {
      easeOptions: { easeTime: easeTime, easeType: keyframe.ease.easeType },
      location: keyframe.pos,
      rotation: keyframe.rot,
    });

    // NOTE: argument of `waitTicks` must be 1 or greater
    const waitTicks = easeTime * 20;
    if (waitTicks >= 1) {
      await system.waitTicks(easeTime * 20);
    }
    easeTime = keyframe.ease.easeTime ?? 5.0;
  }
  const waitTicks = easeTime * 20;
  if (waitTicks >= 1) {
    await system.waitTicks(easeTime * 20);
  }
  player.onScreenDisplay.setHudVisibility(HudVisibility.Reset);
  player.camera.clear();
}
