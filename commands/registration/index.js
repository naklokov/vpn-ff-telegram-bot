const { SCENE_IDS } = require("../../constants");

module.exports = (ctx) => ctx.scene.enter(SCENE_IDS.REGISTRATION);
