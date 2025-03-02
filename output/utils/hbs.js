"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHandlebarsTemplate = buildHandlebarsTemplate;
exports.devBuildHandlebarsTemplate = devBuildHandlebarsTemplate;
exports.buildHandlebarsTemplateWithPath = buildHandlebarsTemplateWithPath;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("./handlebars"));
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
//# sourceMappingURL=hbs.js.map