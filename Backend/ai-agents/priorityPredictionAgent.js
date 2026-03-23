const { BaseAgent } = require('./baseAgent');
const { AgentTypes } = require('./agentTypes');

function scorePriority({ text = '', ward = '', locationContext = '', imageSeverity = 0 }) {
  const t = `${text} ${ward} ${locationContext}`.toLowerCase();
  let score = 0;

  // urgency keywords
  if (/(urgent|emergency|danger|immediately|asap|life threat)/.test(t)) score += 3;
  if (/(not working for (days|week)|for \d+ days|for \d+ weeks)/.test(t)) score += 1;

  // sensitive locations
  if (/(school|hospital|clinic|temple|bus stand|main road|highway)/.test(t)) score += 2;

  // category-specific risk
  if (/(open drain|sewage|overflow|contamination)/.test(t)) score += 2;
  if (/(fallen wire|electric shock|spark)/.test(t)) score += 3;

  // imageSeverity: 0..1 (if available)
  score += Math.round((Number(imageSeverity) || 0) * 3);

  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

class PriorityPredictionAgent extends BaseAgent {
  constructor() {
    super({ name: 'PriorityPredictionAgent', type: AgentTypes.PRIORITY_PREDICTION });
  }

  async run(input, ctx = {}) {
    this.logStart({ complaintId: ctx.complaintId });
    const priority = scorePriority(input || {});
    this.logDone({ complaintId: ctx.complaintId, priority });
    return { priority, source: 'rules_v1' };
  }
}

module.exports = { PriorityPredictionAgent };

