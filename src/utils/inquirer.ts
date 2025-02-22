import Ajv from "ajv";
import jexl from "jexl";

jexl.addFunction('capitalize', (str: string) => {
    if (!str || typeof str !== "string") return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
});

const ajv = new Ajv({ allErrors: true, strict: false });

export function validateInput(schema: Record<string, any> | string): (input: any) => boolean | string {
    if (typeof schema === "string") {
        const fixedSchema = schema.replace(/\\\\/g, "\\");
        const regex = new RegExp(fixedSchema);
        return (input) => {
            return regex.test(input) ? true : `Invalid input: does not match pattern ${schema}`;
        }
    }
    const validate = ajv.compile(schema);
    return (input) => validate(input) ? true : schema?.errorMessage || "Invalid input.";
}


export function applyTransform(expression?: string): (input: any) => any {
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


export function convertWhenToFunction(expression?: string): (answers: Record<string, any>) => boolean {
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
