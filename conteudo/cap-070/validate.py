#!/bin/bash
# Validate cap-070
set -e
cd /home/user/workspace/steamos-part8/saida/cap-070
echo "=== Validating cap-070 ==="
python3 -c "
import json, os

with open('indice.json') as f:
    d = json.load(f)

assert d['capitulo'] == 70
assert d['titulo'] == 'Parsec e alternativas de streaming'
assert len(d['secoes']) == 9
for i, sec in enumerate(d['secoes']):
    assert sec['n'] == i+1, f'sec {i+1}: n mismatch {sec[\"n\"]}'
    assert sec['status'] == 'completo', f'sec {i+1}: status {sec[\"status\"]}'
    assert os.path.exists(sec['arquivo']), f'sec {i+1}: missing {sec[\"arquivo\"]}'
    assert os.path.getsize(sec['arquivo']) > 2000, f'sec {i+1}: too small'
    assert ':::objetivos' in open(sec['arquivo']).read(), f'sec {i+1}: no objetivos'
    assert '## Exercícios' in open(sec['arquivo']).read(), f'sec {i+1}: no exercicios'

print('All 9 sections present and valid')
for i in range(1,10):
    sz = os.path.getsize(f'sec-{i:02d}.md')
    print(f'  sec-{i:02d}.md: {sz:>6} bytes OK')
print('VALIDATION PASSED')
"
echo "=== Done ==="