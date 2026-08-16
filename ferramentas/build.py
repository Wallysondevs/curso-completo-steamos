#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build.py — monta o site do Curso Completo de SteamOS.

O que ele faz, nesta ordem:

  1. lê estrutura/partes.json (as 12 partes e os 108 capítulos)
  2. lê conteudo/cap-NNN/indice.json de cada capítulo
  3. gera automaticamente o Markdown das seções em esboço
  4. valida a integridade de tudo (arquivos, JSON, Markdown)
  5. escreve dados/sumario.js e dados/sumario.json, consumidos pelo site
  6. imprime um relatório

Uso:
    python3 ferramentas/build.py            # build completo
    python3 ferramentas/build.py --so-verificar   # não escreve nada, só valida
"""

import json
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR_CONTEUDO = os.path.join(RAIZ, 'conteudo')
DIR_DADOS = os.path.join(RAIZ, 'dados')
ARQ_PARTES = os.path.join(RAIZ, 'estrutura', 'partes.json')

SECOES_POR_CAP = 9

problemas = []
avisos = []


def erro(msg):
    problemas.append(msg)


def aviso(msg):
    avisos.append(msg)


# --------------------------------------------------------------------------
# 1. Estrutura
# --------------------------------------------------------------------------

def carregar_partes():
    with open(ARQ_PARTES, encoding='utf-8') as f:
        return json.load(f)


# --------------------------------------------------------------------------
# 2. Índices de capítulo
# --------------------------------------------------------------------------

def caminho_cap(n):
    return os.path.join(DIR_CONTEUDO, 'cap-%03d' % n)


def indice_reserva(n, titulo, resumo):
    """Índice sintético para um capítulo cujo indice.json ainda não existe."""
    return {
        'capitulo': n,
        'titulo': titulo,
        'resumo': resumo,
        'secoes': [{
            'n': i,
            'titulo': '%s — parte %d' % (titulo, i),
            'arquivo': 'sec-%02d.md' % i,
            'status': 'esboco',
            'min': 8,
            'tags': [],
            'esboco': {
                'intro': 'Roteiro ainda não detalhado para esta seção.',
                'cobre': ['Conteúdo a definir'],
                'prereq': [],
                'comandos': [],
            },
        } for i in range(1, SECOES_POR_CAP + 1)],
        '_sintetico': True,
    }


def carregar_indice(n, titulo_oficial, resumo_oficial):
    caminho = os.path.join(caminho_cap(n), 'indice.json')
    if not os.path.exists(caminho):
        erro('capítulo %d: indice.json ausente (%s)' % (n, caminho))
        return indice_reserva(n, titulo_oficial, resumo_oficial)

    try:
        with open(caminho, encoding='utf-8') as f:
            idx = json.load(f)
    except Exception as exc:
        erro('capítulo %d: indice.json inválido — %s' % (n, exc))
        return indice_reserva(n, titulo_oficial, resumo_oficial)

    idx['capitulo'] = n
    if not idx.get('titulo'):
        idx['titulo'] = titulo_oficial
    elif idx['titulo'].strip() != titulo_oficial.strip():
        aviso('capítulo %d: título do índice difere de partes.json — usando o oficial' % n)
        idx['titulo'] = titulo_oficial
    if not idx.get('resumo'):
        idx['resumo'] = resumo_oficial

    secoes = idx.get('secoes') or []
    if len(secoes) != SECOES_POR_CAP:
        erro('capítulo %d: %d seções no índice (esperado %d)' % (n, len(secoes), SECOES_POR_CAP))

    normalizadas = []
    for i in range(1, SECOES_POR_CAP + 1):
        achada = next((s for s in secoes if int(s.get('n', 0)) == i), None)
        if achada is None:
            achada = {
                'n': i,
                'titulo': 'Seção %d (a definir)' % i,
                'status': 'esboco',
                'min': 8,
                'tags': [],
                'esboco': {'intro': 'Roteiro a definir.', 'cobre': ['Conteúdo a definir'],
                           'prereq': [], 'comandos': []},
            }
            erro('capítulo %d: seção %d ausente no índice' % (n, i))
        achada['n'] = i
        achada['arquivo'] = 'sec-%02d.md' % i
        achada['status'] = 'completo' if achada.get('status') == 'completo' else 'esboco'
        try:
            achada['min'] = max(3, min(40, int(achada.get('min', 8))))
        except (TypeError, ValueError):
            achada['min'] = 8
        tags = achada.get('tags') or []
        achada['tags'] = [str(t).strip().lower() for t in tags if str(t).strip()][:6]
        achada['titulo'] = str(achada.get('titulo', '')).strip() or 'Seção %d' % i
        normalizadas.append(achada)

    idx['secoes'] = normalizadas
    return idx


# --------------------------------------------------------------------------
# 3. Geração dos esboços
# --------------------------------------------------------------------------

MODELO_ESBOCO = """:::construcao
Esta seção ainda não foi redigida. O roteiro abaixo mostra exatamente o que ela vai cobrir.
:::

