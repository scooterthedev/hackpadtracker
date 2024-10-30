import { createProxyMiddleware } from 'http-proxy-middleware';
import express from 'express';
import https from 'https';
import selfsigned from 'selfsigned';
import cors from 'cors';

const app = express();

app.use(cors());

const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

const sslOptions = {
  key: pems.private,
  cert: pems.cert,
};

app.use('/slack', createProxyMiddleware({
  target: 'https://slack.com',
  changeOrigin: true,
  pathRewrite: {
    '^/slack': '',
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
  },
}));

https.createServer(sslOptions, app).listen(3001, () => {});