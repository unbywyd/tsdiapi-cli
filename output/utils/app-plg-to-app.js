"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPluginToApp = addPluginToApp;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const util_1 = __importDefault(require("util"));
const child_process_1 = require("child_process");
const ts_morph_1 = require("ts-morph");
const execAsync = util_1.default.promisify(child_process_1.exec);
async function addPluginToApp(filePath, pluginName, pluginImportPath, projectDir) {
    const spinner = (0, ora_1.default)().start();
    try {
        spinner.text = chalk_1.default.blue(`📦 Installing ${chalk_1.default.bold(pluginImportPath)}...`);
        await execAsync(`npm install ${pluginImportPath}`, { cwd: projectDir });
        spinner.succeed(chalk_1.default.green(`✅ Installed ${chalk_1.default.bold(pluginImportPath)} successfully!`));
        spinner.text = chalk_1.default.blue("🔍 Updating application entry file...");
        const project = new ts_morph_1.Project();
        const sourceFile = project.addSourceFileAtPath(filePath);
        // Check if import already exists
        const existingImport = sourceFile.getImportDeclaration((imp) => imp.getModuleSpecifier().getLiteralValue() === pluginImportPath);
        if (existingImport) {
            spinner.warn(chalk_1.default.yellow(`⚠️ Plugin ${pluginName} is already imported. Skipping.`));
            return false;
        }
        // Add import statement
        sourceFile.addImportDeclaration({
            defaultImport: pluginName,
            moduleSpecifier: pluginImportPath,
        });
        // Locate `createApp` function
        const createAppCall = sourceFile
            .getFirstDescendantByKind(ts_morph_1.SyntaxKind.CallExpression)
            ?.getFirstChildByKind(ts_morph_1.SyntaxKind.Identifier);
        if (createAppCall?.getText() === "createApp") {
            const createAppExpression = createAppCall.getParentIfKind(ts_morph_1.SyntaxKind.CallExpression);
            const argument = createAppExpression?.getArguments()[0];
            if (argument?.getKind() === ts_morph_1.SyntaxKind.ObjectLiteralExpression) {
                const argumentObject = argument.asKindOrThrow(ts_morph_1.SyntaxKind.ObjectLiteralExpression);
                const pluginsProperty = argumentObject.getProperty("plugins");
                if (pluginsProperty) {
                    const pluginsArray = pluginsProperty.getFirstChildByKind(ts_morph_1.SyntaxKind.ArrayLiteralExpression);
                    if (pluginsArray) {
                        if (pluginsArray.getText().includes(pluginName)) {
                            spinner.warn(chalk_1.default.yellow(`⚠️ Plugin ${pluginName} is already registered. Skipping.`));
                            return false;
                        }
                        pluginsArray.addElement(`${pluginName}()`);
                    }
                    else {
                        spinner.fail(chalk_1.default.red("❌ Failed to locate 'plugins' array in createApp."));
                        return false;
                    }
                }
                else {
                    argumentObject.addPropertyAssignment({
                        name: "plugins",
                        initializer: `[${pluginName}()]`,
                    });
                }
            }
            else {
                createAppExpression?.addArgument(`{ plugins: [${pluginName}()] }`);
            }
        }
        else {
            spinner.fail(chalk_1.default.red("❌ Failed to find 'createApp' function in main file."));
            return false;
        }
        sourceFile.saveSync();
        spinner.succeed(chalk_1.default.green(`✅ Plugin ${chalk_1.default.bold(pluginName)} successfully added to createApp!`));
        return true;
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`❌ Error: ${error.message}`));
        return false;
    }
}
//# sourceMappingURL=app-plg-to-app.js.map