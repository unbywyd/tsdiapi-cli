"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nameToImportName = exports.toUpperCase = exports.toLowerCase = exports.toCapitalCase = exports.toSpaceCase = exports.toPathCase = exports.toDotNotation = exports.toCobolCase = exports.toAdaCase = exports.toTrainCase = exports.toConstantCase = exports.toSnakeCase = exports.toKebabCase = exports.toPascalCase = exports.toCamelCase = exports.spaceSplit = exports.magicSplit = void 0;
exports.camelCase = camelCase;
exports.pascalCase = pascalCase;
exports.kebabCase = kebabCase;
exports.snakeCase = snakeCase;
exports.constantCase = constantCase;
exports.trainCase = trainCase;
exports.adaCase = adaCase;
exports.cobolCase = cobolCase;
exports.dotNotation = dotNotation;
exports.pathCase = pathCase;
exports.spaceCase = spaceCase;
exports.capitalCase = capitalCase;
exports.lowerCase = lowerCase;
exports.upperCase = upperCase;
exports.splitAndPrefix = splitAndPrefix;
exports.getPartsAndIndexes = getPartsAndIndexes;
exports.capitaliseWord = capitaliseWord;
exports.normalizeName = normalizeName;
exports.capitalize = capitalize;
function camelCase(string, options) {
    return splitAndPrefix(string, options).reduce((result, word, index) => index === 0 || !(word[0] || '').match(exports.magicSplit) ? result + word.toLowerCase() : result + capitaliseWord(word), '');
}
function pascalCase(string, options) {
    return splitAndPrefix(string, options).reduce((result, word) => result + capitaliseWord(word), '');
}
function kebabCase(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '-' }).join('').toLowerCase();
}
function snakeCase(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '_' }).join('').toLowerCase();
}
function constantCase(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '_' }).join('').toUpperCase();
}
function trainCase(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '-' }).map(capitaliseWord).join('');
}
function adaCase(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '_' }).map(capitaliseWord).join('');
}
function cobolCase(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '-' }).join('').toUpperCase();
}
function dotNotation(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '.' }).join('');
}
function pathCase(string, options = { keepSpecialCharacters: true }) {
    return splitAndPrefix(string, options).reduce((result, word, i) => result + (i === 0 || word[0] === '/' ? '' : '/') + word, '');
}
function spaceCase(string, options = { keepSpecialCharacters: true }) {
    return splitAndPrefix(string, { ...options, prefix: ' ' }).join('');
}
function capitalCase(string, options = { keepSpecialCharacters: true }) {
    return splitAndPrefix(string, { ...options, prefix: ' ' }).reduce((result, word) => result + capitaliseWord(word), '');
}
function lowerCase(string, options = { keepSpecialCharacters: true }) {
    return splitAndPrefix(string, { ...options, prefix: ' ' }).join('').toLowerCase();
}
function upperCase(string, options = { keepSpecialCharacters: true }) {
    return splitAndPrefix(string, { ...options, prefix: ' ' }).join('').toUpperCase();
}
exports.magicSplit = /^[a-zà-öø-ÿа-я]+|[A-ZÀ-ÖØ-ßА-Я][a-zà-öø-ÿа-я]+|[a-zà-öø-ÿа-я]+|[0-9]+|[A-ZÀ-ÖØ-ßА-Я]+(?![a-zà-öø-ÿа-я])/g;
exports.spaceSplit = /\S+/g;
function splitAndPrefix(string, options) {
    const { keepSpecialCharacters = false, keep, prefix = '' } = options || {};
    const normalString = string.trim().normalize('NFC');
    const split = normalString.includes(' ') ? exports.spaceSplit : exports.magicSplit;
    const { parts, prefixes } = getPartsAndIndexes(normalString, split);
    return parts.map((_part, i) => {
        let foundPrefix = prefixes[i] || '';
        let part = _part;
        if (!keepSpecialCharacters) {
            part = keep ? part.replace(new RegExp(`[^a-zA-ZØßø0-9${keep.join('')}]`, 'g'), '') : part.replace(/[^a-zA-ZØßø0-9]/g, '');
            foundPrefix = '';
        }
        return i === 0 ? foundPrefix + part : (foundPrefix || prefix) + part;
    }).filter(Boolean);
}
function getPartsAndIndexes(string, splitRegex) {
    const result = { parts: [], prefixes: [] };
    let lastWordEndIndex = 0;
    for (const match of string.matchAll(splitRegex)) {
        if (typeof match.index !== 'number')
            continue;
        result.parts.push(match[0]);
        result.prefixes.push(string.slice(lastWordEndIndex, match.index).trim());
        lastWordEndIndex = match.index + match[0].length;
    }
    const tail = string.slice(lastWordEndIndex).trim();
    if (tail)
        result.parts.push(''), result.prefixes.push(tail);
    return result;
}
function capitaliseWord(string) {
    const match = string.matchAll(exports.magicSplit).next().value;
    const firstLetterIndex = match ? match.index : 0;
    return string.slice(0, firstLetterIndex + 1).toUpperCase() + string.slice(firstLetterIndex + 1).toLowerCase();
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
exports.toCamelCase = camelCase;
exports.toPascalCase = pascalCase;
exports.toKebabCase = kebabCase;
exports.toSnakeCase = snakeCase;
exports.toConstantCase = constantCase;
exports.toTrainCase = trainCase;
exports.toAdaCase = adaCase;
exports.toCobolCase = cobolCase;
exports.toDotNotation = dotNotation;
exports.toPathCase = pathCase;
exports.toSpaceCase = spaceCase;
exports.toCapitalCase = capitalCase;
exports.toLowerCase = lowerCase;
exports.toUpperCase = upperCase;
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
const nameToImportName = (name, suffix = "Plugin") => {
    return (0, exports.toPascalCase)(name) + suffix;
};
exports.nameToImportName = nameToImportName;
//# sourceMappingURL=format.js.map