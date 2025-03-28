import Handlebars from "handlebars";
/**
 * Builds a Handlebars template by loading the template file and compiling it with the provided data.
 *
 * @param templateName - The name of the template file (without the .hbs extension).
 * @param data - The data object to populate the template.
 * @returns The compiled template as a string.
 */
export declare function buildHandlebarsTemplate(templateName: string, data: any): string;
export declare function devBuildHandlebarsTemplate(templateName: string, data: any): string;
export declare function buildHandlebarsTemplateWithPath(templateFilePath: string, data: any): string | null;
export default Handlebars;
//# sourceMappingURL=handlebars.d.ts.map