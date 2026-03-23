const { BaseAgent } = require('./baseAgent');
const { AgentTypes } = require('./agentTypes');
const { getOpenAI } = require('./openaiClient');

function mapCategoryToExpectedObject(category) {
  switch (String(category || '').toLowerCase()) {
    case 'road':
      return 'pothole_or_road_damage';
    case 'streetlight':
      return 'street_light_or_electric_pole';
    case 'sanitation':
      return 'garbage_or_drainage_issue';
    case 'water':
      return 'water_leak_or_broken_pipe';
    case 'health':
      return 'health_hazard';
    case 'pension':
      return 'document_or_office_context';
    default:
      return 'unknown';
  }
}

class ImageVerificationAgent extends BaseAgent {
  constructor() {
    super({ name: 'ImageVerificationAgent', type: AgentTypes.IMAGE_VERIFICATION });
  }

  async run(input, ctx = {}) {
    this.logStart({ complaintId: ctx.complaintId });
    const { imageUrl, complaintCategory, complaintText } = input || {};

    if (!imageUrl) {
      return { matched: false, reason: 'no_image', detected_object: null, confidence: 0 };
    }

    const openai = getOpenAI();
    if (!openai) {
      // Safe fallback: can't verify without vision model
      return {
        matched: null,
        reason: 'vision_provider_not_configured',
        detected_object: null,
        confidence: null,
      };
    }

    const expected = mapCategoryToExpectedObject(complaintCategory);

    const resp = await openai.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            'You verify whether an uploaded complaint image matches the complaint. ' +
            'Return ONLY valid JSON with keys: detected_object, confidence, matched. ' +
            'confidence must be 0..1. matched must be true/false.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Complaint category: ${complaintCategory}\nExpected object: ${expected}\nComplaint text: ${complaintText || ''}` },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(resp.choices[0].message.content);
    const result = {
      detected_object: parsed.detected_object || expected,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
      matched: typeof parsed.matched === 'boolean' ? parsed.matched : null,
      source: 'openai_vision',
    };

    this.logDone({ complaintId: ctx.complaintId, source: result.source, matched: result.matched });
    return result;
  }
}

module.exports = { ImageVerificationAgent };
