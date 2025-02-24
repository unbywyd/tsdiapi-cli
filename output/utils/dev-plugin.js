"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptPluginDetails = promptPluginDetails;
exports.installDependencies = installDependencies;
const config_1 = require("./../config");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const format_1 = require("./format");
const path_1 = __importDefault(require("path"));
const hbs_1 = require("./hbs");
const npm_1 = require("./npm");
const ora_1 = __importDefault(require("ora"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
async function loadBoxen() {
    return (await eval('import("boxen")')).default;
}
const execAsync = util_1.default.promisify(child_process_1.exec);
async function promptPluginDetails(sourcePluginName) {
    try {
        const pluginName = (0, format_1.toLowerCase)(sourcePluginName);
        const regexp = /^[a-z0-9-]+$/;
        const minLen = 3;
        const maxLen = 50;
        if (!regexp.test(pluginName)) {
            console.log(chalk_1.default.red(`\n❌ Invalid plugin name: ${pluginName}. Plugin name must be lowercase and contain only letters, numbers, and hyphens.\n`));
            return;
        }
        if (pluginName.length < minLen || pluginName.length > maxLen) {
            console.log(chalk_1.default.red(`\n❌ Invalid plugin name: ${pluginName}. Plugin name must be between ${minLen} and ${maxLen} characters.\n`));
            return;
        }
        const pluginDir = path_1.default.join(process.cwd(), pluginName);
        if (fs_extra_1.default.existsSync(pluginDir)) {
            console.log(chalk_1.default.red(`\n❌ Plugin directory already exists: ${pluginDir}. Please choose a different name.\n`));
            return;
        }
        const packageName = (0, config_1.getPackageName)(pluginName);
        const isExists = await (0, npm_1.packageExistsOnNpm)(packageName, true);
        if (isExists) {
            console.log(chalk_1.default.red(`\n❌ Plugin package already exists on npm: ${packageName}. Please choose a different name.\n`));
            return;
        }
        console.log(chalk_1.default.cyan(`\n🔧 Configuring plugin: ${chalk_1.default.bold(pluginName)}\n`));
        const answers = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "description",
                message: "📜 Enter a brief description of the plugin:",
                default: `A TSDIAPI plugin to extend API functionality with ${pluginName}.`
            },
            {
                type: "input",
                name: "author",
                message: "👤 Author (leave empty if not needed):",
                default: ""
            },
            {
                type: "input",
                name: "giturl",
                message: "🔗 GitHub repository URL (leave empty if not needed):",
                default: ""
            },
            {
                type: "confirm",
                name: "withBootstrapFiles",
                message: "⚙️ Should this plugin support automatic file loading?",
                default: true
            }
        ]);
        await fs_extra_1.default.ensureDir(pluginDir);
        console.log(chalk_1.default.cyan("\n📦 Creating plugin files...\n"));
        const sourceDir = path_1.default.resolve(__dirname, "../dev/project/copy");
        await fs_extra_1.default.copy(sourceDir, pluginDir);
        console.log(chalk_1.default.cyan("\n📦 Creating package.json file...\n"));
        const packageData = (0, hbs_1.devBuildHandlebarsTemplate)("project/package.hbs", {
            name: pluginName,
            ...answers
        });
        await fs_extra_1.default.writeFile(path_1.default.join(pluginDir, "package.json"), packageData);
        await installDependencies(pluginDir);
        const packageJsonPath = path_1.default.join(pluginDir, "package.json");
        const pkg = JSON.parse(fs_extra_1.default.readFileSync(packageJsonPath, "utf-8"));
        pkg.peerDependencies = pkg.dependencies;
        delete pkg.dependencies;
        fs_extra_1.default.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
        // README.hbs
        console.log(chalk_1.default.cyan("\n📦 Creating README.md file...\n"));
        const readmeData = (0, hbs_1.devBuildHandlebarsTemplate)("project/README.hbs", {
            name: pluginName,
            ...answers
        });
        await fs_extra_1.default.writeFile(path_1.default.join(pluginDir, "README.md"), readmeData);
        // index.ts
        console.log(chalk_1.default.cyan("\n📦 Creating index.ts file...\n"));
        const indexData = (0, hbs_1.devBuildHandlebarsTemplate)("project/index.hbs", {
            name: pluginName,
            ...answers
        });
        await fs_extra_1.default.ensureDir(path_1.default.join(pluginDir, "src"));
        await fs_extra_1.default.writeFile(path_1.default.join(pluginDir, "src/index.ts"), indexData);
        const configData = {
            name: pluginName,
            description: answers.description,
        };
        const configName = "tsdiapi.config.ts";
        const configPath = path_1.default.join(pluginDir, configName);
        if (!fs_extra_1.default.existsSync(configPath)) {
            console.log(chalk_1.default.cyan(`Creating ${configName} file...`));
            await fs_extra_1.default.writeFile(configPath, JSON.stringify(configData, null, 2));
        }
        const message = `
${chalk_1.default.yellow.bold('🚀 Congratulations! Your TSDIAPI plugin has been successfully created!')}

${chalk_1.default.green('🎯 You are now part of the TSDIAPI development community!')}
${chalk_1.default.green('💡 Your plugin can extend TSDIAPI with new features, automation, and more.')}

${chalk_1.default.cyan('🔧 To start working on your plugin, explore the generated files and documentation.')}
${chalk_1.default.cyan('📖 Refer to the official TSDIAPI documentation for best practices.')}

${chalk_1.default.blue.bold('📢 Want to publish your plugin?')}
- To publish your plugin on npm under the official @tsdiapi scope:
  ✅ Ensure your plugin follows TSDIAPI’s best practices.
  ✅ Contact me to be added as a maintainer for npm publishing.
  ✅ Once approved, your plugin will be publicly available!

${chalk_1.default.gray('────────────────────────────────────────────')}
${chalk_1.default.gray('💡 Questions, feedback, or need approval for publishing?')}
${chalk_1.default.cyan('📧 Contact:')} ${chalk_1.default.white('unbywyd@gmail.com')}
`;
        const boxen = await loadBoxen();
        console.log(boxen(message, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'yellow'
        }));
        console.log(chalk_1.default.green("\n🎉 Plugin successfully configured! Wishing you success in development! 🚀\n"));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
    }
}
async function installDependencies(projectDir) {
    console.log(chalk_1.default.blue("\n📦 Installing base dependencies...\n"));
    const devDependencies = [
        "@tsdiapi/server", "@types/node", "typescript"
    ];
    const peerDependencies = [
        "reflect-metadata", "typedi"
    ];
    const spinner = (0, ora_1.default)({
        text: chalk_1.default.yellow("⏳ Installing dev dependencies..."),
        spinner: "dots"
    }).start();
    try {
        await execAsync(`npm install -D ${devDependencies.join(" ")}`, { cwd: projectDir });
        spinner.succeed(chalk_1.default.green("✅ Dev dependencies installed!"));
        spinner.text = chalk_1.default.yellow("🔗 Installing peer dependencies...");
        spinner.start();
        await execAsync(`npm install ${peerDependencies.join(" ")}`, { cwd: projectDir });
        spinner.succeed(chalk_1.default.green("✅ Peer dependencies installed!"));
        console.log(chalk_1.default.blue("\n🚀 Setup complete! Your project is now ready to go.\n"));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red("❌ Installation failed!"));
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
//# sourceMappingURL=dev-plugin.js.map