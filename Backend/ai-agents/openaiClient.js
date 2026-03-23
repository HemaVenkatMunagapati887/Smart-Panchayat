const OpenAI = require('openai');

let client = null;

function getOpenAI() {
  if (client) return client;
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) return null;
  client = new OpenAI({ apiKey });
  return client;
}

module.exports = { getOpenAI };
