import { PluginName } from "@src/config";

export function formatControllerName(name: string, lowercaseFirstLetter = false): string {
    const formattedName = name
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');

    if (lowercaseFirstLetter) {
        return formattedName.charAt(0).toLowerCase() + formattedName.slice(1);
    }

    return formattedName;
}


export function toKebabCase(name: string): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')  // Разделяем слова в CamelCase
        .toLowerCase();
}

export const nameToImportName = (name: PluginName): string => {
    return name
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, char: string) => char.toUpperCase()) // Capitalize after special characters
        .replace(/^[a-z]/, (char) => char.toUpperCase()) // Capitalize the first character of the name
        + 'Plugin'; // Append 'Plugin' to the end
};