import { Keyframe } from "./keyframe";
import { getAllEnumKeys } from "enum-for";
import { EasingType, Player, RawMessage, world } from "@minecraft/server";
import {
  ActionFormData,
  MessageFormData,
  ModalFormData,
} from "@minecraft/server-ui";
import {
  isUniqueSceneId,
  parseFloatElse,
  playScene,
  printExport,
} from "./util";
import { getScenes, setScene, Scene } from "./scene";

const navigatorSeparator = " §e>§r ";

export async function openGlobalSceneEditorMenu(player: Player) {
  const scenes = getScenes(world);
  const form = new ActionFormData()
    .title({ translate: "animstud:ui.menu.global_scene_editor.title" })
    .button(
      {
        rawtext: [
          { translate: "animstud:ui.menu.global_scene_editor.button.manual" },
          { text: " §8(coming soon)§r" },
        ],
      },
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
      let retry = true;
      while (retry) {
        retry = (
          await openErrorMessageMenu(player, {
            translate: "animstud:log.error.message.not_yet_implemented",
          })
        ).retry;
      }
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
        { translate: "animstud:ui.menu.scene_creator.title" },
      ],
    })
    .textField(
      {
        rawtext: [
          {
            translate: "animstud:ui.menu.scene_creator.text_field.id.label",
          },
          { text: " §7(" },
          { translate: "animstud:ui.label.required" },
          { text: ")§r" },
        ],
      },
      {
        translate: "animstud:ui.menu.scene_creator.text_field.id.placeholder",
      },
    );

  const response = await form.show(player);
  if (response.canceled) {
    await openGlobalSceneEditorMenu(player);
    return;
  }
  const id: string = response.formValues![0] as string;
  if (id.length == 0) {
    const { retry } = await openErrorMessageMenu(player, {
      translate: "animstud:log.error.message.id_too_short",
    });
    if (retry) {
      await openSceneCreatorMenu(player);
    }
    return;
  }
  if (!isUniqueSceneId(id)) {
    const { retry } = await openErrorMessageMenu(player, {
      translate: "animstud:log.error.message.scene_id_already_used",
    });
    if (retry) {
      await openSceneCreatorMenu(player);
    }
    return;
  }
  setScene(world, { id, keyframes: [] });
}

