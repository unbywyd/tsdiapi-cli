import fs from 'fs'
import path from "path";
import { PluginMetadata, validatePluginConfig } from './plugins-configuration.js';

export async function getPluginMetaDataFromRoot(packagePath: string) {
    const configPath = path.join(packagePath, 'tsdiapi.config.json');
    if (!fs.existsSync(configPath)) {
        return null;
    } else {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const isValid = validatePluginConfig(config);
            if (!isValid) {
                return null;
            } else {
                return config;
            }
        } catch (error) {
            console.error(`Error loading plugin configuration: ${error.message}`);
            return null;
        }
    }
}

export async function getPluginMetadata(currentDirectory: string, packageName: string): Promise<PluginMetadata | null> {
    const packagePath = path.join(currentDirectory, 'node_modules', packageName);
    const configPath = path.join(packagePath, 'tsdiapi.config.json');
    if (!fs.existsSync(configPath)) {
        return null;
    } else {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const isValid = validatePluginConfig(config);
            if (!isValid) {
                return null;
            } else {
                return config;
            }
        } catch (error) {
            console.error(`Error loading plugin configuration: ${error.message}`);
            return null;
        }
    }
}

export async function getPluginMetaDataFromPath(packagePath: string): Promise<PluginMetadata | null> {
    const configPath = path.join(packagePath, 'tsdiapi.config.json');
    if (!fs.existsSync(configPath)) {
        return null;
    } else {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const isValid = validatePluginConfig(config);
            if (!isValid) {
                return null;
            } else {
                return config;
            }
        } catch (error) {
            console.error(`Error loading plugin configuration: ${error.message}`);
            return null;
        }
    }
}

