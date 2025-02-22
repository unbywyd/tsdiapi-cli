import "reflect-metadata";
import type { AppContext, AppPlugin } from "@tsdiapi/server";

export type PluginOptions = {
    {{#if withBootstrapFiles}}
    globEventsPath: string; 
    {{/if}}
}
const defaultConfig: PluginOptions = {
    {{#if withBootstrapFiles}}
    globEventsPath: "*.{{name}}{.ts,.js}",
    {{/if}}
}

class App implements AppPlugin {
    name = 'tsdiapi-{{name}}';
    config: PluginOptions;
    {{#if withBootstrapFiles}}
    bootstrapFilesGlobPath: string;
    {{/if}}
    context: AppContext;
    constructor(config?: PluginOptions) {
        this.config = { ...config };
        {{#if withBootstrapFiles}}
        this.bootstrapFilesGlobPath = this.config.globEventsPath || defaultConfig.globEventsPath;
        {{/if}}
    }
    async onInit(ctx: AppContext) {
        this.context = ctx;
        console.log('Hello, I am {{name}} plugin.');
    }
}

export default function createPlugin(config?: PluginOptions) {
    return new App(config);
}