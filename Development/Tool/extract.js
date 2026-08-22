import fs from 'fs';

const md = fs.readFileSync('../change_control/CC-007_session-detail-knowledge-graph.md', 'utf8');

let currentFile = null;
let lines = md.split('\n');
let jsCode = [];
let cssCode = [];
let jsxCode = [];
let capture = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.trim() === '```javascript' && lines[i+1].includes('src/lib/knowledgeGraph.js')) {
    capture = 'js';
    i++; // skip `// ── src/lib/knowledgeGraph.js` if it's there
    continue;
  }
  if (line.trim() === '```css' && lines[i-2] && lines[i-2].includes('src/styles/knowledge-graph.css')) {
    capture = 'css';
    continue;
  }
  if (line.trim() === '```jsx' && lines[i-2] && lines[i-2].includes('src/pages/SessionDetail.jsx')) {
    capture = 'jsx';
    continue;
  }
  
  if (line.trim() === '```' && capture) {
    capture = null;
    continue;
  }
  
  if (capture === 'js') jsCode.push(line);
  if (capture === 'css') cssCode.push(line);
  if (capture === 'jsx') jsxCode.push(line);
}

// Clean up first line if it's the comment
if (jsCode.length > 0 && jsCode[0].startsWith('// ──')) jsCode.shift();

if (!fs.existsSync('src/styles')) fs.mkdirSync('src/styles');

fs.writeFileSync('src/lib/knowledgeGraph.js', jsCode.join('\n').trim() + '\n');
fs.writeFileSync('src/styles/knowledge-graph.css', cssCode.join('\n').trim() + '\n');
fs.writeFileSync('src/pages/SessionDetail.jsx', jsxCode.join('\n').trim() + '\n');

console.log('JS length:', jsCode.length);
console.log('CSS length:', cssCode.length);
console.log('JSX length:', jsxCode.length);
