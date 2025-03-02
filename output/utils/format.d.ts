export declare function camelCase(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare function pascalCase(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare function kebabCase(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare function snakeCase(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare function constantCase(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare function trainCase(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare function adaCase(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare function cobolCase(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare function dotNotation(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare function pathCase(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare function spaceCase(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare function capitalCase(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare function lowerCase(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare function upperCase(string: string, options?: {
    keepSpecialCharacters?: boolean;
    keep?: string[];
}): string;
export declare const magicSplit: RegExp;
export declare const spaceSplit: RegExp;
type SplitOptions = {
    keepSpecialCharacters?: boolean;
    keep?: string[];
    prefix?: string;
};
type PartsIndexes = {
    parts: string[];
    prefixes: string[];
};
export declare function splitAndPrefix(string: string, options?: SplitOptions): string[];
export declare function getPartsAndIndexes(string: string, splitRegex: RegExp): PartsIndexes;
export declare function capitaliseWord(string: string): string;
export declare function normalizeName(input: string, lowercaseFirst: boolean): string;
export declare const toCamelCase: typeof camelCase;
export declare const toPascalCase: typeof pascalCase;
export declare const toKebabCase: typeof kebabCase;
export declare const toSnakeCase: typeof snakeCase;
export declare const toConstantCase: typeof constantCase;
export declare const toTrainCase: typeof trainCase;
export declare const toAdaCase: typeof adaCase;
export declare const toCobolCase: typeof cobolCase;
export declare const toDotNotation: typeof dotNotation;
export declare const toPathCase: typeof pathCase;
export declare const toSpaceCase: typeof spaceCase;
export declare const toCapitalCase: typeof capitalCase;
export declare const toLowerCase: typeof lowerCase;
export declare const toUpperCase: typeof upperCase;
export declare function capitalize(str: string): string;
export declare const nameToImportName: (name: string, suffix?: string) => string;
export {};
//# sourceMappingURL=format.d.ts.map