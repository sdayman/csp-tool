export default {
  async fetch(request, env) {
    if (request.method === 'POST') {
      return handleCSPReport(request, env);
    } else {
      return new Response('Method not allowed', { status: 405 });
    }
  }
}

async function handleCSPReport(request, env) {
  try {
    const contentType = request.headers.get('Content-Type');
    if (contentType !== 'application/csp-report') {
      return new Response('Unsupported Content-Type', { status: 400 });
    }

    const cspReportData = await request.json();
    const { 'csp-report': cspReport } = cspReportData;

    // Extract relevant fields and provide default values if necessary
    const documentUri = cspReport['document-uri'] || '';
    const blockedUri = cspReport['blocked-uri'] || '';
    const violatedDirective = cspReport['violated-directive'] || '';
    const originalPolicy = cspReport['original-policy'] || '';
    const referrer = cspReport['referrer'] || ''; // Ensure empty strings are handled
    const sourceFile = cspReport['source-file'] || '';
    const lineNumber = cspReport['line-number'] || null; // Use null for empty numeric fields
    const columnNumber = cspReport['column-number'] || null;
    const statusCode = cspReport['status-code'] || null; // Null for status code if not provided

    // Ignore CSP violations triggered by browser extensions
    if (blockedUri.startsWith('chrome-extension')) {
      return new Response('Browser extention CSP violations are ignored', { status: 202 });
    }

    // Ignore CSP violations triggered by about: schemes
    if (documentUri.startsWith('about')) {
      return new Response('about: CSP violations are ignored', { status: 202 });
    }
    
    // Ignore CSP violations triggered by 403 Responses
    if (statusCode === 403) {
      return new Response('403 block page CSP violations are ignored', { status: 202 });
    }

    // Extract hostname from the request URL (not from the document-uri)
    const requestUrl = new URL(request.url);
    const hostname = requestUrl.hostname;

    // Insert the report into the D1 database
    const query = `
      INSERT INTO csp_reports (
        hostname, document_uri, blocked_uri, violated_directive, original_policy, referrer, source_file, line_number, column_number, status_code
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await env.CSP_REPORTS.prepare(query).bind(
      hostname,
      documentUri,
      blockedUri,
      violatedDirective,
      originalPolicy,
      referrer,
      sourceFile,
      lineNumber,
      columnNumber,
      statusCode
    ).run();

    return new Response('CSP report successfully stored', { status: 200 });

  } catch (err) {
    console.error('Error handling CSP report:', err);
    return new Response('Failed to process CSP report', { status: 500 });
  }
}