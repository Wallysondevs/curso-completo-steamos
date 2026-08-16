#!/usr/bin/env node
/*
 * verificar-render.js — passa TODOS os .md do curso pelo renderizador real do site
 * e denuncia qualquer coisa que iria aparecer quebrada na tela.
 *
 * Uso:  node ferramentas/verificar-render.js [--verbose]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.dirname(__dirname);
global.window = {};
require(path.join(RAIZ, 'assets/js/markdown.js'));
const MD = global.window.MD;

const VERBOSE = process.argv.includes('--verbose');
const problemas = [];
const avisos = [];

let arquivos = 0;
let palavrasTotal = 0;
let terminaisTotal = 0;
let caixasTotal = 0;
let tabelasTotal = 0;
let redigidos = 0;

const dirConteudo = path.join(RAIZ, 'conteudo');
const caps = fs.readdirSync(dirConteudo).filter((d) => /^cap-\d{3}$/.test(d)).sort();

for (const cap of caps) {
  const dir = path.join(dirConteudo, cap);
  const secs = fs.readdirSync(dir).filter((f) => /^sec-\d{2}\.md$/.test(f)).sort();

  for (const sec of secs) {
    const rotulo = `${cap}/${sec}`;
    const bruto = fs.readFileSync(path.join(dir, sec), 'utf8');
    arquivos++;
    palavrasTotal += bruto.split(/\s+/).filter(Boolean).length;

    const ehEsboco = bruto.trimStart().startsWith(':::construcao');
    if (!ehEsboco) redigidos++;

    let r;
    try {
      r = MD.render(bruto);
    } catch (e) {
      problemas.push(`${rotulo}: EXCEÇÃO no renderizador — ${e.message}`);
      continue;
    }
    const html = r.html;

    /* --- sinais de markdown mal formado que sobraram no HTML --- */
    if (/(^|\n)\s*:::/.test(html.replace(/<[^>]*>/g, ''))) {
      problemas.push(`${rotulo}: sobrou ":::" no texto renderizado (caixa sem fechamento)`);
    }
    if (html.includes('```')) {
      problemas.push(`${rotulo}: sobrou "\`\`\`" no HTML (cerca de código sem fechamento)`);
    }
    if (/\u0001/.test(html)) {
      problemas.push(`${rotulo}: sentinela interno vazou para o HTML`);
    }
    const semCodigo = html
      .replace(/<pre[\s\S]*?<\/pre>/g, '')
      .replace(/<code[\s\S]*?<\/code>/g, '');
    if (/(^|>)\s*#{2,6}\s/.test(semCodigo)) {
      avisos.push(`${rotulo}: possível título em markdown não convertido`);
    }
    /* só acusa quando o valor indefinido veio do renderizador, não do texto
       (mensagens como "undefined reference to" são legítimas em um curso) */
    if (/>(undefined|NaN)</.test(html) || /="(undefined|NaN)"/.test(html) ||
        html.includes('[object Object]')) {
      problemas.push(`${rotulo}: valor indefinido no HTML gerado`);
    }
    if (/^#\s/m.test(bruto.replace(/```[\s\S]*?```/g, ''))) {
      problemas.push(`${rotulo}: usa título de nível 1 (proibido pela especificação)`);
    }

    /* --- contagens de componentes --- */
    const nTerm = (html.match(/class="terminal"/g) || []).length;
    const nCaixa = (html.match(/class="caixa /g) || []).length;
    const nTab = (html.match(/<table>/g) || []).length;
    terminaisTotal += nTerm;
    caixasTotal += nCaixa;
    tabelasTotal += nTab;

    /* --- exigências das seções redigidas --- */
    if (!ehEsboco) {
      const palavras = bruto.split(/\s+/).filter(Boolean).length;
      if (palavras < 700) avisos.push(`${rotulo}: só ${palavras} palavras (alvo 900-1600)`);
      if (nTerm < 3) avisos.push(`${rotulo}: ${nTerm} bloco(s) terminal (mínimo 3)`);
      if (nCaixa < 2) avisos.push(`${rotulo}: ${nCaixa} caixa(s) de destaque (mínimo 2)`);
      if (!/caixa-objetivos/.test(html)) avisos.push(`${rotulo}: sem bloco :::objetivos`);
      if (!/>Resumo</.test(html)) avisos.push(`${rotulo}: sem "## Resumo"`);
      if (!/>Exerc/.test(html)) avisos.push(`${rotulo}: sem "## Exercícios"`);
      if (!r.sumario.length) avisos.push(`${rotulo}: nenhum título ## encontrado`);
    }

    /* --- links internos apontando para o vazio --- */
    const links = html.match(/href="#\/cap-\d+\/sec-\d+"/g) || [];
    for (const l of links) {
      const m = l.match(/cap-(\d+)\/sec-(\d+)/);
      const c = parseInt(m[1], 10);
      const s = parseInt(m[2], 10);
      if (c < 1 || c > 108 || s < 1 || s > 9) {
        problemas.push(`${rotulo}: link interno inválido -> ${c}.${s}`);
      }
    }

    if (VERBOSE) {
      console.log(`${rotulo}  ${ehEsboco ? 'esboço ' : 'REDIGIDO'}  term=${nTerm} caixas=${nCaixa} tab=${nTab}`);
    }
  }
}

const linha = '='.repeat(62);
console.log(linha);
console.log('  Verificação de renderização — Curso Completo de SteamOS');
console.log(linha);
console.log(`  arquivos .md ............ ${arquivos}`);
console.log(`  redigidos ............... ${redigidos}`);
console.log(`  esboços ................. ${arquivos - redigidos}`);
console.log(`  palavras ................ ${palavrasTotal.toLocaleString('pt-BR')}`);
console.log(`  blocos de terminal ...... ${terminaisTotal}`);
console.log(`  caixas de destaque ...... ${caixasTotal}`);
console.log(`  tabelas ................. ${tabelasTotal}`);
console.log('-'.repeat(62));

if (avisos.length) {
  console.log(`  AVISOS (${avisos.length}):`);
  avisos.slice(0, 30).forEach((a) => console.log(`    · ${a}`));
  if (avisos.length > 30) console.log(`    · ... e mais ${avisos.length - 30}`);
  console.log('-'.repeat(62));
}

if (problemas.length) {
  console.log(`  PROBLEMAS (${problemas.length}):`);
  problemas.slice(0, 40).forEach((p) => console.log(`    ! ${p}`));
  if (problemas.length > 40) console.log(`    ! ... e mais ${problemas.length - 40}`);
  console.log(linha);
  process.exit(1);
}

console.log('  Nenhum problema de renderização.');
console.log(linha);
