import { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
    const countryCode = context.geo?.country?.code || "UNKNOWN";
    const countryName = context.geo?.country?.name || "your region";

    if (countryCode !== "US") {
    // 3. Return your custom, branded HTML page
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Access Restricted</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9fafb;
            color: #111827;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .container {
            max-width: 500px;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          }
          h1 { color: #dc2626; font-size: 1.5rem; margin-bottom: 1rem; }
          p { color: #4b5563; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="/Monogram.png" alt="PlanoGrid" style="height: 60px; margin-bottom: 1.5rem;" />
          <h1>Content Not Available</h1>
          <p>We are sorry, but our services are currently unavailable in <strong>${countryName}</strong> due to regional restrictions.</p>
        </div>
      </body>
      </html>`,
      {
        headers: { "content-type": "text/html; charset=UTF-8" },
        status: 451, // HTTP Status code for "Unavailable For Legal Reasons"
      }
    );
  }

  // If they aren't blocked, let the request pass through normally
  return;
};