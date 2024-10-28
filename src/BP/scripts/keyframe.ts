import { Vector2, Vector3, CameraEaseOptions } from "@minecraft/server";

export type Keyframe = {
  /** The unique ID of the keyframe. */
  id: string;

  /** The position the player has in the keyframe. */
  pos: Vector3;

  /** The rotation the player has in the keyframe. */
  rot: Vector2;

  /** The easing applied for the following transition. */
  ease: CameraEaseOptions;

  /** Whether the HUD is visible. */
  visibleHud: boolean;
};
