export function camelCase(string, options) {
    return splitAndPrefix(string, options).reduce((result, word, index) => index === 0 || !(word[0] || '').match(magicSplit) ? result + word.toLowerCase() : result + capitaliseWord(word), '');
}
export function pascalCase(string, options) {
    return splitAndPrefix(string, options).reduce((result, word) => result + capitaliseWord(word), '');
}
export function kebabCase(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '-' }).join('').toLowerCase();
}
export function snakeCase(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '_' }).join('').toLowerCase();
}
export function constantCase(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '_' }).join('').toUpperCase();
}
export function trainCase(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '-' }).map(capitaliseWord).join('');
}
export function adaCase(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '_' }).map(capitaliseWord).join('');
}
export function cobolCase(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '-' }).join('').toUpperCase();
}
export function dotNotation(string, options) {
    return splitAndPrefix(string, { ...options, prefix: '.' }).join('');
}
export function pathCase(string, options = { keepSpecialCharacters: true }) {
    return splitAndPrefix(string, options).reduce((result, word, i) => result + (i === 0 || word[0] === '/' ? '' : '/') + word, '');
}
export function spaceCase(string, options = { keepSpecialCharacters: true }) {
    return splitAndPrefix(string, { ...options, prefix: ' ' }).join('');
}
export function capitalCase(string, options = { keepSpecialCharacters: true }) {
    return splitAndPrefix(string, { ...options, prefix: ' ' }).reduce((result, word) => result + capitaliseWord(word), '');
}
export function lowerCase(string, options = { keepSpecialCharacters: true }) {
    return splitAndPrefix(string, { ...options, prefix: ' ' }).join('').toLowerCase();
}
export function upperCase(string, options = { keepSpecialCharacters: true }) {
    return splitAndPrefix(string, { ...options, prefix: ' ' }).join('').toUpperCase();
}
export const magicSplit = /^[a-zà-öø-ÿа-я]+|[A-ZÀ-ÖØ-ßА-Я][a-zà-öø-ÿа-я]+|[a-zà-öø-ÿа-я]+|[0-9]+|[A-ZÀ-ÖØ-ßА-Я]+(?![a-zà-öø-ÿа-я])|[A-ZÀ-ÖØ-ßА-Я][a-zà-öø-ÿа-я]+[A-ZÀ-ÖØ-ßА-Я][a-zà-öø-ÿа-я]+/g;
export const spaceSplit = /\S+/g;
export function splitAndPrefix(string, options) {
    const { keepSpecialCharacters = false, keep, prefix = '' } = options || {};
    const normalString = string.trim().normalize('NFC');
    const split = normalString.includes(' ') ? spaceSplit : magicSplit;
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
export function getPartsAndIndexes(string, splitRegex) {
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
export function capitaliseWord(string) {
    const match = string.matchAll(magicSplit).next().value;
    const firstLetterIndex = match ? match.index : 0;
    return string.slice(0, firstLetterIndex + 1).toUpperCase() + string.slice(firstLetterIndex + 1).toLowerCase();
}
export function normalizeName(input, lowercaseFirst) {
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
export const toCamelCase = camelCase;
export const toPascalCase = pascalCase;
export const toKebabCase = kebabCase;
export const toSnakeCase = snakeCase;
export const toConstantCase = constantCase;
export const toTrainCase = trainCase;
export const toAdaCase = adaCase;
export const toCobolCase = cobolCase;
export const toDotNotation = dotNotation;
export const toPathCase = pathCase;
export const toSpaceCase = spaceCase;
export const toCapitalCase = capitalCase;
export const toLowerCase = lowerCase;
export const toUpperCase = upperCase;
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
export const nameToImportName = (name, suffix = "Plugin") => {
    return toPascalCase(name) + suffix;
};
//# sourceMappingURL=format.js.map