async function openSceneEditorMenu(player: Player, scene: Scene) {
  const form = new ActionFormData()
    .title({
      rawtext: [
        { text: "Scene Editor" },
        { text: navigatorSeparator },
        { translate: "animstud:ui.menu.scene_editor.title", with: [scene.id] },
      ],
    })
    .button(
      { translate: "animstud:ui.menu.scene_editor.button.preview" },
      "textures/icons/animstud/play",
    )
    .button(
      { translate: "animstud:ui.menu.scene_editor.button.configure" },
      "textures/ui/icon_setting",
    )
    .button(
      { translate: "animstud:ui.menu.scene_editor.button.edit" },
      "textures/items/keyframe_creator",
    )
    .button(
      { translate: "animstud:ui.menu.scene_editor.button.export" },
      "textures/ui/upload_glyph",
    );

  const response = await form.show(player);
  switch (response.selection) {
    case 0:
      await playScene(player, scene);
      break;
    case 1:
      // TODO: scene configuration menu (change ID e.g.)
      let retry = true;
      while (retry) {
        retry = (
          await openErrorMessageMenu(player, {
            translate: "animstud:log.error.message.not_yet_implemented",
          })
        ).retry;
      }
      break;
    case 2:
      const hasKeyframes = scene.keyframes.length > 0;
      if (hasKeyframes) {
        await openKeyframesEditorMenu(player, scene);
      } else {
        let retry = true;
        while (retry) {
          retry = (
            await openErrorMessageMenu(player, {
              translate: "animstud:log.error.message.scene_without_keyframes",
            })
          ).retry;
        }
      }
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
    .title({
      rawtext: [
        { text: "Scene Editor" },
        { text: navigatorSeparator },
        {
          translate: "animstud:ui.menu.global_scene_editor.button.edit_scene",
          with: [scene.id],
        },
        { text: navigatorSeparator },
        { translate: "animstud:ui.menu.keyframes_editor.title" },
      ],
    })
    .body({ translate: "animstud:ui.menu.keyframes_editor.body" });

  for (const keyframe of scene.keyframes) {
    form.button(
      {
        translate: "animstud:ui.menu.keyframes_editor.button.edit",
        with: [keyframe.id],
      },
      "textures/ui/editIcon",
    );
  }

  const response = await form.show(player);
  if (response.selection === undefined) {
    return;
  }
  const selectedKeyframe = scene.keyframes[response.selection];
  await openKeyframeEditorMenu(player, scene, selectedKeyframe);
}

async function openKeyframeEditorMenu(
  player: Player,
  scene: Scene,
  keyframe: Keyframe,
) {
  const sceneIds = getScenes(world).map((s: Scene) => s.id);
  const form = new ModalFormData()
    .title({
      translate: "animstud:ui.menu.keyframe_editor.title",
      with: [keyframe.id],
    })
    .textField(
      {
        rawtext: [
          {
            translate: "animstud:ui.menu.keyframe_editor.text_field.id.label",
          },
          {
            text: " §7(",
          },
          {
            translate: "animstud:ui.label.required",
          },
          {
            text: ")§r",
          },
        ],
      },
      {
        translate: "animstud:ui.menu.keyframe_editor.text_field.id.placeholder",
      },
      keyframe.id,
    )
    .textField(
      {
        rawtext: [
          {
            translate:
              "animstud:ui.menu.keyframe_editor.text_field.camera_position_x.label",
          },
          { text: " §7(" },
          {
            translate: "animstud:ui.label.required",
          },
          { text: ")§r" },
        ],
      },
      "42",
      keyframe.pos.x.toString(),
    )
    .textField(
      {
        rawtext: [
          {
            translate:
              "animstud:ui.menu.keyframe_editor.text_field.camera_position_y.label",
          },
          { text: " §7(" },
          {
            translate: "animstud:ui.label.required",
          },
          { text: ")§r" },
        ],
      },
      "42",
      keyframe.pos.y.toString(),
    )
    .textField(
      {
        rawtext: [
          {
            translate:
              "animstud:ui.menu.keyframe_editor.text_field.camera_position_z.label",
          },
          { text: " §7(" },
          {
            translate: "animstud:ui.label.required",
          },
          { text: ")§r" },
        ],
      },
      "42",
      keyframe.pos.z.toString(),
    )
    .textField(
      {
        rawtext: [
          {
            translate:
              "animstud:ui.menu.keyframe_editor.text_field.camera_rotation_x.label",
          },
          { text: " §7(" },
          {
            translate: "animstud:ui.label.required",
          },
          { text: ")§r" },
        ],
      },
      "42",
      keyframe.rot.x.toString(),
    )
    .textField(
      {
        rawtext: [
          {
            translate:
              "animstud:ui.menu.keyframe_editor.text_field.camera_rotation_y.label",
          },
          { text: " " },
          {
            translate: "animstud:ui.label.required",
          },
        ],
      },
      "42",
      keyframe.rot.y.toString(),
    )
    .dropdown(
      {
        translate:
          "animstud:ui.menu.keyframe_editor.text_field.easing_type.label",
      },
      getAllEnumKeys(EasingType),
      getAllEnumKeys(EasingType).indexOf(keyframe.ease.easeType!),
    )
    .slider(
      { translate: "animstud:ui.menu.keyframe_editor.slider.easing_duration" },
      1,
      30,
      0.5,
      keyframe.ease.easeTime ?? 5,
    )
    .toggle(
      { translate: "animstud:ui.menu.keyframe_editor.toggle.hide_hud" },
      !keyframe.visibleHud,
    )
    .dropdown(
      { translate: "animstud:ui.menu.keyframe_editor.dropdown.scene.label" },
      sceneIds,
      sceneIds.indexOf(scene.id),
    )
    .dropdown(
      { translate: "animstud:ui.menu.keyframe_editor.dropdown.position.label" },
      [
        {
          translate:
            "animstud:ui.menu.keyframe_editor.dropdown.position.option.keep",
        },
        {
          translate:
            "animstud:ui.menu.keyframe_editor.dropdown.position.option.swap_previous",
        },
        {
          translate:
            "animstud:ui.menu.keyframe_editor.dropdown.position.option.swap_next",
        },
      ],
      0,
    );

  const response = await form.show(player);
  if (response.formValues === undefined) {
    return;
  }
  
  const posX = parseFloat(response.formValues[1] as string);
  if (isNaN(posX) || posX === Infinity || posX === -Infinity) {
    const { retry } = (
      await openErrorMessageMenu(player, {
        translate: "animstud:log.error.message.invalid_coordinate",
      })
    );
    if (retry) {
      await openKeyframeEditorMenu(player, scene, keyframe);
    }
    return;
  }

  const posY = parseFloat(response.formValues[2] as string);
  if (isNaN(posY) || posY === Infinity || posY === -Infinity) {
    const { retry } = (
      await openErrorMessageMenu(player, {
        translate: "animstud:log.error.message.invalid_coordinate",
      })
    );
    if (retry) {
      await openKeyframeEditorMenu(player, scene, keyframe);
    }
    return;
  }

  const posZ = parseFloat(response.formValues[3] as string);
  if (isNaN(posZ) || posZ === Infinity || posZ === -Infinity) {
    const { retry } = (
      await openErrorMessageMenu(player, {
        translate: "animstud:log.error.message.invalid_coordinate",
      })
    );
    if (retry) {
      await openKeyframeEditorMenu(player, scene, keyframe);
    }
    return;
  }

  const rotX = parseFloat(response.formValues[4] as string);
  if (isNaN(rotX) || rotX === Infinity || rotX === -Infinity) {
    const {retry} = (
      await openErrorMessageMenu(player, {
        translate: "animstud:log.error.message.invalid_coordinate",
      })
    );
    if (retry) {
      await openKeyframeEditorMenu(player, scene, keyframe);
    }
    return;
  }

  const rotY = parseFloat(response.formValues[5] as string);
  if (isNaN(rotY) || rotY === Infinity || rotY === -Infinity) {
    const {retry} = (
      await openErrorMessageMenu(player, {
        translate: "animstud:log.error.message.invalid_coordinate",
      })
    );
    if (retry) {
      await openKeyframeEditorMenu(player, scene, keyframe);
    }
    return;
  }

  const easeTime = parseFloat(response.formValues[6] as string);
  if (isNaN(easeTime) || easeTime === Infinity || easeTime < 0) {
    const {retry} = (
      await openErrorMessageMenu(player, {
        translate: "animstud:log.error.message.invalid_ease_time",
      })
    );
    if (retry) {
      await openKeyframeEditorMenu(player, scene, keyframe);
    }
    return;
  }

  const id = response.formValues[0] as string;
  if (id.length === 0) {
    const { retry } = (
      await openErrorMessageMenu(player, {
        translate: "animstud:log.error.message.id_too_short"
      })
    );
    if (retry) {
      await openKeyframeEditorMenu(player, scene, keyframe);
    }
    return;
  }

  keyframe.id = response.formValues[0] as string;
  keyframe.pos = {
    x: posX,
    y: posY,
    z: posZ,
  };
  keyframe.rot = {
    x: rotX,
    y: rotY,
  };
  keyframe.ease = {
    easeType:
      EasingType[getAllEnumKeys(EasingType)[response.formValues[6] as number]],
    easeTime: easeTime,
  };
  keyframe.visibleHud = !(response.formValues[8] as boolean);
  setScene(world, scene);
}

export async function openKeyframeCreatorMenu(player: Player) {
  // TODO: apply same structure as above
  const form = new ModalFormData()
    .title({ translate: "animstud:ui.menu.keyframe_creator.title" })
    .textField(
      {
        rawtext: [
          {
            translate: "animstud:ui.menu.keyframe_editor.text_field.id.label",
          },
          {
            text: " §7(",
          },
          {
            translate: "animstud:ui.label.required",
          },
          {
            text: ")§r",
          },
        ],
      },
      {
        translate: "animstud:ui.menu_keyframe_editor.text_field.id.placeholder",
      },
    )
    .textField(
      {
        rawtext: [
          {
            translate:
              "animstud:ui.menu.keyframe_editor.text_field.camera_position_x.label",
          },
          { text: " §7(" },
          {
            translate: "animstud:ui.label.required",
          },
          { text: ")§r" },
        ],
      },
      "42",
      player.location.x.toString(),
    )
    .textField(
      {
        rawtext: [
          {
            translate:
              "animstud:ui.menu.keyframe_editor.text_field.camera_position_y.label",
          },
          { text: " §7(" },
          {
            translate: "animstud:ui.label.required",
          },
          { text: ")§r" },
        ],
      },
      "42",
      player.location.y.toString(),
    )
    .textField(
      {
        rawtext: [
          {
            translate:
              "animstud:ui.menu.keyframe_editor.text_field.camera_position_z.label",
          },
          { text: " §7(" },
          {
            translate: "animstud:ui.label.required",
          },
          { text: ")§r" },
        ],
      },
      "42",
      player.location.z.toString(),
    )
    .textField(
      {
        rawtext: [
          {
            translate:
              "animstud:ui.menu.keyframe_editor.text_field.camera_rotation_x.label",
          },
          { text: " §7(" },
          {
            translate: "animstud:ui.label.required",
          },
          { text: ")§r" },
        ],
      },
      "42",
      player.getRotation().x.toString(),
    )
    .textField(
      {
        rawtext: [
          {
            translate:
              "animstud:ui.menu.keyframe_editor.text_field.camera_rotation_y.label",
          },
          { text: " §7(" },
          {
            translate: "animstud:ui.label.required",
          },
          { text: ")§r" },
        ],
      },
      "42",
      player.getRotation().y.toString(),
    )
    .dropdown(
      {
        translate:
          "animstud:ui.menu.keyframe_editor.text_field.easing_type.label",
      },

      Object.values(EasingType),
    )
    .slider(
      { translate: "animstud:ui.menu.keyframe_editor.slider.easing_duration" },
      1,
      30,
      0.5,
      5,
    )
    .toggle(
      { translate: "animstud:ui.menu.keyframe_editor.toggle.hide_hud" },
      true,
    )
    .dropdown(
      { translate: "animstud:ui.menu.keyframe_editor.dropdown.scene.label" },
      getScenes(world).map((scene: Scene) => scene.id),
    )
    .dropdown(
      { translate: "animstud:ui.menu.keyframe_editor.dropdown.position.label" },
      [
        {
          translate:
            "animstud:ui.menu.keyframe_creator.dropdown.position.option.append",
        },
        {
          translate:
            "animstud:ui.menu.keyframe_creator.dropdown.position.option.prepend",
        },
      ],
    );

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

export async function openErrorMessageMenu(
  player: Player,
  errorMessage: RawMessage | string,
): Promise<{ retry: boolean }> {
  const form = new MessageFormData()
    .title({ translate: "animstud:ui.menu.error_message.title" })
    .body(errorMessage)
    .button1({ translate: "animstud:ui.menu.button.retry" })
    .button1({ translate: "animstud:ui.menu.button.abort" });

  const response = await form.show(player);
  const retry = response.selection === 0;
  return { retry };
}
