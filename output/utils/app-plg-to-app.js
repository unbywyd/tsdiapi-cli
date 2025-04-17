import chalk from "chalk";
import ora from "ora";
import util from 'util';
import { exec } from 'child_process';
import { Project, SyntaxKind } from "ts-morph";
import { addSafeImport } from "./import-utils.js";
import { getPluginMetadata } from "./plg-metadata.js";
const execAsync = util.promisify(exec);
export async function addPluginToApp(filePath, pluginName, pluginImportPath, projectDir) {
    const spinner = ora().start();
    try {
        spinner.text = chalk.blue(`📦 Installing ${chalk.bold(pluginImportPath)}...`);
        await execAsync(`npm install ${pluginImportPath}`, { cwd: projectDir });
        spinner.succeed(chalk.green(`✅ Installed ${chalk.bold(pluginImportPath)} successfully!`));
        spinner.text = chalk.blue("🔍 Updating application entry file...");
        const project = new Project();
        const sourceFile = project.addSourceFileAtPath(filePath);
        const config = await getPluginMetadata(projectDir, pluginImportPath);
        // Get plugin registration details from config if available
        const registration = config?.registration;
        const pluginImportName = registration?.pluginImportName || pluginName;
        const pluginArgs = registration?.pluginArgs || '';
        const additionalImports = registration?.imports || [];
        // Add additional imports if any
        for (const importStatement of additionalImports) {
            addSafeImport(sourceFile, importStatement);
        }
        // Check if import already exists
        const existingImport = sourceFile.getImportDeclaration((imp) => imp.getModuleSpecifier().getLiteralValue() === pluginImportPath);
        if (existingImport) {
            spinner.warn(chalk.yellow(`⚠️ Plugin ${pluginImportName} is already imported. Skipping.`));
            return false;
        }
        // Add import statement
        sourceFile.addImportDeclaration({
            defaultImport: pluginImportName,
            moduleSpecifier: pluginImportPath,
        });
        // Locate `createApp` function
        const createAppCall = sourceFile
            .getFirstDescendantByKind(SyntaxKind.CallExpression)
            ?.getFirstChildByKind(SyntaxKind.Identifier);
        if (createAppCall?.getText() === "createApp") {
            const createAppExpression = createAppCall.getParentIfKind(SyntaxKind.CallExpression);
            const argument = createAppExpression?.getArguments()[0];
            if (argument?.getKind() === SyntaxKind.ObjectLiteralExpression) {
                const argumentObject = argument.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
                const pluginsProperty = argumentObject.getProperty("plugins");
                if (pluginsProperty) {
                    const pluginsArray = pluginsProperty.getFirstChildByKind(SyntaxKind.ArrayLiteralExpression);
                    if (pluginsArray) {
                        if (pluginsArray.getText().includes(pluginImportName)) {
                            spinner.warn(chalk.yellow(`⚠️ Plugin ${pluginImportName} is already registered. Skipping.`));
                            return false;
                        }
                        // Add plugin with arguments if provided
                        pluginsArray.addElement(pluginArgs ? `${pluginImportName}(${pluginArgs})` : `${pluginImportName}()`);
                    }
                    else {
                        spinner.fail(chalk.red("❌ Failed to locate 'plugins' array in createApp."));
                        return false;
                    }
                }
                else {
                    // Add plugins property with the plugin and its arguments
                    argumentObject.addPropertyAssignment({
                        name: "plugins",
                        initializer: pluginArgs ? `[${pluginImportName}(${pluginArgs})]` : `[${pluginImportName}()]`,
                    });
                }
            }
            else {
                // Add new argument with plugins array
                createAppExpression?.addArgument(pluginArgs
                    ? `{ plugins: [${pluginImportName}(${pluginArgs})] }`
                    : `{ plugins: [${pluginImportName}()] }`);
            }
        }
        else {
            spinner.fail(chalk.red("❌ Failed to find 'createApp' function in main file."));
            return false;
        }
        sourceFile.saveSync();
        spinner.succeed(chalk.green(`✅ Plugin ${chalk.bold(pluginImportName)} successfully added to createApp!`));
        return true;
    }
    catch (error) {
        spinner.fail(chalk.red(`❌ Error: ${error.message}`));
        return false;
    }
}
//# sourceMappingURL=app-plg-to-app.js.map