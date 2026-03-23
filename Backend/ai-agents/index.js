const { ComplaintAnalyzerAgent } = require('./complaintAnalyzerAgent');
const { ImageVerificationAgent } = require('./imageVerificationAgent');
const { PriorityPredictionAgent } = require('./priorityPredictionAgent');
const { ComplaintRoutingAgent } = require('./complaintRoutingAgent');
const { DuplicateComplaintDetectionAgent } = require('./duplicateComplaintDetectionAgent');
const { GovernanceAnalyticsAgent } = require('./governanceAnalyticsAgent');
const { ComplaintHeatmapAgent } = require('./complaintHeatmapAgent');
const { AIReportGeneratorAgent } = require('./aiReportGeneratorAgent');
const { VoiceComplaintProcessingAgent } = require('./voiceComplaintProcessingAgent');

module.exports = {
  ComplaintAnalyzerAgent,
  ImageVerificationAgent,
  PriorityPredictionAgent,
  ComplaintRoutingAgent,
  DuplicateComplaintDetectionAgent,
  GovernanceAnalyticsAgent,
  ComplaintHeatmapAgent,
  AIReportGeneratorAgent,
  VoiceComplaintProcessingAgent,
};

