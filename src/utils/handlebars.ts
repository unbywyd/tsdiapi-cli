import Handlebars from "handlebars";
import { toCamelCase, toKebabCase, toLowerCase, toPascalCase } from "./format";

Handlebars.registerHelper("camelCase", (str) => {
    if(typeof str !== "string") return str;
    return toCamelCase(str);
});
Handlebars.registerHelper("camelcase", (str) => {
    if (typeof str !== "string") return str;
    return toCamelCase(str);
});
Handlebars.registerHelper("pascalcase", (str) => {
    if (typeof str !== "string") return str;
    return toPascalCase(str);
});
Handlebars.registerHelper("pascalCase", (str) => {
    if (typeof str !== "string") return str;
    return toPascalCase(str);
});
Handlebars.registerHelper("kebabcase", (str) => {
    if (typeof str !== "string") return str;
    return toKebabCase(str);
});
Handlebars.registerHelper("kebabCase", (str) => {
    if (typeof str !== "string") return str;
    return toKebabCase(str);
});
Handlebars.registerHelper("lowerCase", (str) => {
    if (typeof str !== "string") return str;
    return toLowerCase(str);
});
Handlebars.registerHelper("lowercase", (str) => {
    if (typeof str !== "string") return str;
    return toLowerCase(str);
});

export default Handlebars;