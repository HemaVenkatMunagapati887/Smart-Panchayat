/**
 * category + ward → department → staff
 * Production: replace with DB-driven staff directory + SLA + workload balancing.
 */

const CATEGORY_TO_DEPARTMENT = Object.freeze({
  sanitation: 'Sanitation',
  streetlight: 'Electricity',
  water: 'Water Supply',
  road: 'Roads',
  health: 'Health',
  pension: 'Pension Services',
  other: 'General',
});

// Example static staff mapping. In production, store staff in Mongo and query by ward+department.
const WARD_DEPARTMENT_TO_STAFF = Object.freeze({
  'ward1:Electricity': 'Ravi Kumar',
  'ward1:Water Supply': 'Siva Prasad',
  'ward2:Roads': 'Anitha Reddy',
  'ward3:Sanitation': 'Lakshmi Devi',
});

module.exports = { CATEGORY_TO_DEPARTMENT, WARD_DEPARTMENT_TO_STAFF };

