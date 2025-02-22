# **TSDIAPI CLI**

A powerful and flexible command-line interface (CLI) for managing **TSDIAPI** projects. The CLI allows you to create, extend, and automate your API development workflow with built-in support for **plugins** and **generators**.

---

## **Overview**

TSDIAPI CLI is designed to provide a streamlined experience when working with **TSDIAPI-based servers**. It allows developers to:

- Quickly **initialize** new API projects.
- Extend functionality using **plugins**.
- Automate **code generation** for services, controllers, and events.
- Manage **configuration files** and environment variables.

By default, the generated project is minimal and provides a **solid foundation** for further customization.

---

## **Installation**

You can install the CLI globally using npm:

```bash
npm install -g @tsdiapi/cli
```

Once installed, you can use the `tsdiapi` command from any terminal.

---

## **Creating a New Project**

To create a new API project, use the following command:

```bash
tsdiapi init <project-name>
```

This will **guide you through an interactive setup** where you can configure the project name, host, and port.

### **Fast Initialization Mode**

For a quick setup that **skips all prompts** and **immediately starts the server**, use:

```bash
tsdiapi start <project-name>
```

This will create a project with default settings and start it instantly.

| Command       | Description                                                       |
|--------------|-------------------------------------------------------------------|
| `init`       | Creates a new project with interactive setup.                     |
| `start`      | Creates a new project with defaults and starts it immediately.    |

---

## **Extending Your Project with Plugins**

TSDIAPI allows for modular extensions through **plugins**. You can add plugins for features like **Prisma**, **Socket.IO**, **JWT authentication**, and more.

### **Adding Plugins**

To install a new plugin, use:

```bash
tsdiapi plugins add <plugin-name>
```

For example, to add Prisma support:

```bash
tsdiapi plugins add prisma
```

### **Configuring Plugins**

Some plugins require additional configuration. To configure a plugin, use:

```bash
tsdiapi plugins config <plugin-name>
```

This will guide you through setting up the necessary parameters.

You can find available plugins on **npm**:

[🔗 Explore all plugins](https://www.npmjs.com/search?q=%40tsdiapi)

---

## **Generating Code Automatically**

TSDIAPI CLI provides a **powerful code generation system**. It dynamically detects **installed plugins** and their associated **generators**.

### **Using Generators**

To generate code, use:

```bash
tsdiapi generate <resource> <name>
```

Example:

```bash
tsdiapi generate controller user
```

This will create a new **UserController**.

| Resource     | Description                          |
|-------------|--------------------------------------|
| `feature`   | Generate a new feature module.       |
| `service`   | Generate a new service.              |
| `controller`| Generate a new controller.           |
| `event`     | Generate an event handler.           |
| `prisma`    | Generate a Prisma model or resource. |
| `cron`      | Generate a cron job.                 |

### **How Generators Work**

- **Plugins define generators.** Each plugin can introduce new generation rules.
- The CLI **automatically detects installed plugins** and provides relevant generation options.
- You don’t need to configure generators manually—just install the necessary plugins!

---

## **How Plugins Work**

Plugins extend the functionality of a **TSDIAPI** server. Each plugin can:

- **Introduce new dependencies.**
- **Modify the project structure.**
- **Provide generators** for automatic code creation.
- **Expose configuration options.**

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

You can explore all available plugins on npm:

[🔗 Available Plugins](https://www.npmjs.com/search?q=%40tsdiapi)

---


## **Developing Plugins**

TSDIAPI CLI allows developers to create their own plugins to extend the framework. Plugins can introduce **new services, middleware, configurations, and generators**.

### **Creating a New Plugin**

To create a plugin template, run:

```bash
tsdiapi dev plugin <name>
```

This will generate a **basic plugin structure** including configuration files and a boilerplate setup.

### **Plugin Lifecycle Methods**

Each plugin supports the following lifecycle methods:

| Method         | Description |
|---------------|-------------|
| `onInit`      | Executed when the plugin is initialized. Ideal for setting up configurations. |
| `beforeStart` | Runs before the server starts. Used for preloading data or dependencies. |
| `afterStart`  | Runs after the server starts. Can be used for logging, event listeners, etc. |

### **Auto-loading Files**

If a plugin supports auto-loading files, it should specify `bootstrapFilesGlobPath` in its configuration.

Example:

```json
{
  "bootstrapFilesGlobPath": "*.events.ts"
}
```

This ensures that all event files matching the pattern are automatically registered.

### **Publishing a Plugin**

To publish a plugin, contact the **TSDIAPI** team and request publishing rights. You can reach out via email:

📧 Contact: **unbywyd@gmail.com**

🚀 Happy coding and developing with **TSDIAPI CLI**!

---

## **Contributing & Contact**

TSDIAPI is an open-source project. Contributions are always welcome! If you want to contribute, suggest features, or report issues, feel free to reach out.

📧 Contact: **unbywyd@gmail.com**

🚀 Happy coding with **TSDIAPI CLI**!

