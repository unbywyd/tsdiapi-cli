import { resolve as resolveTs, load, transformSource } from 'ts-node/esm';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { existsSync, statSync } from 'node:fs';
import { dirname, join, isAbsolute, resolve as pathResolve } from 'node:path';

function isDirectory(filePath) {
    try {
        return statSync(filePath).isDirectory();
    } catch {
        return false;
    }
}

function resolveDirectoryImport(specifier) {
    const indexPath = join(specifier, 'index.js');
    if (existsSync(indexPath)) {
        return pathToFileURL(indexPath).href;
    }
    return null;
}

export function resolve(specifier, context, defaultResolve) {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        const root = isProduction ? 'dist' : 'src';
        const alias = {
            "@base": root,
            "@features": root + "/api/features",
            "@api": root + "/api",
            "@generated": "generated"
        }

        for (const [key, value] of Object.entries(alias)) {
            if (specifier.startsWith(key + '/')) {
                const relativePath = specifier.substring(key.length + 1);
                let absolutePath = join(process.cwd(), value, relativePath);
                if (!isProduction) {
                    const tsPath = absolutePath.replace(/\.js$/, '.ts');
                    if (existsSync(tsPath)) {
                        absolutePath = tsPath;
                    }
                }

                specifier = absolutePath;
                break;
            }
        }
        if (specifier.endsWith('.js')) {
            let tsPath = !isProduction ? specifier.replace(/\.js$/, '.ts') : specifier;

            if (!isAbsolute(tsPath)) {
                const parentDir = context.parentURL ? dirname(fileURLToPath(context.parentURL)) : process.cwd();
                tsPath = pathResolve(parentDir, tsPath);
            }

            if (existsSync(tsPath)) {
                return resolveTs(pathToFileURL(tsPath).href, context, defaultResolve);
            }
        }

        if (isDirectory(specifier)) {
            const resolved = resolveDirectoryImport(specifier);
            if (resolved) {
                return defaultResolve(resolved, context);
            } else {
                throw new Error(`❌ Directory import '${specifier}' is not supported.`);
            }
        }
        if (!specifier.startsWith('file://') && isAbsolute(specifier)) {
            specifier = pathToFileURL(specifier).href;
        }
        if (specifier.endsWith('.ts') || specifier.endsWith('.tsx')) {
            return resolveTs(specifier, context, defaultResolve);
        }
        return defaultResolve(specifier, context);
    } catch (error) {
        console.error('Resolve error:', error);
        throw error;
    }
}

export { load, transformSource };
