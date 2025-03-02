import chalk from "chalk";
import { findTSDIAPIServerProject } from "../utils/app-finder";
import { getPluginMetaDataFromRoot } from "../utils/plg-metadata";

export async function checkPluginConfig() {
    const currentDirectory = await findTSDIAPIServerProject();
    if (!currentDirectory) {
        return console.log(chalk.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
    }
    const config = await getPluginMetaDataFromRoot(currentDirectory);
    if (!config) {
        return console.log(chalk.red(`No plugin configuration found`));
    }
    return true;
}