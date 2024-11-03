// TODO: remove console calls
// TODO: support HUD
// TODO: always just go back on menu close

import { Player, system, world } from "@minecraft/server";
import { openGlobalSceneEditorMenu, openKeyframeCreatorMenu } from "./menu";
import { getScenes } from "./scene";
import { errorMessage, playScene } from "./util";

world.beforeEvents.itemUse.subscribe(async (event) => {
  const { typeId } = event.itemStack;
  const player = event.source;
  switch (typeId) {
    case "animstud:scene_editor":
      system.run(async () => {
        try {
          await openGlobalSceneEditorMenu(player);
        } catch (error) {
          console.error(error);
        }
      });
      break;
    case "animstud:keyframe_creator":
      system.run(async () => {
        try {
          await openKeyframeCreatorMenu(player);
        } catch (error) {
          console.error(error);
        }
      });
      break;
  }
});

system.afterEvents.scriptEventReceive.subscribe(async (event) => {
  const {
    id, // returns string (wiki:test)
    // initiator, // returns Entity (or undefined if an NPC did not fire the command)
    message, // returns string (Hello World)
    // sourceBlock, // returns Block (or undefined if a block did not fire the command)
    sourceEntity, // returns Entity (or undefined if an entity did not fire the command)
    // sourceType, // returns MessageSourceType (can be 'Block', 'Entity', 'NPCDialogue', or 'Server')
  } = event;

  if (id !== "animstud:play") {
    return;
  }
  if (sourceEntity === undefined) {
    return;
  }

  const sceneId = message;
  const player = sourceEntity;
  const scene = getScenes(world).find((s) => s.id === sceneId);

  // TODO: is this OK?
  if (!(player instanceof Player)) {
    return;
  }

  if (scene === undefined) {
    console.error(errorMessage(`there is no scene with the ID ${sceneId}`));
  }

  try {
    await playScene(player, scene!);
  } catch (error) {
    console.error(error);
  }
});
