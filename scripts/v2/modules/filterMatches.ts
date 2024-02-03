import fs from "fs";

export async function filterMatches(filteredTrades: string[]): Promise<string[]> {
    try {
        const data = JSON.parse(fs.readFileSync("./filtered.json", "utf-8"));
        filteredTrades = Array.isArray(JSON.parse(data)) ? JSON.parse(data) : [];
    } catch (error: any) {
        console.log("Error reading filtered.json: ", error.message, "Creating new filtered.json...");
        filteredTrades = [];
        fs.writeFileSync("./filtered.json", JSON.stringify(filteredTrades));
    }
    return filteredTrades;
}
