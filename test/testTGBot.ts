import TelegramBot from "node-telegram-bot-api";
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: `.env.${process.env.NODE_ENV}` });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function testTGBot() {
    const message = "BOT WORKING";
    try {
        if (!TELEGRAM_BOT_TOKEN) {
            throw new Error(
                "Telegram bot token not found in environment variables",
            );
        }
        if (!TELEGRAM_CHAT_ID) {
            throw new Error(
                "Telegram chat id not found in environment variables",
            );
        } else {
            console.log("Bot token: ", TELEGRAM_BOT_TOKEN);
            console.log("Chat ID: ", TELEGRAM_CHAT_ID);
            const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
            const note = await bot.sendMessage(TELEGRAM_CHAT_ID, message);
            console.log("Telegram message sent: " + note.message_id);
        }
    } catch (error: any) {
        console.log("TELEGRAM ERROR [telegramInfo()]: " + error);
        return;
    }
}
testTGBot();
