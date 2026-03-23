const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const multer = require('multer');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Multer Config for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Initialize Groq Client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `You are a helpful Smart Panchayat assistant helping village citizens. 
Provide simple explanations about government schemes, required documents, and complaint procedures. 
Use a friendly, professional tone. Keep answers short and easy to understand.

CRITICAL FORMATTING RULES: 
- Use ### for Section Headings to make it look organized.
- ALWAYS use bullet points (-) or numbered lists (1.) for documents or steps.
- Start each new point on a NEW LINE.
- Use **bold text** for key terms, document names, and offices.
- NO large blocks of text. Make it easy to scan like a professional guide.

VISION CAPABILITY (FORM ANALYSIS):
If a user uploads a form screenshot:
1. Identify the form type (e.g., Pension, Caste, or Grievance form).
2. Describe visible text from the form first before giving advice.
3. Explain each visible field step-by-step.
4. Tell the user what information they should enter and where to get it.
5. Provide a clear example for confusing fields (like "Annual Income").

Default language: English (but reply in the user's language if they ask in Telugu or others).`;

/**
 * @route   POST /api/chatbot/message
 * @desc    Get AI response for chatbot (supports text & images)
 * @access  Public
 */
router.post('/message', upload.single('image'), async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ success: false, message: 'Invalid request body' });
        }

        let { message, history } = req.body;

        // History might be JSON string if multipart
        if (typeof history === 'string') {
            try { history = JSON.parse(history); } catch (e) { history = []; }
        }

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const apiKey = (process.env.GROQ_API_KEY || '').trim();
        if (!apiKey || apiKey.length < 10) {
            return res.status(503).json({
                success: false,
                message: 'AI Service currently unavailable (Invalid API Key)'
            });
        }

        // DEBUG LOGS
        if (req.file) {
            console.log("📸 Image received:", req.file.originalname, `(${Math.round(req.file.size / 1024)} KB)`);
        }

        let model = "llama-3.3-70b-versatile";
        let userContent = [{ type: "text", text: message }];

        // Handle Image Upload
        if (req.file) {
            model = "meta-llama/llama-4-scout-17b-16e-instruct"; // Official Groq recommended replacement for all deprecated llama-3.2 vision models
            const base64Image = req.file.buffer.toString('base64');
            const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

            userContent = [
                { type: "text", text: message },
                {
                    type: "image_url",
                    image_url: {
                        url: dataUrl
                    }
                }
            ];
            logger.info(`Vision Analysis requested with ${model}`);
        }

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(history || []).map(m => ({
                role: m.role,
                content: m.content // Preserved structure
            })),
            { role: 'user', content: userContent }
        ];

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: model,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
        });

        const aiResponse = completion.choices[0].message.content;

        res.json({
            success: true,
            response: aiResponse
        });

    } catch (err) {
        console.error("==== CHATBOT ERROR ====");
        console.error(err);
        logger.error(`Chatbot Error: ${err.message}`);

        let userMsg = "I am having trouble connecting to my brain.";
        if (err.message.includes("model_decommissioned")) {
            userMsg = "My vision model is undergoing maintenance. Please try again with text only.";
        }

        res.status(err.status || 500).json({
            success: false,
            message: userMsg,
            error: err.message
        });
    }
});

module.exports = router;
