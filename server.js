const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const rootDir = __dirname;
const envPath = path.join(rootDir, '.env');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce(function (acc, line) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return acc;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) return acc;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

const envValues = parseEnvFile(envPath);
const openAiKey = process.env.OPENAI_API_KEY || envValues.OPENAI_API_KEY || '';

const systemPrompt = [
  'You are RevaroAI, the official AI assistant for GoRevaro.',
  'Answer only questions about GoRevaro, its services, roles, pricing, vetting, delivery models, team management, FAQ, contacts, and the website itself.',
  'Be concise, helpful, and professional.',
  'Do not discuss unrelated topics, homework, coding tasks, legal advice, medical matters, politics, or other off-topic subjects.',
  'Do not promise outcomes beyond what is stated on the website. If a customer wants a strategy call, encourage them to book one through the website.',
  'If you are uncertain, say you can help with the information available on the site and recommend the contact option.'
].join(' ');

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.ico': return 'image/x-icon';
    case '.webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

function fallbackReply(userMessage) {
  const message = String(userMessage || '').toLowerCase();

  if (/homework|essay|assignment|coding|programming|legal|medical|politics|religion|finance|investment/i.test(message)) {
    return 'I can help with GoRevaro and questions about its services, team models, pricing, and FAQ topics. I cannot assist with unrelated requests such as homework, coding, or legal advice.';
  }

  if (/cost|price|save|half the cost|50%|50 percent/i.test(message)) {
    return 'GoRevaro helps companies place pre-vetted offshore revenue professionals at up to 50% less than domestic hiring costs, with managed support and coaching included.';
  }

  if (/role|bdr|account executive|account manager|customer success|sales rep|sdr/i.test(message)) {
    return 'GoRevaro places revenue professionals across BDR/SDR, Account Executive, Account Manager, and Customer Success or Support roles.';
  }

  if (/delivery|managed team|direct placement/i.test(message)) {
    return 'GoRevaro offers Managed Teams for fully supported offshore teams and Direct Placement for one-time placements with the same vetting process.';
  }

  if (/vet|screen|process|guarantee|90-day|replacement/i.test(message)) {
    return 'Every candidate goes through a 5-stage assessment and GoRevaro offers a 90-day replacement guarantee on placements.';
  }

  if (/how quickly|shortlist|7|10 business days|days/i.test(message)) {
    return 'GoRevaro typically shortlists qualified candidates within 7 to 10 business days.';
  }

  if (/contact|book|call|strategy/i.test(message)) {
    return 'You can book a free strategy call through the website contact link or reach out at info@gorevaro.com.';
  }

  if (/faq|question|underperform|rep underperform|what happens/i.test(message)) {
    return 'On Managed Teams, a Team Manager monitors performance continuously and replaces underperforming reps within the first 90 days if needed.';
  }

  return 'I’m RevaroAI, and I can help with GoRevaro’s services, roles, delivery models, vetting, FAQ, and booking a strategy call. Ask me anything about the site and I’ll stay focused on that topic.';
}

async function getOpenAiReply(messages) {
  if (!openAiKey) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + openAiKey
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.3,
      max_tokens: 220,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    })
  });

  if (!response.ok) {
    throw new Error('OpenAI request failed');
  }

  const data = await response.json();
  return data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
    ? data.choices[0].message.content.trim()
    : null;
}

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, function (error, content) {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(content);
  });
}

const server = http.createServer(async function (req, res) {
  const requestUrl = new URL(req.url, 'http://' + req.headers.host);
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (req.method === 'POST' && pathname === '/api/chat') {
    let body = '';
    req.on('data', function (chunk) {
      body += chunk;
    });
    req.on('end', async function () {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const chatMessages = Array.isArray(parsed.messages) ? parsed.messages : [];
        const latestUserMessage = chatMessages.filter(function (message) {
          return message && message.role === 'user' && message.content;
        }).slice(-1)[0] || null;

        let reply = null;
        try {
          reply = await getOpenAiReply(chatMessages);
        } catch (error) {
          reply = null;
        }

        if (!reply) {
          reply = fallbackReply(latestUserMessage ? latestUserMessage.content : '');
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ reply: reply }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ reply: 'I could not process that message. Please try again.' }));
      }
    });
    return;
  }

  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  const relativePath = normalizedPath.replace(/^\/+/, '');
  const resolvedPath = path.resolve(rootDir, relativePath);

  if (!resolvedPath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  serveStaticFile(res, resolvedPath);
});

server.listen(port, function () {
  console.log('RevaroAI is running at http://localhost:' + port);
});
