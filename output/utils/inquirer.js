import Ajv from "ajv";
const ajv = new Ajv.default({ allErrors: true, strict: false });
import jexl from "jexl";
import { toCamelCase, toKebabCase, toLowerCase, toPascalCase, toSnakeCase, toUpperCase } from "./format.js";
jexl.addFunction('capitalize', (str) => {
    if (!str || typeof str !== "string")
        return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
});
jexl.addFunction('camelCase', (str) => {
    if (!str || typeof str !== "string")
        return str;
    return toCamelCase(str);
});
jexl.addFunction('kebabCase', (str) => {
    if (!str || typeof str !== "string")
        return str;
    return toKebabCase(str);
});
jexl.addFunction('pascalCase', (str) => {
    if (!str || typeof str !== "string")
        return str;
    return toPascalCase(str);
});
jexl.addFunction('lowerCase', (str) => {
    if (!str || typeof str !== "string")
        return str;
    return toLowerCase(str);
});
jexl.addFunction('snakeCase', (str) => {
    if (!str || typeof str !== "string")
        return str;
    return toSnakeCase(str);
});
jexl.addFunction('upperCase', (str) => {
    if (!str || typeof str !== "string")
        return str;
    return toUpperCase(str);
});
export function validateInput(schema) {
    if (typeof schema === "string") {
        const fixedSchema = schema.replace(/\\\\/g, "\\");
        const regex = new RegExp(fixedSchema);
        return (input) => {
            return regex.test(input) ? true : `Invalid input: does not match pattern ${schema}`;
        };
    }
    const validate = ajv.compile(schema);
    return (input) => {
        const isStringIsNumber = typeof input === "string" && !isNaN(Number(input)) ? parseFloat(input) : input;
        return validate(isStringIsNumber) ? true : schema?.errorMessage || "Invalid input.";
    };
}
export function applyTransform(expression) {
    if (!expression)
        return (input) => input;
    return (input) => {
        try {
            return jexl.evalSync(expression, { x: input });
        }
        catch (error) {
            console.error(`Error while applying transform: ${error.message}`);
            return input;
        }
    };
}
export function convertWhenToFunction(expression) {
    if (!expression)
        return () => true;
    return (answers) => {
        try {
            return jexl.evalSync(expression, answers);
        }
        catch (error) {
            console.error(`Error while evaluating when expression: ${error.message}`);
            return false;
        }
    };
}
//# sourceMappingURL=inquirer.js.map