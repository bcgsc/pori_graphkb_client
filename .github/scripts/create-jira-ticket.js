/* eslint-disable @typescript-eslint/no-var-requires */
const https = require('https');

function createJiraTicket() {
  const options = {
    method: 'POST',
    host: process.env.JIRA_BASE_URL,
    port: process.env.JIRA_PORT,
    path: '/jira/rest/api/2/issue/',
    headers: {
      Authorization: `Bearer ${process.env.JIRA_API_TOKEN}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  const formattedTitle = `GraphKB Client ${process.env.PR_TITLE}`;
  let formattedDesc = '';

  const body = process.env.PR_DESCRIPTION;
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);

  let section = '';
  const tables = {};

  for (let line of lines) {
    if (line.startsWith('###')) {
      line = '';
    } else if (line.startsWith('**')) {
      section = line.replace(/\*\*/g, '').trim();
      tables[section] = [];
    } else if (line.startsWith('[[')) {
      const match = line.match(/\[\[(?<title>[A-Z]+-\d+)\]\([^)]+\)\]\s*-\s*(?<description>.+)/);

      if (match?.groups) {
        const { title, description } = match.groups;
        tables[section].push({ title, description });
      }
    }
  }

  for (const [sectionName, items] of Object.entries(tables)) {
    formattedDesc += `| *${sectionName}* | *Need Review* | *Status* | *Reviewer* | *Description* |\n`;

    for (const { title, description } of items) {
      formattedDesc += `| ${title} |  |  |  | ${description} |\n`;
    }
  }

  const issueData = JSON.stringify({
    fields: {
      project: {
        key: process.env.JIRA_PROJECT_NAME,
      },
      summary: formattedTitle,
      description: formattedDesc,
      issuetype: {
        name: process.env.JIRA_ISSUE_TYPE,
      },
    },
  });

  console.log('Writing issue: \n', issueData);

  const req = https.request(options, (res) => {
    res.setEncoding('utf8');
    res.on('data', (body) => {
      console.log('Body:', body);
    });
  });

  req.on('error', (e) => {
    console.error('problem with request:', e.message);
  });

  req.write(issueData);
  req.end();
}

createJiraTicket();
