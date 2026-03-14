const express = require('express');
const proxy = require('express-http-proxy');
const dns = require('dns');
const path = require('path');

const app = express();

const targetHost = 'zookeeper.zoodata.com.au';
let cachedIp = null;

function startServer() {
  app.use('/api', proxy(`https://${targetHost}/api`, {
    proxyReqPathResolver: (req) => {
      return req.url;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      console.log(`[OUT] ${srcReq.method} ${srcReq.url} -> ${targetHost} (${cachedIp || 'pending'})`);
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      
      const status = proxyRes.statusCode;
      const location = proxyRes.headers.location;
      if (status >= 300 && status < 400 && location) {
        console.log(`[REDIRECT] ${status} ${userReq.url} -> ${location}`);
      }
      console.log(`[RESP] ${userReq.method} ${userReq.url} <- ${status}`);
      return proxyResData;
    }
  }));

  app.use(express.static(path.join(__dirname, 'dist')));

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });

  const PORT = process.env.PORT || 3131;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

dns.resolve4(targetHost, (err, addresses) => {
  if (err) {
    console.error(`DNS resolution failed: ${err.message}`);
    cachedIp = 'resolution-failed';
  } else {
    cachedIp = addresses[0];
    console.log(`Resolved ${targetHost} -> ${cachedIp}`);
  }
  startServer();
});
