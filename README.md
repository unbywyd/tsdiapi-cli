# **TSDIAPI CLI**

A powerful and flexible command-line interface (CLI) for managing **TSDIAPI** projects. The CLI allows you to create, extend, and automate your API development workflow with built-in support for **plugins** and **generators**.

---

## **Overview**

TSDIAPI CLI is designed to provide a streamlined experience when working with **TSDIAPI-based servers**. It allows developers to:

- **Initialize** new API projects quickly.
- **Extend functionality** using modular plugins.
- **Automate code generation** for services, controllers, and events.
- **Manage configuration files** and environment variables effortlessly.

By default, the generated project provides a **solid foundation** for further customization.

---

## **Installation**

Install the CLI globally using npm:

```bash
npm install -g @tsdiapi/cli
```

Once installed, use the `tsdiapi` command from any terminal.

---

## **Creating a New Project**

To create a new API project, use:

```bash
tsdiapi init <project-name>
```

This will **guide you through an interactive setup**, allowing you to configure project details like name, host, and port.

### **Quick Start**

For a fast setup that **skips all prompts** and **immediately starts the server**, use:

```bash
tsdiapi start <project-name>
```

| Command | Description                                                    |
| ------- | -------------------------------------------------------------- |
| `init`  | Creates a new project with interactive setup.                  |
| `start` | Creates a new project with defaults and starts it immediately. |

---

## **Extending Your Project with Plugins**

TSDIAPI supports modular extensions through **plugins**. Plugins can introduce features like **Prisma ORM**, **Socket.IO**, **JWT authentication**, and more.

### **Installing Plugins**

To install a new plugin, use:

```bash
tsdiapi plugins add <plugin-name>
```

For example, to add Prisma support:

```bash
tsdiapi plugins add prisma
```

### **Configuring Plugins**

Some plugins require additional configuration. Use:

```bash
tsdiapi plugins config <plugin-name>
```

This will guide you through setting up the necessary parameters.

🔗 [Explore all available plugins](https://www.npmjs.com/search?q=%40tsdiapi)

---

## **Generating Code Automatically**

TSDIAPI CLI features a **powerful code generation system** that detects installed plugins and their **generators** dynamically.

### **Using Generators**

To generate code, use:

```bash
tsdiapi generate <resource|pluginName> <name>
```

Example:

```bash
tsdiapi generate controller user
```

This will create a **UserController**.

| Resource     | Description                    |
| ------------ | ------------------------------ |
| `feature`    | Generate a new feature module. |
| `service`    | Generate a new service.        |
| `controller` | Generate a new controller.     |

### **How Generators Work**

- **Plugins define generators.** Each plugin can introduce its own generators.
- The CLI **automatically detects installed plugins** and provides relevant options.
- You don’t need to configure generators manually—just install the required plugins.

---

## **How Plugins Work**

Plugins extend **TSDIAPI** by introducing new services, middleware, configurations, and generators.

### **Plugin System Diagram**

```
+---------------------------+
|       TSDIAPI CLI        |
+---------------------------+
        |        |
        v        v
+--------------+ +--------------+
|  Plugins     | |  Generators  |
+--------------+ +--------------+
        |        |
        v        v
+--------------+ +--------------+
|  Prisma      | |  Controllers |
|  Socket.IO   | |  Services    |
|  Cron Jobs   | |  Events      |
+--------------+ +--------------+
```

🔗 [Available Plugins](https://www.npmjs.com/search?q=%40tsdiapi)

---

## **Developing Plugins**

TSDIAPI CLI allows developers to create custom plugins that extend the framework.

For detailed development instructions, see [DEV.README.md](https://github.com/unbywyd/tsdiapi-cli/blob/master/DEV.README.md).

### **Development Commands (`tsdiapi dev`)**

The `dev` command provides tools for **plugin development**. It allows you to quickly scaffold a new plugin and validate its configuration.

#### **Creating a New Plugin**

To generate a new plugin, use:

```bash
tsdiapi dev plugin <name>
```

This will prompt you to configure the plugin by providing:

- A **name** (automatically converted to the correct format).
- A **description**.
- An **author name**.
- A **GitHub repository URL** (optional).
- Whether the plugin should support **automatic file loading**.
- And other settings.

Once configured, the CLI will:

1. **Create the plugin directory**.
2. **Generate the necessary files** (e.g., `index.ts`, `package.json`, `README.md`).
3. **Set up a base plugin structure** with optional bootstrap support.
4. **Install dependencies** required for the plugin.

After completion, you can start modifying the generated plugin to fit your needs.

---

#### **Validating Plugin Configuration**

To check if a plugin’s configuration is correct, use:

```bash
tsdiapi dev check
```

This command validates the plugin’s `tsdiapi.config.json` file and ensures that:

- All **required fields** are present.
- No **conflicting configurations** exist.
- The **plugin structure** follows the best practices.

If errors are found, the CLI will output detailed messages to help you resolve them.

---

### **Plugin Lifecycle Methods**

Each plugin supports the following lifecycle methods:

| Method        | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| `onInit`      | Executed when the plugin is initialized, used for setup.            |
| `beforeStart` | Runs before the server starts, used for preloading dependencies.    |
| `afterStart`  | Runs after the server starts, ideal for logging or event listeners. |

### **Auto-loading Files**

If a plugin supports auto-loading files, it should specify `bootstrapFilesGlobPath` in its configuration.

Example:

```json
{
  "bootstrapFilesGlobPath": "*.events.ts"
}
```

This ensures that all matching files are automatically registered.

### **Publishing a Plugin**

To publish a plugin, contact the **TSDIAPI** team and request publishing rights.

📧 Contact: [unbywyd](https://unbywyd.com)

🚀 Happy coding and developing with **TSDIAPI CLI**!

---

## **Contributing & Contact**

TSDIAPI is an open-source project. Contributions are always welcome! If you want to contribute, suggest features, or report issues, feel free to reach out.

📧 Contact: [unbywyd](https://unbywyd.com)

🚀 Happy coding with **TSDIAPI CLI**!
