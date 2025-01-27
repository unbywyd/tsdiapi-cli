import chalk from "chalk";
import inquirer from "inquirer";
import path from "path";
import fs from "fs-extra";
import { buildHandlebarsTemplate, runNpmInstall, setupCron, setupPrisma, setupSockets } from "../utils";
import { CurrentVersion, DefaultHost, DefaultPort } from "../config";


export async function initProject() {
    try {
        // Welcome message
        console.log(chalk.green("Welcome to the TSDIAPI project initializer!"));

        // Prompt the user for project details
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "name",
                message: "Project name:",
                default: "my-tsdiapi-project",
                validate: async (input: string) => {
                    const projectDir = path.resolve(process.cwd(), input);
                    const exists = fs.existsSync(projectDir);
                    if (exists) {
                        return "A project already exists at this location. Please choose a different name.";
                    }
                    const npmNameRegex = /^[a-z0-9-]+$/;
                    if (!npmNameRegex.test(input)) {
                        return "The project name can only contain lowercase letters, numbers, and hyphens.";
                    }
                    return true;
                }
            },

            {
                type: "number",
                name: "port",
                message: "Port:",
                default: DefaultPort,
                validate: (input: number) => {
                    if (input < 1 || input > 65535) {
                        return "Port number must be between 1 and 65535.";
                    }
                    return true;
                }
            },

            {
                type: "confirm",
                name: "installPrisma",
                message: "Install prisma?",
                default: false
            },
            {
                type: "confirm",
                name: "installSocket",
                message: "Install socket.io?",
                default: false
            },
            {
                type: "confirm",
                name: "installCron",
                message: "You need cron?",
                default: false
            }
        ]);

        // check npm name is valid
        const npmNameRegex = /^[a-z0-9-]+$/;
        if (!npmNameRegex.test(answers.name)) {
            console.log(chalk.red("Error: The project name can only contain lowercase letters, numbers, and hyphens."));
            process.exit(1);
        }

        // Resolve the project directory path
        const projectDir = path.resolve(process.cwd(), answers.name);

        // Check if the project directory exists and is not empty
        if (fs.existsSync(projectDir) && fs.readdirSync(projectDir).length > 0) {
            console.log(chalk.red(`Error: A project already exists at ${projectDir} and is not empty.`));
            process.exit(1); // Exit the process with an error code
        }

        // Placeholder for project generation logic
        console.log(chalk.blue(`Initializing project at ${projectDir}...`));

        await populateProjectFiles(projectDir, answers);

        // Init npm
        await runNpmInstall(projectDir);

        console.log(chalk.green(`Project successfully initialized at ${projectDir}!`));
        console.log(`
    ${chalk.yellow("Next steps:")}
    1. ${chalk.cyan(`cd ${answers.name}`)}
    2. ${chalk.cyan("npm run dev")}
    
    Happy coding with TSDIAPI!
    `);

        if (answers.installPrisma) {
            await setupPrisma(projectDir);
        }

        if (answers.installSocket) {
            await setupSockets(projectDir, answers);
        }

        if (answers.installCron) {
            await setupCron(projectDir);
        }

    } catch (error) {
        console.error(chalk.red("An unexpected error occurred during project initialization."), error.message);
        process.exit(1);
    }
}

export type CliOptions = {
    name: string;
    installPrisma: boolean;
    installSocket: boolean;
    installCron: boolean;
    port?: number;
    host?: string;
};

async function populateProjectFiles(projectDir: string, options: CliOptions) {
    console.log(chalk.blue("Copying files to the project directory..."));

    const sourceDir = path.resolve(__dirname, "../files/root");
    try {
        // Copy all files from the source directory to the project directory
        await fs.copy(sourceDir, projectDir);


        // cron, prisma, io
        const plugins = [];
        const scripts: Array<{
            name: string;
            value: string;
        }> = [];
        const dependencies = [];

        // ^${CurrentVersion}
        if (options.installPrisma) {
            plugins.push("prisma");
            dependencies.push({
                name: "tsdiapi-prisma",
                version: "github:unbywyd/tsdiapi-prisma#master"
            });
        }
        if (options.installSocket) {
            plugins.push("io");
            dependencies.push({
                name: "tsdiapi-io",
                version: "github:unbywyd/tsdiapi-io#master"
            });
        }
        if (options.installCron) {
            plugins.push("cron");
            dependencies.push({
                name: "tsdiapi-cron",
                version: "github:unbywyd/tsdiapi-cron#master"
            });
        }

        const payload = {
            ...options,
            plugins: plugins?.length ? plugins : false,
            dependencies: dependencies?.length ? dependencies : false,
            scripts: scripts?.length ? scripts : false,
            host: DefaultHost,
            port: options.port || DefaultPort
        };

        const envDevPath = path.join(projectDir, ".env.development");
        const envProdPath = path.join(projectDir, ".env.production");

        const envDevContent = buildHandlebarsTemplate("env", {
            ...payload,
            isProduction: false
        });
        if (envDevContent) {
            await fs.writeFile(envDevPath, envDevContent);
        }

        const envProdContent = buildHandlebarsTemplate("env", {
            ...payload,
            isProduction: true
        });
        if (envProdContent) {
            await fs.writeFile(envProdPath, envProdContent);
        }

        const packageContent = buildHandlebarsTemplate("package", payload);
        if (packageContent) {
            const packagePath = path.join(projectDir, "package.json");
            await fs.writeFile(packagePath, packageContent);
        }

        // Provide src directory
        await fs.ensureDir(path.join(projectDir, "src/api/features"));
        await fs.ensureDir(path.join(projectDir, "src/public"));


        const homePageContent = buildHandlebarsTemplate("home", payload);
        if (homePageContent) {
            const homePagePath = path.join(projectDir, "src/public/index.html");
            await fs.writeFile(homePagePath, homePageContent);
        }

        const appConfigContent = buildHandlebarsTemplate("app_config", payload);
        if (appConfigContent) {
            const appConfigPath = path.join(projectDir, "src/app.config.ts");
            await fs.writeFile(appConfigPath, appConfigContent);
        }

        const mainContent = buildHandlebarsTemplate("main", payload);
        if (mainContent) {
            const mainPath = path.join(projectDir, "src/main.ts");
            await fs.writeFile(mainPath, mainContent);
        }

        // hello feature
        const sourceHelloDir = path.resolve(__dirname, "../files/hello-feature");
        await fs.copy(sourceHelloDir, path.join(projectDir, "src/api/features/hello"));

        console.log(chalk.green("All files copied successfully!"));
    } catch (error) {
        console.error(chalk.red(`Error copying files: ${error.message}`));
        process.exit(1);
    }
}