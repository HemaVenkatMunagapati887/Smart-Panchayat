const { BaseAgent } = require('./baseAgent');
const { AgentTypes } = require('./agentTypes');
const Complaint = require('../models/Complaint');

class GovernanceAnalyticsAgent extends BaseAgent {
  constructor() {
    super({ name: 'GovernanceAnalyticsAgent', type: AgentTypes.GOVERNANCE_ANALYTICS });
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

    const [byWard, byCategory, growth] = await Promise.all([
      Complaint.aggregate([
        { $match: match },
        { $group: { _id: '$ward', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Complaint.aggregate([
        { $match: match },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $match: match },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const result = {
      wardsWithHighestComplaints: byWard.map((x) => ({ ward: x._id, count: x.count })),
      mostCommonCategory: byCategory[0]?._id || null,
      categories: byCategory.map((x) => ({ category: x._id, count: x.count })),
      monthlyGrowth: growth.map((x) => ({ year: x._id.year, month: x._id.month, count: x.count })),
      source: 'mongo_aggregate',
    };
    this.logDone({ mostCommonCategory: result.mostCommonCategory });
    return result;
  }
}

module.exports = { GovernanceAnalyticsAgent };

