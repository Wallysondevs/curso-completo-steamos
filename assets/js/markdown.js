/* =========================================================================
   Renderizador de Markdown do Curso de SteamOS
   Subconjunto controlado, definido em ESPECIFICACAO-CONTEUDO.md.
   Sem dependências externas — funciona offline e no GitHub Pages.
   Expõe: window.MD.render(texto) -> { html, sumario }
   ========================================================================= */
(function (global) {
  'use strict';

  /* ---------- utilidades ---------- */

  var MAPA_ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return MAPA_ESCAPE[c]; });
  }

  function slugificar(txt) {
    return txt
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 64) || 'secao';
  }

  var ROTULOS = {
    objetivos: 'Objetivos desta seção',
    dica: 'Dica',
    nota: 'Nota',
    info: 'Informação',
    atencao: 'Atenção',
    perigo: 'Perigo',
    exemplo: 'Exemplo prático',
    construcao: 'Seção em construção'
  };

  var ICONE_COPIAR =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/>' +
    '<path d="M5 15V5a2 2 0 012-2h10"/></svg>';

  /* ---------- passe inline ---------- */

  function inline(texto) {
    var t = esc(texto);
    var codigos = [];

    /* protege código embutido antes de qualquer outra substituição */
    t = t.replace(/`([^`]+)`/g, function (_, c) {
      codigos.push(c);
      return '\u0001C' + (codigos.length - 1) + '\u0001';
    });

    /* teclas: [[Ctrl+Alt+T]] */
    t = t.replace(/\[\[([^\][]+)\]\]/g, function (_, k) {
      return '<kbd>' + k + '</kbd>';
    });

    /* links: [texto](destino) */
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, rot, destino) {
      var externo = /^https?:/i.test(destino);
      return '<a href="' + destino + '"' +
        (externo ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + rot + '</a>';
    });

    /* URL solta */
    t = t.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, function (_, pre, url) {
      return pre + '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
    });

    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^\w*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    t = t.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    t = t.replace(/\u0001C(\d+)\u0001/g, function (_, i) {
      return '<code>' + codigos[+i] + '</code>';
    });

    return t;
  }

  /* ---------- blocos de código ---------- */

  function renderTerminal(codigo, titulo) {
    var linhas = codigo.split('\n');
    var corpo = '';
    var comandos = [];

    for (var i = 0; i < linhas.length; i++) {
      var l = linhas[i];
      var m;

      if (/^##\s?/.test(l)) {
        corpo += '<span class="t-linha t-coment">' + esc(l) + '</span>\n';
      } else if ((m = l.match(/^\$\s?(.*)$/))) {
        comandos.push(m[1]);
        corpo += '<span class="t-linha"><span class="t-ps">$</span> ' +
          '<span class="t-cmd">' + esc(m[1]) + '</span></span>\n';
      } else if ((m = l.match(/^#\s(.*)$/))) {
        comandos.push(m[1]);
        corpo += '<span class="t-linha"><span class="t-ps-root">#</span> ' +
          '<span class="t-cmd">' + esc(m[1]) + '</span></span>\n';
      } else {
        corpo += '<span class="t-linha t-saida">' + (l === '' ? '&nbsp;' : esc(l)) + '</span>\n';
      }
    }

    var paraCopiar = comandos.length ? comandos.join('\n') : codigo;

    return '<div class="terminal">' +
      '<div class="term-barra">' +
      '<span class="term-luzes"><i></i><i></i><i></i></span>' +
      '<span class="term-titulo">' + esc(titulo || 'deck@steamdeck: ~') + '</span>' +
      '<button class="term-copiar" type="button" data-copiar="' + esc(paraCopiar) + '" ' +
      'aria-label="Copiar comandos">copiar</button>' +
      '</div>' +
      '<pre><code>' + corpo.replace(/\n$/, '') + '</code></pre>' +
      '</div>';
  }

  function renderCodigo(codigo, lang) {
    return '<div class="bloco-codigo">' +
      '<div class="bc-barra">' +
      '<span class="bc-lang">' + esc(lang || 'texto') + '</span>' +
      '<button class="bc-copiar" type="button" data-copiar="' + esc(codigo) + '">' +
      ICONE_COPIAR + '<span>copiar</span></button>' +
      '</div>' +
      '<pre><code>' + esc(codigo) + '</code></pre>' +
      '</div>';
  }

  /* ---------- listas (com aninhamento por indentação) ---------- */

  var RE_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

  function coletarItens(linhas, inicio) {
    var itens = [];
    var i = inicio;

    while (i < linhas.length) {
      var m = linhas[i].match(RE_ITEM);
      if (m) {
        itens.push({
          indent: m[1].replace(/\t/g, '  ').length,
          ordenada: /^\d/.test(m[2]),
          texto: m[3],
          extra: []
        });
        i++;
        continue;
      }
      if (/^\s*$/.test(linhas[i])) {
        var prox = linhas[i + 1];
        if (prox && (RE_ITEM.test(prox) || /^\s{2,}\S/.test(prox))) { i++; continue; }
        break;
      }
      if (itens.length && /^\s{2,}\S/.test(linhas[i])) {
        itens[itens.length - 1].extra.push(linhas[i].trim());
        i++;
        continue;
      }
      break;
    }
    return { itens: itens, fim: i };
  }

  function montarLista(itens, pos, indent) {
    var ordenada = itens[pos].ordenada;
    var html = ordenada ? '<ol>' : '<ul>';

    while (pos < itens.length && itens[pos].indent >= indent) {
      if (itens[pos].indent > indent) {
        var r = montarLista(itens, pos, itens[pos].indent);
        html += r.html;
        pos = r.pos;
        continue;
      }
      var it = itens[pos];
      var conteudo = [it.texto].concat(it.extra).join(' ');
      var li = '<li>' + inline(conteudo);
      pos++;
      if (pos < itens.length && itens[pos].indent > indent) {
        var sub = montarLista(itens, pos, itens[pos].indent);
        li += sub.html;
        pos = sub.pos;
      }
      html += li + '</li>';
    }
    return { html: html + (ordenada ? '</ol>' : '</ul>'), pos: pos };
  }

  /* ---------- tabelas ---------- */

  function celulas(linha) {
    var l = linha.trim().replace(/^\|/, '').replace(/\|$/, '');
    return l.split('|').map(function (c) { return c.trim(); });
  }

  function renderTabela(linhas, inicio) {
    var cab = celulas(linhas[inicio]);
    var alinh = celulas(linhas[inicio + 1]).map(function (c) {
      if (/^:-+:$/.test(c)) return 'center';
      if (/^-+:$/.test(c)) return 'right';
      return 'left';
    });

    var html = '<div class="tabela-rolagem"><table><thead><tr>';
    cab.forEach(function (c, i) {
      html += '<th style="text-align:' + (alinh[i] || 'left') + '">' + inline(c) + '</th>';
    });
    html += '</tr></thead><tbody>';

    var i = inicio + 2;
    while (i < linhas.length && /^\s*\|/.test(linhas[i])) {
      var cs = celulas(linhas[i]);
      html += '<tr>';
      for (var k = 0; k < cab.length; k++) {
        html += '<td style="text-align:' + (alinh[k] || 'left') + '">' + inline(cs[k] || '') + '</td>';
      }
      html += '</tr>';
      i++;
    }
    return { html: html + '</tbody></table></div>', fim: i };
  }

  /* ---------- parser de blocos ---------- */

  function processar(texto, ctx) {
    var linhas = String(texto).replace(/\r\n?/g, '\n').split('\n');
    var out = [];
    var i = 0;
    var paragrafo = [];

    function fecharParagrafo() {
      if (paragrafo.length) {
        out.push('<p>' + inline(paragrafo.join(' ')) + '</p>');
        paragrafo = [];
      }
    }

    while (i < linhas.length) {
      var linha = linhas[i];

      /* bloco de código cercado */
      var fence = linha.match(/^\s*```+\s*([\w-]*)\s*(.*)$/);
      if (fence) {
        fecharParagrafo();
        var lang = (fence[1] || '').toLowerCase();
        var titulo = fence[2] || '';
        var buf = [];
        i++;
        while (i < linhas.length && !/^\s*```+\s*$/.test(linhas[i])) {
          buf.push(linhas[i]);
          i++;
        }
        i++; /* pula a cerca de fechamento */
        var codigo = buf.join('\n').replace(/\s+$/, '');
        out.push(lang === 'terminal' || lang === 'console' || lang === 'shell-session'
          ? renderTerminal(codigo, titulo)
          : renderCodigo(codigo, lang || 'texto'));
        continue;
      }

      /* caixa de destaque */
      var caixa = linha.match(/^\s*:::\s*([a-zç]+)\s*$/i);
      if (caixa) {
        fecharParagrafo();
        var tipo = caixa[1].toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        var dentro = [];
        var profundidade = 1;
        i++;
        while (i < linhas.length) {
          if (/^\s*:::\s*[a-zç]+\s*$/i.test(linhas[i])) { profundidade++; }
          else if (/^\s*:::\s*$/.test(linhas[i])) {
            profundidade--;
            if (profundidade === 0) { i++; break; }
          }
          dentro.push(linhas[i]);
          i++;
        }
        var rotulo = ROTULOS[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
        out.push('<div class="caixa caixa-' + esc(tipo) + '" role="note">' +
          '<span class="caixa-rotulo">' + esc(rotulo) + '</span>' +
          processar(dentro.join('\n'), ctx) +
          '</div>');
        continue;
      }

      /* título */
      var tit = linha.match(/^(#{2,6})\s+(.+?)\s*#*\s*$/);
      if (tit) {
        fecharParagrafo();
        var nivel = Math.min(tit[1].length, 4);
        var textoTit = tit[2];
        var id = slugificar(textoTit);
        var base = id, n = 2;
        while (ctx.ids[id]) { id = base + '-' + n; n++; }
        ctx.ids[id] = true;
        ctx.sumario.push({ nivel: nivel, id: id, texto: textoTit.replace(/[*`]/g, '') });
        out.push('<h' + nivel + ' id="' + id + '">' + inline(textoTit) + '</h' + nivel + '>');
        i++;
        continue;
      }

      /* linha horizontal */
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(linha)) {
        fecharParagrafo();
        out.push('<hr>');
        i++;
        continue;
      }

      /* tabela */
      if (/^\s*\|/.test(linha) && i + 1 < linhas.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(linhas[i + 1])) {
        fecharParagrafo();
        var tb = renderTabela(linhas, i);
        out.push(tb.html);
        i = tb.fim;
        continue;
      }

      /* citação */
      if (/^\s*>\s?/.test(linha)) {
        fecharParagrafo();
        var cit = [];
        while (i < linhas.length && /^\s*>\s?/.test(linhas[i])) {
          cit.push(linhas[i].replace(/^\s*>\s?/, ''));
          i++;
        }
        out.push('<blockquote>' + processar(cit.join('\n'), ctx) + '</blockquote>');
        continue;
      }

      /* lista */
      if (RE_ITEM.test(linha)) {
        fecharParagrafo();
        var col = coletarItens(linhas, i);
        if (col.itens.length) {
          out.push(montarLista(col.itens, 0, col.itens[0].indent).html);
          i = col.fim;
          continue;
        }
      }

      /* linha em branco */
      if (/^\s*$/.test(linha)) {
        fecharParagrafo();
        i++;
        continue;
      }

      paragrafo.push(linha.trim());
      i++;
    }

    fecharParagrafo();
    return out.join('\n');
  }

  /* ---------- API ---------- */

  function render(texto) {
    var ctx = { sumario: [], ids: Object.create(null) };
    var html = processar(texto || '', ctx);
    return { html: html, sumario: ctx.sumario };
  }

  global.MD = { render: render, esc: esc, slug: slugificar };

})(window);
