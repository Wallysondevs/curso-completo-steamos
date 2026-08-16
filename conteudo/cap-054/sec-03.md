Aplicar patches no Steam Deck não exige nada de exótico: tudo que você precisa roda em userland, sem root, e está disponível nos repositórios do Arch (que o SteamOS usa) ou via Flatpak. O desafio não é a ferramenta, é lembrar que o SteamOS é um sistema *imutável* — então o jeito de instalar segue algumas regras próprias.

:::objetivos
- Instalar `flips`, `xdelta3` e utilitários de patching no SteamOS
- Entender as limitações do sistema de arquivos somente-leitura do SteamOS
- Aplicar patches via linha de comando e via ferramentas gráficas
- Automatizar o patching de múltiplos ROMs com scripts
- Usar o Desktop Mode para patching com interface gráfica quando preferir
:::

## Instalando as ferramentas

O SteamOS é baseado em Arch, mas monta a raiz em modo somente-leitura (`/usr` é read-only em produção). A maneira correta de instalar pacotes de forma persistente é o Flatpak ou o `pacman` com o "unlock" do sistema de arquivos. Para ferramentas de patching, o caminho mais simples envolve Flatpak e/ou o repositório AUR:

```terminal
## Flips (Floating IPS) — multiformato, com interface gráfica
$ flatpak install flathub com.github.Alcaro.Flips

## xdelta3 — diffs binários
$ flatpak install flathub org.delta.XDelta

## Alternativa CLI via pacman (exige desbloquear o /usr)
$ sudo steamos-readonly disable
$ sudo pacman -S python-multipatcher xdelta3
```

Para quem não quer se aventurar no `pacman`, o Flatpak cobre 90% dos casos: o `flips` (Flips) é a ferramenta gráfica de referência e suporta IPS, UPS, BPS, PPF e até "softpatch" experimental.

## Um detalhe sobre o sistema imutável

O `steamos-readonly disable` desbloqueia a partição raiz, mas tudo que você instalar via `pacman` é *apagado* na próxima atualização de sistema do SteamOS. Isso não é um bug — é o design do SteamOS, e a Valve recomenda Flatpak/AppImage justamente por isso.

Regra prática:

- **Persistente**: Flatpak, AppImage, scripts no seu `~` (home).
- **Volátil**: qualquer coisa via `pacman` em `/usr`.

Seus ROMs, patches e scripts devem viver em `~/Emulation` ou em um cartão SD, nunca em `/usr`.

## Aplicando um patch: linha de comando

O fluxo mínimo com `flips` (que também roda em modo texto):

```terminal
## Sintaxe: flips --apply <patch> <rom-entrada> <rom-saida>
$ flips --apply tradução.bps pokemon.gba pokemon-ptbr.gba
```

Com `xdelta3`:

```terminal
$ xdelta3 -d -s rom-original.rom patch.xdelta rom-saida.rom
```

Uma convenção útil: **nunca sobrescreva o ROM original**. Sempre gere um arquivo de saída novo e nomeie de forma clara:

```terminal
$ flips --apply hack.bps "Final Fantasy VI (USA).sfc" "Final Fantasy VI - Brave New World.sfc"
```

## Aplicando via interface gráfica

Se você está no Desktop Mode (necessário para a maioria dos Flatpak com GUI), o `flips` oferece uma janela com três botões: "Apply Patch", o seletor de ROM de entrada e o de saída. O fluxo é drag-and-drop amigável e mostra o checksum na tela — útil para confirmar que você escolheu o ROM certo sem abrir terminal.

Para abrir um terminal no Steam Deck: Steam Button → Power → "Switch to Desktop". Lá, o Konsole (KDE) está a um clique.

## Automação com script

Quando o hack distribui vários patches (um por versão, ou uma sequência), um script shell economiza dezenas de cliques:

```bash
#!/usr/bin/env bash
# patchar.sh — aplica uma lista de patches em lote
set -euo pipefail
ROMDIR="$HOME/Emulation/roms"
PATCHDIR="$HOME/Emulation/patches"

# Formato: "rom_entrada|patch|rom_saida"
APLICAR=(
  "gba/Pokemon Emerald (USA).gba|emerald-ptbr.bps|gba/Pokemon Emerald PT-BR.gba"
  "sfc/Super Metroid (USA).sfc|metroid-redux.bps|sfc/Super Metroid Redux.sfc"
)

for item in "${APLICAR[@]}"; do
  IFS='|' read -r rom patch saida <<< "$item"
  flips --apply "$PATCHDIR/$patch" "$ROMDIR/$rom" "$ROMDIR/$saida"
  echo "OK: $saida"
done
```

Salve como `~/scripts/patchar.sh`, dê permissão e execute:

```terminal
$ chmod +x ~/scripts/patchar.sh
$ ~/scripts/patchar.sh
```

## Softpatch automatizado no RetroArch

Para softpatch, você nem precisa aplicar nada em disco — basta parear arquivos. Um script pode copiar o `.ips`/`.bps` para a pasta do ROM com o nome correspondente:

```bash
#!/usr/bin/env bash
# softpatch.sh <rom> <patch>
rom="$1"; patch="$2"
rombase="${rom%.*}"
cp "$patch" "${rombase}.$(basename "$patch" | sed 's/.*\.//')"
```

O RetroArch detecta o patch automaticamente no carregamento quando o nome-base coincide.

## Pontos-chave

- SteamOS é imutável: prefira Flatpak/AppImage para persistência.
- `flips` (Flips) é a ferramenta multiformato de referência; `xdelta3` para arquivos grandes.
- Nunca sobrescreva o ROM original; use nome de saída descritivo.
- Scripts em `~` automatizam patching em lote.
- Softpatch no RetroArch não exige gerar arquivo novo.

## Exercícios

1. Instale o `flips` via Flatpak e aplique um patch `.bps` de exemplo pela interface gráfica.
2. Escreva um script `patchar.sh` que processe ao menos três ROMs de uma lista.
3. Compare o tempo de aplicar um patch em disco (hardpatch) vs. softpatch no RetroArch.
4. Use `xdelta3` num arquivo grande (imagem de CD) e meça o tempo de processamento.
5. **Desafio.** Automatize a verificação de checksum pós-patch: o script compara o `sha1sum` do ROM gerado com um hash esperado lido de um arquivo `.sha1`.
