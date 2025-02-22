"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nameToImportName = void 0;
exports.toCamelCase = toCamelCase;
exports.toPascalCase = toPascalCase;
exports.toLowerCase = toLowerCase;
exports.normalizeName = normalizeName;
exports.capitalize = capitalize;
exports.toKebabCase = toKebabCase;
function toCamelCase(input) {
    return normalizeName(input, true);
}
function toPascalCase(input) {
    return normalizeName(input, false);
}
function toLowerCase(input) {
    return normalizeName(input, false)?.toLowerCase();
}
function normalizeName(input, lowercaseFirst) {
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
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function toKebabCase(input) {
    let cleaned = input.replace(/[^a-zA-Z0-9_\-\.]+/g, '');
    let words = cleaned.match(/[A-Za-z0-9]+/g) || [];
    if (words.length === 0) {
        throw new Error("Invalid input: no valid characters found.");
    }
    return words.join('-').toLowerCase();
}
const nameToImportName = (name, suffix = "Plugin") => {
    return toPascalCase(name) + suffix;
};
exports.nameToImportName = nameToImportName;
//# sourceMappingURL=format.js.map