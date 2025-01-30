import chalk from "chalk"
import { findTSDIAPIServerProject, isPackageInstalled } from "./addPlugin"
import inquirer from "inquirer";
import fs from "fs-extra";
import { buildHandlebarsTemplate } from ".";
import { formatControllerName, toKebabCase } from "./format";
import path from "path";


export async function generateFeature(emptyOrName: string) {
    try {
        const currentDirectory = await findTSDIAPIServerProject()

        if (!currentDirectory) {
            return console.log(
                chalk.red(`Not found package.json or maybe you are not using @tsdiapi/server!`)
            )
        }
        let name = emptyOrName;
        if (!name) {
            try {
                const answer = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: 'Enter the name of the feature:',
                        validate: (value: string) => {
                            const pass = value.match(/^[a-zA-Z0-9-_]+$/);
                            if (pass) {
                                return true;
                            }
                        },
                        required: true,
                    },
                ]);
                name = answer.name
            } catch (e) {
                // cancel
                console.log(chalk.red('Operation canceled!'))
                return;
            }
        }
        const featurePath = `${currentDirectory}/src/api/features/${name}`;
        if (fs.existsSync(featurePath)) {
            console.log(chalk.red(`Feature ${name} already exists!`));
            process.exit(1);
        }
        await fs.mkdirp(featurePath);
        const res = await generateNewService(featurePath, name);
        await generateNewController(featurePath, name, res);

        console.log(chalk.green(`Feature ${name} generated at: ${featurePath}`));

    } catch (e) {
        console.error(chalk.red('Error generating feature:', e));
    }
}

export async function runGenerateCommand(type: string, name: string) {
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
                console.log(chalk.red(`Type ${type} is not supported!`));
        }
    } catch (e) {
        console.error(chalk.red('Error generating feature:', e));
    }
}

export async function generateNewPrisma(dir: string, name: string) {
    try {
        const currentDirectory = await findTSDIAPIServerProject();
        if (!currentDirectory) {
            return console.log(
                chalk.red(`Not found package.json or maybe you are not using @tsdiapi/server!`)
            )
        }
        const prismaPluginInstalled = await isPackageInstalled(currentDirectory, '@tsdiapi/prisma');
        if (!prismaPluginInstalled) {
            return console.log(
                chalk.red(`@tsdiapi/prisma plugin is not installed, please install it first, use 'tsdiapi add plugin prisma'`)
            )
        }
        const hasPrisma = fs.existsSync(path.join(currentDirectory, 'prisma/schema.prisma'));
        if(!hasPrisma) {
            return console.log(
                chalk.red(`Prisma schema not found, please create it first!`)
            )
        }

        const formattedName = formatControllerName(name);
        const targetPath = path.join(dir, `${toKebabCase(formattedName)}.prisma.ts`);
        if (fs.existsSync(targetPath)) {
            console.log(chalk.red(`Prisma resource ${formattedName} already exists!`));
            return;
        }
        const className = `${formattedName}Prisma`;

        const content = buildHandlebarsTemplate('generator/prisma', {
            className,
        });

        await fs.outputFile(targetPath, content);
        console.log(chalk.green(`Prisma resource generated at: ${targetPath}`));
    } catch (e) {
        console.error(chalk.red('Error generating prisma resource:', e));
    }
}

export async function generateNewCron(dir: string, name: string) {
    try {
        const currentDirectory = await findTSDIAPIServerProject();
        if (!currentDirectory) {
            return console.log(
                chalk.red(`Not found package.json or maybe you are not using @tsdiapi/server!`)
            )
        }
        const cronPluginInstalled = await isPackageInstalled(currentDirectory, '@tsdiapi/cron');
        if (!cronPluginInstalled) {
            return console.log(
                chalk.red(`@tsdiapi/cron plugin is not installed, please install it first, use 'tsdiapi add plugin cron'`)
            )
        }

        const formattedName = formatControllerName(name);
        const targetPath = path.join(dir, `${toKebabCase(formattedName)}.cron.ts`);
        if (fs.existsSync(targetPath)) {
            console.log(chalk.red(`Cron job ${formattedName} already exists!`));
            return;
        }
        const className = `${formattedName}Cron`;

        const content = buildHandlebarsTemplate('generator/cron', {
            className,
        });

        await fs.outputFile(targetPath, content);
        console.log(chalk.green(`Cron job generated at: ${targetPath}`));
    } catch (e) {
        console.error(chalk.red('Error generating cron job:', e));
    }
}
export async function generateNewEvent(dir: string, name: string) {
    try {
        const currentDirectory = await findTSDIAPIServerProject();
        if (!currentDirectory) {
            return console.log(
                chalk.red(`Not found package.json or maybe you are not using @tsdiapi/server!`)
            )
        }
        const eventPluginInstalled = await isPackageInstalled(currentDirectory, '@tsdiapi/events');
        if (!eventPluginInstalled) {
            return console.log(
                chalk.red(`@tsdiapi/events plugin is not installed, please install it first, use 'tsdiapi add plugin events'`)
            )
        }

        const formattedName = formatControllerName(name);
        const targetPath = path.join(dir, `${toKebabCase(formattedName)}.event.ts`);
        if (fs.existsSync(targetPath)) {
            console.log(chalk.red(`Event ${formattedName} already exists!`));
            return;
        }

        const className = `${formattedName}Event`;
        const content = buildHandlebarsTemplate('generator/event', {
            className,
        });

        await fs.outputFile(targetPath, content);
        console.log(chalk.green(`Event generated at: ${targetPath}`));
    } catch (e) {
        console.error(chalk.red('Error generating event:', e));
    }
}

export async function generateNewService(dir: string, name: string): Promise<boolean> {
    try {
        const formattedName = formatControllerName(name);
        const targetPath = path.join(dir, `${toKebabCase(formattedName)}.service.ts`);
        if (fs.existsSync(targetPath)) {
            console.log(chalk.red(`Service ${formattedName} already exists!`));
            return;
        }

        const className = `${formattedName}Service`;
        const message = `Hello from ${formattedName}`;

        const content = buildHandlebarsTemplate('generator/service', {
            className,
            message,
        });
        await fs.outputFile(targetPath, content);
        console.log(chalk.green(`Service generated at: ${targetPath}`));
        return true;
    } catch (e) {
        console.error(chalk.red('Error generating service:', e));
        return false;
    }
}


export async function generateNewController(dir: string, name: string, withService = false) {
    try {
        const formattedName = formatControllerName(name);
        const targetPath = path.join(dir, `${toKebabCase(formattedName)}.controller.ts`);
        if (fs.existsSync(targetPath)) {
            console.log(chalk.red(`Controller ${formattedName} already exists!`));
            return;
        }

        const serviceName = withService ? `${formatControllerName(name, true)}Service` : null;
        const serviceTypeName = withService ? `${formattedName}Service` : null;

        const className = `${formattedName}Controller`;
        const tagName = formattedName;
        const routePath = `/${toKebabCase(formattedName)}`;
        const summary = `Get ${formattedName} data`;
        const message = `Hello from ${formattedName}`;

        const content = buildHandlebarsTemplate('generator/controller', {
            tagName,
            serviceName,
            kebabCase: toKebabCase(formattedName),
            serviceTypeName,
            routePath,
            className,
            summary,
            message,
        });
        await fs.outputFile(targetPath, content);
        console.log(chalk.green(`Controller generated at: ${targetPath}`));
    } catch (e) {
        console.error(chalk.red('Error generating controller:', e));
    }
}

