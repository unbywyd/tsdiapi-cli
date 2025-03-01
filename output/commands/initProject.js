"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFastProject = startFastProject;
exports.initProject = initProject;
exports.installation = installation;
const cwd_1 = require("../utils/cwd");
const npm_1 = require("../utils/npm");
const config_1 = require("./../config");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const config_2 = require("../config");
const plugins_1 = require("../utils/plugins");
const ora_1 = __importDefault(require("ora"));
const figlet_1 = __importDefault(require("figlet"));
const hbs_1 = require("../utils/hbs");
const generate_1 = require("../utils/generate");
async function loadGradient() {
    return (await eval('import("gradient-string")')).default;
}
async function loadBoxen() {
    return (await eval('import("boxen")')).default;
}
async function startFastProject(projectDir) {
    try {
        if (!fs_extra_1.default.existsSync(projectDir)) {
            console.error(chalk_1.default.red("❌ Project directory does not exist:", projectDir));
            process.exit(1);
        }
        console.log(chalk_1.default.yellow("⚡ Starting fast development mode..."));
        await (0, npm_1.runUnsafeNpmScript)(projectDir, "fast-dev");
    }
    catch (error) {
        console.error(chalk_1.default.red("❌ An unexpected error occurred during project initialization."), error.message);
    }
}
async function initProject(installpath, options) {
    try {
        if (options?.startMode) {
            const cwd = path_1.default.resolve(process.cwd(), installpath);
            const currentDirectory = await (0, plugins_1.findTSDIAPIServerProject)(cwd);
            if (currentDirectory) {
                console.log(chalk_1.default.green(`🎯 Found existing TSDIAPI project at: ${chalk_1.default.bold(currentDirectory)}`));
                await startFastProject(currentDirectory);
                return;
            }
        }
        const gradient = await loadGradient();
        console.log(gradient.pastel.multiline(figlet_1.default.textSync("TSDIAPI", { horizontalLayout: "full" })));
        console.log(chalk_1.default.yellow("\n✨ Welcome to the TSDIAPI project initializer!\n"));
        const questions = [];
        // 📌 Шаг 3: Проверяем путь
        const projectDir = (0, cwd_1.isPathSuitableToNewProject)(installpath);
        if (!projectDir) {
            return process.exit(1);
        }
        let projectName = path_1.default.basename(projectDir);
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
                default: config_1.DefaultHost,
                validate: (input) => input ? true : "❌ Host is required."
            });
            questions.push({
                type: "number",
                name: "port",
                message: "🔌 Port:",
                default: config_2.DefaultPort,
                validate: (input) => (input >= 1 && input <= 65535) ? true : "❌ Port must be between 1 and 65535."
            });
        }
        const answers = questions.length ? await inquirer_1.default.prompt(questions) : {
            ...options,
            name: projectName,
            port: config_2.DefaultPort,
            host: config_1.DefaultHost
        };
        answers.name = answers.name || projectName;
        answers.host = answers.host || config_1.DefaultHost;
        if (options) {
            for (const [key, value] of Object.entries(options)) {
                if (value !== undefined) {
                    answers[key] = value;
                }
            }
        }
        if (!answers.port) {
            answers.port = config_2.DefaultPort;
        }
        // 🏗️ Шаг 5: Генерация файлов
        const spinner = (0, ora_1.default)({
            text: chalk_1.default.blue(`💾 Setting up project at ${chalk_1.default.bold(projectDir)}...`),
            spinner: "dots"
        }).start();
        await installation(projectDir, answers);
        spinner.succeed(chalk_1.default.green("✅ Project files generated successfully!"));
        // 🎯 Шаг 7: Финальный вывод
        const cdCommand = (0, cwd_1.getCdCommand)(installpath);
        console.log(chalk_1.default.green("\n🎉 Project successfully initialized!\n"));
        try {
            const { newFeatureAccepted } = await inquirer_1.default.prompt([{
                    type: "confirm",
                    name: "newFeatureAccepted",
                    message: "🚀 Do you want to create a new feature?",
                    default: false
                }]);
            if (newFeatureAccepted) {
                const { featureName } = await inquirer_1.default.prompt([{
                        type: "input",
                        name: "featureName",
                        message: "🚀 Enter the name of the feature:",
                        validate: (input) => input ? true : "❌ Feature name is required."
                    }]);
                await (0, generate_1.generateFeature)(featureName, projectDir);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red("❌ An unexpected error occurred during project initialization."), error.message);
        }
        const message = `
        ${chalk_1.default.yellow.bold('📦 Need more functionality? Extend your server with TSDIAPI plugins!')}
        
        ${chalk_1.default.cyan('◆')} Supports ${chalk_1.default.green('Prisma, Email, Sockets, Cron Jobs, and more.')}.
        ${chalk_1.default.cyan('◆')} Fully automated setup for easy integration.
        ${chalk_1.default.cyan('◆')} Just install with: ${chalk_1.default.cyan.bold('tsdiapi plugins add <pluginName>')}
        ${chalk_1.default.cyan('◆')} Or manually configure: ${chalk_1.default.cyan.bold('tsdiapi plugins config <pluginName>')}
        
        ${chalk_1.default.blue.bold('🌐 Explore all available plugins here:')} ${chalk_1.default.blue('https://www.npmjs.com/search?q=@tsdiapi')}
        
        ${chalk_1.default.magenta.bold('✨ More plugins coming soon!')}
        
        ${chalk_1.default.gray('────────────────────────────────────────────')}
        ${chalk_1.default.gray('💡 Want to contribute or ask something?')}
        ${chalk_1.default.cyan('📧 Contact:')} ${chalk_1.default.white('unbywyd@gmail.com')}
        `;
        const boxen = await loadBoxen();
        console.log(boxen(message, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'blue'
        }));
        if (!options?.startMode) {
            console.log(chalk_1.default.yellow("📌 Next steps:"));
            if (cdCommand) {
                console.log(`🔹 ${chalk_1.default.cyan(`${cdCommand}`)}`);
            }
            console.log(`🔹 ${chalk_1.default.cyan("npm run dev")}`);
        }
        console.log(chalk_1.default.green("\n🚀 Happy coding with TSDIAPI!\n"));
        // 🚀 Шаг 8: Запуск в быстром режиме (если выбрано)
        if (options?.startMode) {
            await startFastProject(projectDir);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red("❌ An unexpected error occurred during project initialization."), error.message);
        process.exit(1);
    }
}
async function installation(projectDir, options) {
    console.log(chalk_1.default.blue("\n🛠️ Initializing project structure...\n"));
    const spinner = (0, ora_1.default)({
        text: chalk_1.default.yellow("🚀 Copying base project files..."),
        spinner: "dots"
    }).start();
    try {
        const sourceDir = path_1.default.resolve(__dirname, "../files/root");
        await fs_extra_1.default.copy(sourceDir, projectDir);
        spinner.succeed(chalk_1.default.green("✅ Project files copied successfully!"));
        const payload = {
            ...options,
            port: options.port || config_2.DefaultPort,
        };
        const envFiles = [
            { path: ".env.development", isProduction: false },
            { path: ".env.production", isProduction: true },
        ];
        for (const env of envFiles) {
            const envPath = path_1.default.join(projectDir, env.path);
            const envContent = (0, hbs_1.buildHandlebarsTemplate)("env", { ...payload, isProduction: env.isProduction });
            if (envContent) {
                await fs_extra_1.default.writeFile(envPath, envContent);
            }
        }
        // 📦 Генерация package.json
        const packagePath = path_1.default.join(projectDir, "package.json");
        const packageContent = (0, hbs_1.buildHandlebarsTemplate)("package", payload);
        if (packageContent) {
            await fs_extra_1.default.writeFile(packagePath, packageContent);
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
        await fs_extra_1.default.writeFile(path_1.default.join(projectDir, ".gitignore"), gitignore);
        // 📂 Создание нужных директорий
        await fs_extra_1.default.ensureDir(path_1.default.join(projectDir, "src/api/features"));
        await fs_extra_1.default.ensureDir(path_1.default.join(projectDir, "src/public"));
        // 🏡 Главная страница
        const homePagePath = path_1.default.join(projectDir, "src/public/index.html");
        const homePageContent = (0, hbs_1.buildHandlebarsTemplate)("home", payload);
        if (homePageContent) {
            await fs_extra_1.default.writeFile(homePagePath, homePageContent);
        }
        // ⚙️ Конфигурация приложения
        const appConfigPath = path_1.default.join(projectDir, "src/app.config.ts");
        const appConfigContent = (0, hbs_1.buildHandlebarsTemplate)("app_config", payload);
        if (appConfigContent) {
            await fs_extra_1.default.writeFile(appConfigPath, appConfigContent);
        }
        // 🏗 Основной файл
        const mainPath = path_1.default.join(projectDir, "src/main.ts");
        const mainContent = (0, hbs_1.buildHandlebarsTemplate)("main", payload);
        if (mainContent) {
            await fs_extra_1.default.writeFile(mainPath, mainContent);
        }
        await (0, npm_1.installBaseDependencies)(projectDir);
    }
    catch (error) {
        spinner.fail(chalk_1.default.red("❌ Error during project setup!"));
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
//# sourceMappingURL=initProject.js.map