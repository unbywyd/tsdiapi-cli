
import Handlebars from 'handlebars'
import fs from 'fs-extra'
import path from 'path'
/**
 * Builds a Handlebars template by loading the template file and compiling it with the provided data.
 *
 * @param templateName - The name of the template file (without the .hbs extension).
 * @param data - The data object to populate the template.
 * @returns The compiled template as a string.
 */
export function buildHandlebarsTemplate(templateName: string, data: any): string {
    try {
        // Define the path to the templates directory
        const templatePath = path.join(__dirname, '../', 'templates', templateName + '.hbs')

        // Check if the template file exists
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templatePath}`)
        }

        // Load the template content
        const templateContent = fs.readFileSync(templatePath, 'utf8')

        // Compile the template using Handlebars
        const template = Handlebars.compile(templateContent)

        // Generate the output by passing the data to the compiled template
        return template(data)
    } catch (error) {
        console.error(`Error building template "${templateName}":`, error)
        throw error
    }
}

export function buildHandlebarsTemplateWithPath(templateFilePath: string, data: any): string | null {
    try {
        // Check if the template file exists
        if (!fs.existsSync(templateFilePath)) {
            throw new Error(`Template file not found: ${templateFilePath}`)
        }

        // Load the template content
        const templateContent = fs.readFileSync(templateFilePath, 'utf8')

        // Compile the template using Handlebars
        const template = Handlebars.compile(templateContent)

        // Generate the output by passing the data to the compiled template
        return template(data)
    } catch (error) {
        console.error(`Error building template "${templateFilePath}":`, error)
        return null
    }
}