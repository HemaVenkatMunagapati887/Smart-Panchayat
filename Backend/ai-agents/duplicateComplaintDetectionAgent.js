const { BaseAgent } = require('./baseAgent');
const { AgentTypes } = require('./agentTypes');
const Complaint = require('../models/Complaint');

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function jaccard(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

class DuplicateComplaintDetectionAgent extends BaseAgent {
  constructor() {
    super({ name: 'DuplicateComplaintDetectionAgent', type: AgentTypes.DUPLICATE_DETECTION });
  }

  async run(input, ctx = {}) {
    this.logStart({ complaintId: ctx.complaintId });
    const { text, ward, category } = input || {};
    const tokens = tokenize(text);

    // Search recent complaints in same ward+category to keep it fast.
    const sinceDays = Number(process.env.DEDUPE_LOOKBACK_DAYS || 14);
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

    const candidates = await Complaint.find({
      ward: ward,
      category: category,
      createdAt: { $gte: since },
    })
      .select({ id: 1, title: 1, description: 1, aiInsights: 1, createdAt: 1 })
      .limit(50)
      .lean();

    let best = { id: null, score: 0 };
    for (const c of candidates) {
      const cText = `${c.title || ''} ${c.description || ''}`;
      const score = jaccard(tokens, tokenize(cText));
      if (score > best.score) best = { id: c.id, score };
    }

    const threshold = Number(process.env.DEDUPE_THRESHOLD || 0.45);
    const duplicate = best.score >= threshold;
    const groupId = duplicate ? `issue_${best.id}` : null;

    const result = {
      duplicate,
      groupId,
      matchedComplaintId: duplicate ? best.id : null,
      similarity: Number(best.score.toFixed(3)),
      source: 'jaccard_recent_v1',
    };
    this.logDone({ complaintId: ctx.complaintId, duplicate, similarity: result.similarity });
    return result;
  }
}

module.exports = { DuplicateComplaintDetectionAgent };

