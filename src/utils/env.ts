import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'


/**
 * Updates or adds a key-value pair in the .env file.
 *
 * @param envPath - Path to the .env file.
 * @param key - The key to update or add (e.g., "DATABASE_URL").
 * @param value - The value to set for the key.
 */

export function updateEnvVariable(envPath: string, key: string, value: string, onlyIfEmpty = false) {
    const envFilename = path.basename(envPath);

    try {
        let envContent = '';

        // Check if .env exists, if not create an empty one
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        } else {
            console.log(chalk.yellow(`${envFilename} file not found. Creating a new one at ${envPath}.`));
            fs.writeFileSync(envPath, '');
        }

        // Split the content into lines
        const lines = envContent.split('\n');

        // Update the key-value pair if it exists, or add a new one if it doesn't
        let found = false;
        const updatedLines = lines.map((line) => {
            const [currentKey, ...rest] = line.split('=');

            if (currentKey.trim() === key) {
                found = true;

                // If `onlyIfEmpty` is true, do not overwrite existing non-empty values
                if (onlyIfEmpty && rest.join('=').trim() !== '') {
                    console.log(chalk.yellow(`${key} already exists in ${envFilename} and will not be updated.`));
                    return line;
                }

                return `${key}="${value}"`; // Replace or update the value
            }

            return line; // Keep the line as is
        });

        if (!found) {
            updatedLines.push(`${key}="${value}"`); // Add the new key-value pair if not found
        }

        // Write the updated content back to the .env file
        fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
        console.log(chalk.green(`${key} updated in ${envFilename}.`));
    } catch (error) {
        console.error(chalk.red(`Failed to update ${key} in ${envFilename}:`), error.message);
    }
}

export function updateAllEnvFilesWithVariable(projectDir: string, key: string, value: string, onlyIfEmpty = false) {
    const envPath = path.join(projectDir, '.env')
    if (fs.existsSync(envPath)) {
        updateEnvVariable(envPath, key, value, onlyIfEmpty)
    }
    const envExamplePath = path.join(projectDir, '.env.development')
    if (fs.existsSync(envExamplePath)) {
        updateEnvVariable(envExamplePath, key, value, onlyIfEmpty)
    }
    const envProductionPath = path.join(projectDir, '.env.production')
    if (fs.existsSync(envProductionPath)) {
        updateEnvVariable(envProductionPath, key, value, onlyIfEmpty)
    }
}