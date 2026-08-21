const http = require('http');

http.get('http://127.0.0.1:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const targets = JSON.parse(data);
    const page = targets.find(t => t.type === 'page');
    console.log(page ? page.webSocketDebuggerUrl : 'No page found');
  });
}).on('error', err => console.error(err.message));
