import { Keyframe } from "./keyframe";
import { getAllEnumKeys } from "enum-for";
import { EasingType, Player, world } from "@minecraft/server";
import {
  ActionFormData,
  MessageFormData,
  ModalFormData,
} from "@minecraft/server-ui";
import {
  errorMessage,
  isUniqueSceneId,
  parseFloatElse,
  playScene,
  printExport,
} from "./util";
import { getScenes, setScene, Scene } from "./scene";

const navigatorSeparator = " > ";

export async function openGlobalSceneEditorMenu(player: Player) {
  const scenes = getScenes(world);
  const form = new ActionFormData()
    .title({ translate: "animstud:ui.menu.global_scene_editor.title" })
    .button(
      { translate: "animstud:ui.menu.global_scene_editor.button.manual" },
      "textures/ui/creative_icon",
    )
    .button(
      { translate: "animstud:ui.menu.global_scene_editor.button.create_scene" },
      "textures/ui/color_plus",
    );
  for (const scene of scenes) {
    form.button(
      {
        translate: "animstud:ui.menu.global_scene_editor.button.edit_scene",
        with: [scene.id],
      },
      "textures/ui/icon_setting",
    );
  }

  const response = await form.show(player);
  const { selection } = response;
  switch (selection) {
    case 0:
      // TODO: open manual
      break;
    case 1:
      await openSceneCreatorMenu(player);
      break;
    case null:
    case undefined:
      break;
    default:
      const scene = scenes[selection - 2];
      await openSceneEditorMenu(player, scene);
  }
}

async function openSceneCreatorMenu(player: Player) {
  const form = new ModalFormData()
    .title({
      rawtext: [
        { translate: "animstud:ui.menu.global_scene_editor.title" },
        { text: navigatorSeparator },
        { translate: "animstud:ui.menu.scene_creator_menu.title" },
      ],
    })
    .textField(
      {
        rawtext: [
          {
            translate:
              "animstud:ui.menu.scene_creator_menu.text_field.id.label",
          },
          { text: " §7(" },
          { translate: "animstud:ui.label.required" },
          { text: ")§r" },
        ],
      },
      {
        translate:
          "animstud:ui.menu.scene_creator_menu.text_field.id.placeholder",
      },
    );

  const response = await form.show(player);
  if (response.canceled) {
    await openGlobalSceneEditorMenu(player);
    return;
  }
  const id: string = response.formValues![0] as string;
  if (id.length == 0) {
    // TODO: use translation key
    player.sendMessage(errorMessage("ID must have a length of 1 or greater."));
    return;
  }
  if (!isUniqueSceneId(id)) {
    // TODO
    return;
  }
  setScene(world, { id, keyframes: [] });
}

async function openSceneEditorMenu(player: Player, scene: Scene) {
  const form = new ActionFormData()
    .title(`Scene Editor §8>§r Edit §o${scene.id}§r`)
    .button("Preview Scene", "textures/icons/animstud/play")
    .button("Configure Scene", "textures/ui/icon_setting")
    .button("Edit keyframes", "textures/items/keyframe_creator")
    .button("Export Scene", "textures/ui/upload_glyph");

  const response = await form.show(player);
  switch (response.selection) {
    case 0:
      await playScene(player, scene);
      break;
    case 1:
      // TODO: configure scene
      break;
    case 2:
      await openKeyframesEditorMenu(player, scene);
      break;
    case 3:
      await printExport(player, scene);
      break;
    case null:
    case undefined:
      break;
  }
}

async function openKeyframesEditorMenu(player: Player, scene: Scene) {
  const form = new ActionFormData()
    .title(`Scene Editor §8>§r Edit §o${scene.id}§r §8>§r Keyframes`)
    .body("Use the §bCreate Keyframe§r item to create a new keyframe.");
  const hasKeyframes = scene.keyframes.length > 0;
  if (hasKeyframes) {
    for (const keyframe of scene.keyframes) {
      form.button(`Edit Keyframe §o${keyframe.id}§r`, "textures/ui/editIcon");
    }
  } else {
    form.button("TODO: we need at least one button");
  }

  const response = await form.show(player);
  if (response.selection === undefined) {
    return;
  }
  if (hasKeyframes) {
    const selectedKeyframe = scene.keyframes[response.selection];
    await openKeyframeEditorMenu(player, scene, selectedKeyframe);
  } else {
    // TODO
  }
}

