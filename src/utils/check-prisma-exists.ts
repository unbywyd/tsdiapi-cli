import fs from 'fs-extra';
import chalk from "chalk";
import { isPackageInstalled } from "./is-plg-installed.js";
import path from "path";

export const checkPrismaExist = async (projectDir: string): Promise<{
    results: Array<string>,
    prismaExist: boolean
}> => {
    const requiredPackages = ['@prisma/client'];
    const requiredPaths = ['prisma/schema.prisma'];
    const results: Array<string> = [];
    let prismaExist = true;
    for (const packageName of requiredPackages) {
        const isInstalled = await isPackageInstalled(projectDir, packageName);
        results.push(`${isInstalled ? chalk.green('✅') : chalk.red('❌')} ${chalk.gray(packageName)} ${isInstalled ? `- ${chalk.green('Found')}` : `- ${chalk.red('Required for Prisma, please install')}`}`);
        if (!isInstalled) {
            prismaExist = false;
        }
    }
    for (const requiredPath of requiredPaths) {
        const fullPath = path.join(projectDir, requiredPath);
        if (!fs.existsSync(fullPath)) {
            results.push(`${chalk.red('❌')} ${chalk.gray(requiredPath)} - ${chalk.red('File or directory not found')}. Please install Prisma via ${chalk.cyan('npm install @tsdiapi/prisma')} or manually and run ${chalk.cyan('prisma init')}`);
            prismaExist = false;
        } else {
            results.push(`${chalk.green('✅')} ${chalk.gray(requiredPath)} - ${chalk.green('Found')}`);
        }
    }
    return { results, prismaExist };
}