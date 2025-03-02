import chalk from "chalk";
import ora from "ora";
import util from 'util'
import { exec } from 'child_process'
import { Project, SyntaxKind } from "ts-morph";
const execAsync = util.promisify(exec)

export async function addPluginToApp(
    filePath: string,
    pluginName: string,
    pluginImportPath: string,
    projectDir: string
): Promise<boolean> {
    const spinner = ora().start();
    try {
        spinner.text = chalk.blue(`📦 Installing ${chalk.bold(pluginImportPath)}...`);
        await execAsync(`npm install ${pluginImportPath}`, { cwd: projectDir });
        spinner.succeed(chalk.green(`✅ Installed ${chalk.bold(pluginImportPath)} successfully!`));

        spinner.text = chalk.blue("🔍 Updating application entry file...");
        const project = new Project();
        const sourceFile = project.addSourceFileAtPath(filePath);

        // Check if import already exists
        const existingImport = sourceFile.getImportDeclaration(
            (imp) => imp.getModuleSpecifier().getLiteralValue() === pluginImportPath
        );

        if (existingImport) {
            spinner.warn(chalk.yellow(`⚠️ Plugin ${pluginName} is already imported. Skipping.`));
            return false;
        }

        // Add import statement
        sourceFile.addImportDeclaration({
            defaultImport: pluginName,
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
                        if (pluginsArray.getText().includes(pluginName)) {
                            spinner.warn(chalk.yellow(`⚠️ Plugin ${pluginName} is already registered. Skipping.`));
                            return false;
                        }
                        pluginsArray.addElement(`${pluginName}()`);
                    } else {
                        spinner.fail(chalk.red("❌ Failed to locate 'plugins' array in createApp."));
                        return false;
                    }
                } else {
                    argumentObject.addPropertyAssignment({
                        name: "plugins",
                        initializer: `[${pluginName}()]`,
                    });
                }
            } else {
                createAppExpression?.addArgument(`{ plugins: [${pluginName}()] }`);
            }
        } else {
            spinner.fail(chalk.red("❌ Failed to find 'createApp' function in main file."));
            return false;
        }

        sourceFile.saveSync();
        spinner.succeed(chalk.green(`✅ Plugin ${chalk.bold(pluginName)} successfully added to createApp!`));

        return true;
    } catch (error: any) {
        spinner.fail(chalk.red(`❌ Error: ${error.message}`));
        return false;
    }
}


