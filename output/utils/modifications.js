import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import Handlebars from "./handlebars.js";
import { convertWhenToFunction } from './inquirer.js';
export async function fileModifications(pluginName, projectDir, modifications, payload = {}) {
    try {
        const pendingChanges = [];
        for (const mod of modifications) {
            const filePath = path.join(projectDir, mod.path);
            if (mod?.when) {
                try {
                    if (!convertWhenToFunction(mod.when)(payload)) {
                        console.log(chalk.yellow(`⚠️ Skipping ${filePath} (When condition not met)`));
                        continue;
                    }
                }
                catch (e) {
                    console.error(chalk.red(`❌ Error while evaluating when condition: ${e.message}`));
                    continue;
                }
            }
            if (!fs.existsSync(filePath)) {
                console.log(chalk.yellow(`⚠️ Skipping ${filePath} (File not found)`));
                continue;
            }
            const fileContent = await fs.readFile(filePath, "utf8");
            const regex = new RegExp(replaceSafeVariables(mod.match, payload));
            const matchFound = regex.test(fileContent);
            if (mod.expected !== undefined && matchFound !== mod.expected) {
                console.log(chalk.yellow(`⚠️ Skipping modification for ${filePath} (Expected match condition not met)`));
                continue;
            }
            pendingChanges.push({
                filePath,
                mode: mod.mode,
                plugin: pluginName
            });
        }
        if (pendingChanges.length === 0) {
            console.log(chalk.blue(`✅ No modifications required for ${pluginName}.`));
            return;
        }
        console.log(chalk.blue(`⚡ Plugin "${pluginName}" wants to modify ${pendingChanges.length} files:`));
        for (const { filePath, mode } of pendingChanges) {
            console.log(`- ${filePath} (${mode})`);
        }
        for (const mod of modifications) {
            const filePath = path.join(projectDir, mod.path);
            if (!fs.existsSync(filePath))
                continue;
            let fileContent = await fs.readFile(filePath, "utf8");
            const updatedContent = mod?.isHandlebarsTemplate ? replaceSafeVariables(mod.content, payload) : mod.content;
            if (mod.mode === "prepend") {
                fileContent = updatedContent + "\n" + fileContent;
            }
            else if (mod.mode === "append") {
                fileContent = fileContent + "\n" + updatedContent;
            }
            await fs.writeFile(filePath, fileContent, "utf8");
            console.log(chalk.green(`✅ Updated: ${filePath} (${mod.mode})`));
        }
        console.log(chalk.blue(`🎉 Modifications applied successfully for "${pluginName}"`));
    }
    catch (error) {
        console.error(chalk.red(`❌ Error while modifying files: ${error.message}`));
    }
}
function replaceSafeVariables(content, variables) {
    try {
        return Handlebars.compile(content)(variables);
    }
    catch (error) {
        console.error(chalk.red(`❌ Error while replacing variables: ${error.message}`));
        return content;
    }
}
//# sourceMappingURL=modifications.js.map