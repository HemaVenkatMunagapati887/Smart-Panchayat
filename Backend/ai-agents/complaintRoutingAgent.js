const { BaseAgent } = require('./baseAgent');
const { AgentTypes } = require('./agentTypes');
const { CATEGORY_TO_DEPARTMENT, WARD_DEPARTMENT_TO_STAFF } = require('../config/routingMap');

class ComplaintRoutingAgent extends BaseAgent {
  constructor() {
    super({ name: 'ComplaintRoutingAgent', type: AgentTypes.COMPLAINT_ROUTING });
  }

  async run(input, ctx = {}) {
    this.logStart({ complaintId: ctx.complaintId });
    const category = String(input?.category || 'other').toLowerCase();
    const ward = String(input?.ward || '').trim().toLowerCase();

    const department = CATEGORY_TO_DEPARTMENT[category] || CATEGORY_TO_DEPARTMENT.other;
    const key = `${ward || 'ward1'}:${department}`;
    const assignedStaff = WARD_DEPARTMENT_TO_STAFF[key] || 'Unassigned';

    const result = { department, assignedStaff, source: 'routing_map_v1' };
    this.logDone({ complaintId: ctx.complaintId, department, assignedStaff });
    return result;
  }
}

module.exports = { ComplaintRoutingAgent };

