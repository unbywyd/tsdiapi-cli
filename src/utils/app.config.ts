import path from 'path'
import chalk from 'chalk'
import { Project, SourceFile, ClassDeclaration } from 'ts-morph'
import { capitalize } from './format.js'


// Utility function to ensure imports are present or add them if missing
function ensureImports(
    sourceFile: SourceFile,
    imports: { name: string; moduleSpecifier: string }[]
) {
    imports.forEach(({ name, moduleSpecifier }) => {
        const existingImport = sourceFile
            .getImportDeclarations()
            .find((imp: any) => imp.getModuleSpecifierValue() === moduleSpecifier)

        if (existingImport) {
            // Check if the named import already exists
            const existingNamedImport = existingImport
                .getNamedImports()
                .find((n: any) => n.getName() === name)
            if (!existingNamedImport) {
                existingImport.addNamedImport(name)
            }
        } else {
            // Add the new import declaration
            sourceFile.addImportDeclaration({
                moduleSpecifier,
                namedImports: [name],
            })
        }
    })
}


export type AppParam = {
    key: string
    type: 'string' | 'number' | 'boolean'
}

export async function addAppConfigParams(projectDir: string, params: AppParam[]) {
    try {
        const appConfigPath = path.join(projectDir, 'src/app.config.ts')

        // Initialize ts-morph project
        const project = new Project()
        const sourceFile: SourceFile = project.addSourceFileAtPath(appConfigPath)

        // Ensure required imports are present
        ensureImports(sourceFile, [
            { name: 'Expose', moduleSpecifier: 'class-transformer' },
            { name: 'Type', moduleSpecifier: 'class-transformer' },
            { name: 'IsString', moduleSpecifier: 'class-validator' },
            { name: 'IsNumber', moduleSpecifier: 'class-validator' },
            { name: 'IsBoolean', moduleSpecifier: 'class-validator' },
        ])

        // Find the class declaration
        const classDeclaration: ClassDeclaration | undefined = sourceFile.getClass('ConfigSchema')
        if (!classDeclaration) {
            return
        }

        params.forEach((param) => {
            // Check if the property already exists
            const existingProperty = classDeclaration.getProperty(param.key)
            if (existingProperty) {
                console.log(chalk.yellow(`Property '${param.key}' already exists in ConfigSchema.`))
                return
            }

            // Add the new property with decorators based on the type
            const typeMap = {
                string: 'String',
                number: 'Number',
                boolean: 'Boolean',
            }

            const property = classDeclaration.addProperty({
                name: param.key,
                type: param.type,
            })

            property.addDecorator({ name: 'Is' + capitalize(param.type), arguments: [] })
            property.addDecorator({ name: 'Expose', arguments: [] })
            property.addDecorator({
                name: 'Type',
                arguments: [`() => ${typeMap[param.type]}`],
            })
        })

        // Save the modified file
        await sourceFile.save()
        console.log(chalk.green('app.config.ts has been successfully updated.'))
    } catch (error) {
        console.error(chalk.red('An error occurred while updating app.config.ts:'), error.message)
    }
}