import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.blindpay');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface CLIConfig {
    apiKey?: string;
    baseUrl?: string;
}

export function readConfig(): CLIConfig {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        }
    } catch { /* ignore */ }
    return {};
}

export function writeConfig(config: CLIConfig): void {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getApiKey(): string {
    const envKey = process.env.BLINDPAY_API_KEY;
    if (envKey) return envKey;

    const config = readConfig();
    if (config.apiKey) return config.apiKey;

    throw new Error('No API key found. Run `blindpay init` or set BLINDPAY_API_KEY.');
}

export function getBaseUrl(): string {
    const config = readConfig();
    return config.baseUrl || process.env.BLINDPAY_BASE_URL || 'https://api.blindpay.xyz';
}
