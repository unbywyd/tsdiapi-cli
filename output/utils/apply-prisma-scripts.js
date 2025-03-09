import chalk from "chalk";
import { mutationsHandler, PrismaQlProvider, PrismaQlRelationCollector, PrismaQlSchemaLoader, queryRendersHandler } from "prismaql";
import { convertWhenToFunction } from "./inquirer.js";
import path from "path";
import Handlebars from "./handlebars.js";
export const applyPrismaScripts = async (projectDir, prismaScripts, payload) => {
    const executeErrorMessage = (script) => {
        console.error(chalk.red(`Error while running Prisma script: ${script.description}`));
    };
    const manager = new PrismaQlSchemaLoader(new PrismaQlRelationCollector());
    await manager.loadFromFile(path.join(projectDir, 'prisma', 'schema.prisma'));
    const provider = new PrismaQlProvider({
        queryHandler: queryRendersHandler,
        mutationHandler: mutationsHandler,
        loader: manager,
    });
    for (const script of prismaScripts) {
        const when = convertWhenToFunction(script.when)(payload);
        if (when) {
            // execute script
            console.log(chalk.blue(`Running Prisma script: ${script.description}`));
            try {
                const result = await provider.multiApply(replaceSafeVariables(script.command, payload), {
                    save: true,
                    dryRun: false,
                });
                if (result?.length) {
                    for (const { result: r, error } of result) {
                        if (r) {
                            console.log(chalk.green(`✅ ${script.description} - Successfully completed`));
                        }
                        else {
                            console.error(chalk.red(`❌ ${script.description} - Error while running script: ${error?.toString()}`));
                        }
                    }
                }
                const hasError = result.some(r => r.error);
                if (hasError) {
                    executeErrorMessage(script);
                    return false;
                }
            }
            catch (e) {
                executeErrorMessage(script);
                return false;
            }
        }
    }
    return true;
};
function replaceSafeVariables(command, variables) {
    try {
        return Handlebars.compile(command)(variables);
    }
    catch (error) {
        console.error(chalk.red(`❌ Error while replacing variables: ${error.message}`));
        return command;
    }
}
//# sourceMappingURL=apply-prisma-scripts.js.map