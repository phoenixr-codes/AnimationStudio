import { World } from "@minecraft/server";
import { Keyframe } from "./keyframe";

export type Scene = {
  /** The unqiue ID of the scene. */
  id: string;

  /** The keyframes describing the scene. */
  keyframes: Keyframe[];
};

/** Returns all scenes. */
export function getScenes(world: World): Scene[] {
  const scenesData = world.getDynamicProperty("scenes");
  if (scenesData === undefined) {
    return [];
  }
  if (typeof scenesData === "string") {
    const scenes: Scene[] = JSON.parse(scenesData);
    return scenes;
  }
  console.error("invalid type for dynamic property `scenes`");
  return [];
}

export function setScene(world: World, scene: Scene) {
  const scenes = getScenes(world);
  const indexBefore = scenes.findIndex((s: Scene) => s.id === scene.id);
  if (indexBefore < 0) {
    scenes.push(scene);
  } else {
    scenes[indexBefore] = scene;
  }
  world.setDynamicProperty("scenes", JSON.stringify(scenes));
}
