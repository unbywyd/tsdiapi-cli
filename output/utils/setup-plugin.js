"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCommon = setupCommon;
const ajv_1 = __importDefault(require("ajv"));
const inquirer_1 = __importDefault(require("inquirer"));
const _1 = require(".");
const chalk_1 = __importDefault(require("chalk"));
const jexl_1 = __importDefault(require("jexl"));
const ajv = new ajv_1.default({ allErrors: true, strict: false });
function validateInput(schema) {
    const validate = ajv.compile(schema);
    return (input) => validate(input) ? true : schema?.errorMessage || "Invalid input.";
}
function applyTransform(expression) {
    if (!expression)
        return (input) => input;
    return (input) => {
        try {
            return jexl_1.default.evalSync(expression, { x: input });
        }
        catch (error) {
            console.error(`Error while applying transform: ${error.message}`);
            return input;
        }
    };
}
function convertWhenToFunction(expression) {
    if (!expression)
        return () => true;
    return (answers) => {
        try {
            return jexl_1.default.evalSync(expression, answers);
        }
        catch (error) {
            console.error(`Error while evaluating when expression: ${error.message}`);
            return false;
        }
    };
}
function generateInquirerQuestion(variable) {
    return {
        ...variable.inquirer,
        type: variable.inquirer?.type || (variable.type === "boolean" ? "confirm" : "input"),
        name: variable.key,
        message: variable.inquirer?.message || variable.description || variable.key,
        default: variable.inquirer?.default || variable.default || "",
        validate: variable.validate ? validateInput(variable.validate) : undefined,
        filter: variable.transform ? applyTransform(variable.transform) : undefined,
        when: convertWhenToFunction(variable.when)
    };
}
async function setupCommon(pluginName, projectDir, pluginConfig) {
    try {
        const varNames = pluginConfig.variables?.map((v) => v.key);
        if (!varNames?.length) {
            console.log(chalk_1.default.yellow(`No settings found for ${pluginName}. Skipping setup.`));
            console.log(chalk_1.default.green(`${pluginName} setup has been successfully completed.`));
            return;
        }
        const { setupCommon } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'setupCommon',
                message: `Do you want to configure ${pluginName} settings?`,
                default: true,
            },
        ]);
        if (!setupCommon) {
            console.log(chalk_1.default.yellow(`Setup of ${pluginName} settings has been skipped.`));
            console.log(chalk_1.default.green(`${pluginName} setup has been successfully completed.`));
            return;
        }
        const questions = pluginConfig.variables
            .filter((v) => v.inquirer && v.configurable)
            .map(generateInquirerQuestion);
        const envAnswers = await inquirer_1.default.prompt(questions);
        pluginConfig.variables.forEach((variable) => {
            const value = envAnswers[variable.key] ?? variable.default;
            (0, _1.updateAllEnvFilesWithVariable)(projectDir, variable.key, value);
        });
        console.log(chalk_1.default.green('.env file has been successfully updated with settings.'));
        const configParams = pluginConfig.variables?.map((v) => {
            return { key: v.key, type: v.type };
        });
        await (0, _1.addAppConfigParams)(projectDir, configParams);
        console.log(chalk_1.default.green(`${pluginName} settings have been successfully configured.`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error while setting up ${pluginName} settings: ${error.message}`));
    }
}
//# sourceMappingURL=setup-plugin.js.map