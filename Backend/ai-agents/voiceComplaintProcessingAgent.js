const { BaseAgent } = require('./baseAgent');
const { AgentTypes } = require('./agentTypes');
const { getOpenAI } = require('./openaiClient');
const { ComplaintAnalyzerAgent } = require('./complaintAnalyzerAgent');
const OpenAI = require('openai');

class VoiceComplaintProcessingAgent extends BaseAgent {
  constructor() {
    super({ name: 'VoiceComplaintProcessingAgent', type: AgentTypes.VOICE_PROCESSING });
    this.analyzer = new ComplaintAnalyzerAgent();
  }

  async run(input, ctx = {}) {
    this.logStart({ complaintId: ctx.complaintId });
    const { audioBuffer, filename } = input || {};
    const openai = getOpenAI();

    if (!openai) {
      return { text: null, category: 'other', source: 'provider_not_configured' };
    }
    if (!audioBuffer) {
      return { text: null, category: 'other', source: 'no_audio' };
    }

    // openai node SDK supports file uploads via "toFile"
    const file = await OpenAI.toFile(audioBuffer, filename || 'complaint-audio.wav');
    const transcript = await openai.audio.transcriptions.create({
      model: process.env.OPENAI_STT_MODEL || 'gpt-4o-mini-transcribe',
      file,
    });

    const text = String(transcript.text || '').trim();
    const analysis = await this.analyzer.run({ text }, ctx);

    const result = {
      text,
      category: analysis.category,
      priority: analysis.priority,
      summary: analysis.summary,
      source: 'openai_stt+analyzer',
    };
    this.logDone({ complaintId: ctx.complaintId, category: result.category });
    return result;
  }
}

module.exports = { VoiceComplaintProcessingAgent };

