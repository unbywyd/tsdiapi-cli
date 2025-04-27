import path from 'path';
import chalk from 'chalk';
import { CallExpression, ObjectLiteralExpression, Project, SourceFile, SyntaxKind, VariableDeclaration } from 'ts-morph';

// Utility function to ensure imports are present or add them if missing
function ensureImports(
  sourceFile: SourceFile,
  imports: { name: string; moduleSpecifier: string }[]
) {
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
    } else {
      // Add the new import declaration
      sourceFile.addImportDeclaration({
        moduleSpecifier,
        namedImports: [name],
      });
    }
  });
}

export type AppParam = {
  key: string;
  type: 'string' | 'number' | 'boolean';
};

export async function addAppConfigParams(
  projectDir: string,
  params: AppParam[]
) {
  try {
    const appConfigPath = path.join(projectDir, 'src/app.config.ts')

    const project = new Project({
      tsConfigFilePath: path.join(projectDir, 'tsconfig.json'),
    })

    const sourceFile = project.addSourceFileAtPathIfExists(appConfigPath)

    if (!sourceFile) {
      console.log(chalk.red(`ERROR: File 'app.config.ts' not found at ${appConfigPath}.`))
      return
    }

    ensureImports(sourceFile, [{ name: 'Type', moduleSpecifier: '@sinclair/typebox' }])

    const configSchemaDecl = sourceFile
      .getVariableDeclarations()
      .find((v) => v.getName() === 'ConfigSchema') as VariableDeclaration | undefined

    if (!configSchemaDecl) {
      console.log(chalk.red(`ERROR: 'ConfigSchema' variable not found in ${appConfigPath}.`))
      return
    }

    const initializer = configSchemaDecl.getInitializer()

    if (!initializer) {
      console.log(chalk.red(`ERROR: 'ConfigSchema' has no initializer.`))
      return
    }


    if (!initializer.isKind(SyntaxKind.CallExpression)) {
      console.log(chalk.red(`ERROR: 'ConfigSchema' is not a function call (Type.Object({...})).`))
      return
    }

    const callExpr = initializer as CallExpression
    const expressionText = callExpr.getExpression().getText()

    if (expressionText !== 'Type.Object') {
      console.log(chalk.red(`ERROR: 'ConfigSchema' is initialized with '${expressionText}', not 'Type.Object'.`))
      return
    }

    const args = callExpr.getArguments()
    if (!args.length) {
      console.log(chalk.red(`ERROR: 'Type.Object()' has no arguments.`))
      return
    }

    const objectArg = args[0]
    if (!objectArg || !objectArg.isKind(SyntaxKind.ObjectLiteralExpression)) {
      console.log(chalk.red(`ERROR: First argument to 'Type.Object()' is not an object literal.`))
      return
    }

    const objectLiteral = objectArg as ObjectLiteralExpression

    params.forEach((param) => {
      const existingProp = objectLiteral.getProperty(param.key)
      if (existingProp) {
        console.log(chalk.yellow(`Property '${param.key}' already exists in ConfigSchema.`))
        return
      }

      const typeBoxMap = {
        string: 'Type.String()',
        number: 'Type.Number()',
        boolean: 'Type.Boolean()',
      }

      objectLiteral.addPropertyAssignment({
        name: param.key,
        initializer: typeBoxMap[param.type],
      })
    })

    await sourceFile.save()
    console.log(chalk.green('app.config.ts has been successfully updated (TypeBox).'))
  } catch (error: any) {
    console.error(chalk.red('An error occurred while updating app.config.ts:'), error.message)
  }
}