import { PluginConfigVariable, PluginMetadata } from './types'
import Ajv from "ajv";
import inquirer, { Question } from 'inquirer';
import { addAppConfigParams, updateAllEnvFilesWithVariable } from '.';
import chalk from 'chalk';
import jexl from "jexl";


const ajv = new Ajv({ allErrors: true, strict: false });

function validateInput(schema: Record<string, any>): (input: any) => boolean | string {
    const validate = ajv.compile(schema);
    return (input) => validate(input) ? true : schema?.errorMessage || "Invalid input.";
}


function applyTransform(expression?: string): (input: any) => any {
    if (!expression) return (input) => input;

    return (input) => {
        try {
            return jexl.evalSync(expression, { x: input });
        } catch (error) {
            console.error(`Error while applying transform: ${error.message}`);
            return input;
        }
    };
}


function convertWhenToFunction(expression?: string): (answers: Record<string, any>) => boolean {
    if (!expression) return () => true;

    return (answers) => {
        try {
            return jexl.evalSync(expression, answers);
        } catch (error) {
            console.error(`Error while evaluating when expression: ${error.message}`);
            return false;
        }
    };
}

function generateInquirerQuestion(variable: PluginConfigVariable) {
    return {
        ...variable.inquirer,
        type: variable.inquirer?.type || (variable.type === "boolean" ? "confirm" : "input"),
        name: variable.key,
        message: variable.inquirer?.message || variable.description || variable.key,
        default: variable.inquirer?.default || variable.default || "",
        validate: variable.validate ? validateInput(variable.validate) : undefined,
        filter: variable.transform ? applyTransform(variable.transform) : undefined,
        when: convertWhenToFunction(variable.when)
    }
}


export async function setupCommon(pluginName: string, projectDir: string, pluginConfig: PluginMetadata) {
    try {
        const varNames = pluginConfig.variables?.map((v) => v.key);
        if (!varNames?.length) {
            console.log(chalk.yellow(`No settings found for ${pluginName}. Skipping setup.`));
            console.log(chalk.green(`${pluginName} setup has been successfully completed.`));
            return
        }
        const { setupCommon } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'setupCommon',
                message: `Do you want to configure ${pluginName} settings?`,
                default: true,
            },
        ]);
        if (!setupCommon) {
            console.log(chalk.yellow(`Setup of ${pluginName} settings has been skipped.`));
            console.log(chalk.green(`${pluginName} setup has been successfully completed.`));
            return
        }

        const questions: Question[] = pluginConfig.variables
            .filter((v) => v.inquirer && v.configurable)
            .map(generateInquirerQuestion);

        const envAnswers = await inquirer.prompt(questions as any);

        pluginConfig.variables.forEach((variable: any) => {
            const value = envAnswers[variable.key] ?? variable.default;
            updateAllEnvFilesWithVariable(projectDir, variable.key, value);
        });

        console.log(chalk.green('.env file has been successfully updated with settings.'));
        const configParams = pluginConfig.variables?.map((v) => {
            return { key: v.key, type: v.type }
        });
        await addAppConfigParams(projectDir, configParams);

        console.log(chalk.green(`${pluginName} settings have been successfully configured.`));
    } catch (error) {
        console.error(chalk.red(`Error while setting up ${pluginName} settings: ${error.message}`));
    }
}
