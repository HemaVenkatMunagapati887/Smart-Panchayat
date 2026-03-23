const Groq = require('groq-sdk');
const logger = require('./logger');

// Initialize Groq
let groq = null;

const getGroq = () => {
    if (!groq && process.env.GROQ_API_KEY) {
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
    }
    return groq;
};

/**
 * Local fallback analysis for when AI API is unavailable.
 */
const localKeywordAnalysis = (text) => {
    const lowerText = text.toLowerCase();
    let category = 'other';
    let priority = 'medium';

    if (lowerText.includes('water') || lowerText.includes('pipe') || lowerText.includes('leak')) category = 'water';
    else if (lowerText.includes('light') || lowerText.includes('current') || lowerText.includes('electric')) category = 'streetlight';
    else if (lowerText.includes('garbage') || lowerText.includes('waste') || lowerText.includes('drain')) category = 'sanitation';
    else if (lowerText.includes('road') || lowerText.includes('pothole')) category = 'road';
    else if (lowerText.includes('health') || lowerText.includes('fever') || lowerText.includes('hospital')) category = 'health';

    if (lowerText.includes('urgent') || lowerText.includes('emergency') || lowerText.includes('danger') || lowerText.includes('immediate')) {
        priority = 'high';
    }

    return {
        category,
        priority,
        summary: `(Local Analysis) ${text.substring(0, 50)}...`,
        source: 'local_fallback'
    };
};

/**
 * Analyze grievance using Groq Cloud LLM (Llama 3.3 70B).
 */
const analyzeGrievance = async (text) => {
    const ai = getGroq();

    logger.info(`🧠 AI (Groq): Analyzing with Llama 3.3 70B: "${text?.substring(0, 40)}..."`);

    const apiKey = (process.env.GROQ_API_KEY || '').trim();

    if (!apiKey || apiKey.length < 10) {
        logger.warn('⚠️ AI: Groq API Key missing or too short. Using Local Fallback.');
        return localKeywordAnalysis(text);
    }

    try {
        const completion = await ai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a village administration assistant. Analyze the user's grievance and return a JSON object.
                    Fields:
                    - "category": Choose ONE from [sanitation, streetlight, water, road, health, other].
                    - "priority": Choose ONE from [low, medium, high].
                    - "summary": A very brief 1-sentence summary.

                    Rules:
                    - Garbage/drainage -> sanitation
                    - Electricity -> streetlight
                    - Pot hole -> road
                    - Leaks -> water`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content);
        logger.info(`✅ AI (Groq): Analysis complete.`);
        return { ...result, source: 'groq_llama_3.3_70b' };

    } catch (err) {
        logger.error(`❌ Groq Error: ${err.message}. Switching to Local Fallback.`);
        return localKeywordAnalysis(text);
    }
};

module.exports = { analyzeGrievance };
