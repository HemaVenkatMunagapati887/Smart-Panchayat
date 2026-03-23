const { BaseAgent } = require('./baseAgent');
const { AgentTypes } = require('./agentTypes');
const Complaint = require('../models/Complaint');
const { getOpenAI } = require('./openaiClient');

function msToHours(ms) {
  return ms / (1000 * 60 * 60);
}

class AIReportGeneratorAgent extends BaseAgent {
  constructor() {
    super({ name: 'AIReportGeneratorAgent', type: AgentTypes.REPORT_GENERATOR });
  }

  async run(input) {
    this.logStart();
    const { from, to, reportName } = input || {};
    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    const [totals, topCategoryAgg, resolutionAgg] = await Promise.all([
      Complaint.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          },
        },
      ]),
      Complaint.aggregate([
        { $match: match },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
      Complaint.aggregate([
        { $match: { ...match, status: 'resolved' } },
        {
          $project: {
            createdAt: 1,
            updatedAt: 1,
            resolutionMs: { $subtract: ['$updatedAt', '$createdAt'] },
          },
        },
        { $group: { _id: null, avgResolutionMs: { $avg: '$resolutionMs' } } },
      ]),
    ]);

    const totalComplaints = totals[0]?.total || 0;
    const resolvedComplaints = totals[0]?.resolved || 0;
    const avgResolutionHours = resolutionAgg[0]?.avgResolutionMs
      ? Number(msToHours(resolutionAgg[0].avgResolutionMs).toFixed(2))
      : null;
    const topProblemCategory = topCategoryAgg[0]?._id || null;

    const structured = {
      reportName: reportName || 'Monthly Panchayat Report',
      period: { from: from || null, to: to || null },
      totalComplaints,
      resolvedComplaints,
      pendingComplaints: totalComplaints - resolvedComplaints,
      avgResolutionHours,
      topProblemCategory,
      source: 'mongo_aggregate',
    };

    // Optional: generate a human-readable narrative using an LLM.
    const openai = getOpenAI();
    if (openai) {
      const resp = await openai.chat.completions.create({
        model: process.env.OPENAI_TEXT_MODEL || 'gpt-4.1-mini',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'Write a concise governance report narrative (max 8 lines). ' +
              'Be factual, do not invent numbers not present.',
          },
          { role: 'user', content: JSON.stringify(structured) },
        ],
      });
      structured.narrative = resp.choices[0].message.content.trim();
      structured.narrativeSource = 'openai';
    }

    this.logDone({ totalComplaints });
    return structured;
  }
}

module.exports = { AIReportGeneratorAgent };