async function openKeyframeEditorMenu(
  player: Player,
  scene: Scene,
  keyframe: Keyframe,
) {
  const sceneIds = getScenes(world).map((s: Scene) => s.id);
  const form = new ModalFormData()
    .title(`Edit Keyframe §o${keyframe.id}§r`)
    .textField(
      "ID §7(required)§r",
      "Unique identifier of keyframe",
      keyframe.id,
    )
    .textField(
      "Camera Position X §7(required)§r",
      "42",
      keyframe.pos.x.toString(),
    )
    .textField(
      "Camera Position Y §7(required)§r",
      "42",
      keyframe.pos.y.toString(),
    )
    .textField(
      "Camera Position Z §7(required)§r",
      "42",
      keyframe.pos.z.toString(),
    )
    .textField(
      "Camera Rotation X §7(required)§r",
      "42",
      keyframe.rot.x.toString(),
    )
    .textField(
      "Camera Rotation Y §7(required)§r",
      "42",
      keyframe.rot.y.toString(),
    )
    .dropdown(
      "Easing Type",
      getAllEnumKeys(EasingType),
      getAllEnumKeys(EasingType).indexOf(keyframe.ease.easeType!),
    )
    .slider("Ease Duration", 1, 30, 0.5, keyframe.ease.easeTime ?? 5)
    .toggle("Hide HUD", !keyframe.visibleHud)
    .dropdown("Scene", sceneIds, sceneIds.indexOf(scene.id))
    .dropdown("Position", ["Keep", "Swap with previous", "Swap with next"], 0);

  const response = await form.show(player);
  if (response.formValues === undefined) {
    return;
  }
  // TODO: ensure id.length > 0
  keyframe.id = response.formValues[0] as string;
  // TODO: error message when not float
  keyframe.pos = {
    x: parseFloatElse(response.formValues[1] as string, () => {
      console.error("TODO");
      return 0;
    }),
    y: parseFloatElse(response.formValues[2] as string, () => {
      console.error("TODO");
      return 0;
    }),
    z: parseFloatElse(response.formValues[3] as string, () => {
      console.error("TODO");
      return 0;
    }),
  };
  keyframe.rot = {
    x: parseFloatElse(response.formValues[4] as string, () => {
      console.error("TODO");
      return 0;
    }),
    y: parseFloatElse(response.formValues[5] as string, () => {
      console.error("TODO");
      return 0;
    }),
  };
  keyframe.ease = {
    easeType:
      EasingType[getAllEnumKeys(EasingType)[response.formValues[6] as number]],
    easeTime: parseFloatElse(response.formValues[7] as string, () => {
      console.error("TODO");
      return 0.5;
    }),
  };
  keyframe.visibleHud = !(response.formValues[8] as boolean);
  setScene(world, scene); // TODO: is this right?
}

export async function openKeyframeCreatorMenu(player: Player) {
  // TODO: see `openKeyframeEditorMenu`
  const form = new ModalFormData()
    .title("Create Keyframe")
    .textField("ID §7(required)§r", "Unique identifier of keyframe")
    .textField(
      "Camera Position X §7(required)§r",
      "42",
      player.location.x.toString(),
    )
    .textField(
      "Camera Position Y §7(required)§r",
      "42",
      player.location.y.toString(),
    )
    .textField(
      "Camera Position Z §7(required)§r",
      "42",
      player.location.z.toString(),
    )
    .textField(
      "Camera Rotation X §7(required)§r",
      "42",
      player.getRotation().x.toString(),
    )
    .textField(
      "Camera Rotation Y §7(required)§r",
      "42",
      player.getRotation().y.toString(),
    )
    .dropdown("Easing Type", Object.values(EasingType))
    .slider("Ease Duration", 1, 30, 0.5, 5)
    .toggle("Hide HUD", true)
    .dropdown(
      "Scene",
      getScenes(world).map((scene: Scene) => scene.id),
    )
    .dropdown("Position", ["Append", "Prepend"]);

  const response = await form.show(player);
  if (response.formValues === undefined) {
    return;
  }
  const keyframe: Keyframe = {
    id: response.formValues[0] as string,
    pos: {
      x: parseFloatElse(response.formValues[1] as string, () => 0),
      y: parseFloatElse(response.formValues[2] as string, () => 0),
      z: parseFloatElse(response.formValues[3] as string, () => 0),
    },
    rot: {
      x: parseFloatElse(response.formValues[4] as string, () => 0),
      y: parseFloatElse(response.formValues[5] as string, () => 0),
    },
    ease: {
      easeType:
        EasingType[
          getAllEnumKeys(EasingType)[response.formValues[6] as number]
        ],
      easeTime: parseFloatElse(response.formValues[7] as string, () => 5),
    },
    visibleHud: !(response.formValues[8] as boolean),
  };
  const scene = getScenes(world)[response.formValues[9] as number];
  const position = response.formValues[10] as number;
  switch (position) {
    case 0:
      // Append
      scene.keyframes.push(keyframe);
      break;
    case 1:
      // Prepend
      scene.keyframes.unshift(keyframe);
      break;
    default:
      throw new Error("unreachable");
  }
  setScene(world, scene);
}

async function openErrorMessageMenu(
  player: Player,
  errorMessage: string,
): Promise<{ retry: boolean }> {
  const form = new MessageFormData()
    .title("Error")
    .body(errorMessage)
    .button1("Retry")
    .button1("Abort");

  return form
    .show(player)
    .then((response) => {
      const canceled = response.canceled ?? response.selection === 1;
      return { retry: !canceled };
    })
    .catch((e) => {
      console.error(e);
      return { retry: false };
    });
}
