import { SourceFile } from "ts-morph";

/**
 * Safely inserts an import statement if not already present.
 */
export function addSafeImport(sourceFile: SourceFile, importStatement: string) {
    const trimmed = importStatement.trim();

    // Try to parse using temporary file (safe AST parsing)
    const temp = sourceFile.getProject().createSourceFile("__temp__.ts", trimmed, { overwrite: true });

    const tempImport = temp.getImportDeclarations()[0];
    if (!tempImport) {
        console.warn(`⚠️ Skipping invalid import: ${trimmed}`);
        return;
    }

    const moduleSpecifier = tempImport.getModuleSpecifierValue();
    const namedImports = tempImport.getNamedImports().map(i => i.getText());
    const defaultImport = tempImport.getDefaultImport()?.getText();

    const existing = sourceFile.getImportDeclarations().find(imp =>
        imp.getModuleSpecifierValue() === moduleSpecifier
    );

    if (existing) {
        // Merge default import
        if (defaultImport && !existing.getDefaultImport()) {
            existing.setDefaultImport(defaultImport);
        }

        // Merge named imports
        const currentNamed = existing.getNamedImports().map(i => i.getName());
        const toAdd = namedImports.filter(n => !currentNamed.includes(n));
        if (toAdd.length) {
            existing.addNamedImports(toAdd);
        }
    } else {
        // If no existing import, copy full AST-based import
        sourceFile.insertImportDeclaration(0, {
            defaultImport,
            namedImports,
            moduleSpecifier
        });
    }

    // Cleanup temp
    temp.deleteImmediatelySync();
} 