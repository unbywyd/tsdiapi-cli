
import { getPackageName } from './../config';
import chalk from "chalk"
import { findTSDIAPIServerProject, getPluginMetadata, isPackageInstalled } from "./plugins"
import inquirer from "inquirer";
import fs from "fs-extra";
import { toCamelCase, toKebabCase, toLowerCase, toPascalCase } from "./format";
import path from "path";
import { glob } from "glob";
import { PluginGenerator } from './plugins-configuration';
import { buildHandlebarsTemplate, buildHandlebarsTemplateWithPath, devBuildHandlebarsTemplate } from './hbs';
import { isDirectoryPath, resolveTargetDirectory } from './cwd';
import { packageExistsOnNpm } from './npm';
import ora from 'ora';
import { spawn, exec } from 'child_process'
import util from 'util'
async function loadBoxen() {
    return (await eval('import("boxen")')).default;
}

const execAsync = util.promisify(exec)

export async function promptPluginDetails(sourcePluginName: string) {
    try {
        const pluginName = toLowerCase(sourcePluginName);
        const regexp = /^[a-z0-9-]+$/;
        const minLen = 3;
        const maxLen = 50;
        if (!regexp.test(pluginName)) {
            console.log(chalk.red(`\n❌ Invalid plugin name: ${pluginName}. Plugin name must be lowercase and contain only letters, numbers, and hyphens.\n`));
            return;
        }
        if (pluginName.length < minLen || pluginName.length > maxLen) {
            console.log(chalk.red(`\n❌ Invalid plugin name: ${pluginName}. Plugin name must be between ${minLen} and ${maxLen} characters.\n`));
            return;
        }
        const nonAcceptablePluginNames = ["feature", "controller", "service", "middleware", "plugin"];	
        if(nonAcceptablePluginNames.includes(pluginName)) {
            console.log(chalk.red(`\n❌ Invalid plugin name: ${pluginName}. Plugin name must not be one of the following: ${nonAcceptablePluginNames.join(", ")}.\n`));
            return;
        }
        const pluginFullName = pluginName.startsWith('tsdiapi') ? pluginName : 'tsdiapi-' + pluginName;
        const pluginDir = path.join(process.cwd(), pluginFullName);
        if (fs.existsSync(pluginDir)) {
            console.log(chalk.red(`\n❌ Plugin directory already exists: ${pluginDir}. Please choose a different name.\n`));
            return;
        }

        const packageName = getPackageName(pluginName);

        const isExists = await packageExistsOnNpm(packageName, true);
        if (isExists) {
            console.log(chalk.red(`\n❌ Plugin package already exists on npm: ${packageName}. Please choose a different name.\n`));
            return;
        }


        console.log(chalk.cyan(`\n🔧 Configuring plugin: ${chalk.bold(pluginName)}\n`));
        const answers = await inquirer.prompt([
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


        await fs.ensureDir(pluginDir);

        console.log(chalk.cyan("\n📦 Creating plugin files...\n"));
        const sourceDir = path.resolve(__dirname, "../dev/project/copy");
        await fs.copy(sourceDir, pluginDir);

        console.log(chalk.cyan("\n📦 Creating package.json file...\n"));
        const packageData = devBuildHandlebarsTemplate("project/package.hbs", {
            name: pluginName,
            ...answers
        });
        await fs.writeFile(path.join(pluginDir, "package.json"), packageData);

        await installDependencies(pluginDir);
        const packageJsonPath = path.join(pluginDir, "package.json");
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        pkg.peerDependencies = pkg.dependencies;
        delete pkg.dependencies;
        fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));


        // README.hbs
        console.log(chalk.cyan("\n📦 Creating README.md file...\n"))
        const readmeData = devBuildHandlebarsTemplate("project/README.hbs", {
            name: pluginName,
            ...answers
        });
        await fs.writeFile(path.join(pluginDir, "README.md"), readmeData);

        // index.ts
        console.log(chalk.cyan("\n📦 Creating index.ts file...\n"));
        const indexData = devBuildHandlebarsTemplate("project/index.hbs", {
            name: pluginName,
            ...answers
        });
        await fs.ensureDir(path.join(pluginDir, "src"));
        await fs.writeFile(path.join(pluginDir, "src/index.ts"), indexData);

        const configData = {
            name: pluginFullName,
            description: answers.description,
        }
        const configName = "tsdiapi.config.json";
        const configPath = path.join(pluginDir, configName);
        if (!fs.existsSync(configPath)) {
            console.log(chalk.cyan(`Creating ${configName} file...`));
            await fs.writeFile(configPath, JSON.stringify(configData, null, 2));
        }


        const message = `
${chalk.yellow.bold('🚀 Congratulations! Your TSDIAPI plugin has been successfully created!')}

${chalk.green('🎯 You are now part of the TSDIAPI development community!')}
${chalk.green('💡 Your plugin can extend TSDIAPI with new features, automation, and more.')}

${chalk.cyan('🔧 To start working on your plugin, explore the generated files and documentation.')}
${chalk.cyan('📖 Refer to the official TSDIAPI documentation for best practices.')}

${chalk.blue.bold('📢 Want to publish your plugin?')}
- To publish your plugin on npm under the official @tsdiapi scope:
  ✅ Ensure your plugin follows TSDIAPI’s best practices.
  ✅ Contact me to be added as a maintainer for npm publishing.
  ✅ Once approved, your plugin will be publicly available!

${chalk.gray('────────────────────────────────────────────')}
${chalk.gray('💡 Questions, feedback, or need approval for publishing?')}
${chalk.cyan('📧 Contact:')} ${chalk.white('unbywyd@gmail.com')}
`;

        const boxen = await loadBoxen();
        console.log(boxen(message, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'yellow'
        }));

        console.log(chalk.green("\n🎉 Plugin successfully configured! Wishing you success in development! 🚀\n"));
    } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
    }
}


export async function installDependencies(projectDir: string) {
    console.log(chalk.blue("\n📦 Installing base dependencies...\n"));

    const devDependencies = [
        "@tsdiapi/server", "@types/node", "typescript"
    ];

    const peerDependencies = [
        "reflect-metadata", "typedi"
    ];

    const spinner = ora({
        text: chalk.yellow("⏳ Installing dev dependencies..."),
        spinner: "dots"
    }).start();

    try {
        await execAsync(`npm install -D ${devDependencies.join(" ")}`, { cwd: projectDir });
        spinner.succeed(chalk.green("✅ Dev dependencies installed!"));

        spinner.text = chalk.yellow("🔗 Installing peer dependencies...");
        spinner.start();

        await execAsync(`npm install ${peerDependencies.join(" ")}`, { cwd: projectDir });
        spinner.succeed(chalk.green("✅ Peer dependencies installed!"));

        console.log(chalk.blue("\n🚀 Setup complete! Your project is now ready to go.\n"));
    } catch (error: any) {
        spinner.fail(chalk.red("❌ Installation failed!"));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
    }
}