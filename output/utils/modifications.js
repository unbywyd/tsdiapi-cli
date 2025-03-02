"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileModifications = fileModifications;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("./handlebars"));
const inquirer_1 = require("./inquirer");
async function fileModifications(pluginName, projectDir, modifications, payload = {}) {
    try {
        const pendingChanges = [];
        for (const mod of modifications) {
            const filePath = path_1.default.join(projectDir, mod.path);
            if (mod?.when) {
                try {
                    if (!(0, inquirer_1.convertWhenToFunction)(mod.when)(payload)) {
                        console.log(chalk_1.default.yellow(`⚠️ Skipping ${filePath} (When condition not met)`));
                        continue;
                    }
                }
                catch (e) {
                    console.error(chalk_1.default.red(`❌ Error while evaluating when condition: ${e.message}`));
                    continue;
                }
            }
            if (!fs_extra_1.default.existsSync(filePath)) {
                console.log(chalk_1.default.yellow(`⚠️ Skipping ${filePath} (File not found)`));
                continue;
            }
            const fileContent = await fs_extra_1.default.readFile(filePath, "utf8");
            const regex = new RegExp(replaceSafeVariables(mod.match, payload));
            const matchFound = regex.test(fileContent);
            if (mod.expected !== undefined && matchFound !== mod.expected) {
                console.log(chalk_1.default.yellow(`⚠️ Skipping modification for ${filePath} (Expected match condition not met)`));
                continue;
            }
            pendingChanges.push({
                filePath,
                mode: mod.mode,
                plugin: pluginName
            });
        }
        if (pendingChanges.length === 0) {
            console.log(chalk_1.default.blue(`✅ No modifications required for ${pluginName}.`));
            return;
        }
        console.log(chalk_1.default.blue(`⚡ Plugin "${pluginName}" wants to modify ${pendingChanges.length} files:`));
        for (const { filePath, mode } of pendingChanges) {
            console.log(`- ${filePath} (${mode})`);
        }
        for (const mod of modifications) {
            const filePath = path_1.default.join(projectDir, mod.path);
            if (!fs_extra_1.default.existsSync(filePath))
                continue;
            let fileContent = await fs_extra_1.default.readFile(filePath, "utf8");
            const updatedContent = mod?.isHandlebarsTemplate ? replaceSafeVariables(mod.content, payload) : mod.content;
            if (mod.mode === "prepend") {
                fileContent = updatedContent + "\n" + fileContent;
            }
            else if (mod.mode === "append") {
                fileContent = fileContent + "\n" + updatedContent;
            }
            await fs_extra_1.default.writeFile(filePath, fileContent, "utf8");
            console.log(chalk_1.default.green(`✅ Updated: ${filePath} (${mod.mode})`));
        }
        console.log(chalk_1.default.blue(`🎉 Modifications applied successfully for "${pluginName}"`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`❌ Error while modifying files: ${error.message}`));
    }
}
function replaceSafeVariables(content, variables) {
    try {
        return handlebars_1.default.compile(content)(variables);
    }
    catch (error) {
        console.error(chalk_1.default.red(`❌ Error while replacing variables: ${error.message}`));
        return content;
    }
}
//# sourceMappingURL=modifications.js.map