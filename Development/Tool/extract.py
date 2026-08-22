import re

with open('../change_control/CC-007_session-detail-knowledge-graph.md', 'r', encoding='utf-8') as f:
    md = f.read()

blocks = re.findall(r'```(javascript|css|jsx)\n(.*?)\n```', md, re.DOTALL)

for lang, code in blocks:
    if 'knowledgeGraph.js' in code or lang == 'javascript':
        if 'export function' in code:
            with open('src/lib/knowledgeGraph.js', 'w', encoding='utf-8') as out:
                out.write(code)
            print("Wrote knowledgeGraph.js")
    if lang == 'css':
        with open('src/styles/knowledge-graph.css', 'w', encoding='utf-8') as out:
            out.write(code)
        print("Wrote knowledge-graph.css")
    if lang == 'jsx':
        if 'export default function SessionDetail' in code:
            with open('src/pages/SessionDetail.jsx', 'w', encoding='utf-8') as out:
                out.write(code)
            print("Wrote SessionDetail.jsx")
