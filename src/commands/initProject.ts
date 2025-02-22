import { getCdCommand, isPathSuitableToNewProject } from '../utils/cwd';
import { installBaseDependencies, runUnsafeNpmScript } from '../utils/npm';
import { DefaultHost } from './../config';
import chalk from "chalk";
import inquirer from "inquirer";
import path from "path";
import fs from "fs-extra";
import { DefaultPort } from "../config";
import { findTSDIAPIServerProject } from '../utils/plugins';
import ora from 'ora';
import figlet from "figlet";
import { buildHandlebarsTemplate } from '../utils/hbs';
import { generateFeature } from '../utils/generate';
async function loadGradient() {
    return (await eval('import("gradient-string")')).default;
}
async function loadBoxen() {
    return (await eval('import("boxen")')).default;
}
type CreateProjectOptions = {
    name?: string;
    host?: string;
    port?: number;
    startMode?: boolean;
    skipAll?: boolean;
}
export async function startFastProject(projectDir: string) {
    try {
        if (!fs.existsSync(projectDir)) {
            console.error(chalk.red("❌ Project directory does not exist:", projectDir));
            process.exit(1);
        }
        console.log(chalk.yellow("⚡ Starting fast development mode..."));
        await runUnsafeNpmScript(projectDir, "fast-dev");
    } catch (error) {
        console.error(chalk.red("❌ An unexpected error occurred during project initialization."), error.message);
    }
}

export async function initProject(projectname?: string, options?: CreateProjectOptions) {
    try {
        // 🌟 Шаг 1: Проверка на существующий проект (fast mode)
        if (options?.startMode) {
            const cwd = path.resolve(process.cwd(), projectname!);
            const currentDirectory = await findTSDIAPIServerProject(cwd);
            if (currentDirectory) {
                console.log(chalk.green(`🎯 Found existing TSDIAPI project at: ${chalk.bold(currentDirectory)}`));
                await startFastProject(currentDirectory);
                return;
            }
        }

        // 🚀 Шаг 2: Красивый ASCII баннер
        const gradient = await loadGradient();
        console.log(gradient.pastel.multiline(figlet.textSync("TSDIAPI", { horizontalLayout: "full" })));
        console.log(chalk.yellow("\n✨ Welcome to the TSDIAPI project initializer!\n"));

        const questions: Array<any> = [];

        // 📌 Шаг 3: Проверяем путь
        const projectDir = isPathSuitableToNewProject(projectname!);
        if (!projectDir) {
            return process.exit(1);
        }

        let projectName = path.basename(projectDir);

        if (!options?.skipAll) {
            questions.push({
                type: "input",
                name: "name",
                message: "📦 Project name:",
                default: projectName,
                validate: (input: string) => input ? true : "❌ Project name is required."
            });

            questions.push({
                type: "input",
                name: "host",
                message: "🌍 Host:",
                default: DefaultHost,
                validate: (input: string) => input ? true : "❌ Host is required."
            });

            questions.push({
                type: "number",
                name: "port",
                message: "🔌 Port:",
                default: DefaultPort,
                validate: (input: number) => (input >= 1 && input <= 65535) ? true : "❌ Port must be between 1 and 65535."
            });
        }

        // ⏳ Шаг 4: Запрос данных
        const answers = questions.length ? await inquirer.prompt(questions) : {
            ...options,
            name: projectname,
            port: DefaultPort,
            host: DefaultHost
        };

        // Обновление данных
        answers.name = answers.name || projectname;
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

        await installation(projectDir, answers as CreateProjectOptions);
        spinner.succeed(chalk.green("✅ Project files generated successfully!"));

        // 🎯 Шаг 7: Финальный вывод
        const cdCommand = getCdCommand(projectname!);
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
                    validate: (input: string) => input ? true : "❌ Feature name is required."
                }]);
                await generateFeature(featureName, projectDir);
            }
        } catch (error) {
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

        const boxen = await loadBoxen();
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
    } catch (error) {
        console.error(chalk.red("❌ An unexpected error occurred during project initialization."), error.message);
        process.exit(1);
    }
}
export async function installation(projectDir: string, options: CreateProjectOptions) {
    console.log(chalk.blue("\n🛠️ Initializing project structure...\n"));

    const spinner = ora({
        text: chalk.yellow("🚀 Copying base project files..."),
        spinner: "dots"
    }).start();

    try {
        const sourceDir = path.resolve(__dirname, "../files/root");
        await fs.copy(sourceDir, projectDir);
        spinner.succeed(chalk.green("✅ Project files copied successfully!"));

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

    } catch (error) {
        spinner.fail(chalk.red("❌ Error during project setup!"));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
    }
}