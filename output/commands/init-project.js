import chalk from "chalk";
import inquirer from "inquirer";
import path from "path";
import fs from "fs-extra";
import ora from 'ora';
import figlet from "figlet";
import boxen from "boxen";
import { pastel } from "gradient-string";
import { getCdCommand, isDirSuitableToNewProject, isPathSuitableToNewProject } from '../utils/cwd.js';
import { installBaseDependencies, runUnsafeNpmScript } from '../utils/npm.js';
import { DefaultHost } from '../config.js';
import { DefaultPort } from "../config.js";
import { generateFeature } from './generate.js';
import { buildHandlebarsTemplate } from '../utils/handlebars.js';
import { findTSDIAPIServerProject } from '../utils/app-finder.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function startFastProject(projectDir) {
    try {
        if (!fs.existsSync(projectDir)) {
            console.error(chalk.red("❌ Project directory does not exist:", projectDir));
            process.exit(1);
        }
        console.log(chalk.yellow("⚡ Starting fast development mode..."));
        await runUnsafeNpmScript(projectDir, "fast-dev");
    }
    catch (error) {
        console.error(chalk.red("❌ An unexpected error occurred during project initialization."), error.message);
    }
}
export async function initProject(_installpath, options) {
    try {
        let installpath = _installpath;
        if (options?.startMode) {
            const cwd = path.resolve(process.cwd(), installpath);
            const currentDirectory = await findTSDIAPIServerProject(cwd);
            if (currentDirectory) {
                console.log(chalk.green(`🎯 Found existing TSDIAPI project at: ${chalk.bold(currentDirectory)}`));
                await startFastProject(currentDirectory);
                return;
            }
        }
        console.log(pastel.multiline(figlet.textSync("TSDIAPI", { horizontalLayout: "full" })));
        console.log(chalk.yellow("\n✨ Welcome to the TSDIAPI project initializer!\n"));
        const questions = [];
        // 📌 Шаг 3: Проверяем путь
        let projectDir = isPathSuitableToNewProject(installpath);
        if (!projectDir) {
            return process.exit(1);
        }
        const dirAvailable = isDirSuitableToNewProject(installpath);
        if (!dirAvailable) {
            console.log(chalk.red(`❌ Error: Directory "${projectDir}" is not empty.`));
            try {
                const { newDir } = await inquirer.prompt([{
                        type: "input",
                        name: "newDir",
                        message: "📁 Enter a new directory name:",
                        validate: async (input) => {
                            return isDirSuitableToNewProject(input) ? true : "❌ Directory is not empty or invalid.";
                        }
                    }]);
                installpath = newDir;
                console.log(chalk.yellow(`📁 Using new directory: ${installpath}`));
                projectDir = path.resolve(process.cwd(), newDir);
            }
            catch (error) {
                console.error(chalk.red("❌ An unexpected error occurred during project initialization."), error.message);
                process.exit(1);
            }
        }
        let projectName = path.basename(projectDir);
        options.name = projectName;
        if (!options?.skipAll) {
            questions.push({
                type: "input",
                name: "name",
                message: "📦 Project name:",
                default: projectName,
                validate: (input) => input ? true : "❌ Project name is required."
            });
            questions.push({
                type: "input",
                name: "host",
                message: "🌍 Host:",
                default: DefaultHost,
                validate: (input) => input ? true : "❌ Host is required."
            });
            questions.push({
                type: "number",
                name: "port",
                message: "🔌 Port:",
                default: DefaultPort,
                validate: (input) => (input >= 1 && input <= 65535) ? true : "❌ Port must be between 1 and 65535."
            });
        }
        const answers = questions.length ? await inquirer.prompt(questions) : {
            ...options,
            name: projectName,
            port: DefaultPort,
            host: DefaultHost
        };
        answers.name = answers.name || projectName;
        answers.host = answers.host || DefaultHost;
        if (options) {
            for (const [key, value] of Object.entries(options)) {
                if (value !== undefined) {
                    answers[key] = value;
                }
            }
        }
        if (!answers.port) {
            answers.port = DefaultPort;
        }
        // 🏗️ Шаг 5: Генерация файлов
        const spinner = ora({
            text: chalk.blue(`💾 Setting up project at ${chalk.bold(projectDir)}...`),
            spinner: "dots"
        }).start();
        await installation(projectDir, answers);
        spinner.succeed(chalk.green("Project files generated successfully!"));
        // 🎯 Шаг 7: Финальный вывод
        const cdCommand = getCdCommand(installpath);
        console.log(chalk.green("\n🎉 Project successfully initialized!\n"));
        try {
            const { newFeatureAccepted } = await inquirer.prompt([{
                    type: "confirm",
                    name: "newFeatureAccepted",
                    message: "🚀 Do you want to create a new feature?",
                    default: false
                }]);
            if (newFeatureAccepted) {
                const { featureName } = await inquirer.prompt([{
                        type: "input",
                        name: "featureName",
                        message: "🚀 Enter the name of the feature:",
                        validate: (input) => input ? true : "❌ Feature name is required."
                    }]);
                await generateFeature(featureName, projectDir, true);
            }
        }
        catch (error) {
            console.error(chalk.red("❌ An unexpected error occurred during project initialization."), error.message);
        }
        const message = `
        ${chalk.yellow.bold('📦 Need more functionality? Extend your server with TSDIAPI plugins!')}
        
        ${chalk.cyan('◆')} Supports ${chalk.green('Prisma, Email, Sockets, Cron Jobs, and more.')}.
        ${chalk.cyan('◆')} Fully automated setup for easy integration.
        ${chalk.cyan('◆')} Just install with: ${chalk.cyan.bold('tsdiapi plugins add <pluginName>')}
        ${chalk.cyan('◆')} Or manually configure: ${chalk.cyan.bold('tsdiapi plugins config <pluginName>')}
        
        ${chalk.blue.bold('🌐 Explore all available plugins here:')} ${chalk.blue('https://www.npmjs.com/search?q=@tsdiapi')}
        
        ${chalk.magenta.bold('✨ More plugins coming soon!')}
        
        ${chalk.gray('────────────────────────────────────────────')}
        ${chalk.gray('💡 Want to contribute or ask something?')}
        ${chalk.cyan('📧 Contact:')} ${chalk.white('unbywyd@gmail.com')}
        `;
        console.log(boxen(message, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'blue'
        }));
        if (!options?.startMode) {
            console.log(chalk.yellow("📌 Next steps:"));
            if (cdCommand) {
                console.log(`🔹 ${chalk.cyan(`${cdCommand}`)}`);
            }
            console.log(`🔹 ${chalk.cyan("npm run dev")}`);
        }
        console.log(chalk.green("\n🚀 Happy coding with TSDIAPI!\n"));
        // 🚀 Шаг 8: Запуск в быстром режиме (если выбрано)
        if (options?.startMode) {
            await startFastProject(projectDir);
        }
    }
    catch (error) {
        console.error(chalk.red("❌ An unexpected error occurred during project initialization."), error.message);
        process.exit(1);
    }
}
export async function installation(projectDir, options) {
    console.log(chalk.blue("\n🛠️ Initializing project structure...\n"));
    const spinner = ora({
        text: chalk.yellow("🚀 Copying base project files..."),
        spinner: "dots"
    }).start();
    try {
        const sourceDir = path.resolve(__dirname, "../files/root");
        await fs.copy(sourceDir, projectDir);
        spinner.succeed(chalk.green("Project files copied successfully!"));
        const payload = {
            ...options,
            port: options.port || DefaultPort,
        };
        const envFiles = [
            { path: ".env.development", isProduction: false },
            { path: ".env.production", isProduction: true },
        ];
        for (const env of envFiles) {
            const envPath = path.join(projectDir, env.path);
            const envContent = buildHandlebarsTemplate("env", { ...payload, isProduction: env.isProduction });
            if (envContent) {
                await fs.writeFile(envPath, envContent);
            }
        }
        // 📦 Генерация package.json
        const packagePath = path.join(projectDir, "package.json");
        const packageContent = buildHandlebarsTemplate("package", payload);
        if (packageContent) {
            await fs.writeFile(packagePath, packageContent);
        }
        const gitignore = `
node_modules
# Keep environment variables out of version control
#.env
#.env.development
#.env.production

dist
logs/*  
`;
        await fs.writeFile(path.join(projectDir, ".gitignore"), gitignore);
        // 📂 Создание нужных директорий
        await fs.ensureDir(path.join(projectDir, "src/api/features"));
        await fs.ensureDir(path.join(projectDir, "src/public"));
        // 🏡 Главная страница
        const homePagePath = path.join(projectDir, "src/public/index.html");
        const homePageContent = buildHandlebarsTemplate("home", payload);
        if (homePageContent) {
            await fs.writeFile(homePagePath, homePageContent);
        }
        // ⚙️ Конфигурация приложения
        const appConfigPath = path.join(projectDir, "src/app.config.ts");
        const appConfigContent = buildHandlebarsTemplate("app_config", payload);
        if (appConfigContent) {
            await fs.writeFile(appConfigPath, appConfigContent);
        }
        // 🏗 Основной файл
        const mainPath = path.join(projectDir, "src/main.ts");
        const mainContent = buildHandlebarsTemplate("main", payload);
        if (mainContent) {
            await fs.writeFile(mainPath, mainContent);
        }
        await installBaseDependencies(projectDir);
    }
    catch (error) {
        spinner.fail(chalk.red("❌ Error during project setup!"));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
//# sourceMappingURL=init-project.js.map