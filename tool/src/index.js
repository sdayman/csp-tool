// src/index.js
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostnameToDelete = url.searchParams.get("delete");
    const hostname = url.searchParams.get("hostname");
    const history = url.searchParams.get("history");
    if (request.method === "GET") {
      if (hostnameToDelete) {
        return deleteEntriesForHostname(hostnameToDelete, env);
      } else if (hostname && history) {
        return downloadHistoryAsCSV(hostname, history, env);
      } else if (hostname) {
        return downloadEntriesAsCSV(hostname, env);
      } else {
        return listHostnamesWithReports(env);
      }
    } else {
      return new Response("Method not allowed", { status: 405 });
    }
  }
};
async function listHostnamesWithReports(env) {
  try {
    const query = `
      SELECT hostname, COUNT(*) as record_count
      FROM csp_reports
      GROUP BY hostname
      ORDER BY hostname;
    `;
    const result = await env.CSP_REPORTS.prepare(query).all();
    const uniqueHostnamesCount = result.results.length;
    if (result.results.length === 0) {
      const html2 = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="refresh" content="300">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20width%3D%22100%25%22%20height%3D%22100%25%22%20viewBox%3D%220%200%20449%20449%22%20version%3D%221.1%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20xmlns%3Axlink%3D%22http%3A//www.w3.org/1999/xlink%22%20xml%3Aspace%3D%22preserve%22%20xmlns%3Aserif%3D%22http%3A//www.serif.com/%22%20style%3D%22fill-rule%3Aevenodd%3Bclip-rule%3Aevenodd%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A2%3B%22%3E%3Cg%20transform%3D%22matrix(1%2C0%2C0%2C1%2C-31.9996%2C-32.0055)%22%3E%3Cpath%20d%3D%22M288.24%2C154.78C279.56%2C122.241%20287.959%2C86.061%20313.478%2C60.561C340.4%2C33.639%20379.197%2C25.741%20413.076%2C36.92C415.596%2C37.842%20417.498%2C39.979%20418.076%2C42.6C418.654%2C45.221%20417.877%2C47.959%20415.955%2C49.861C402.576%2C63.42%20376.576%2C89.42%20365.115%2C100.881C361.974%2C104.022%20361.974%2C109.081%20365.115%2C112.201C373.955%2C121.041%20390.935%2C138.041%20399.795%2C146.881C402.916%2C150.022%20407.975%2C150.022%20411.115%2C146.881C422.576%2C135.42%20448.576%2C109.42%20462.037%2C95.959C463.978%2C94.018%20466.756%2C93.198%20469.435%2C93.799C472.115%2C94.401%20474.295%2C96.319%20475.236%2C98.877C486.256%2C132.818%20478.377%2C171.615%20451.435%2C198.537C425.935%2C224.057%20389.755%2C232.478%20357.216%2C223.775L223.756%2C357.235C232.436%2C389.774%20224.037%2C425.954%20198.518%2C451.454C160.459%2C489.532%2098.635%2C489.532%2060.558%2C451.454C22.48%2C413.395%2022.48%2C351.571%2060.558%2C313.494C86.058%2C287.974%20122.238%2C279.553%20154.777%2C288.256L288.237%2C154.796L288.24%2C154.78ZM171.32%2C391.72C172.082%2C394.482%20171.281%2C397.439%20169.261%2C399.482L143.382%2C425.361C141.343%2C427.4%20138.382%2C428.181%20135.621%2C427.419C127.062%2C425.08%20108.441%2C420.021%2099.922%2C417.701C97.183%2C416.962%2095.043%2C414.822%2094.301%2C412.079C91.98%2C403.56%2086.902%2C384.938%2084.582%2C376.38C83.82%2C373.619%2084.621%2C370.662%2086.64%2C368.619L112.519%2C342.74C114.559%2C340.701%20117.519%2C339.919%20120.281%2C340.681C128.84%2C343.021%20147.461%2C348.08%20155.98%2C350.4C158.718%2C351.138%20160.859%2C353.279%20161.601%2C356.021C163.922%2C364.541%20169%2C383.162%20171.32%2C391.72Z%22%20style%3D%22fill%3Argb(252%2C148%2C6)%3B%22/%3E%3C/g%3E%3C/svg%3E">
          <title>CSP-Reports</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #ffa500; margin-left: 25%; margin-right: 25%}
            h1, h2 {text-align:center;}
          </style>
        </head>
        <body>
          <h1>Hostnames with Reports</h1>
          <h2>~~ No Reports ~~</h2>
        </body>
        </html>
      `;
      return new Response(html2, {
        status: 200,
        headers: { "Content-Type": "text/html" }
      });
    }
    const hostnamesWithReports = result.results.map((row) => `
      <tr>
        <td>
        <form action="/" method="get" style="display:inline;">
          <input type="hidden" name="delete" value="${row.hostname}">
          <button type="submit" style="background-color: red; color: white; border: none; padding: 5px 10px;">Delete</button>
        </form>
        </td>
        <td>${row.hostname} (${row.record_count})</td><td><a href="?hostname=${row.hostname}&history=1">1-Day</a></td><td><a href="?hostname=${row.hostname}&history=7">1-Week</a></td><td><a href="?hostname=${row.hostname}&history=30">1-Month</a></td><td><a href="?hostname=${row.hostname}">All</a></td>
      </tr>
    `).join("");
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="300">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20width%3D%22100%25%22%20height%3D%22100%25%22%20viewBox%3D%220%200%20449%20449%22%20version%3D%221.1%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20xmlns%3Axlink%3D%22http%3A//www.w3.org/1999/xlink%22%20xml%3Aspace%3D%22preserve%22%20xmlns%3Aserif%3D%22http%3A//www.serif.com/%22%20style%3D%22fill-rule%3Aevenodd%3Bclip-rule%3Aevenodd%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A2%3B%22%3E%3Cg%20transform%3D%22matrix(1%2C0%2C0%2C1%2C-31.9996%2C-32.0055)%22%3E%3Cpath%20d%3D%22M288.24%2C154.78C279.56%2C122.241%20287.959%2C86.061%20313.478%2C60.561C340.4%2C33.639%20379.197%2C25.741%20413.076%2C36.92C415.596%2C37.842%20417.498%2C39.979%20418.076%2C42.6C418.654%2C45.221%20417.877%2C47.959%20415.955%2C49.861C402.576%2C63.42%20376.576%2C89.42%20365.115%2C100.881C361.974%2C104.022%20361.974%2C109.081%20365.115%2C112.201C373.955%2C121.041%20390.935%2C138.041%20399.795%2C146.881C402.916%2C150.022%20407.975%2C150.022%20411.115%2C146.881C422.576%2C135.42%20448.576%2C109.42%20462.037%2C95.959C463.978%2C94.018%20466.756%2C93.198%20469.435%2C93.799C472.115%2C94.401%20474.295%2C96.319%20475.236%2C98.877C486.256%2C132.818%20478.377%2C171.615%20451.435%2C198.537C425.935%2C224.057%20389.755%2C232.478%20357.216%2C223.775L223.756%2C357.235C232.436%2C389.774%20224.037%2C425.954%20198.518%2C451.454C160.459%2C489.532%2098.635%2C489.532%2060.558%2C451.454C22.48%2C413.395%2022.48%2C351.571%2060.558%2C313.494C86.058%2C287.974%20122.238%2C279.553%20154.777%2C288.256L288.237%2C154.796L288.24%2C154.78ZM171.32%2C391.72C172.082%2C394.482%20171.281%2C397.439%20169.261%2C399.482L143.382%2C425.361C141.343%2C427.4%20138.382%2C428.181%20135.621%2C427.419C127.062%2C425.08%20108.441%2C420.021%2099.922%2C417.701C97.183%2C416.962%2095.043%2C414.822%2094.301%2C412.079C91.98%2C403.56%2086.902%2C384.938%2084.582%2C376.38C83.82%2C373.619%2084.621%2C370.662%2086.64%2C368.619L112.519%2C342.74C114.559%2C340.701%20117.519%2C339.919%20120.281%2C340.681C128.84%2C343.021%20147.461%2C348.08%20155.98%2C350.4C158.718%2C351.138%20160.859%2C353.279%20161.601%2C356.021C163.922%2C364.541%20169%2C383.162%20171.32%2C391.72Z%22%20style%3D%22fill%3Argb(252%2C148%2C6)%3B%22/%3E%3C/g%3E%3C/svg%3E">
        <title>CSP-Reports (${uniqueHostnamesCount})</title>
        <style>
          body {font-family: Arial, sans-serif; background-color: #ffa500; margin-left: 25%; margin-right: 25%}
          table {border-collapse: separate; border-spacing: 0px 10px;margin: 0px auto;}
          td {padding: 10px; background: #f4f4f4;}
          td:first-child {border-top-left-radius: 10px;border-bottom-left-radius: 10px;}
          td:last-child {border-top-right-radius: 10px;border-bottom-right-radius: 10px;}
          h1 {text-align:center;}
          button {border-radius: 5px;}
          button:hover {color: red !important; background-color: black !important; cursor: pointer;}
          a {background-color:green; color:white !important; padding: 5px 7px 5px 7px; border-radius: 5px; text-decoration: none !important;}
          a:hover {background-color:black;}
        </style>
      </head>
      <body>
        <h1>Hostnames with Reports</h1>
        <table>${hostnamesWithReports}</table>
      </body>
      </html>
    `;
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html" }
    });
  } catch (err) {
    return new Response("Failed to fetch hostnames with reports", { status: 500 });
  }
}
async function downloadEntriesAsCSV(hostname, env) {
  try {
    const query = `
      SELECT *
      FROM csp_reports
      WHERE hostname = ?
      ORDER BY report_time DESC;
    `;
    const result = await env.CSP_REPORTS.prepare(query).bind(hostname).all();
    if (result.results.length === 0) {
      return new Response(`No entries found for hostname: ${hostname}`, { status: 404 });
    }
    const csv = convertToCSV(result.results, "hostname");
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${hostname}_csp_reports.csv"`
      }
    });
  } catch (err) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="refresh" content="5;URL='/'">
      <title>Error</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #ffa500; margin-left: 25%; margin-right: 25%}
        h1 {text-align: center; color: black;}
      </style>
    </head>
    <body>
      <h1>Failed to download entries as CSV</h1>
      <p>Something went wrong, please try again later.</p>
    </body>
    </html>
  `;
    return new Response(html, {
      status: 500,
      headers: { "Content-Type": "text/html" }
    });
  }
}
async function downloadHistoryAsCSV(hostname, history, env) {
  try {
    const query = `
      SELECT *
      FROM csp_reports
      WHERE hostname = ?
      AND report_time >= DATETIME('now', '-${history} day')
      ORDER BY report_time DESC;
    `;
    const result = await env.CSP_REPORTS.prepare(query).bind(hostname).all();
    if (result.results.length === 0) {
      
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="refresh" content="5;URL='/'">
          <title>None Found</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #ffa500; margin-left: 25%; margin-right: 25%}
            h1 {text-align: center; color: black;}
          </style>
        </head>
        <body>
          <h1>No entries found for ${hostname} in last ${history} days</h1>
        </body>
        </html>
      `;
        return new Response(html, {
          status: 404,
          headers: { "Content-Type": "text/html" }
        });
    }
    const csv = convertToCSV(result.results, "hostname");
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${hostname}_${history}_days_csp_reports.csv"`
      }
    });
  } catch (err) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="refresh" content="5;URL='/'">
      <title>Error</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #ffa500; margin-left: 25%; margin-right: 25%}
        h1 {text-align: center; color: black;}
      </style>
    </head>
    <body>
      <h1>Failed to download ${hostname} entries as CSV</h1>
      <p>Something went wrong, please try again later.</p>
    </body>
    </html>
  `;
    return new Response(html, {
      status: 500,
      headers: { "Content-Type": "text/html" }
    });
  }
}
async function deleteEntriesForHostname(hostname, env) {
  try {
    const query = `
      DELETE FROM csp_reports
      WHERE hostname = ?;
    `;
    const result = await env.CSP_REPORTS.prepare(query).bind(hostname).run();
    let message;
    if (result && result.meta && typeof result.meta.changes === "number") {
      message = `Successfully deleted ${result.meta.changes} entries for hostname: ${hostname}`;
    } else {
      message = `No entries found for hostname: ${hostname}`;
    }
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="5;URL='/'">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20width%3D%22100%25%22%20height%3D%22100%25%22%20viewBox%3D%220%200%20449%20449%22%20version%3D%221.1%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20xmlns%3Axlink%3D%22http%3A//www.w3.org/1999/xlink%22%20xml%3Aspace%3D%22preserve%22%20xmlns%3Aserif%3D%22http%3A//www.serif.com/%22%20style%3D%22fill-rule%3Aevenodd%3Bclip-rule%3Aevenodd%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A2%3B%22%3E%3Cg%20transform%3D%22matrix(1%2C0%2C0%2C1%2C-31.9996%2C-32.0055)%22%3E%3Cpath%20d%3D%22M288.24%2C154.78C279.56%2C122.241%20287.959%2C86.061%20313.478%2C60.561C340.4%2C33.639%20379.197%2C25.741%20413.076%2C36.92C415.596%2C37.842%20417.498%2C39.979%20418.076%2C42.6C418.654%2C45.221%20417.877%2C47.959%20415.955%2C49.861C402.576%2C63.42%20376.576%2C89.42%20365.115%2C100.881C361.974%2C104.022%20361.974%2C109.081%20365.115%2C112.201C373.955%2C121.041%20390.935%2C138.041%20399.795%2C146.881C402.916%2C150.022%20407.975%2C150.022%20411.115%2C146.881C422.576%2C135.42%20448.576%2C109.42%20462.037%2C95.959C463.978%2C94.018%20466.756%2C93.198%20469.435%2C93.799C472.115%2C94.401%20474.295%2C96.319%20475.236%2C98.877C486.256%2C132.818%20478.377%2C171.615%20451.435%2C198.537C425.935%2C224.057%20389.755%2C232.478%20357.216%2C223.775L223.756%2C357.235C232.436%2C389.774%20224.037%2C425.954%20198.518%2C451.454C160.459%2C489.532%2098.635%2C489.532%2060.558%2C451.454C22.48%2C413.395%2022.48%2C351.571%2060.558%2C313.494C86.058%2C287.974%20122.238%2C279.553%20154.777%2C288.256L288.237%2C154.796L288.24%2C154.78ZM171.32%2C391.72C172.082%2C394.482%20171.281%2C397.439%20169.261%2C399.482L143.382%2C425.361C141.343%2C427.4%20138.382%2C428.181%20135.621%2C427.419C127.062%2C425.08%20108.441%2C420.021%2099.922%2C417.701C97.183%2C416.962%2095.043%2C414.822%2094.301%2C412.079C91.98%2C403.56%2086.902%2C384.938%2084.582%2C376.38C83.82%2C373.619%2084.621%2C370.662%2086.64%2C368.619L112.519%2C342.74C114.559%2C340.701%20117.519%2C339.919%20120.281%2C340.681C128.84%2C343.021%20147.461%2C348.08%20155.98%2C350.4C158.718%2C351.138%20160.859%2C353.279%20161.601%2C356.021C163.922%2C364.541%20169%2C383.162%20171.32%2C391.72Z%22%20style%3D%22fill%3Argb(252%2C148%2C6)%3B%22/%3E%3C/g%3E%3C/svg%3E">
        <title>Deleting Entries…</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #ffa500; margin-left: 25%; margin-right: 25%}
          h1 {text-align:center;}
        </style>
      </head>
      <body>
        <h1>${message}</h1>
      </body>
      </html>
    `;
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html" }
    });
  } catch (err) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #ffa500; margin-left: 25%; margin-right: 25%}
        h1 {text-align: center; color: black;}
      </style>
    </head>
    <body>
      <h1>Failed to delete entries for ${hostname}</h1>
      <p>Something went wrong, please try again later.</p>
    </body>
    </html>
  `;
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html" }
    });
  }
}
function convertToCSV(data, excludeField) {
  const headers = Object.keys(data[0]).filter((header) => header !== excludeField);
  const csvRows = [];
  csvRows.push(headers.join(","));
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
}
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