{intro}

## O que esta seção vai cobrir

{cobre}

## Pré-requisitos

{prereq}

## Comandos e arquivos que aparecem aqui

{comandos}

---

Subcapítulo **{c}.{s}** — capítulo {c}, *{cap_titulo}*.
"""


def gerar_esboco(cap_n, cap_titulo, sec):
    e = sec.get('esboco') or {}

    intro = str(e.get('intro') or '').strip()
    if not intro:
        intro = ('Este subcapítulo trata de **%s** dentro do capítulo sobre %s.'
                 % (sec['titulo'], cap_titulo.lower()))

    cobre = [str(x).strip() for x in (e.get('cobre') or []) if str(x).strip()]
    if not cobre:
        cobre = ['Roteiro detalhado ainda não definido para esta seção.']
    cobre_md = '\n'.join('- %s' % x for x in cobre)

    prereq = [str(x).strip() for x in (e.get('prereq') or []) if str(x).strip()]
    prereq_md = '\n'.join('- %s' % x for x in prereq) if prereq \
        else '- Nenhum além do conteúdo dos capítulos anteriores'

    comandos = [str(x).strip().strip('`') for x in (e.get('comandos') or []) if str(x).strip()]
    comandos_md = ' · '.join('`%s`' % c for c in comandos) if comandos \
        else '*A definir.*'

    return MODELO_ESBOCO.format(
        intro=intro, cobre=cobre_md, prereq=prereq_md, comandos=comandos_md,
        c=cap_n, s=sec['n'], cap_titulo=cap_titulo,
    )


LIMITE_PALAVRAS_COMPLETO = 400


def inspecionar_md(caminho):
    """Devolve (foi_redigido_a_mao, numero_de_palavras).

    Um arquivo conta como redigido quando existe, não começa com a caixa
    :::construcao (marca dos esboços gerados) e tem corpo suficiente.
    Assim o build nunca sobrescreve texto escrito por uma pessoa ou por um autor.
    """
    if not os.path.exists(caminho):
        return False, 0
    try:
        with open(caminho, encoding='utf-8') as f:
            txt = f.read()
    except Exception:
        return False, 0

    palavras = len(txt.split())
    primeira = next((l.strip() for l in txt.split('\n') if l.strip()), '')
    if primeira.startswith(':::construcao'):
        return False, palavras
    return palavras >= 200, palavras


# --------------------------------------------------------------------------
# 4. Validação do Markdown
# --------------------------------------------------------------------------

def validar_md(caminho, rotulo):
    try:
        with open(caminho, encoding='utf-8') as f:
            txt = f.read()
    except Exception as exc:
        erro('%s: não foi possível ler — %s' % (rotulo, exc))
        return 0

    linhas = txt.split('\n')
    dentro_cerca = False
    abertas = 0
    caixas = 0

    for i, l in enumerate(linhas, 1):
        if re.match(r'^\s*```', l):
            dentro_cerca = not dentro_cerca
            abertas += 1
            continue
        if dentro_cerca:
            continue
        if re.match(r'^#\s', l):
            erro('%s (linha %d): título de nível 1 não é permitido' % (rotulo, i))
        if re.match(r'^\s*:::\s*[a-zA-ZçÇ]+\s*$', l):
            caixas += 1
        elif re.match(r'^\s*:::\s*$', l):
            caixas -= 1

    if abertas % 2 != 0:
        erro('%s: bloco de código sem fechamento (``` ímpar)' % rotulo)
    if caixas != 0:
        erro('%s: caixa ::: sem fechamento (saldo %d)' % (rotulo, caixas))

    return len(txt.split())


# --------------------------------------------------------------------------
# 5. Build
# --------------------------------------------------------------------------

def main():
    so_verificar = '--so-verificar' in sys.argv

    dados = carregar_partes()
    partes = dados['partes']
    capitulos_oficiais = dados['capitulos']

    saida_caps = {}
    ordem = []
    total_secoes = 0
    total_completas = 0
    total_palavras = 0
    esbocos_gerados = 0

    for parte in partes:
        for cn in parte['capitulos']:
            oficial = capitulos_oficiais.get(str(cn), {})
            idx = carregar_indice(cn, oficial.get('titulo', 'Capítulo %d' % cn),
                                  oficial.get('resumo', ''))

            for sec in idx['secoes']:
                caminho_md = os.path.join(caminho_cap(cn), sec['arquivo'])
                rotulo = 'cap-%03d/%s' % (cn, sec['arquivo'])

                # O disco manda: um .md redigido à mão nunca é sobrescrito, e o status
                # do índice é apenas uma sugestão — quem decide é o conteúdo real.
                redigido, palavras = inspecionar_md(caminho_md)

                if redigido:
                    sec['status'] = 'completo'
                    sec['min'] = max(5, min(40, int(round(palavras / 170.0))))
                    if palavras < LIMITE_PALAVRAS_COMPLETO:
                        aviso('%s: texto próprio com apenas %d palavras' % (rotulo, palavras))
                else:
                    sec['status'] = 'esboco'
                    if not so_verificar:
                        os.makedirs(caminho_cap(cn), exist_ok=True)
                        with open(caminho_md, 'w', encoding='utf-8') as f:
                            f.write(gerar_esboco(cn, idx['titulo'], sec))
                        esbocos_gerados += 1

                if os.path.exists(caminho_md):
                    total_palavras += validar_md(caminho_md, rotulo)

                sec.pop('esboco', None)
                total_secoes += 1
                if sec['status'] == 'completo':
                    total_completas += 1
                ordem.append({'c': cn, 's': sec['n']})

            saida_caps[str(cn)] = {
                'n': cn,
                'titulo': idx['titulo'],
                'resumo': idx.get('resumo', ''),
                'parte': parte['n'],
                'secoes': idx['secoes'],
            }

    sumario = {
        'titulo': dados['titulo'],
        'subtitulo': dados['subtitulo'],
        'estatisticas': {
            'partes': len(partes),
            'capitulos': len(saida_caps),
            'secoes': total_secoes,
            'completas': total_completas,
            'esbocos': total_secoes - total_completas,
            'palavras': total_palavras,
        },
        'partes': [{'n': p['n'], 'titulo': p['titulo'],
                    'descricao': p['descricao'], 'capitulos': p['capitulos']} for p in partes],
        'capitulos': saida_caps,
        'ordem': ordem,
    }

    if not so_verificar:
        os.makedirs(DIR_DADOS, exist_ok=True)
        bruto = json.dumps(sumario, ensure_ascii=False, separators=(',', ':'))
        with open(os.path.join(DIR_DADOS, 'sumario.js'), 'w', encoding='utf-8') as f:
            f.write('/* Gerado por ferramentas/build.py — nao edite a mao. */\n')
            f.write('window.SUMARIO = ' + bruto + ';\n')
        with open(os.path.join(DIR_DADOS, 'sumario.json'), 'w', encoding='utf-8') as f:
            json.dump(sumario, f, ensure_ascii=False, indent=1)

    # ---- relatório ----
    print('=' * 62)
    print('  Curso Completo de SteamOS — build')
    print('=' * 62)
    print('  partes .................. %d' % len(partes))
    print('  capítulos ............... %d' % len(saida_caps))
    print('  subcapítulos ............ %d' % total_secoes)
    print('  redigidos ............... %d (%.1f%%)'
          % (total_completas, 100.0 * total_completas / max(total_secoes, 1)))
    print('  esboços ................. %d' % (total_secoes - total_completas))
    print('  esboços (re)gerados ..... %d' % esbocos_gerados)
    print('  palavras no total ....... %s' % format(total_palavras, ',d').replace(',', '.'))
    print('-' * 62)

    if avisos:
        print('  AVISOS (%d):' % len(avisos))
        for a in avisos[:25]:
            print('    · %s' % a)
        if len(avisos) > 25:
            print('    · ... e mais %d' % (len(avisos) - 25))
        print('-' * 62)

    if problemas:
        print('  PROBLEMAS (%d):' % len(problemas))
        for p in problemas[:40]:
            print('    ! %s' % p)
        if len(problemas) > 40:
            print('    ! ... e mais %d' % (len(problemas) - 40))
        print('=' * 62)
        return 1

    print('  Tudo certo. dados/sumario.js atualizado.')
    print('=' * 62)
    return 0


if __name__ == '__main__':
    sys.exit(main())
