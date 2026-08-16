Centenas de jogos de SNES, PlayStation, Saturn e até Game Boy só se tornaram acessíveis para quem não lê japonês graças a traduções de fãs. Essas traduções são, tecnicamente, ROM hacks cujo alvo é o subsistema de texto — e no Steam Deck elas funcionam tão bem quanto qualquer outra modificação.

:::objetivos
- Identificar os tipos de tradução de fãs e suas complexidades
- Aplicar traduções que vêm como patch IPS/UPS/BPS/XDelta
- Lidar com traduções que injetam fontes e tabelas de caracteres
- Aplicar traduções de jogos de CD (PS1/Saturn) via PPF/XDelta
- Verificar compatibilidade e reverter quando algo quebrar
:::

## Tipos de tradução e graus de complexidade

Nem toda tradução é igual. A complexidade varia enormemente:

- **Tradução direta de texto**: substitui as strings de diálogo. Fácil, tipicamente um simples patch de tabela.
- **Injeção de fonte (font hack)**: jogos que usam fonte bitmap japonesa precisam de uma fonte nova com caracteres latinos e acentos. Isso mexe no VWF (variable width font) e é onde muitos hacks ficam complicados.
- **Tradução com dublagem/voz**: raríssima em hacks de fãs (áudio é caro), mas existe em projetos como Tales of Phantasia.
- **Tradução de jogos de CD**: além do texto, pode exigir redublagem da voz gravada em arquivos de áudio — trabalho de anos de comunidade.

## Onde encontrar e checar a qualidade

O repositório histórico é o romhacking.net, com centenas de traduções catalogadas por plataforma, idioma e status (completo, em andamento, abandonado). Para jogos em português há comunidades próprias (projetos como o grupo "Traduções PT-BR" e fóruns dedicados).

Sempre leia o README do patch antes de aplicar: ele especifica qual ROM base (região, revisão), se há pré-requisitos (outro patch antes) e qual o hash esperado.

## Aplicando a tradução (patches binários)

O fluxo é idêntico ao de qualquer ROM hack:

```terminal
## Tradução de SNES (BPS)
$ flips --apply "Chrono Trigger PT-BR.bps" "Chrono Trigger (USA).sfc" "Chrono Trigger PT-BR.sfc"

## Tradução de GBA (UPS)
$ flips --apply "FF6 PT-BR.ups" "Final Fantasy VI (USA).gba" "Final Fantasy VI PT-BR.gba"
```

A diferença crítica nas traduções é **a região exata do ROM base**. Uma tradução feita a partir da versão japonesa não aplica na versão americana, e vice-versa — os offsets do texto diferem tudo.

## Tratando fontes e acentuação

Traduções para português precisam de acentos (á, é, ã, ç). Se o jogo original não tem esses glifos na fonte bitmap, o tradutor injeta uma fonte nova. Isso significa que o patch pode ser *maior* e mais sensível a versão.

Alguns projetos, em vez de um único patch, distribuem:

- Um **patch principal** (texto).
- Um **font patch** separado (glifos).

Aplique na ordem indicada pelo README, geralmente fonte primeiro, texto depois. Se invertermos, o texto pode usar glifos ausentes e exibir "?" ou quadrados.

## Traduções de jogos de CD (PS1, Saturn)

Jogos de CD trazem o texto em arquivos dentro da imagem, e as traduções geralmente vêm como PPF ou XDelta que alteram esses arquivos:

```terminal
## PS1 — imagem no padrão Redump
$ applyppf a "Final Fantasy VII (USA) (Disc 1).bin" "FF7 PT-BR (Disc 1).ppf"

## Ou via XDelta
$ xdelta3 -d -s "Chrono Cross (USA).bin" "chrono-cross-ptbr.xdelta" "Chrono Cross PT-BR.bin"
```

Pontos de atenção no CD:

- Aplique o patch em **cada disco** se o jogo tiver vários.
- O `.cue` normalmente permanece o mesmo (só a track de dados muda) — mas confira no README se o patch mexe na estrutura.
- Mantenha o `.cue`/`.bin` com nomes consistentes para o emulador montar correto.

## Verificando e revertendo

Depois de aplicar, carregue o ROM no emulador e confira se o texto está correto, sem caracteres quebrados e sem crash no menu. Se algo estiver errado, o caminho é simples porque você manteve o ROM original intacto:

```terminal
## Reverta simplesmente descartando o ROM patcheado
$ rm "Chrono Trigger PT-BR.sfc"
```

O ROM original nunca foi tocado — é a grande vantagem do fluxo "gerar novo arquivo, nunca sobrescrever".

## Pontos-chave

- Traduções são ROM hacks focados em texto; podem incluir font hack e áudio.
- O ROM base precisa ser a região/revisão exata indicada no README.
- Font patch e texto têm ordem de aplicação; siga o README.
- Jogos de CD: aplique PPF/XDelta por disco, mantendo o `.cue` consistente.
- Nunca sobrescreva o ROM original.

## Exercícios

1. Baixe uma tradução PT-BR de um jogo de SNES e aplique com `flips`, conferindo o hash do ROM base antes.
2. Aplique uma tradução que inclui font patch separado e observe a ordem correta de aplicação.
3. Traduza um jogo de GBA cujo patch exige a versão japonesa como base, e verifique se o texto renderiza acentos.
4. Aplique um PPF de tradução a um jogo de PS1 de dois discos e teste os dois discos.
5. **Desafio.** Pegue uma tradução abandonada (incompleta) e documente: quais trechos estão traduzidos, quais estão em branco, e se há possibilidade de completar com ferramentas de edição de tabela.
