"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFeature = generateFeature;
exports.runGenerateCommand = runGenerateCommand;
exports.generateNewPrisma = generateNewPrisma;
exports.generateNewCron = generateNewCron;
exports.generateNewEvent = generateNewEvent;
exports.generateNewService = generateNewService;
exports.generateNewController = generateNewController;
const chalk_1 = __importDefault(require("chalk"));
const addPlugin_1 = require("./addPlugin");
const inquirer_1 = __importDefault(require("inquirer"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const _1 = require(".");
const format_1 = require("./format");
const path_1 = __importDefault(require("path"));
async function generateFeature(emptyOrName) {
    try {
        const currentDirectory = await (0, addPlugin_1.findTSDIAPIServerProject)();
        if (!currentDirectory) {
            return console.log(chalk_1.default.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }
        let name = emptyOrName;
        if (!name) {
            try {
                const answer = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: 'Enter the name of the feature:',
                        validate: (value) => {
                            const pass = value.match(/^[a-zA-Z0-9-_]+$/);
                            if (pass) {
                                return true;
                            }
                        },
                        required: true,
                    },
                ]);
                name = answer.name;
            }
            catch (e) {
                // cancel
                console.log(chalk_1.default.red('Operation canceled!'));
                return;
            }
        }
        const featurePath = `${currentDirectory}/src/api/features/${name}`;
        if (fs_extra_1.default.existsSync(featurePath)) {
            console.log(chalk_1.default.red(`Feature ${name} already exists!`));
            process.exit(1);
        }
        await fs_extra_1.default.mkdirp(featurePath);
        const res = await generateNewService(featurePath, name);
        await generateNewController(featurePath, name, res);
        console.log(chalk_1.default.green(`Feature ${name} generated at: ${featurePath}`));
    }
    catch (e) {
        console.error(chalk_1.default.red('Error generating feature:', e));
    }
}
async function runGenerateCommand(type, name) {
    try {
        const cwd = process.cwd();
        switch (type) {
            case 'service':
                await generateNewService(`${cwd}`, name);
                break;
            case 'controller':
                await generateNewController(`${cwd}`, name);
                break;
            case 'event':
                await generateNewEvent(`${cwd}`, name);
                break;
            case 'prisma':
                await generateNewPrisma(`${cwd}`, name);
                break;
            case 'cron':
                await generateNewCron(`${cwd}`, name);
                break;
            default:
                console.log(chalk_1.default.red(`Type ${type} is not supported!`));
        }
    }
    catch (e) {
        console.error(chalk_1.default.red('Error generating feature:', e));
    }
}
async function generateNewPrisma(dir, name) {
    try {
        const currentDirectory = await (0, addPlugin_1.findTSDIAPIServerProject)();
        if (!currentDirectory) {
            return console.log(chalk_1.default.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }
        const prismaPluginInstalled = await (0, addPlugin_1.isPackageInstalled)(currentDirectory, '@tsdiapi/prisma');
        if (!prismaPluginInstalled) {
            return console.log(chalk_1.default.red(`@tsdiapi/prisma plugin is not installed, please install it first, use 'tsdiapi add plugin prisma'`));
        }
        const hasPrisma = fs_extra_1.default.existsSync(path_1.default.join(currentDirectory, 'prisma/schema.prisma'));
        if (!hasPrisma) {
            return console.log(chalk_1.default.red(`Prisma schema not found, please create it first!`));
        }
        const formattedName = (0, format_1.formatControllerName)(name);
        const targetPath = path_1.default.join(dir, `${(0, format_1.toKebabCase)(formattedName)}.prisma.ts`);
        if (fs_extra_1.default.existsSync(targetPath)) {
            console.log(chalk_1.default.red(`Prisma resource ${formattedName} already exists!`));
            return;
        }
        const className = `${formattedName}Prisma`;
        const content = (0, _1.buildHandlebarsTemplate)('generator/prisma', {
            className,
        });
        await fs_extra_1.default.outputFile(targetPath, content);
        console.log(chalk_1.default.green(`Prisma resource generated at: ${targetPath}`));
    }
    catch (e) {
        console.error(chalk_1.default.red('Error generating prisma resource:', e));
    }
}
async function generateNewCron(dir, name) {
    try {
        const currentDirectory = await (0, addPlugin_1.findTSDIAPIServerProject)();
        if (!currentDirectory) {
            return console.log(chalk_1.default.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }
        const cronPluginInstalled = await (0, addPlugin_1.isPackageInstalled)(currentDirectory, '@tsdiapi/cron');
        if (!cronPluginInstalled) {
            return console.log(chalk_1.default.red(`@tsdiapi/cron plugin is not installed, please install it first, use 'tsdiapi add plugin cron'`));
        }
        const formattedName = (0, format_1.formatControllerName)(name);
        const targetPath = path_1.default.join(dir, `${(0, format_1.toKebabCase)(formattedName)}.cron.ts`);
        if (fs_extra_1.default.existsSync(targetPath)) {
            console.log(chalk_1.default.red(`Cron job ${formattedName} already exists!`));
            return;
        }
        const className = `${formattedName}Cron`;
        const content = (0, _1.buildHandlebarsTemplate)('generator/cron', {
            className,
        });
        await fs_extra_1.default.outputFile(targetPath, content);
        console.log(chalk_1.default.green(`Cron job generated at: ${targetPath}`));
    }
    catch (e) {
        console.error(chalk_1.default.red('Error generating cron job:', e));
    }
}
async function generateNewEvent(dir, name) {
    try {
        const currentDirectory = await (0, addPlugin_1.findTSDIAPIServerProject)();
        if (!currentDirectory) {
            return console.log(chalk_1.default.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }
        const eventPluginInstalled = await (0, addPlugin_1.isPackageInstalled)(currentDirectory, '@tsdiapi/events');
        if (!eventPluginInstalled) {
            return console.log(chalk_1.default.red(`@tsdiapi/events plugin is not installed, please install it first, use 'tsdiapi add plugin events'`));
        }
        const formattedName = (0, format_1.formatControllerName)(name);
        const targetPath = path_1.default.join(dir, `${(0, format_1.toKebabCase)(formattedName)}.event.ts`);
        if (fs_extra_1.default.existsSync(targetPath)) {
            console.log(chalk_1.default.red(`Event ${formattedName} already exists!`));
            return;
        }
        const className = `${formattedName}Event`;
        const content = (0, _1.buildHandlebarsTemplate)('generator/event', {
            className,
        });
        await fs_extra_1.default.outputFile(targetPath, content);
        console.log(chalk_1.default.green(`Event generated at: ${targetPath}`));
    }
    catch (e) {
        console.error(chalk_1.default.red('Error generating event:', e));
    }
}
async function generateNewService(dir, name) {
    try {
        const formattedName = (0, format_1.formatControllerName)(name);
        const targetPath = path_1.default.join(dir, `${(0, format_1.toKebabCase)(formattedName)}.service.ts`);
        if (fs_extra_1.default.existsSync(targetPath)) {
            console.log(chalk_1.default.red(`Service ${formattedName} already exists!`));
            return;
        }
        const className = `${formattedName}Service`;
        const message = `Hello from ${formattedName}`;
        const content = (0, _1.buildHandlebarsTemplate)('generator/service', {
            className,
            message,
        });
        await fs_extra_1.default.outputFile(targetPath, content);
        console.log(chalk_1.default.green(`Service generated at: ${targetPath}`));
        return true;
    }
    catch (e) {
        console.error(chalk_1.default.red('Error generating service:', e));
        return false;
    }
}
async function generateNewController(dir, name, withService = false) {
    try {
        const formattedName = (0, format_1.formatControllerName)(name);
        const targetPath = path_1.default.join(dir, `${(0, format_1.toKebabCase)(formattedName)}.controller.ts`);
        if (fs_extra_1.default.existsSync(targetPath)) {
            console.log(chalk_1.default.red(`Controller ${formattedName} already exists!`));
            return;
        }
        const serviceName = withService ? `${(0, format_1.formatControllerName)(name, true)}Service` : null;
        const serviceTypeName = withService ? `${formattedName}Service` : null;
        const className = `${formattedName}Controller`;
        const tagName = formattedName;
        const routePath = `/${(0, format_1.toKebabCase)(formattedName)}`;
        const summary = `Get ${formattedName} data`;
        const message = `Hello from ${formattedName}`;
        const content = (0, _1.buildHandlebarsTemplate)('generator/controller', {
            tagName,
            serviceName,
            kebabCase: (0, format_1.toKebabCase)(formattedName),
            serviceTypeName,
            routePath,
            className,
            summary,
            message,
        });
        await fs_extra_1.default.outputFile(targetPath, content);
        console.log(chalk_1.default.green(`Controller generated at: ${targetPath}`));
    }
    catch (e) {
        console.error(chalk_1.default.red('Error generating controller:', e));
    }
}
//# sourceMappingURL=generate.js.map