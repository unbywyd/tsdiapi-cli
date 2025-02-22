"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAppConfigParams = addAppConfigParams;
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const ts_morph_1 = require("ts-morph");
const format_1 = require("./format");
// Utility function to ensure imports are present or add them if missing
function ensureImports(sourceFile, imports) {
    imports.forEach(({ name, moduleSpecifier }) => {
        const existingImport = sourceFile
            .getImportDeclarations()
            .find((imp) => imp.getModuleSpecifierValue() === moduleSpecifier);
        if (existingImport) {
            // Check if the named import already exists
            const existingNamedImport = existingImport
                .getNamedImports()
                .find((n) => n.getName() === name);
            if (!existingNamedImport) {
                existingImport.addNamedImport(name);
            }
        }
        else {
            // Add the new import declaration
            sourceFile.addImportDeclaration({
                moduleSpecifier,
                namedImports: [name],
            });
        }
    });
}
async function addAppConfigParams(projectDir, params) {
    try {
        const appConfigPath = path_1.default.join(projectDir, 'src/app.config.ts');
        // Initialize ts-morph project
        const project = new ts_morph_1.Project();
        const sourceFile = project.addSourceFileAtPath(appConfigPath);
        // Ensure required imports are present
        ensureImports(sourceFile, [
            { name: 'Expose', moduleSpecifier: 'class-transformer' },
            { name: 'Type', moduleSpecifier: 'class-transformer' },
            { name: 'IsString', moduleSpecifier: 'class-validator' },
            { name: 'IsNumber', moduleSpecifier: 'class-validator' },
            { name: 'IsBoolean', moduleSpecifier: 'class-validator' },
        ]);
        // Find the class declaration
        const classDeclaration = sourceFile.getClass('ConfigSchema');
        if (!classDeclaration) {
            return;
        }
        params.forEach((param) => {
            // Check if the property already exists
            const existingProperty = classDeclaration.getProperty(param.key);
            if (existingProperty) {
                console.log(chalk_1.default.yellow(`Property '${param.key}' already exists in ConfigSchema.`));
                return;
            }
            // Add the new property with decorators based on the type
            const typeMap = {
                string: 'String',
                number: 'Number',
                boolean: 'Boolean',
            };
            const property = classDeclaration.addProperty({
                name: param.key,
                type: param.type,
            });
            property.addDecorator({ name: 'Is' + (0, format_1.capitalize)(param.type), arguments: [] });
            property.addDecorator({ name: 'Expose', arguments: [] });
            property.addDecorator({
                name: 'Type',
                arguments: [`() => ${typeMap[param.type]}`],
            });
        });
        // Save the modified file
        await sourceFile.save();
        console.log(chalk_1.default.green('app.config.ts has been successfully updated.'));
    }
    catch (error) {
        console.error(chalk_1.default.red('An error occurred while updating app.config.ts:'), error.message);
    }
}
//# sourceMappingURL=app.config.js.map