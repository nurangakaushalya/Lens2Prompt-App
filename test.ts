import { analyzeImage } from './services/geminiService';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.API_KEY = process.env.GEMINI_API_KEY;

const test = async () => {
    try {
        console.log("Starting analysis...");
        const result = await analyzeImage('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'image/png');
        console.log("Analysis Result:", result);
    } catch (e) {
        console.error("Error analyzing image:", e);
    }
}
test();
