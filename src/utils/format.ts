
export function toCamelCase(input: string): string {
    return normalizeName(input, true);
}

export function toPascalCase(input: string): string {
    return normalizeName(input, false);
}
export function toLowerCase(input: string): string {
    return normalizeName(input, false)?.toLowerCase();
}

export function normalizeName(input: string, lowercaseFirst: boolean): string {
    // 1. Удаляем всё, кроме латинских букв, цифр и разделителей (превращаем их в пробелы)
    let cleaned = input.replace(/[^a-zA-Z0-9]+/g, ' ');

    // 2. Разбиваем строку на слова (по пробелам или разделителям)
    let words = cleaned.trim().split(/\s+/);

    // 3. Фильтруем пустые элементы и убираем цифры в начале
    words = words.filter(word => word.length > 0 && !/^\d+$/.test(word));

    if (words.length === 0) {
        throw new Error("Invalid input: no valid characters found.");
    }

    // 4. Делаем каждое слово с заглавной буквы
    let formatted = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    // 5. Если требуется camelCase, первая буква остаётся в нижнем регистре
    if (lowercaseFirst && formatted.length) {
        formatted[0] = formatted[0].charAt(0).toLowerCase() + formatted[0].slice(1);
    }

    return formatted.join('');
}

export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export function toKebabCase(input: string): string {
    let cleaned = input.replace(/[^a-zA-Z0-9_\-\.]+/g, '');

    let words = cleaned.match(/[A-Za-z0-9]+/g) || [];

    if (words.length === 0) {
        throw new Error("Invalid input: no valid characters found.");
    }

    return words.join('-').toLowerCase();
}


export const nameToImportName = (name: string, suffix: string = "Plugin"): string => {
    return toPascalCase(name) + suffix;
};

export function toConstantCase(input: string): string {
    return input
        .normalize("NFD") // Normalize accents
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9_]/g, "_") // Replace special characters with underscores (keep existing underscores)
        .trim() // Trim spaces
        .replace(/_+/g, "_") // Collapse multiple underscores
        .toUpperCase(); // Convert to uppercase
}
