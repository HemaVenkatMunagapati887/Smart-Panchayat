const logger = require('../utils/logger');
const {
  ComplaintAnalyzerAgent,
  ImageVerificationAgent,
  PriorityPredictionAgent,
  ComplaintRoutingAgent,
  DuplicateComplaintDetectionAgent,
} = require('../ai-agents');

/**
 * Runs the multi-agent workflow for a newly submitted complaint.
 * Keep it fast and safe: each agent failure should not block complaint creation.
 *
 * Production scaling:
 * - move this pipeline to an async queue (BullMQ/Redis) and persist per-agent traces.
 */
async function runComplaintAIPipeline({ complaintDraft }) {
  const complaintId = complaintDraft?.id;
  const ctx = { complaintId };

  const analyzer = new ComplaintAnalyzerAgent();
  const imageVerifier = new ImageVerificationAgent();
  const priorityPredictor = new PriorityPredictionAgent();
  const router = new ComplaintRoutingAgent();
  const deduper = new DuplicateComplaintDetectionAgent();

  const insights = { agents: {} };

  // 1) Analyzer
  try {
    const analysis = await analyzer.run(
      { text: complaintDraft.description || complaintDraft.title, ward: complaintDraft.ward },
      ctx
    );
    insights.agents.complaintAnalyzer = analysis;
    complaintDraft.category = analysis.category || complaintDraft.category;
    complaintDraft.priority = analysis.priority || complaintDraft.priority;
  } catch (e) {
    logger.warn(`AI pipeline: analyzer failed: ${e.message}`);
  }

  // 2) Image verification (optional)
  try {
    const v = await imageVerifier.run(
      {
        imageUrl: complaintDraft.image,
        complaintCategory: complaintDraft.category,
        complaintText: complaintDraft.description || complaintDraft.title,
      },
      ctx
    );
    insights.agents.imageVerification = v;
  } catch (e) {
    logger.warn(`AI pipeline: image verification failed: ${e.message}`);
  }

  // 3) Priority prediction (can override medium→high, but never reduce below analyzer’s priority)
  try {
    const pred = await priorityPredictor.run(
      {
        text: complaintDraft.description || complaintDraft.title,
        ward: complaintDraft.ward,
        locationContext: complaintDraft.address || '',
        imageSeverity: insights.agents.imageVerification?.confidence || 0,
      },
      ctx
    );
    insights.agents.priorityPrediction = pred;
    if (pred?.priority && complaintDraft.priority !== 'high') {
      complaintDraft.priority = pred.priority;
    }
  } catch (e) {
    logger.warn(`AI pipeline: priority prediction failed: ${e.message}`);
  }

  // 4) Routing
  try {
    const routing = await router.run(
      { category: complaintDraft.category, ward: complaintDraft.ward },
      ctx
    );
    insights.agents.routing = routing;
    if (routing?.assignedStaff) complaintDraft.assignedTo = routing.assignedStaff;
  } catch (e) {
    logger.warn(`AI pipeline: routing failed: ${e.message}`);
  }

  // 5) Dedupe
  try {
    const dedupe = await deduper.run(
      {
        text: `${complaintDraft.title || ''} ${complaintDraft.description || ''}`,
        ward: complaintDraft.ward,
        category: complaintDraft.category,
      },
      ctx
    );
    insights.agents.duplicateDetection = dedupe;
  } catch (e) {
    logger.warn(`AI pipeline: dedupe failed: ${e.message}`);
  }

  return { complaintDraft, insights };
}

module.exports = { runComplaintAIPipeline };

