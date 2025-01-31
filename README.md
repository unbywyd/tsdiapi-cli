# **TSDIAPI CLI**

A powerful and flexible command-line interface (CLI) for managing **TSDIAPI** projects. Easily initialize projects with built-in support for plugins like **Prisma**, **Socket.IO**, **Email services**, and more.

---

## **Features**

- Quickly generate and manage **TSDIAPI** projects.
- Add or remove plugins and resources on demand.
- Generate boilerplate code for services, controllers, events, and more.
- Manage configuration files, environment variables, and project structure.
- Run project tasks (`build`, `dev`, etc.) directly from the CLI.

---

## **Installation**

Install globally via npm:

```bash
npm install -g @tsdiapi/cli
```

Alternatively, add it to your project:

```bash
npm install --save-dev @tsdiapi/cli
```

---

## **Usage**

### **Create a New Project**

Use the `create` command to generate a new project:

```bash
tsdiapi create my-api-project
```

#### **Options**

You can specify additional options to include plugins during project setup:

```bash
tsdiapi create my-api-project --prisma --socket --cron
```

| Option     | Description                           |
| ---------- | ------------------------------------- |
| `--prisma` | Install and configure Prisma.         |
| `--socket` | Install and configure Socket.IO.      |
| `--cron`   | Install and configure Cron jobs.      |
| `--s3`     | Install and configure AWS S3 plugin.  |
| `--events` | Install and configure event handling. |
| `--jwt`    | Install and configure JWT auth.       |
| `--inforu` | Install and configure SMS (Inforu).   |
| `--email`  | Install and configure email services. |

---

## **Available Commands**

The CLI provides several commands to manage your project:

```bash
tsdiapi <command> [options]
```

### **Commands**

| Command      | Description                                                     |
| ------------ | --------------------------------------------------------------- |
| `init`       | Initialize a new TSDIAPI project (interactive mode).            |
| `start`      | Initialize or run the project in development mode (quick mode). |
| `create`     | Create a new TSDIAPI project with options.                      |
| `plugin:add` | Add a plugin to the project.                                    |
| `generate`   | Generate boilerplate code (features, services, etc).            |
| `build`      | Build the project.                                              |
| `dev`        | Run the project in development mode.                            |

#### **Generate Resources**

```bash
tsdiapi generate <resource> <name>
```

| Resource     | Description                          |
| ------------ | ------------------------------------ |
| `feature`    | Generate a new feature.              |
| `service`    | Generate a new service.              |
| `controller` | Generate a new controller.           |
| `event`      | Generate a new event handler.        |
| `prisma`     | Generate a Prisma model or resource. |
| `cron`       | Generate a cron job.                 |

Example:

```bash
tsdiapi generate controller user
```

---

## **Running the Project**

You can run project scripts directly using the CLI:

### **Build the Project**

```bash
tsdiapi build
```

### **Run in Development Mode**

```bash
tsdiapi dev
```

This command runs the `npm run dev` script from your project.

---

## **Plugin Support**

The CLI integrates seamlessly with plugins like **Prisma**, **Socket.IO**, **JWT Auth**, and others. Add plugins dynamically to your project:

```bash
tsdiapi plugin:add <plugin-name>
```

For example:

```bash
tsdiapi plugin:add cron
```

This command installs and configures the **Cron** plugin in your project.

---

## **Configuration**

The CLI generates necessary configuration files, including `.env`. Customize these files as needed for your project.

---

## **Contributing**

Contributions are welcome! Submit issues and pull requests at [GitHub](https://github.com/unbywyd/tsdiapi-cli).

---

## **License**

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
