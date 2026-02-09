const https = require('https');

const {
  AZURE_TENANT_ID,
  AZURE_CLIENT_ID,
  AZURE_CLIENT_SECRET,
  AZURE_SENDER_EMAIL,
  RECIPIENT_EMAIL,
  RELEASE_TITLE,
  RELEASE_BODY
} = process.env;

/**
 * Simple HTTPS request helper
 */
const httpsRequest = async (options, body) =>
  new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });

/**
 * Get Microsoft Graph access token (client credentials)
 */
const getGraphToken = async () => {
  const params = new URLSearchParams({
    client_id: AZURE_CLIENT_ID,
    client_secret: AZURE_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const { status, data } = await httpsRequest(
    {
      method: 'POST',
      hostname: 'login.microsoftonline.com',
      path: `/${AZURE_TENANT_ID}/oauth2/v2.0/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': params.toString().length
      }
    },
    params.toString()
  );

  const json = JSON.parse(data);

  if (status >= 300 || !json.access_token) {
    throw new Error(`Token request failed: ${data}`);
  }

  return json.access_token;
};

/**
 * Escape HTML
 */
const escapeHtml = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Minimal markdown formatter
 * - ### heading → bold, 14px
 * - **bold** → bold
 * - everything else → plain text
 */
const formatBody = (body = 'No description provided.') => {
  let content = escapeHtml(body);

  content = content.replace(
    /^### (.*)$/gm,
    '<h2>$1</h2>'
  );

  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return content.replace(/\n/g, '<br/>');
};

/**
 * Send email via Microsoft Graph
 */
const sendMail = async (token) => {
  const payload = JSON.stringify({
    message: {
      subject: `GraphKb Client ${RELEASE_TITLE}`,
      body: {
        contentType: 'HTML',
        content: formatBody(RELEASE_BODY)
      },
      toRecipients: [
        {
          emailAddress: { address: RECIPIENT_EMAIL }
        }
      ]
    }
  });

  const { status, data } = await httpsRequest({
    method: 'POST',
    hostname: 'graph.microsoft.com',
    path: `/v1.0/users/${AZURE_SENDER_EMAIL}/sendMail`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, payload);

  if (status >= 300) {
    throw new Error(`Graph sendMail failed (${status}): ${data}`);
  }
};

/**
 * Main
 */
const main = async () => {
  const token = await getGraphToken();
  await sendMail(token);
  console.log('Email sent successfully.');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
