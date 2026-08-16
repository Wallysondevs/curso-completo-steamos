A cena de patching de ROMs tem uma pequena Torre de Babel de formatos, cada um nascido para resolver uma limitação do anterior. Saber qual serve para quê evita a frustração de "aplicou o patch e o jogo corrompeu" — que, na verdade, quase sempre é patch aplicado no ROM errado.

:::objetivos
- Entender a diferença entre IPS, UPS, BPS, PPF e XDelta
- Escolher o formato certo por plataforma e tamanho de ROM
- Reconhecer patches que falham por truncamento (limites de tamanho do formato)
- Aplicar e reverter patches corretamente
- Validar o resultado comparando o checksum do ROM modificado
:::

## IPS (International Patching System) — o pioneiro

O IPS é o formato mais antigo e ainda o mais difundido para consoles de 8 e 16 bits. Ele registra uma lista de "offset + dados a substituir", o que o torna simples, mas frágil.

Duas limitações clássicas:

- **Limite de 16 MB**: offsets são endereçados em 24 bits, então ROMs maiores (GBA acima de 16 MB, SNES grandes) quebram.
- **Sem verificação**: o IPS não grava o checksum do arquivo de origem, então nada impede você de aplicar num ROM errado e obter lixo.

Por causa da falta de checagem, a regra de ouro é: **confie no hash, não no formato**. Ferramentas modernas como `flips` (Floating IPS) adicionam verificação extra, mas o formato em si não carrega.

## UPS (Universal Patching System) — sucessor direto

Criado para resolver as dores do IPS mantendo a simplicidade: suporta arquivos maiores e armazena checksums de origem e destino, de modo que a ferramenta consegue *validar* que você está aplicando no ROM certo.

```terminal
$ flips --apply patch.ups rom-game.sfc saida.sfc
```

O UPS é o padrão recomendado para SNES, Genesis e GBA quando disponível, justamente pela checagem embutida. Se um patch UPS reclama de checksum, acredite nele: você está com o ROM errado.

## BPS (Beat Patching System) — o recomendado moderno

O BPS é o formato mais robusto da família "patches binários menores que o arquivo". É o padrão da comunidade de ROM hacking atual (romhacking.net passou a recomendar BPS) porque:

- Suporta ROMs de qualquer tamanho (offsets de largura variável).
- Armazena checksums CRC32 de origem e destino.
- Lida com inserções e remoções (não apenas substituições de tamanho fixo), permitindo mudanças que alteram o tamanho do arquivo.
- Pode armazenar metadados descritivos.

```terminal
$ flips --apply patch.bps rom-base.gba rom-modificado.gba
Patch successfully applied.
```

Se você só vai memorizar um formato, memorize o BPS.

## PPF (Playstation Patch Format) — o mundo do CD

Para jogos de CD (PS1, PS2, Saturn), o arquivo não é um ROM único, mas uma imagem `.bin/.cue` ou `.iso` de centenas de megabytes. O PPF foi desenhado para isso: aplica diferenças numa imagem de disco inteira, com suporte a mudanças de dados e até a criação de "undo" automático.

Ferramentas: `applyppf`, `ppf-o-matic`, ou o embutido em frontends como o DuckStation (que às vezes aplica PPF ao montar). O PPF exige a imagem exata — normalmente a versão "Redump" (a padrão da comunidade de preservação de CDs).

## XDelta e XDelta3 — o canivete suíço

O XDelta não é exclusivo de ROMs; é uma ferramenta genérica de diff binário usada amplamente (inclusive em patches de jogos de PC). No contexto de emulação, é a escolha para imagens grandes e ROMs de N64, DS, PSP e afins:

```terminal
$ xdelta3 -d -s original.iso patch.xdelta saida.iso
```

Diferente de IPS/UPS/BPS, o XDelta faz diff orientado a blocos, então é eficiente mesmo com arquivos gigantes. A desvantagem é que exige o arquivo de origem intacto e a ferramenta de linha de comando — não há "undo" mágico.

## Qual formato usar, resumo rápido

| Plataforma | Formato típico | Nota |
|---|---|---|
| NES, GB, GBC, Master System | IPS | ROMs pequenos, IPS basta |
| SNES, Genesis, GBA | UPS ou BPS | Prefira BPS (checksum) |
| N64, DS, PSP | XDelta | ROMs maiores |
| PS1, PS2, Saturn (CD/DVD) | PPF ou XDelta | Sobre imagem de disco |

## Validando o resultado

Depois de aplicar, confira o checksum contra o esperado pela página do hack. Muitos autores publicam o hash do ROM já patcheado:

```terminal
$ sha1sum rom-modificado.gba
99f2a9c...  rom-modificado.gba
```

Se bater, o patch foi aplicado limpo. Se não bater, ou o ROM de origem era o errado, ou o patch tem dependências (ex.: deve ser aplicado sobre outro patch primeiro).

## Pontos-chave

- IPS é simples mas sem checagem e limitado a 16 MB.
- UPS e BPS guardam checksum; BPS é o formato moderno recomendado.
- PPF é para imagens de CD (PS1/PS2); XDelta para arquivos grandes e genéricos.
- Sempre valide o ROM de saída pelo checksum publicado pelo autor.

## Exercícios

1. Aplique um mesmo hack disponível em IPS e em BPS e compare se os dois ROMs gerados são idênticos (mesmo `sha1sum`).
2. Tente aplicar um patch UPS no ROM errado (versão de outra região) e observe como a ferramenta rejeita o checksum.
3. Use `xdelta3` para criar um patch a partir de um ROM original e um modificado, e depois reverta aplicando esse patch.
4. Aplique um PPF a uma imagem de PS1 e teste no DuckStation.
5. **Desafio.** Pegue um hack "multi-patch" que exige aplicação em ordem (base → patch A → patch B) e documente a sequência e os hashes de cada etapa.
