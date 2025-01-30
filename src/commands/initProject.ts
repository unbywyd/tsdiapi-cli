import { PluginName, getPackageVersion, getPackageName } from './../config';
import chalk from "chalk";
import inquirer from "inquirer";
import path from "path";
import fs from "fs-extra";
import { buildHandlebarsTemplate, runNpmInstall, setupCron, setupEmail, setupEvents, setupInforu, setupJWTAuth, setupPrisma, setupS3, setupSockets } from "../utils";
import { DefaultPort } from "../config";
import { CliOptions } from '..';
import { nameToImportName } from '../utils/format';


export async function initProject(projectname?: string,
    options?: {
        installPrisma?: boolean;
        installSocket?: boolean;
        installCron?: boolean;
        installS3?: boolean;
        installEvents?: boolean;
        installJwt?: boolean;
        installInforu?: boolean;
        installEmail?: boolean;
    }) {
    try {
        // Welcome message
        console.log(chalk.green("Welcome to the TSDIAPI project initializer!"));

        const questions: Array<any> = [];

        if (!projectname) {
            questions.push(
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
                });
            questions.push({
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
            });
        }

        if (options?.installPrisma === undefined) {
            questions.push({
                type: "confirm",
                name: "installPrisma",
                message: "Install prisma?",
                default: false
            });
        }

        if (options?.installSocket === undefined) {
            questions.push({
                type: "confirm",
                name: "installSocket",
                message: "Install socket.io?",
                default: false
            });
        }

        if (options?.installCron === undefined) {
            questions.push({
                type: "confirm",
                name: "installCron",
                message: "You need cron?",
                default: false
            });
        }

        if (options?.installEvents === undefined) {
            questions.push({
                type: "confirm",
                name: "installEvents",
                message: "You need events?",
                default: false
            });
        }

        if (options?.installS3 === undefined) {
            questions.push({
                type: "confirm",
                name: "installS3",
                message: "You need s3?",
                default: false
            });
        }

        if (options?.installJwt === undefined) {
            questions.push({
                type: "confirm",
                name: "installJwt",
                message: "You need jwt auth?",
                default: false
            });
        }

        if (options?.installInforu === undefined) {
            questions.push({
                type: "confirm",
                name: "installInforu",
                message: "You need inforu for sms sending?",
                default: false
            });
        }

        if (options?.installEmail === undefined) {
            questions.push({
                type: "confirm",
                name: "installEmail",
                message: "You need email sending?",
                default: false
            });
        }


        // Prompt the user for project details
        const answers = questions?.length ? await inquirer.prompt(questions) : {
            ...options,
            name: projectname,
            port: DefaultPort
        }

        answers.name = answers.name || projectname;
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

        await populateProjectFiles(projectDir, answers as CliOptions);

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
            await setupSockets(projectDir, answers as CliOptions);
        }

        if (answers.installCron) {
            await setupCron(projectDir);
        }

        if (answers.installS3) {
            await setupS3(projectDir);
        }

        if (answers.installEvents) {
            await setupEvents(projectDir);
        }

        if (answers.installJwt) {
            await setupJWTAuth(projectDir);
        }

        if (answers.installInforu) {
            await setupInforu(projectDir);
        }

        if (answers.installEmail) {
            await setupEmail(projectDir);
        }

    } catch (error) {
        console.error(chalk.red("An unexpected error occurred during project initialization."), error.message);
        process.exit(1);
    }
}


type Depenpendency = {
    name: string;
    version: string;
};

type PreparePluginsAndDependencies = {
    plugins: Array<{
        packageName: string;
        importPackageName: string;
    }>;
    dependencies: Array<Depenpendency>;
}

function preparePluginsAndDependencies(options: CliOptions): PreparePluginsAndDependencies {
    const plugins: Array<{
        packageName: string;
        importPackageName: string;
    }> = [];
    const dependencies: Array<Depenpendency> = [];


    const getDependency = (name: PluginName) => {
        return {
            name: getPackageName(name),
            version: getPackageVersion(name)
        };
    }

    const optionsByPlugins: Record<PluginName, boolean> = {
        "prisma": options.installPrisma,
        "socket.io": options.installSocket,
        "cron": options.installCron,
        "events": options.installEvents,
        "email": options.installEmail,
        "s3": options.installS3,
        "jwt-auth": options.installJwt,
        "inforu": options.installInforu
    }

    for (const [plugin, install] of Object.entries(optionsByPlugins) as Array<[PluginName, boolean]>) {
        if (install) {
            plugins.push({
                packageName: getPackageName(plugin),
                importPackageName: nameToImportName(plugin)
            });
            dependencies.push(getDependency(plugin));
        }
    }

    return {
        plugins: plugins,
        dependencies
    }
}

async function populateProjectFiles(projectDir: string, options: CliOptions) {
    console.log(chalk.blue("Copying files to the project directory..."));

    const sourceDir = path.resolve(__dirname, "../files/root");
    try {
        // Copy all files from the source directory to the project directory
        await fs.copy(sourceDir, projectDir);


        // cron, prisma, io
        const { plugins, dependencies } = preparePluginsAndDependencies(options);


        const payload = {
            ...options,
            plugins: plugins?.length ? plugins : false,
            dependencies: dependencies?.length ? dependencies : false,
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