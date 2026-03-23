const { BaseAgent } = require('./baseAgent');
const { AgentTypes } = require('./agentTypes');
const Complaint = require('../models/Complaint');

class ComplaintHeatmapAgent extends BaseAgent {
  constructor() {
    super({ name: 'ComplaintHeatmapAgent', type: AgentTypes.COMPLAINT_HEATMAP });
  }

  async run(input) {
    this.logStart();
    const { from, to } = input || {};
    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    const byWard = await Complaint.aggregate([
      { $match: match },
      { $group: { _id: '$ward', complaints: { $sum: 1 } } },
      { $sort: { complaints: -1 } },
    ]);

    const wardCounts = {};
    for (const w of byWard) wardCounts[w._id] = w.complaints;

    this.logDone({ wards: Object.keys(wardCounts).length });
    return { wards: wardCounts, source: 'mongo_aggregate' };
  }
}

module.exports = { ComplaintHeatmapAgent };

