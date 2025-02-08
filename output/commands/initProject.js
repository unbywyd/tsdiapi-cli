"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFastProject = startFastProject;
exports.initProject = initProject;
const config_1 = require("./../config");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const utils_1 = require("../utils");
const config_2 = require("../config");
const format_1 = require("../utils/format");
const addPlugin_1 = require("../utils/addPlugin");
async function startFastProject(projectDir) {
    try {
        if (!fs_extra_1.default.existsSync(projectDir)) {
            console.error(chalk_1.default.red('Project directory does not exist:', projectDir));
            process.exit(1);
        }
        await (0, utils_1.runUnsafeNpmScript)(projectDir, 'fast-dev');
    }
    catch (error) {
        console.error(chalk_1.default.red('An unexpected error occurred during project initialization.'), error.message);
    }
}
async function initProject(projectname, options) {
    try {
        if (options?.startMode) {
            const cwd = path_1.default.resolve(process.cwd(), projectname);
            const currentDirectory = await (0, addPlugin_1.findTSDIAPIServerProject)(cwd);
            if (currentDirectory) {
                console.log(chalk_1.default.green(`Found TSDIAPI project at ${currentDirectory}`));
                await startFastProject(currentDirectory);
                return;
            }
        }
        // Welcome message
        console.log(chalk_1.default.green("Welcome to the TSDIAPI project initializer!"));
        const questions = [];
        const projectDir = (0, utils_1.isPathSuitableToNewProject)(projectname);
        if (!projectDir) {
            return process.exit(1);
        }
        let projectName = path_1.default.basename(projectDir);
        if (!options?.skipAll) {
            questions.push({
                type: "input",
                name: "name",
                message: "Project name:",
                default: projectName,
                validate: (input) => {
                    if (!input) {
                        return "Project name is required.";
                    }
                    return true;
                }
            });
            questions.push({
                type: "input",
                name: "host",
                message: "Host:",
                default: config_1.DefaultHost,
                validate: (input) => {
                    if (!input) {
                        return "Host is required.";
                    }
                    return true;
                }
            });
            questions.push({
                type: "number",
                name: "port",
                message: "Port:",
                default: config_2.DefaultPort,
                validate: (input) => {
                    if (input < 1 || input > 65535) {
                        return "Port number must be between 1 and 65535.";
                    }
                    return true;
                }
            });
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
        }
        // Prompt the user for project details
        const answers = questions?.length ? await inquirer_1.default.prompt(questions) : {
            ...options,
            name: projectname,
            port: config_2.DefaultPort,
            host: config_1.DefaultHost
        };
        answers.name = answers.name || projectname;
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
        // Placeholder for project generation logic
        console.log(chalk_1.default.blue(`Initializing project at ${projectDir}...`));
        await populateProjectFiles(projectDir, answers);
        // Init npm
        await (0, utils_1.runNpmInstall)(projectDir);
        const cdCommand = (0, utils_1.getCdCommand)(projectname);
        console.log(chalk_1.default.green(`Project successfully initialized at ${projectDir}!`));
        if (cdCommand) {
            console.log(`
${chalk_1.default.yellow("Next steps:")}
1. ${chalk_1.default.cyan(`cd ${cdCommand}`)}
2. ${chalk_1.default.cyan("npm run dev")}
`);
        }
        else {
            console.log(`
${chalk_1.default.yellow("Next steps:")}
${chalk_1.default.cyan("npm run dev")}`);
        }
        console.log(chalk_1.default.green("Happy coding with TSDIAPI!"));
        if (answers.installPrisma) {
            await (0, utils_1.setupPrisma)(projectDir);
        }
        if (answers.installSocket) {
            await (0, utils_1.setupSockets)(projectDir, answers);
        }
        if (answers.installCron) {
            await (0, utils_1.setupCron)(projectDir);
        }
        if (answers.installS3) {
            await (0, utils_1.setupS3)(projectDir);
        }
        if (answers.installEvents) {
            await (0, utils_1.setupEvents)(projectDir);
        }
        if (answers.installJwt) {
            await (0, utils_1.setupJWTAuth)(projectDir);
        }
        if (answers.installInforu) {
            await (0, utils_1.setupInforu)(projectDir);
        }
        if (answers.installEmail) {
            await (0, utils_1.setupEmail)(projectDir);
        }
        if (options?.startMode) {
            await startFastProject(projectDir);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red("An unexpected error occurred during project initialization."), error.message);
        process.exit(1);
    }
}
function preparePluginsAndDependencies(options) {
    const plugins = [];
    const dependencies = [];
    const getDependency = (name) => {
        return {
            name: (0, config_1.getPackageName)(name),
            version: (0, config_1.getPackageVersion)(name)
        };
    };
    const optionsByPlugins = {
        "prisma": options.installPrisma,
        "socket.io": options.installSocket,
        "cron": options.installCron,
        "events": options.installEvents,
        "email": options.installEmail,
        "s3": options.installS3,
        "jwt-auth": options.installJwt,
        "inforu": options.installInforu
    };
    for (const [plugin, install] of Object.entries(optionsByPlugins)) {
        if (install) {
            plugins.push({
                packageName: (0, config_1.getPackageName)(plugin),
                importPackageName: (0, format_1.nameToImportName)(plugin)
            });
            dependencies.push(getDependency(plugin));
        }
    }
    return {
        plugins: plugins,
        dependencies
    };
}
async function populateProjectFiles(projectDir, options) {
    console.log(chalk_1.default.blue("Copying files to the project directory..."));
    const sourceDir = path_1.default.resolve(__dirname, "../files/root");
    try {
        // Copy all files from the source directory to the project directory
        await fs_extra_1.default.copy(sourceDir, projectDir);
        // cron, prisma, io
        const { plugins, dependencies } = preparePluginsAndDependencies(options);
        const payload = {
            ...options,
            plugins: plugins?.length ? plugins : false,
            dependencies: dependencies?.length ? dependencies : false,
            port: options.port || config_2.DefaultPort,
        };
        const envDevPath = path_1.default.join(projectDir, ".env.development");
        const envProdPath = path_1.default.join(projectDir, ".env.production");
        const envDevContent = (0, utils_1.buildHandlebarsTemplate)("env", {
            ...payload,
            isProduction: false
        });
        if (envDevContent) {
            await fs_extra_1.default.writeFile(envDevPath, envDevContent);
        }
        const envProdContent = (0, utils_1.buildHandlebarsTemplate)("env", {
            ...payload,
            isProduction: true
        });
        if (envProdContent) {
            await fs_extra_1.default.writeFile(envProdPath, envProdContent);
        }
        const packageContent = (0, utils_1.buildHandlebarsTemplate)("package", payload);
        if (packageContent) {
            const packagePath = path_1.default.join(projectDir, "package.json");
            await fs_extra_1.default.writeFile(packagePath, packageContent);
        }
        // Provide src directory
        await fs_extra_1.default.ensureDir(path_1.default.join(projectDir, "src/api/features"));
        await fs_extra_1.default.ensureDir(path_1.default.join(projectDir, "src/public"));
        const homePageContent = (0, utils_1.buildHandlebarsTemplate)("home", payload);
        if (homePageContent) {
            const homePagePath = path_1.default.join(projectDir, "src/public/index.html");
            await fs_extra_1.default.writeFile(homePagePath, homePageContent);
        }
        const appConfigContent = (0, utils_1.buildHandlebarsTemplate)("app_config", payload);
        if (appConfigContent) {
            const appConfigPath = path_1.default.join(projectDir, "src/app.config.ts");
            await fs_extra_1.default.writeFile(appConfigPath, appConfigContent);
        }
        const mainContent = (0, utils_1.buildHandlebarsTemplate)("main", payload);
        if (mainContent) {
            const mainPath = path_1.default.join(projectDir, "src/main.ts");
            await fs_extra_1.default.writeFile(mainPath, mainContent);
        }
        // hello feature
        const sourceHelloDir = path_1.default.resolve(__dirname, "../files/hello-feature");
        await fs_extra_1.default.copy(sourceHelloDir, path_1.default.join(projectDir, "src/api/features/hello"));
        console.log(chalk_1.default.green("All files copied successfully!"));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error copying files: ${error.message}`));
        process.exit(1);
    }
}
//# sourceMappingURL=initProject.js.map