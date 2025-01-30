"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatControllerName = formatControllerName;
exports.toKebabCase = toKebabCase;
function formatControllerName(name, lowercaseFirstLetter = false) {
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
function toKebabCase(name) {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // Разделяем слова в CamelCase
        .toLowerCase();
}
//# sourceMappingURL=format.js.map