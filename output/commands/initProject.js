"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initProject = initProject;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const utils_1 = require("../utils");
const config_1 = require("../config");
async function initProject() {
    try {
        // Welcome message
        console.log(chalk_1.default.green("Welcome to the TSDIAPI project initializer!"));
        // Prompt the user for project details
        const answers = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "name",
                message: "Project name:",
                default: "my-tsdiapi-project",
                validate: async (input) => {
                    const projectDir = path_1.default.resolve(process.cwd(), input);
                    const exists = fs_extra_1.default.existsSync(projectDir);
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
                default: config_1.DefaultPort,
                validate: (input) => {
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
            },
            {
                type: "confirm",
                name: "installEvents",
                message: "You need events?",
                default: false
            },
            {
                type: "confirm",
                name: "installS3",
                message: "You need s3?",
                default: false
            }
        ]);
        // check npm name is valid
        const npmNameRegex = /^[a-z0-9-]+$/;
        if (!npmNameRegex.test(answers.name)) {
            console.log(chalk_1.default.red("Error: The project name can only contain lowercase letters, numbers, and hyphens."));
            process.exit(1);
        }
        // Resolve the project directory path
        const projectDir = path_1.default.resolve(process.cwd(), answers.name);
        // Check if the project directory exists and is not empty
        if (fs_extra_1.default.existsSync(projectDir) && fs_extra_1.default.readdirSync(projectDir).length > 0) {
            console.log(chalk_1.default.red(`Error: A project already exists at ${projectDir} and is not empty.`));
            process.exit(1); // Exit the process with an error code
        }
        // Placeholder for project generation logic
        console.log(chalk_1.default.blue(`Initializing project at ${projectDir}...`));
        await populateProjectFiles(projectDir, answers);
        // Init npm
        await (0, utils_1.runNpmInstall)(projectDir);
        console.log(chalk_1.default.green(`Project successfully initialized at ${projectDir}!`));
        console.log(`
    ${chalk_1.default.yellow("Next steps:")}
    1. ${chalk_1.default.cyan(`cd ${answers.name}`)}
    2. ${chalk_1.default.cyan("npm run dev")}
    
    Happy coding with TSDIAPI!
    `);
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
    }
    catch (error) {
        console.error(chalk_1.default.red("An unexpected error occurred during project initialization."), error.message);
        process.exit(1);
    }
}
async function populateProjectFiles(projectDir, options) {
    console.log(chalk_1.default.blue("Copying files to the project directory..."));
    const sourceDir = path_1.default.resolve(__dirname, "../files/root");
    try {
        // Copy all files from the source directory to the project directory
        await fs_extra_1.default.copy(sourceDir, projectDir);
        // cron, prisma, io
        const plugins = [];
        const scripts = [];
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
            host: config_1.DefaultHost,
            port: options.port || config_1.DefaultPort
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