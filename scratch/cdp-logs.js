const http = require('http');
const WebSocket = require('ws');

http.get('http://127.0.0.1:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const targets = JSON.parse(data);
    const page = targets.find(t => t.type === 'page' && t.url.includes('127.0.0.1'));
    
    if (!page) {
      console.log('No Next.js page found:', targets.map(t => t.url));
      return;
    }

    const ws = new WebSocket(page.webSocketDebuggerUrl);

    ws.on('open', () => {
      console.log('Connected to CDP!');
      
      // Enable Network and Console domains
      ws.send(JSON.stringify({ id: 1, method: 'Network.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Log.enable' }));
      ws.send(JSON.stringify({ id: 4, method: 'Runtime.enable' }));

      // Reload to catch startup errors
      setTimeout(() => {
        ws.send(JSON.stringify({ id: 5, method: 'Page.reload' }));
      }, 500);
      
      setTimeout(() => {
        ws.close();
      }, 5000);
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.method === 'Console.messageAdded') {
        console.log('[Console]', msg.params.message.text);
      } else if (msg.method === 'Log.entryAdded') {
        console.log('[Log]', msg.params.entry.text);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[Runtime]', msg.params.args.map(a => a.value || a.description).join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.log('[Exception]', msg.params.exceptionDetails.exception.description);
      } else if (msg.method === 'Network.responseReceived') {
        if (msg.params.response.status >= 400) {
          console.log('[Network Error]', msg.params.response.status, msg.params.response.url);
        }
      }
    });
  });
}).on('error', err => console.error('HTTP Error:', err.message));
