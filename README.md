# CSP Reporting with Cloudflare Workers

The inspiration for this was [Report URI](https://report-uri.com), which is a fantastic service I used for many years. That service now offers many more features, but I only wanted CSP reporting and wanted to create something with Cloudflare Workers. I documented my process here:  
[https://scottdayman.com/csp-reports-with-workers/](https://scottdayman.com/csp-reports-with-workers/)

---

## Setup Instructions
*(coming soon)*

---

## Some Assembly Required

To implement CSP reporting with Cloudflare Workers, you'll need the following components:

- **D1 Database**
- **Intake Worker** bound to D1
- **Report Tool** bound to D1
- **CSP Response Header**

---

## D1 Database Setup

Use the following SQL command to set up the `new_csp_reports` table in your D1 database:

```
CREATE TABLE new_csp_reports (
  hostname TEXT NOT NULL,
  document_uri TEXT NOT NULL,
  blocked_uri TEXT NOT NULL,
  violated_directive TEXT NOT NULL,
  original_policy TEXT,
  referrer TEXT,
  source_file TEXT,
  line_number INTEGER,
  column_number INTEGER,
  status_code INTEGER,
  report_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```