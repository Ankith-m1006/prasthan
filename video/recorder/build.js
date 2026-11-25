// Build MP4 from screencast frames using their real timestamps (concat demuxer with durations).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const out = process.argv[2] || path.join(__dirname, 'out.mp4');
const { idx, marks } = JSON.parse(fs.readFileSync(path.join(__dirname, 'index.json'), 'utf8'));
const stopRel = marks.find(m => m[0] === 'stop')[1];
const t0 = idx[0][1];
// total wall length: from first frame to last frame + tail so end card holds
const startRel = marks[0][1];
const total = stopRel - startRel;
let lines = [];
for (let i = 0; i < idx.length; i++) {
  const d = i + 1 < idx.length ? idx[i + 1][1] - idx[i][1] : Math.max(0.5, total - (idx[i][1] - t0));
  lines.push(`file 'frames/${idx[i][0]}'`, `duration ${Math.max(d, 0.001).toFixed(4)}`);
}
lines.push(`file 'frames/${idx[idx.length - 1][0]}'`);
fs.writeFileSync(path.join(__dirname, 'list.txt'), lines.join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'list.txt',
  '-vf', 'fps=30,scale=1920:1080:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
  '-movflags', '+faststart', out], { cwd: __dirname, stdio: 'inherit' });
console.log('wrote', out, 'frames', idx.length, 'approx total', total.toFixed(1));
