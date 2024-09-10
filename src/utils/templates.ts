export function generateHTML(title: string, items: { name: string, href: string }[]): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  margin: 0;
                  padding: 20px;
                  background-color: #f4f4f4;
              }
              h1 {
                  color: #333;
              }
              .file-list {
                  background-color: white;
                  border-radius: 5px;
                  padding: 20px;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
              }
              .file-item {
                  padding: 10px;
                  border-bottom: 1px solid #eee;
              }
              .file-item:last-child {
                  border-bottom: none;
              }
              .file-item a {
                  color: #0066cc;
                  text-decoration: none;
              }
              .file-item a:hover {
                  text-decoration: underline;
              }
          </style>
      </head>
      <body>
          <h1>${title}</h1>
          <div class="file-list">
              ${items.map(item => `
                  <div class="file-item">
                      <a href="${item.href}">${item.name}</a>
                  </div>
              `).join('')}
          </div>
      </body>
      </html>
    `;
  }
  
  export function generateErrorHTML(title: string, message: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  margin: 0;
                  padding: 20px;
                  background-color: #f4f4f4;
              }
              h1 {
                  color: #333;
              }
              .error-message {
                  background-color: white;
                  border-radius: 5px;
                  padding: 20px;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                  color: #e60000;
              }
          </style>
      </head>
      <body>
          <h1>${title}</h1>
          <div class="error-message">
              ${message}
          </div>
      </body>
      </html>
    `;
  }