import TelegramBot from "node-telegram-bot-api";
import { config } from "./settings.js";
import chalk from "chalk";

export function connectbot() {
    if (!config.telegram.token) {
        console.error(chalk.red("Error: Telegram Token is missing in config/settings.js"));
        process.exit(1);
    }

    const bot = new TelegramBot(config.telegram.token, { polling: true });

    console.log(chalk.blue(`
    ____  ___                  .__  .__               
    \\   \\/  /_______  _______  |  | |__|__ __  _____  
     \\     //  _ \\  \\/ /\\__  \\ |  | |  |  |  \\/     \\ 
     /     (  <_> )   /  / __ \\|  |_|  |  |  /  Y Y  \\
    /___/\\  \\____/ \\_/  (____  /____/__|____/|__|_|  /
          \\_/                \\/                    \\/ `));
    console.log(chalk.blue("========================================================="));
    console.log(chalk.green(`
        Success Connected to ${config.app.name}
        Version: ${config.app.version}
        Author:  ${config.app.author}
        Web URL: ${config.app.urlWeb}:${config.app.port}
        Status:  Online & Active
        `));
    console.log(chalk.blue("========================================================="));

    return bot;
}