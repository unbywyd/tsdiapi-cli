"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHandlebarsTemplate = buildHandlebarsTemplate;
exports.devBuildHandlebarsTemplate = devBuildHandlebarsTemplate;
exports.buildHandlebarsTemplateWithPath = buildHandlebarsTemplateWithPath;
const handlebars_1 = __importDefault(require("handlebars"));
const format_1 = require("./format");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
handlebars_1.default.registerHelper("camelCase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toCamelCase)(str);
});
handlebars_1.default.registerHelper("camelcase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toCamelCase)(str);
});
handlebars_1.default.registerHelper("pascalcase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toPascalCase)(str);
});
handlebars_1.default.registerHelper("pascalCase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toPascalCase)(str);
});
handlebars_1.default.registerHelper("kebabcase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toKebabCase)(str);
});
handlebars_1.default.registerHelper("kebabCase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toKebabCase)(str);
});
handlebars_1.default.registerHelper("lowerCase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toLowerCase)(str);
});
handlebars_1.default.registerHelper("lowercase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toLowerCase)(str);
});
/**
 * Builds a Handlebars template by loading the template file and compiling it with the provided data.
 *
 * @param templateName - The name of the template file (without the .hbs extension).
 * @param data - The data object to populate the template.
 * @returns The compiled template as a string.
 */
function buildHandlebarsTemplate(templateName, data) {
    try {
        // Define the path to the templates directory
        const templatePath = path_1.default.join(__dirname, '../', 'templates', templateName + '.hbs');
        // Check if the template file exists
        if (!fs_extra_1.default.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templatePath}`);
        }
        // Load the template content
        const templateContent = fs_extra_1.default.readFileSync(templatePath, 'utf8');
        // Compile the template using Handlebars
        const template = handlebars_1.default.compile(templateContent);
        // Generate the output by passing the data to the compiled template
        return template(data);
    }
    catch (error) {
        console.error(`Error building template "${templateName}":`, error);
        throw error;
    }
}
function devBuildHandlebarsTemplate(templateName, data) {
    try {
        // Define the path to the templates directory
        const templatePath = path_1.default.join(__dirname, '../', 'dev', templateName);
        // Check if the template file exists
        if (!fs_extra_1.default.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templatePath}`);
        }
        // Load the template content
        const templateContent = fs_extra_1.default.readFileSync(templatePath, 'utf8');
        // Compile the template using Handlebars
        const template = handlebars_1.default.compile(templateContent);
        // Generate the output by passing the data to the compiled template
        return template(data);
    }
    catch (error) {
        console.error(`Error building template "${templateName}":`, error);
        throw error;
    }
}
function buildHandlebarsTemplateWithPath(templateFilePath, data) {
    try {
        // Check if the template file exists
        if (!fs_extra_1.default.existsSync(templateFilePath)) {
            throw new Error(`Template file not found: ${templateFilePath}`);
        }
        // Load the template content
        const templateContent = fs_extra_1.default.readFileSync(templateFilePath, 'utf8');
        // Compile the template using Handlebars
        const template = handlebars_1.default.compile(templateContent);
        // Generate the output by passing the data to the compiled template
        return template(data);
    }
    catch (error) {
        console.error(`Error building template "${templateFilePath}":`, error);
        return null;
    }
}
exports.default = handlebars_1.default;
//# sourceMappingURL=handlebars.js.map