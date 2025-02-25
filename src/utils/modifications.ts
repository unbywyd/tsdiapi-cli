import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { PluginFileModification } from './plugins-configuration';


export async function fileModifications(pluginName: string, projectDir: string, modifications: Array<PluginFileModification>): Promise<void> {
    try {
        const pendingChanges: Array<{ filePath: string; mode: string; plugin: string }> = [];

        for (const mod of modifications) {
            const filePath = path.join(projectDir, mod.path);
            if (!fs.existsSync(filePath)) {
                console.log(chalk.yellow(`⚠️ Skipping ${filePath} (File not found)`));
                continue;
            }

            const fileContent = await fs.readFile(filePath, "utf8");
            const regex = new RegExp(mod.match, "g");

            const matchFound = regex.test(fileContent);

            if (mod.expected !== undefined && matchFound !== mod.expected) {
                console.log(
                    chalk.yellow(
                        `⚠️ Skipping modification for ${filePath} (Expected match condition not met)`
                    )
                );
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
            if (!fs.existsSync(filePath)) continue;

            let fileContent = await fs.readFile(filePath, "utf8");

            if (mod.mode === "prepend") {
                fileContent = mod.content + "\n" + fileContent;
            } else if (mod.mode === "append") {
                fileContent = fileContent + "\n" + mod.content;
            }

            await fs.writeFile(filePath, fileContent, "utf8");
            console.log(chalk.green(`✅ Updated: ${filePath} (${mod.mode})`));
        }

        console.log(chalk.blue(`🎉 Modifications applied successfully for "${pluginName}"`));

    } catch (error) {
        console.error(chalk.red(`❌ Error while modifying files: ${error.message}`));
    }
}