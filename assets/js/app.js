/* =========================================================================
   Curso Completo de SteamOS — aplicação
   Roteamento por hash (compatível com GitHub Pages), sumário dinâmico,
   busca, progresso local, tema claro/escuro e navegação por teclado.
   ========================================================================= */
(function () {
  'use strict';

  /* ============ 0. Estado e utilidades ============ */

  var S = window.SUMARIO || null;
  var CHAVE_PROG = 'steamos-curso:progresso';
  var CHAVE_TEMA = 'steamos-curso:tema';
  var CHAVE_ULT = 'steamos-curso:ultimo';
  var CHAVE_ABERTOS = 'steamos-curso:abertos';

  var cache = new Map();
  var indiceBusca = [];
  var progresso = new Set();
  var rotaAtual = null;
  var sumarioPagina = [];
  var filtroAtual = 'todos';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function pad(n, t) { return String(n).padStart(t, '0'); }
  function idSecao(c, s) { return c + '-' + s; }

  function semAcento(t) {
    return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function lerJSON(chave, padrao) {
    try { var v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; }
    catch (e) { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, typeof valor === 'string' ? valor : JSON.stringify(valor)); }
    catch (e) { /* modo privado */ }
  }

  function plural(n, um, muitos) { return n + ' ' + (n === 1 ? um : muitos); }

  var ICONES = {
    relogio: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>',
    livro: '<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 016.5 3H19v15H6.5A2.5 2.5 0 004 20.5z"/><path d="M4 20.5A2.5 2.5 0 016.5 18H19v3H6.5A2.5 2.5 0 014 20.5z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg>',
    seta: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
    setaEsq: '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg>',
    marcador: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4.5L6 21z"/></svg>'
  };

  /* ============ 1. Progresso ============ */

  function carregarProgresso() {
    progresso = new Set(lerJSON(CHAVE_PROG, []));
  }
  function salvarProgresso() {
    gravar(CHAVE_PROG, Array.from(progresso));
    atualizarProgressoUI();
  }
  function concluida(c, s) { return progresso.has(idSecao(c, s)); }

  function atualizarProgressoUI() {
    if (!S) return;
    var total = S.estatisticas.secoes;
    var feitas = progresso.size;
    var pct = total ? Math.round((feitas / total) * 100) : 0;
    $('#progresso-pct').textContent = pct + '%';
    $('#progresso-barra').style.width = pct + '%';
    $('#progresso-detalhe').textContent = feitas + ' de ' + total + ' subcapítulos concluídos';

    $$('.sec-link').forEach(function (a) {
      var ok = progresso.has(a.dataset.id);
      a.classList.toggle('concluido', ok);
    });
  }

  /* ============ 2. Tema ============ */

  function aplicarTema(t) {
    if (t === 'claro' || t === 'escuro') {
      document.documentElement.setAttribute('data-tema', t);
    } else {
      document.documentElement.setAttribute('data-tema', 'auto');
    }
  }

  function alternarTema() {
    var atual = document.documentElement.getAttribute('data-tema');
    var escuroAgora = atual === 'escuro' ||
      (atual === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var novo = escuroAgora ? 'claro' : 'escuro';
    aplicarTema(novo);
    gravar(CHAVE_TEMA, novo);
  }

  /* ============ 3. Sumário lateral ============ */

  function montarArvore() {
    var arv = $('#arvore');
    if (!S) {
      arv.innerHTML = '<p class="res-vazio">Sumário não carregado.</p>';
      return;
    }
    var abertos = new Set(lerJSON(CHAVE_ABERTOS, []));
    var html = '';

    S.partes.forEach(function (parte) {
      html += '<div class="parte" data-parte="' + parte.n + '">';
      html += '<div class="parte-cabecalho">Parte ' + parte.n + ' — ' + esc(parte.titulo) + '</div>';

      parte.capitulos.forEach(function (cn) {
        var cap = S.capitulos[cn];
        if (!cap) return;
        var cid = pad(cn, 3);
        html += '<div class="cap' + (abertos.has(cn) ? ' aberto' : '') + '" data-cap="' + cn + '">';
        html += '<button class="cap-botao" type="button" aria-expanded="' + abertos.has(cn) + '">' +
          '<svg class="seta" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>' +
          '<span class="cap-num">' + cn + '</span>' +
          '<span class="cap-nome">' + esc(cap.titulo) + '</span>' +
          '</button>';
        html += '<div class="secoes">';
        cap.secoes.forEach(function (sec) {
          var sid = idSecao(cn, sec.n);
          html += '<a class="sec-link" data-id="' + sid + '" data-status="' + sec.status + '" ' +
            'href="#/cap-' + cid + '/sec-' + pad(sec.n, 2) + '">' +
            '<span class="sec-marca">' + ICONES.check + '</span>' +
            '<span class="sec-texto">' + esc(sec.titulo) +
            (sec.status !== 'completo' ? '<span class="selo-esboco">esboço</span>' : '') +
            '</span></a>';
        });
        html += '</div></div>';
      });
      html += '</div>';
    });

    arv.innerHTML = html;

    arv.addEventListener('click', function (ev) {
      var bt = ev.target.closest('.cap-botao');
      if (bt) {
        var cap = bt.closest('.cap');
        cap.classList.toggle('aberto');
        bt.setAttribute('aria-expanded', cap.classList.contains('aberto'));
        var ab = new Set(lerJSON(CHAVE_ABERTOS, []));
        var n = +cap.dataset.cap;
        if (cap.classList.contains('aberto')) ab.add(n); else ab.delete(n);
        gravar(CHAVE_ABERTOS, Array.from(ab));
        return;
      }
      if (ev.target.closest('.sec-link') && window.innerWidth <= 950) fecharLateral();
    });

    atualizarProgressoUI();
    aplicarFiltro(filtroAtual);
  }

  function aplicarFiltro(f) {
    filtroAtual = f;
    $$('.chip').forEach(function (c) { c.classList.toggle('ativo', c.dataset.filtro === f); });

    $$('.cap').forEach(function (cap) {
      var links = $$('.sec-link', cap);
      var visiveis = 0;
      links.forEach(function (a) {
        var mostrar = f === 'todos' ||
          (f === 'completo' && a.dataset.status === 'completo') ||
          (f === 'pendente' && !progresso.has(a.dataset.id));
        a.style.display = mostrar ? '' : 'none';
        if (mostrar) visiveis++;
      });
      cap.style.display = (f === 'todos' || visiveis > 0) ? '' : 'none';
    });

    $$('.parte').forEach(function (p) {
      var caps = $$('.cap', p).filter(function (c) { return c.style.display !== 'none'; });
      p.style.display = caps.length ? '' : 'none';
    });
  }

  function marcarAtivo(c, s) {
    $$('.sec-link.ativo').forEach(function (a) { a.classList.remove('ativo'); });
    $$('.cap.contem-ativo').forEach(function (a) { a.classList.remove('contem-ativo'); });
    if (!c) return;
    var cap = $('.cap[data-cap="' + c + '"]');
    if (cap) {
      cap.classList.add('contem-ativo', 'aberto');
      var bt = $('.cap-botao', cap);
      if (bt) bt.setAttribute('aria-expanded', 'true');
    }
    if (s) {
      var link = $('.sec-link[data-id="' + idSecao(c, s) + '"]');
      if (link) {
        link.classList.add('ativo');
        var caixa = $('#arvore');
        var rl = link.getBoundingClientRect(), rc = caixa.getBoundingClientRect();
        if (rl.top < rc.top + 40 || rl.bottom > rc.bottom - 40) {
          caixa.scrollTop += rl.top - rc.top - caixa.clientHeight / 2.6;
        }
      }
    }
  }

  /* ============ 4. Busca ============ */

  function construirIndice() {
    if (!S) return;
    S.partes.forEach(function (parte) {
      parte.capitulos.forEach(function (cn) {
        var cap = S.capitulos[cn];
        if (!cap) return;
        cap.secoes.forEach(function (sec) {
          indiceBusca.push({
            c: cn, s: sec.n,
            titulo: sec.titulo,
            capTitulo: cap.titulo,
            parteTitulo: parte.titulo,
            status: sec.status,
            tags: (sec.tags || []).join(' '),
            busca: semAcento(sec.titulo + ' ' + (sec.tags || []).join(' ') + ' ' + cap.titulo + ' ' + parte.titulo)
          });
        });
      });
    });
  }

  function buscar(termo) {
    var q = semAcento(termo.trim());
    if (q.length < 2) return [];
    var termos = q.split(/\s+/);
    var res = [];

    indiceBusca.forEach(function (it) {
      var pont = 0;
      var tituloN = semAcento(it.titulo);
      var tagsN = semAcento(it.tags);
      var capN = semAcento(it.capTitulo);

      for (var i = 0; i < termos.length; i++) {
        var t = termos[i];
        if (it.busca.indexOf(t) === -1) return;
        if (tituloN.indexOf(t) === 0) pont += 14;
        else if (tituloN.indexOf(t) > -1) pont += 10;
        if (tagsN.split(' ').indexOf(t) > -1) pont += 9;
        else if (tagsN.indexOf(t) > -1) pont += 5;
        if (capN.indexOf(t) > -1) pont += 3;
      }
      if (it.status === 'completo') pont += 2;
      res.push({ it: it, pont: pont });
    });

    res.sort(function (a, b) { return b.pont - a.pont || a.it.c - b.it.c || a.it.s - b.it.s; });
    return res.slice(0, 40).map(function (r) { return r.it; });
  }

  function realcar(texto, termo) {
    var q = semAcento(termo.trim()).split(/\s+/).filter(function (t) { return t.length > 1; });
    var saida = esc(texto);
    var alvo = semAcento(texto);
    if (!q.length) return saida;
    var marcas = [];
    q.forEach(function (t) {
      var de = 0, p;
      while ((p = alvo.indexOf(t, de)) > -1) { marcas.push([p, p + t.length]); de = p + t.length; }
    });
    if (!marcas.length) return saida;
    marcas.sort(function (a, b) { return a[0] - b[0]; });
    var fundidas = [marcas[0]];
    for (var i = 1; i < marcas.length; i++) {
      var u = fundidas[fundidas.length - 1];
      if (marcas[i][0] <= u[1]) u[1] = Math.max(u[1], marcas[i][1]);
      else fundidas.push(marcas[i]);
    }
    var out = '', pos = 0;
    fundidas.forEach(function (m) {
      out += esc(texto.slice(pos, m[0])) + '<mark>' + esc(texto.slice(m[0], m[1])) + '</mark>';
      pos = m[1];
    });
    return out + esc(texto.slice(pos));
  }

  function mostrarResultados(termo) {
    var caixa = $('#resultados-busca');
    var campo = $('#campo-busca');
    if (termo.trim().length < 2) {
      caixa.hidden = true;
      campo.setAttribute('aria-expanded', 'false');
      return;
    }
    var itens = buscar(termo);
    if (!itens.length) {
      caixa.innerHTML = '<div class="res-vazio">Nenhum resultado para <strong>' + esc(termo) + '</strong></div>';
    } else {
      var html = '<div class="res-cabecalho">' + plural(itens.length, 'resultado', 'resultados') +
        (itens.length === 40 ? ' (mostrando os 40 melhores)' : '') + '</div>';
      itens.forEach(function (it) {
        html += '<a class="res-item" href="#/cap-' + pad(it.c, 3) + '/sec-' + pad(it.s, 2) + '">' +
          '<div class="res-titulo">' + realcar(it.titulo, termo) +
          (it.status !== 'completo' ? '<span class="selo-esboco">esboço</span>' : '') + '</div>' +
          '<div class="res-trilha">' + it.c + '.' + it.s + ' · ' + esc(it.capTitulo) + '</div></a>';
      });
      caixa.innerHTML = html;
    }
    caixa.hidden = false;
    campo.setAttribute('aria-expanded', 'true');
  }

  /* ============ 5. Carregamento de conteúdo ============ */

  function carregarMd(c, s) {
    var chave = idSecao(c, s);
    if (cache.has(chave)) return Promise.resolve(cache.get(chave));
    var url = 'conteudo/cap-' + pad(c, 3) + '/sec-' + pad(s, 2) + '.md';
    return fetch(url, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (txt) { cache.set(chave, txt); return txt; });
  }

  /* ============ 6. Telas ============ */

  function esc(t) { return window.MD ? window.MD.esc(t) : String(t); }

  function progressoDaParte(parte) {
    var tot = 0, feitas = 0;
    parte.capitulos.forEach(function (cn) {
      var cap = S.capitulos[cn];
      if (!cap) return;
      cap.secoes.forEach(function (sec) {
        tot++;
        if (concluida(cn, sec.n)) feitas++;
      });
    });
    return { tot: tot, feitas: feitas, pct: tot ? Math.round(feitas / tot * 100) : 0 };
  }

  function telaInicial() {
    var e = S.estatisticas;
    var ult = lerJSON(CHAVE_ULT, null);
    var h = '';

    h += '<section class="heroi">' +
      '<svg class="logo-steamos" viewBox="0 0 100 100" aria-hidden="true"><rect x="4" y="4" width="92" height="92" rx="18" fill="none"/><g stroke-linecap="round"><circle cx="40" cy="60" r="16" fill="none" stroke="#66C0F4" stroke-width="5"/><circle cx="40" cy="60" r="5" fill="#66C0F4"/><circle cx="71" cy="40" r="11" fill="none" stroke="#B8B6B4" stroke-width="5"/><circle cx="71" cy="40" r="4" fill="#B8B6B4"/><path d="M40 60 L71 40" stroke="#B8B6B4" stroke-width="5"/></g></svg>' +
      '<h1>Curso Completo de <b>SteamOS</b></h1>' +
      '<p class="sub">' + esc(S.subtitulo) + '. Um material em português, com explicações densas, ' +
      'sessões de terminal comentadas e exemplos de saída de cada comando.</p>' +
      '<div class="numeros">' +
      '<div class="numero"><b>' + e.partes + '</b><span>partes</span></div>' +
      '<div class="numero"><b>' + e.capitulos + '</b><span>capítulos</span></div>' +
      '<div class="numero"><b>' + e.secoes + '</b><span>subcapítulos</span></div>' +
      '<div class="numero"><b>' + e.completas + '</b><span>já redigidos</span></div>' +
      '</div>' +
      '<div class="acoes-heroi">' +
      (ult ? '<a class="botao" href="#/cap-' + pad(ult.c, 3) + '/sec-' + pad(ult.s, 2) + '">' +
        ICONES.play + 'Continuar de onde parei</a>' : '') +
      '<a class="botao' + (ult ? ' secundario' : '') + '" href="#/cap-001/sec-01">' +
      ICONES.livro + 'Começar do início</a>' +
      '</div></section>';

    h += '<h2 class="titulo-bloco">As 12 partes do curso</h2><div class="grade-partes">';
    S.partes.forEach(function (p) {
      var pr = progressoDaParte(p);
      var prim = p.capitulos[0];
      h += '<a class="cartao-parte" href="#/cap-' + pad(prim, 3) + '">' +
        '<span class="cp-num">Parte ' + p.n + '</span>' +
        '<span class="cp-titulo">' + esc(p.titulo) + '</span>' +
        '<span class="cp-desc">' + esc(p.descricao) + '</span>' +
        '<span class="cp-rodape">' +
        '<span>' + plural(p.capitulos.length, 'capítulo', 'capítulos') + '</span>' +
        '<span class="cp-barra"><i style="width:' + pr.pct + '%"></i></span>' +
        '<span>' + pr.pct + '%</span></span></a>';
    });
    h += '</div>';

    h += '<h2 class="titulo-bloco">Como este material funciona</h2>' +
      '<div class="md">' +
      '<div class="caixa caixa-info"><span class="caixa-rotulo">Informação</span>' +
      '<p>O curso tem <strong>' + e.secoes + ' subcapítulos</strong>. Os que já foram redigidos trazem ' +
      'objetivos, explicação conceitual, sessões de terminal com saída de exemplo, resumo e exercícios. ' +
      'Os demais aparecem marcados como <strong>esboço</strong> e já mostram exatamente o que vão cobrir, ' +
      'servindo como roteiro de estudo.</p></div>' +
      '<div class="caixa caixa-atencao"><span class="caixa-rotulo">Atenção</span>' +
      '<p>Todas as saídas de terminal são <strong>ilustrativas</strong>: reproduzem o formato real de cada ' +
      'comando, mas com dados de exemplo (usuário <code>deck</code>, máquina <code>steamdeck</code>). ' +
      'Os números que você verá na sua máquina serão diferentes.</p></div>' +
      '<div class="caixa caixa-dica"><span class="caixa-rotulo">Dica</span>' +
      '<p>Seu progresso fica salvo neste navegador. Use <kbd>/</kbd> para buscar, ' +
      '<kbd>←</kbd> e <kbd>→</kbd> para navegar entre subcapítulos e o botão de tema no topo ' +
      'para alternar entre claro e escuro.</p></div>' +
      '</div>';

    document.title = S.titulo;
    return h;
  }

  function telaCapitulo(cn) {
    var cap = S.capitulos[cn];
    if (!cap) return telaErro('Capítulo ' + cn + ' não encontrado.');
    var parte = S.partes.find(function (p) { return p.capitulos.indexOf(cn) > -1; });
    var h = '';

    h += '<nav class="trilha"><a href="#/">Início</a><span class="sep">›</span>' +
      '<span>Parte ' + (parte ? parte.n : '?') + ' — ' + esc(parte ? parte.titulo : '') + '</span></nav>';

    h += '<header class="cap-cabecalho">' +
      '<div class="cap-etiqueta">Capítulo ' + cn + ' de ' + S.estatisticas.capitulos + '</div>' +
      '<h1>' + esc(cap.titulo) + '</h1>' +
      '<p class="resumo">' + esc(cap.resumo || '') + '</p></header>';

    h += '<div class="lista-secoes">';
    cap.secoes.forEach(function (sec) {
      var ok = concluida(cn, sec.n);
      h += '<a class="item-secao' + (ok ? ' concluido' : '') + '" href="#/cap-' + pad(cn, 3) + '/sec-' + pad(sec.n, 2) + '">' +
        '<span class="is-num">' + (ok ? ICONES.check : cn + '.' + sec.n) + '</span>' +
        '<span class="is-corpo"><span class="is-titulo">' + esc(sec.titulo) + '</span>' +
        '<span class="is-tags">' +
        (sec.tags || []).slice(0, 4).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') +
        '</span></span>' +
        '<span class="is-meta">' +
        '<span class="selo ' + (sec.status === 'completo' ? 'pronto">redigido' : 'rascunho">esboço') + '</span>' +
        '<span>' + (sec.min || 10) + ' min</span></span></a>';
    });
    h += '</div>';

    document.title = cn + '. ' + cap.titulo + ' — ' + S.titulo;
    return h;
  }

  function telaSecao(cn, sn, md) {
    var cap = S.capitulos[cn];
    var sec = cap.secoes.find(function (x) { return x.n === sn; });
    var parte = S.partes.find(function (p) { return p.capitulos.indexOf(cn) > -1; });
    var r = window.MD.render(md);
    sumarioPagina = r.sumario;
    var ok = concluida(cn, sn);

    var h = '';
    h += '<nav class="trilha">' +
      '<a href="#/">Início</a><span class="sep">›</span>' +
      '<span>Parte ' + (parte ? parte.n : '?') + '</span><span class="sep">›</span>' +
      '<a href="#/cap-' + pad(cn, 3) + '">' + cn + '. ' + esc(cap.titulo) + '</a>' +
      '</nav>';

    h += '<header class="cabecalho-secao">' +
      '<h1>' + esc(sec.titulo) + '</h1>' +
      '<div class="meta-secao">' +
      '<span class="meta-item">' + ICONES.marcador + 'Subcapítulo ' + cn + '.' + sn + '</span>' +
      '<span class="meta-item">' + ICONES.relogio + (sec.min || 10) + ' min de leitura</span>' +
      '<span class="selo ' + (sec.status === 'completo' ? 'pronto">redigido' : 'rascunho">esboço') + '</span>' +
      '<button class="marcar-lido' + (ok ? ' ativo' : '') + '" id="btn-lido" type="button">' +
      ICONES.check + '<span>' + (ok ? 'Concluído' : 'Marcar como concluído') + '</span></button>' +
      '</div></header>';

    h += '<div class="md">' + r.html + '</div>';

    document.title = cn + '.' + sn + ' ' + sec.titulo + ' — ' + S.titulo;
    return h;
  }

  function telaErro(msg, detalhe) {
    return '<div class="md"><div class="caixa caixa-perigo"><span class="caixa-rotulo">Não foi possível carregar</span>' +
      '<p>' + esc(msg) + '</p>' + (detalhe ? '<p>' + detalhe + '</p>' : '') + '</div></div>';
  }

  /* ============ 7. Navegação anterior / próximo ============ */

  function indiceNaOrdem(c, s) {
    for (var i = 0; i < S.ordem.length; i++) {
      if (S.ordem[i].c === c && S.ordem[i].s === s) return i;
    }
    return -1;
  }

  function montarPares(c, s) {
    var el = $('#nav-pares');
    if (c == null || s == null) { el.innerHTML = ''; return; }
    var i = indiceNaOrdem(c, s);
    var ant = i > 0 ? S.ordem[i - 1] : null;
    var prox = i > -1 && i < S.ordem.length - 1 ? S.ordem[i + 1] : null;
    var h = '';

    if (ant) {
      var ta = S.capitulos[ant.c].secoes.find(function (x) { return x.n === ant.s; });
      h += '<a class="par anterior" href="#/cap-' + pad(ant.c, 3) + '/sec-' + pad(ant.s, 2) + '">' +
        ICONES.setaEsq + '<span><span class="par-rotulo">Anterior</span>' +
        '<span class="par-titulo">' + esc(ta.titulo) + '</span></span></a>';
    } else h += '<span class="par par-vazio"></span>';

    if (prox) {
      var tp = S.capitulos[prox.c].secoes.find(function (x) { return x.n === prox.s; });
      h += '<a class="par proximo" href="#/cap-' + pad(prox.c, 3) + '/sec-' + pad(prox.s, 2) + '">' +
        ICONES.seta + '<span><span class="par-rotulo">Próximo</span>' +
        '<span class="par-titulo">' + esc(tp.titulo) + '</span></span></a>';
    } else h += '<span class="par par-vazio"></span>';

    el.innerHTML = h;
  }

  /* ============ 8. Índice da página ============ */

  function montarIndicePagina() {
    var el = $('#ip-lista');
    var caixa = $('#indice-pagina');
    if (!sumarioPagina.length) { caixa.style.visibility = 'hidden'; el.innerHTML = ''; return; }
    caixa.style.visibility = 'visible';
    el.innerHTML = sumarioPagina.map(function (t) {
      return '<a class="n' + t.nivel + '" href="#' + t.id + '" data-alvo="' + t.id + '">' + esc(t.texto) + '</a>';
    }).join('');
  }

  function espiarRolagem() {
    if (!sumarioPagina.length) return;
    var limite = 130;
    var ativo = null;
    for (var i = 0; i < sumarioPagina.length; i++) {
      var el = document.getElementById(sumarioPagina[i].id);
      if (el && el.getBoundingClientRect().top <= limite) ativo = sumarioPagina[i].id;
    }
    if (!ativo && sumarioPagina.length) ativo = sumarioPagina[0].id;
    $$('#ip-lista a').forEach(function (a) {
      a.classList.toggle('ativo', a.dataset.alvo === ativo);
    });
  }

  /* ============ 9. Roteador ============ */

  function analisarHash() {
    var h = (location.hash || '#/').replace(/^#/, '');
    var m = h.match(/^\/cap-(\d+)(?:\/sec-(\d+))?/);
    if (!m) return { tipo: 'inicio' };
    var c = parseInt(m[1], 10);
    if (m[2] == null) return { tipo: 'capitulo', c: c };
    return { tipo: 'secao', c: c, s: parseInt(m[2], 10) };
  }

  function mostrarCarregando(v) {
    var el = $('#carregando');
    if (!el) return;
    el.hidden = !v;
  }

  function rotear() {
    if (!S) {
      $('#artigo').innerHTML = telaErro(
        'O arquivo dados/sumario.js não foi carregado.',
        'Gere-o com <code>python3 ferramentas/build.py</code> e recarregue a página.');
      return;
    }
    var r = analisarHash();
    rotaAtual = r;
    var art = $('#artigo');
    fecharBusca();

    if (r.tipo === 'inicio') {
      mostrarCarregando(false);
      art.innerHTML = telaInicial();
      sumarioPagina = [];
      montarPares(null, null);
      montarIndicePagina();
      marcarAtivo(null, null);
      window.scrollTo({ top: 0 });
      return;
    }

    if (r.tipo === 'capitulo') {
      mostrarCarregando(false);
      art.innerHTML = telaCapitulo(r.c);
      sumarioPagina = [];
      montarPares(null, null);
      montarIndicePagina();
      marcarAtivo(r.c, null);
      window.scrollTo({ top: 0 });
      return;
    }

    var cap = S.capitulos[r.c];
    var sec = cap && cap.secoes.find(function (x) { return x.n === r.s; });
    if (!sec) {
      art.innerHTML = telaErro('Subcapítulo ' + r.c + '.' + r.s + ' não existe no sumário.');
      montarPares(null, null);
      return;
    }

    art.innerHTML = '';
    mostrarCarregando(true);
    marcarAtivo(r.c, r.s);
    gravar(CHAVE_ULT, { c: r.c, s: r.s });

    carregarMd(r.c, r.s)
      .then(function (md) {
        if (rotaAtual !== r) return;
        mostrarCarregando(false);
        art.innerHTML = telaSecao(r.c, r.s, md);
        montarPares(r.c, r.s);
        montarIndicePagina();
        window.scrollTo({ top: 0 });
        espiarRolagem();
      })
      .catch(function (err) {
        if (rotaAtual !== r) return;
        mostrarCarregando(false);
        var local = location.protocol === 'file:';
        art.innerHTML = telaErro(
          'Não consegui ler o arquivo conteudo/cap-' + pad(r.c, 3) + '/sec-' + pad(r.s, 2) + '.md (' + err.message + ').',
          local
            ? 'Você abriu o site pelo sistema de arquivos (<code>file://</code>), e o navegador bloqueia a leitura de arquivos nesse modo. ' +
              'Rode <code>python3 -m http.server 8000</code> na pasta do curso e acesse <code>http://localhost:8000</code>, ' +
              'ou publique no GitHub Pages, onde tudo funciona normalmente.'
            : 'Verifique se o arquivo existe e se o build foi executado.');
        montarPares(r.c, r.s);
      });
  }

  /* ============ 10. Interações ============ */

  function abrirLateral() {
    $('#lateral').classList.add('aberta');
    $('#cortina').hidden = false;
    $('#btn-menu').setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function fecharLateral() {
    $('#lateral').classList.remove('aberta');
    $('#cortina').hidden = true;
    $('#btn-menu').setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  function fecharBusca() {
    $('#resultados-busca').hidden = true;
    $('#campo-busca').setAttribute('aria-expanded', 'false');
  }

  function copiar(texto, botao) {
    var feito = function () {
      var antigo = botao.innerHTML;
      botao.classList.add('feito');
      botao.innerHTML = botao.classList.contains('term-copiar') ? 'copiado!' :
        '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg><span>copiado!</span>';
      setTimeout(function () { botao.classList.remove('feito'); botao.innerHTML = antigo; }, 1600);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(feito, function () { fallback(texto, feito); });
    } else fallback(texto, feito);
  }
  function fallback(texto, ok) {
    var ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); ok(); } catch (e) { /* nada */ }
    document.body.removeChild(ta);
  }

  function ligarEventos() {
    $('#btn-menu').addEventListener('click', function () {
      $('#lateral').classList.contains('aberta') ? fecharLateral() : abrirLateral();
    });
    $('#cortina').addEventListener('click', fecharLateral);
    $('#btn-tema').addEventListener('click', alternarTema);

    $$('.chip').forEach(function (c) {
      c.addEventListener('click', function () { aplicarFiltro(c.dataset.filtro); });
    });

    $('#btn-expandir').addEventListener('click', function () {
      $$('.cap').forEach(function (c) { c.classList.add('aberto'); });
      gravar(CHAVE_ABERTOS, $$('.cap').map(function (c) { return +c.dataset.cap; }));
    });
    $('#btn-recolher').addEventListener('click', function () {
      $$('.cap').forEach(function (c) { c.classList.remove('aberto'); });
      gravar(CHAVE_ABERTOS, []);
    });

    var campo = $('#campo-busca');
    var t = null;
    campo.addEventListener('input', function () {
      $('#busca-limpar').hidden = !campo.value;
      clearTimeout(t);
      t = setTimeout(function () { mostrarResultados(campo.value); }, 110);
    });
    campo.addEventListener('focus', function () {
      if (campo.value.trim().length >= 2) mostrarResultados(campo.value);
    });
    campo.addEventListener('keydown', function (ev) {
      var caixa = $('#resultados-busca');
      if (caixa.hidden) return;
      var itens = $$('.res-item', caixa);
      if (!itens.length) return;
      var i = itens.findIndex(function (x) { return x.classList.contains('selecionado'); });

      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (i > -1) itens[i].classList.remove('selecionado');
        i = ev.key === 'ArrowDown'
          ? (i + 1) % itens.length
          : (i <= 0 ? itens.length - 1 : i - 1);
        itens[i].classList.add('selecionado');
        itens[i].scrollIntoView({ block: 'nearest' });
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        var alvo = itens[i > -1 ? i : 0];
        if (alvo) { location.hash = alvo.getAttribute('href'); campo.blur(); fecharBusca(); }
      }
    });

    $('#busca-limpar').addEventListener('click', function () {
      campo.value = ''; $('#busca-limpar').hidden = true; fecharBusca(); campo.focus();
    });
    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('.busca')) fecharBusca();
    });

    /* botões de cópia (delegação) */
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-copiar]');
      if (b) { copiar(b.dataset.copiar, b); return; }

      var lido = ev.target.closest('#btn-lido');
      if (lido && rotaAtual && rotaAtual.tipo === 'secao') {
        var id = idSecao(rotaAtual.c, rotaAtual.s);
        if (progresso.has(id)) { progresso.delete(id); lido.classList.remove('ativo'); $('span', lido).textContent = 'Marcar como concluído'; }
        else { progresso.add(id); lido.classList.add('ativo'); $('span', lido).textContent = 'Concluído'; }
        salvarProgresso();
      }
    });

    /* teclado */
    document.addEventListener('keydown', function (ev) {
      var emCampo = /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName);
      if (ev.key === '/' && !emCampo) { ev.preventDefault(); campo.focus(); campo.select(); return; }
      if (ev.key === 'Escape') { fecharBusca(); fecharLateral(); if (emCampo) ev.target.blur(); return; }
      if (emCampo || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (!rotaAtual || rotaAtual.tipo !== 'secao') return;
      var i = indiceNaOrdem(rotaAtual.c, rotaAtual.s);
      if (ev.key === 'ArrowLeft' && i > 0) {
        location.hash = '#/cap-' + pad(S.ordem[i - 1].c, 3) + '/sec-' + pad(S.ordem[i - 1].s, 2);
      } else if (ev.key === 'ArrowRight' && i > -1 && i < S.ordem.length - 1) {
        location.hash = '#/cap-' + pad(S.ordem[i + 1].c, 3) + '/sec-' + pad(S.ordem[i + 1].s, 2);
      }
    });

    /* rolagem: barra de leitura, voltar ao topo, espião do índice */
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        var alt = document.documentElement.scrollHeight - window.innerHeight;
        var pct = alt > 0 ? (window.scrollY / alt) * 100 : 0;
        $('#barra-leitura i').style.width = pct + '%';
        $('#voltar-topo').hidden = window.scrollY < 500;
        espiarRolagem();
        tick = false;
      });
    }, { passive: true });

    $('#voltar-topo').addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    $('#ip-lista').addEventListener('click', function (ev) {
      var a = ev.target.closest('a');
      if (!a) return;
      ev.preventDefault();
      var alvo = document.getElementById(a.dataset.alvo);
      if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    window.addEventListener('hashchange', rotear);
    window.addEventListener('resize', function () {
      if (window.innerWidth > 950) fecharLateral();
    });
  }

  /* ============ 11. Início ============ */

  function iniciar() {
    aplicarTema(localStorage.getItem(CHAVE_TEMA));
    carregarProgresso();
    montarArvore();
    construirIndice();
    ligarEventos();
    rotear();
    atualizarProgressoUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

})();
