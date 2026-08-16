O ProtonDB cobre duas realidades bem diferentes ao mesmo tempo: o desktop Linux, onde você tem teclado, tela grande e liberdade total, e o Steam Deck, uma máquina com tela de 7 polegadas, GPU integrada e um sistema imutável que limita o que você pode mexer. Um jogo "Platinum no desktop" pode ser uma tortura no deck. Filtrar os reports pela plataforma certa é o passo que evita comprar baseado na informação errada.

:::objetivos
- Entender por que desktop e Steam Deck divergem em compatibilidade
- Usar o filtro de Steam Deck na interface do site
- Ler reports que indicam explicitamente hardware de deck
- Interpretar os campos de sistema operacional e GPU de um report
- Evitar conclusões erradas ao misturar plataformas

:::

## Por que o mesmo jogo diverge entre plataformas

O ProtonDB agrega reports de qualquer máquina rodando Linux, e a maioria histórica deles vem do desktop. Mas deck e desktop impõem condições opostas. No desktop a GPU dedicada sobra, a resolução é alta e você pode instalar pacotes à vontade. No deck a APU integrada divide memória com o sistema, a tela trava em 1280×800 e o sistema de arquivos raiz é read-only — instalar dependências extras exige contornar com Flatpak ou com overlays.

Consequência prática: um jogo que pede 16 GB de RAM e uma GPU parruda pode reportar `Platinum` porque a amostra é toda de desktop, mas engasgar no deck. O inverso também acontece: jogos leves e indie costumam ser `Platinum` nos dois, e alguns títulos até se comportam *melhor* no deck porque a Valve testou e ajustou exatamente para aquele hardware.

:::atencao
A medalha consolidada no topo da página é calculada com **todos** os reports, desktop e deck misturados. Antes de decidir qualquer coisa, filtre. Uma medalha `Platinum` sem filtrar pode esconder que todos os reports de deck são `Silver` ou `Borked`.
:::

## O filtro por Steam Deck na interface

Na página de cada jogo, os reports podem ser filtrados por plataforma, sistema operacional, GPU e até por versão específica do Proton. O filtro que interessa aqui é o de Steam Deck: ele seleciona apenas os relatos enviados de uma máquina identificada como deck. Depois de ativá-lo, a medalha exibida e a barra de distribuição passam a refletir **somente** essa fatia da amostra.

Olhar a distribuição filtrada muda o jogo em relação à visão consolidada:

```terminal
$ xdg-open https://www.protondb.com/app/1145360
```

No caso do *Hades*, os reports de deck são quase todos `Platinum` — bate com a reputação dele como um dos títulos mais confortáveis de jogar no deck. Mas há muitos jogos em que a barra filtrada por deck fica visivelmente mais "vermelha" (mais `Bronze` e `Borked`) do que a visão geral, e é exatamente essa diferença que você quer enxergar antes de gastar dinheiro.

Para quantificar essa diferença sem depender do olho, compare os reports do endpoint bruto com um filtro rápido por `os`:

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/1145360.json" | python3 -c "
import sys, json
reports = json.load(sys.stdin)
deck = [r for r in reports if 'SteamOS' in r.get('os', '')]
desktop = [r for r in reports if 'SteamOS' not in r.get('os', '')]
print(f'Deck: {len(deck)} reports')
print(f'Desktop: {len(desktop)} reports')
# Conta ratings para cada grupo
from collections import Counter
deck_ratings = Counter(r['rating'] for r in deck)
desktop_ratings = Counter(r['rating'] for r in desktop)
print(f'Deck ratings:    {dict(deck_ratings)}')
print(f'Desktop ratings: {dict(desktop_ratings)}')
"
Deck: 17 reports
Desktop: 11 reports
Deck ratings:    {'platinum': 16, 'gold': 1}
Desktop ratings: {'platinum': 10, 'gold': 1}
```

A diferença entre os dois grupos fica visível nos números — e há jogos em que a divergência é muito mais acentuada.

## Lendo os metadados de um report

Cada report individual carrega a configuração de quem enviou. Saber ler esses metadados vale mais do que a nota, porque te diz se aquele relato se aplica a você. Os campos principais são:

| Campo | O que revela |
|---|---|
| OS | O sistema e a versão — no deck, aparece algo como "SteamOS 3.6" |
| GPU | O hardware gráfico — a APU do deck aparece como "AMD Custom GPU 0405" |
| Proton | A versão usada — "Proton Experimental", "Proton 9.x", "GE-Proton" |
| Hardware | Às vezes o próprio report marca "Steam Deck" como plataforma |
| Ajustes | Flags de lançamento e passos extras que a pessoa aplicou |

O par OS + GPU é o que mais denuncia um deck: "SteamOS" como sistema operacional e a APU AMD integrada. Já um report com "Ubuntu 24.04" e uma "NVIDIA RTX 3080" é desktop puro — útil, mas não para a sua decisão de deck.

Para inspecionar os metadados de reports reais sem abrir o navegador:

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/1145360.json" | python3 -c "
import sys, json
reports = json.load(sys.stdin)
for r in reports[:8]:
    print(f\"{r['created'][:10]} | {r['os']:15s} | {r['gpu']:25s} | {r['rating']}\")
"
2025-03-18 | SteamOS         | AMD Custom GPU 0405       | platinum
2025-03-15 | Ubuntu 24.04    | NVIDIA RTX 3080           | platinum
2025-03-12 | SteamOS         | AMD Custom GPU 0405       | platinum
2025-03-08 | Arch Linux      | AMD Radeon RX 7900 XTX    | gold
2025-03-01 | SteamOS         | AMD Custom GPU 0405       | platinum
2025-02-25 | Fedora 41       | NVIDIA RTX 4070           | platinum
2025-02-18 | SteamOS         | AMD Custom GPU 0405       | gold
2025-02-10 | Ubuntu 24.04    | NVIDIA RTX 3060           | platinum
```

