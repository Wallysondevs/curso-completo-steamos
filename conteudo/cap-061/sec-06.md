Até aqui você mediu e limpou pastas específicas. Mas e quando o disco está cheio e você não sabe por quê? `du` resolve, mas descer manualmente na árvore de diretórios com repetidos `du -sh *` é lento e propenso a erro. O `ncdu` — *NCurses Disk Usage* — transforma a análise de disco numa experiência interativa, navegável e muito mais rápida. Esta seção mostra como usá-lo, junto com alternativas baseadas em `du` puro para situações onde instalar nada não é opção.

:::objetivos
- Navegar no `ncdu` para identificar visualmente os maiores diretórios
- Interpretar o relatório do `ncdu` e exportar para arquivo offline
- Usar `du` com `sort` e `head` como alternativa leve e instalada de fábrica
- Comparar `du --max-depth` com `ncdu` em eficiência e legibilidade
- Aplicar análise de disco ao cenário específico do SteamOS com `--exclude`
:::

## Por que ncdu muda o jogo

`ncdu` é um programa de terminal que lê toda a árvore de diretórios num caminho, ordena do maior para o menor, e exibe uma interface navegável onde você sobe e desce na árvore com as setas do teclado. Em vez de percorrer a home com `du -sh` em cada subpasta, você roda ncdu uma vez e explora os resultados.

No SteamOS, `ncdu` não vem pré-instalado, mas chega em segundos via Flatpak ou pela loja Discover como `ncdu`:

```terminal
## Via pacote Arch (em modo desktop com pacman desbloqueado) ou via homebrew
$ brew install ncdu
```

Se o ambiente estiver bloqueado, você pode instalar pelo Flatpak: `com.github.vpelletier.ncdu`.

## Primeira análise com ncdu

```terminal
$ ncdu ~/
```

A tela inicial mostra os diretórios da sua home ordenados por tamanho decrescente. Com as setas `[[↑]]` e `[[↓]]` você navega, `[[Enter]]` entra num diretório, `[[←]]` volta, `[[d]]` marca para deleção e `[[q]]` sai:

```text
ncdu 1.20 ~ Use the arrow keys to navigate, press ? for help
--- /home/deck ---------------------------------------------------
   78.2 GiB [##########] /.local
   23.1 GiB [###       ] /Emulation
    8.9 GiB [#         ] /Downloads
    4.1 GiB [          ] /.cache
    2.3 GiB [          ] /.var
  345.2 MiB [          ] /Documents
  120.1 MiB [          ] /.config
```

A barra de progresso visual mostra a proporção relativa a cada fatia, e o número — 78.2 GiB em `.local` — já denuncia que a biblioteca Steam domina. Apertando `[[Enter]]` em `.local`, você desce mais um nível e vê que `share/Steam` come 72 GiB. Em segundos você localiza o culpado exato, sem digitar uma única linha de `du`.

## Exportando o relatório

`ncdu` pode exportar um relatório para arquivo, útil para comparar o antes e depois de uma faxina, ou para levar a outro computador:

```terminal
## Exporta o relatório em formato binário
$ ncdu -o ~/ncdu-home-report.json ~/

## Depois visualiza offline (até em outra máquina)
$ ncdu -f ~/ncdu-home-report.json
```

:::dica
O relatório exportado é um arquivo JSON com a árvore inteira. Você pode salvar uma foto do estado atual do disco, fazer a faxina, e depois gerar um novo relatório para comparar. O `ncdu` não tem diff nativo, mas `grep '"name"'` nos dois JSONs já mostra diferenças brutas.
:::

## Alternativa com du puro (sem instalar nada)

Se você não pode ou não quer instalar o `ncdu`, o `du` com os argumentos certos cobre 80% dos casos de uso:

```terminal
## Top 10 diretórios na home com um nível de profundidade
$ du -h --max-depth=1 ~/ 2>/dev/null | sort -hr | head -10

## Versão mais rápida: medir a home em MB, ordenar numericamente
$ du -m --max-depth=1 ~/ 2>/dev/null | sort -nr | head -10
```

A diferença para o `ncdu` é que cada descida na árvore exige rodar o comando de novo apontando para a subpasta. É mais lento, mas funciona em qualquer ambiente sem instalar nada — inclusive no próprio Game Mode via terminal SSH.

Para isolar a biblioteca Steam de outras pastas, o `--exclude` ajuda:

```terminal
$ du -h --max-depth=1 --exclude='.steam' --exclude='.local/share/Steam' \
    ~/ 2>/dev/null | sort -hr | head -10
```

Isso responde: "além dos jogos, o que está ocupando espaço?"

## Aplicando análise ao cenário SteamOS

O uso realista no Deck combina `ncdu` para análise exploratória e `du` com `sort` para verificações pontuais. Um fluxo típico:

```terminal
## 1. Análise ampla com ncdu
$ ncdu ~/

## 2. Identificada uma pasta suspeita, medir subpastas rapidamente
$ du -h --max-depth=2 ~/Emulation/roms/ | sort -hr | head -15

## 3. Foco nos arquivos grandes dentro da pasta, não nos diretórios
$ find ~/Emulation/roms/ps2 -type f -size +1G -exec ls -lh {} \;
```

Use `ncdu` para o diagnóstico, `du` para o detalhamento e `find` para a ação.

:::atencao
Rodar `ncdu ~/` escaneia **tudo** — inclusive `.steam` e `.local/share/Steam` que podem ser montanhas de arquivos pequenos. O scan pode levar de 30 segundos a 2 minutos num Deck com SSD NVMe cheio. Seja paciente; a espera compensa com a visibilidade que você ganha.
:::

## Resumo

- `ncdu` transforma a análise de disco em navegação interativa com setas do teclado.
- Ele exporta relatórios em JSON para comparação antes/depois de faxinas.
- `du --max-depth=1` com `sort -hr | head` é o substituto leve e sempre disponível.
- O `find` com `-size` complementa `ncdu` quando o alvo são arquivos, não diretórios.
- Excluir `.steam` e `.local` da análise mostra o que ocupa espaço além dos jogos.

## Exercícios

1. Instale o `ncdu` (Flatpak ou Homebrew) e roteie um scan completo da sua home.
2. Navegando no `ncdu`, desça até encontrar os três maiores diretórios individuais dentro de `.local/share` e anote os caminhos.
3. Exporte o relatório do `ncdu` com `-o`, depois faça o mesmo exercício com `du --max-depth=1` e compare os resultados.
4. Use `du --exclude` para medir o tamanho da home excluindo `.steam` e `.local/share/Steam`; o que sobrou no topo?
5. **Desafio.** Gere dois relatórios `ncdu -o` com 24 horas de intervalo (antes e depois de aplicar as limpezas das seções anteriores). Compare os JSONs e quantifique o espaço total recuperado.