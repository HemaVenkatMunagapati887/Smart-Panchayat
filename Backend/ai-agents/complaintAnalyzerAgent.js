const { BaseAgent } = require('./baseAgent');
const { AgentTypes } = require('./agentTypes');
const { analyzeGrievance } = require('../utils/ai'); // existing Groq-based analyzer + fallback
const { getOpenAI } = require('./openaiClient');

const ALLOWED_CATEGORIES = ['sanitation', 'streetlight', 'water', 'road', 'health', 'pension', 'other'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high'];

function normalizeCategory(category) {
  if (!category) return 'other';
  const c = String(category).toLowerCase().trim();
  return ALLOWED_CATEGORIES.includes(c) ? c : 'other';
}

function normalizePriority(priority) {
  if (!priority) return 'medium';
  const p = String(priority).toLowerCase().trim();
  return ALLOWED_PRIORITIES.includes(p) ? p : 'medium';
}

class ComplaintAnalyzerAgent extends BaseAgent {
  constructor() {
    super({ name: 'ComplaintAnalyzerAgent', type: AgentTypes.COMPLAINT_ANALYZER });
  }

  async run(input, ctx = {}) {
    this.logStart({ complaintId: ctx.complaintId });
    const text = (input?.text || '').trim();
    const wardHint = (input?.ward || '').trim();

    // Preferred: OpenAI structured JSON (if key is configured). Fallback: existing Groq analyzer.
    const openai = getOpenAI();
    if (openai) {
      const resp = await openai.chat.completions.create({
        model: process.env.OPENAI_TEXT_MODEL || 'gpt-4.1-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are a civic complaint analyzer for a village governance platform. ' +
              'Return ONLY valid JSON with keys: category, priority, ward, summary. ' +
              `category must be one of ${JSON.stringify(ALLOWED_CATEGORIES)}. ` +
              `priority must be one of ${JSON.stringify(ALLOWED_PRIORITIES)}. ` +
              'ward should be a short ward/location string if present (or empty string). ' +
              'summary must be one short sentence.',
          },
          {
            role: 'user',
            content: `Complaint text:\n${text}\n\nWard hint (if any): ${wardHint || '(none)'}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(resp.choices[0].message.content);
      const result = {
        category: normalizeCategory(parsed.category),
        priority: normalizePriority(parsed.priority),
        ward: String(parsed.ward || wardHint || '').trim(),
        summary: String(parsed.summary || '').trim(),
        source: 'openai_chat_completions',
      };
      this.logDone({ complaintId: ctx.complaintId, source: result.source });
      return result;
    }

    const groqResult = await analyzeGrievance(text);
    const result = {
      category: normalizeCategory(groqResult?.category),
      priority: normalizePriority(groqResult?.priority),
      ward: wardHint,
      summary: String(groqResult?.summary || '').trim(),
      source: groqResult?.source || 'groq_or_local',
    };

    this.logDone({ complaintId: ctx.complaintId, source: result.source });
    return result;
  }
}

module.exports = { ComplaintAnalyzerAgent };
