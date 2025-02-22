"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInput = validateInput;
exports.applyTransform = applyTransform;
exports.convertWhenToFunction = convertWhenToFunction;
const ajv_1 = __importDefault(require("ajv"));
const jexl_1 = __importDefault(require("jexl"));
jexl_1.default.addFunction('capitalize', (str) => {
    if (!str || typeof str !== "string")
        return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
});
const ajv = new ajv_1.default({ allErrors: true, strict: false });
function validateInput(schema) {
    if (typeof schema === "string") {
        const fixedSchema = schema.replace(/\\\\/g, "\\");
        const regex = new RegExp(fixedSchema);
        return (input) => {
            return regex.test(input) ? true : `Invalid input: does not match pattern ${schema}`;
        };
    }
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
//# sourceMappingURL=inquirer.js.map