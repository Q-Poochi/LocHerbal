/* pagespeed.cjs — gọi PageSpeed Insights API thật cho trang chủ production */
const https = require('https');
const fs = require('fs');
const url = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=' +
  encodeURIComponent('https://frontend-production-d58e.up.railway.app/') +
  '&strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices';
https.get(url, (r) => {
  let d = '';
  r.on('data', (c) => (d += c));
  r.on('end', () => {
    fs.writeFileSync('pagespeed.json', d);
    console.log('saved, status', r.statusCode, 'bytes', d.length);
  });
}).on('error', (e) => { console.error(e.message); process.exit(1); });