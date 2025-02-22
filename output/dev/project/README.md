# **{{name}} Plugin for TSDIAPI**

{{description}}

## 📌 About

This is a **TSDIAPI** plugin designed to extend your server functionality. TSDIAPI is a modular framework that allows you to build scalable APIs with dynamic plugin support.

🔗 **TSDIAPI CLI:** [@tsdiapi/cli](https://www.npmjs.com/package/@tsdiapi/cli)

---

## 📦 Installation

You can install this plugin using npm:

```bash
npm install --save @tsdiapi/{{name}}
```

Then, register the plugin in your TSDIAPI project:

```typescript
import { createApp } from "@tsdiapi/server";
import createPlugin from "@tsdiapi/{{name}}";

createApp({
    plugins: [createPlugin()]
});
```

---

## 🚀 Features

- 🛠 **Extend TSDIAPI** with additional functionalities.
- ⚙ **Seamless integration** with your existing API.
- 🏗 **Fully configurable** to match your project needs.
{{#if withBootstrapFiles}}
- 🔄 **Automatic file loading** via `globEventsPath`.
{{/if}}

---

## 🔧 Configuration

This plugin can be configured via options when initializing:

```typescript
createPlugin({
    {{#if withBootstrapFiles}}
    globEventsPath: "*.{{name}}{.ts,.js}" // Auto-load event handlers
    {{/if}}
});
```

| Option            | Type   | Default | Description |
|------------------|-------|---------|-------------|
{{#if withBootstrapFiles}}
| `globEventsPath` | `string` | `"*.{{name}}{.ts,.js}"` | Glob pattern for auto-loading event files. |
{{/if}}

---

## 📌 How to Use

After installation, you can use this plugin as part of your **TSDIAPI** application. If additional configuration is required, it can be passed as an object when initializing the plugin.

### Example Usage:

```typescript
import { createApp } from "@tsdiapi/server";
import createPlugin from "@tsdiapi/{{name}}";

const app = createApp({
    plugins: [createPlugin({
        {{#if withBootstrapFiles}}
        globEventsPath: "features/**/*.{{name}}.ts"
        {{/if}}
    })]
});

app.start();
```

---

## 🔗 Related Plugins

You can find more **TSDIAPI** plugins here:  
🔗 [Available Plugins](https://www.npmjs.com/search?q=%40tsdiapi)

---

## 👨‍💻 Contributing

Contributions are always welcome! If you have ideas for improving this plugin, feel free to open a pull request.

{{#if author}}
**Author:** {{author}}  
{{/if}}
{{#if giturl}}
**GitHub Repository:** [{{giturl}}]({{giturl}})  
{{/if}}

📧 **Contact:** unbywyd@gmail.com

🚀 Happy coding with **TSDIAPI**! 🎉
