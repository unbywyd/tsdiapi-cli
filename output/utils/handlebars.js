"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const handlebars_1 = __importDefault(require("handlebars"));
const format_1 = require("./format");
handlebars_1.default.registerHelper("camelCase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toCamelCase)(str);
});
handlebars_1.default.registerHelper("camelcase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toCamelCase)(str);
});
handlebars_1.default.registerHelper("pascalcase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toPascalCase)(str);
});
handlebars_1.default.registerHelper("pascalCase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toPascalCase)(str);
});
handlebars_1.default.registerHelper("kebabcase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toKebabCase)(str);
});
handlebars_1.default.registerHelper("kebabCase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toKebabCase)(str);
});
handlebars_1.default.registerHelper("lowerCase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toLowerCase)(str);
});
handlebars_1.default.registerHelper("lowercase", (str) => {
    if (typeof str !== "string")
        return str;
    return (0, format_1.toLowerCase)(str);
});
exports.default = handlebars_1.default;
//# sourceMappingURL=handlebars.js.map