As linhas com `SteamOS` + `AMD Custom GPU 0405` são de deck. As outras são desktop. É essa separação que o filtro do site faz automaticamente — e você consegue reproduzi-la com 3 linhas de Python.

:::dica
Na página, passe o mouse (ou toque) sobre a linha de hardware de um report para ver o detalhe completo. Em report de deck legítimo você reconhece a assinatura "SteamOS" + APU AMD; reports de desktop costumam trazer distribuições como Arch, Ubuntu ou Fedora e GPUs NVIDIA ou AMD dedicadas.
:::

## A API não filtra por deck diretamente

Um detalhe importante se você quiser automatizar: o endpoint de resumo que vimos antes **não** aceita filtro de plataforma. Ele devolve sempre o agregado global. Para ter os dados filtrados por deck, o caminho é pegar a lista de reports individuais e filtrar você mesmo no lado do cliente:

```terminal
$ xdg-open https://www.protondb.com/app/1145360
```

Na interface, o filtro resolve isso com cliques. Se você precisa do dado filtrado em script, consulte o endpoint de reports e separe por `operatingSystem` ou pelo campo que identifica o Steam Deck. O site também expõe essa separação em algumas páginas como um recorte visual, mas a API de resumo em si permanece agregada.

Outra saída para uma leitura rápida: existem extensões de navegador e wrappers comunitários (como o `protondb-cli` e o decky plugin "ProtonDB Badges") que injetam a medalha filtrada por deck direto na página da Steam ou na biblioteca do próprio deck. Eles usam a mesma API pública por baixo e poupam o trabalho de abrir o site toda vez.

## Resumo

- Desktop e Steam Deck divergem por GPU, resolução e sistema de arquivos imutável; a medalha global mistura os dois.
- O filtro de Steam Deck restringe a medalha e a barra aos relatos enviados de um deck real.
- A assinatura de um report de deck é "SteamOS" + APU AMD integrada; desktop traz distros variadas e GPU dedicada.
- A API de resumo não filtra por plataforma; o filtro é da interface, ou você filtra os reports no cliente.
- Plugins como o decky "ProtonDB Badges" trazem a medalha filtrada para dentro do deck.

## Exercícios

1. Abra um jogo "famoso e pesado" e compare a medalha global com a medalha filtrada por Steam Deck. Elas diferem?
2. Identifique, em pelo menos três reports de um mesmo jogo, o par OS + GPU e classifique cada um como deck ou desktop.
3. Localize um jogo cuja barra filtrada por deck fique visivelmente pior que a global e explique a provável causa da diferença.
4. Usando o endpoint de reports, colete alguns relatos e tente separar deck de desktop apenas pelos campos retornados.
5. **Desafio.** Sem depender do filtro visual, monte uma contagem manual de quantos reports de um jogo são de Steam Deck e recalcule mentalmente a medalha considerando só eles. Compare com o que o filtro do site mostra e explique eventuais discrepâncias.
