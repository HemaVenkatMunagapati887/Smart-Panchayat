const logger = require('../utils/logger');

class BaseAgent {
  constructor({ name, type }) {
    this.name = name;
    this.type = type;
  }

  async run(_input, _ctx = {}) {
    throw new Error(`${this.name} run() not implemented`);
  }

  logStart(meta = {}) {
    logger.info(`🤖 AI Agent start: ${this.name}`, meta);
  }

  logDone(meta = {}) {
    logger.info(`✅ AI Agent done: ${this.name}`, meta);
  }
}

module.exports = { BaseAgent };
