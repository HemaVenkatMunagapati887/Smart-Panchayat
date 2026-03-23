const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');

const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { uploadAudioMemory } = require('../middleware/uploadAudioMiddleware');

const {
  ComplaintAnalyzerAgent,
  ImageVerificationAgent,
  PriorityPredictionAgent,
  ComplaintRoutingAgent,
  DuplicateComplaintDetectionAgent,
  GovernanceAnalyticsAgent,
  ComplaintHeatmapAgent,
  AIReportGeneratorAgent,
  VoiceComplaintProcessingAgent,
} = require('../ai-agents');

// 1) Complaint Analyzer
router.post(
  '/complaint-analyzer',
  protect,
  [body('text').isString().trim().isLength({ min: 1 }), body('ward').optional().isString().trim()],
  validate,
  async (req, res, next) => {
    try {
      const agent = new ComplaintAnalyzerAgent();
      const out = await agent.run({ text: req.body.text, ward: req.body.ward || '' });
      res.json(out);
    } catch (e) {
      next(e);
    }
  }
);

// 2) Image Verification (expects Cloudinary URL via complaint upload OR directly uploaded here)
router.post(
  '/image-verification',
  protect,
  upload.single('image'),
  [body('complaintCategory').isString().trim(), body('complaintText').optional().isString()],
  validate,
  async (req, res, next) => {
    try {
      const imageUrl = req.file?.path || req.body.imageUrl;
      const agent = new ImageVerificationAgent();
      const out = await agent.run({
        imageUrl,
        complaintCategory: req.body.complaintCategory,
        complaintText: req.body.complaintText || '',
      });
      res.json(out);
    } catch (e) {
      next(e);
    }
  }
);

// 3) Priority Prediction
router.post(
  '/priority-prediction',
  protect,
  [body('text').isString().trim().isLength({ min: 1 }), body('locationContext').optional().isString()],
  validate,
  async (req, res, next) => {
    try {
      const agent = new PriorityPredictionAgent();
      const out = await agent.run({
        text: req.body.text,
        ward: req.body.ward || '',
        locationContext: req.body.locationContext || '',
        imageSeverity: req.body.imageSeverity || 0,
      });
      res.json(out);
    } catch (e) {
      next(e);
    }
  }
);

// 4) Complaint Routing
router.post(
  '/complaint-routing',
  protect,
  [body('category').isString().trim(), body('ward').isString().trim()],
  validate,
  async (req, res, next) => {
    try {
      const agent = new ComplaintRoutingAgent();
      const out = await agent.run({ category: req.body.category, ward: req.body.ward });
      res.json(out);
    } catch (e) {
      next(e);
    }
  }
);

// 5) Duplicate Detection
router.post(
  '/duplicate-detection',
  protect,
  [body('text').isString().trim().isLength({ min: 1 }), body('ward').isString().trim(), body('category').isString().trim()],
  validate,
  async (req, res, next) => {
    try {
      const agent = new DuplicateComplaintDetectionAgent();
      const out = await agent.run({ text: req.body.text, ward: req.body.ward, category: req.body.category });
      res.json(out);
    } catch (e) {
      next(e);
    }
  }
);

// 6) Governance Analytics (admin/staff)
router.get(
  '/governance-analytics',
  protect,
  authorize('staff', 'admin'),
  [query('from').optional().isISO8601(), query('to').optional().isISO8601()],
  validate,
  async (req, res, next) => {
    try {
      const agent = new GovernanceAnalyticsAgent();
      const out = await agent.run({ from: req.query.from, to: req.query.to });
      res.json(out);
    } catch (e) {
      next(e);
    }
  }
);

// 7) Complaint Heatmap (admin/staff)
router.get(
  '/complaint-heatmap',
  protect,
  authorize('staff', 'admin'),
  [query('from').optional().isISO8601(), query('to').optional().isISO8601()],
  validate,
  async (req, res, next) => {
    try {
      const agent = new ComplaintHeatmapAgent();
      const out = await agent.run({ from: req.query.from, to: req.query.to });
      res.json(out);
    } catch (e) {
      next(e);
    }
  }
);

// 8) AI Report Generator (admin/staff)
router.get(
  '/report',
  protect,
  authorize('staff', 'admin'),
  [query('from').optional().isISO8601(), query('to').optional().isISO8601(), query('name').optional().isString().trim()],
  validate,
  async (req, res, next) => {
    try {
      const agent = new AIReportGeneratorAgent();
      const out = await agent.run({ from: req.query.from, to: req.query.to, reportName: req.query.name });
      res.json(out);
    } catch (e) {
      next(e);
    }
  }
);

// 9) Voice complaint processing
router.post(
  '/voice',
  protect,
  uploadAudioMemory.single('audio'),
  async (req, res, next) => {
    try {
      const agent = new VoiceComplaintProcessingAgent();
      const out = await agent.run({
        audioBuffer: req.file?.buffer,
        filename: req.file?.originalname,
      });
      res.json(out);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;

