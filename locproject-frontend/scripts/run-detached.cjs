/* run-detached.cjs — spawn verify-redesign.js detached, thoát ngay lập tức */
const { spawn } = require('child_process');
const fs = require('fs');
const out = fs.openSync(__dirname + '/../verify-final.log', 'w');
const err = fs.openSync(__dirname + '/../verify-final.err', 'w');
const child = spawn(process.execPath, [__dirname + '/verify-redesign.js'], {
  cwd: __dirname + '/..',
  detached: true,
  stdio: ['ignore', out, err],
});
child.unref();
console.log('DETACHED PID=' + child.pid);