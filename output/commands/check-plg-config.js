"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPluginConfig = checkPluginConfig;
const chalk_1 = __importDefault(require("chalk"));
const app_finder_1 = require("../utils/app-finder");
const plg_metadata_1 = require("../utils/plg-metadata");
async function checkPluginConfig() {
    const currentDirectory = await (0, app_finder_1.findTSDIAPIServerProject)();
    if (!currentDirectory) {
        return console.log(chalk_1.default.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
    }
    const config = await (0, plg_metadata_1.getPluginMetaDataFromRoot)(currentDirectory);
    if (!config) {
        return console.log(chalk_1.default.red(`No plugin configuration found`));
    }
    return true;
}
//# sourceMappingURL=check-plg-config.js.map