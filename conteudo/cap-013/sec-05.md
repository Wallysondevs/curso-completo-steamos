Os perfis de desempenho não são inventados do zero toda vez — existe um conjunto de configurações padrão que o SteamOS sugere, e elas vêm embutidas no cliente. Esta seção mostra como acessar e inspecionar esses perfis recomendados sem abrir um jogo, entender por que certos gêneros pedem ajustes diferentes e usar os diretórios do sistema para ver o que já está disponível antes de criar qualquer coisa manualmente.

:::objetivos
- Identificar onde o SteamOS armazena perfis padrão no disco
- Diferenciar perfis recomendados por gênero de perfis manuais
- Usar o terminal para listar as recomendações do sistema
- Avaliar quando seguir a recomendação e quando ignorá-la
- Entender os ajustes típicos por gênero (RPG, FPS, indie, etc.)
:::

## Onde as recomendações vivem

O Steam Deck embarca configurações sugeridas que não são escritas por você — elas vêm da Valve ou são geradas pelo cliente com base em heurísticas. No disco, essas sugestões podem aparecer no diretório de configuração do Steam, geralmente sob `~/.local/share/Steam/steamapps/common/` em arquivos próprios dos títulos, ou dentro de subpastas como `_ship`.

```terminal
$ find ~/.local/share/Steam/steamapps -name "*.cfg" -o -name "*.ini" 2>/dev/null | head -10
/home/deck/.local/share/Steam/steamapps/common/SteamLinuxRuntime_sniper/run
/home/deck/.local/share/Steam/steamapps/common/SteamLinuxRuntime_sniper/_v2-entry-point
```

Esse `find` procura arquivos `.cfg` e `.ini` dentro do diretório de aplicativos — mas muitos jogos não têm configuração de desempenho em texto puro. O importante aqui não é o arquivo específico, e sim o fato de que o Steam usa o diretório `steamapps` como base para tudo que envolve os títulos, e as recomendações do Modo Jogo são lidas do cliente, não de um arquivo de texto editável.

## Gêneros e suas demandas

Cada gênero de jogo pressiona o Deck de um jeito diferente, e saber disso ajuda a decidir se você segue a recomendação do sistema ou a personaliza:

| Gênero | Exigência principal | Ajuste típico recomendado |
|---|---|---|
| FPS competitivo | Latência e FPS altos | FPS destravado, FSR desligado |
| RPG de mundo aberto | GPU constante, bateria | FPS 30-40, TDP moderado |
| Indie / pixel art | Quase nada de GPU | FPS 60, TDP baixíssimo |
| Emulador | CPU single-core | TDP generoso, GPU automática |
| Estratégia / 4X | CPU, fim de jogo pesado | TDP alto, FPS 30 é aceitável |

Essas recomendações não são regra — são heurísticas que a Valve e a comunidade refinaram observando milhares de horas de uso. A recomendação do sistema no Modo Jogo muitas vezes segue essa lógica, e você pode aceitá-la ou modificá-la depois.

## Verificando se um perfil do sistema já existe

O Steam cliente expõe recomendações através do painel de desempenho, mas você pode verificar se alguma configuração já foi gravada para um jogo sem abri-lo, inspecionando o `localconfig.vdf`:

```terminal
$ grep -A 12 '"PerformanceProfile"' ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf | head -40
```

Esse comando mostra todos os blocos `PerformanceProfile` com 12 linhas de contexto depois de cada um. Se um AppID aparece com perfil mas você nunca o criou, provavelmente o sistema gerou uma recomendação — ou alguém com acesso ao Deck a criou. A distinção é relevante porque perfis recomendados às vezes são reescritos em atualizações do cliente.

:::info
No SteamOS 3.6, as recomendações do sistema para TDP e FPS são geradas por um serviço interno do cliente e não ficam em um arquivo separado — elas são aplicadas em memória e gravadas no `localconfig.vdf` quando você resolve "adotar" a recomendação. Até lá, não deixam rastro no disco.
:::

## Quando ignorar a recomendação

A recomendação da Valve é genérica: ela não sabe se você está no sofá com o carregador por perto ou num voo de 10 horas. Um RPG que a Valve sugere rodar em 40 FPS pode perfeitamente rodar a 30 e lhe dar 40 minutos extras de bateria — e essa troca é sua, não da Valve.

```text
Recomendação do sistema: fpsLimit=40, tdpLimit="auto"
Ajuste da ana (viagem longa): fpsLimit=30, tdpLimit=8
```

O segundo perfil sacrifica fluidez por autonomia. Nenhum algoritmo decide isso por você, e é por isso que perfis manuais existem: para registrar essas decisões pessoais.

:::dica
Use a recomendação do sistema como ponto de partida: adote-a, jogue 5 minutos, e então ajuste slider por slider. Você gasta menos tempo do que partir do zero, mas o resultado final é seu.
:::

## O que muda com atualizações do Proton e do SteamOS

Perfis de desempenho podem ficar defasados quando o Proton melhora (o que diminui a necessidade de TDP para o mesmo FPS) ou quando o kernel do SteamOS ganha otimizações de driver. Por isso, recomendações que faziam sentido no SteamOS 3.4 podem estar conservadoras no 3.6.

```terminal
$ cat /etc/os-release | grep VERSION
VERSION="3.6"
VERSION_ID="3.6"
```

Saber sua versão do SteamOS é o primeiro passo para decidir se uma recomendação online (do Reddit, do ProtonDB, do fórum da Valve) ainda se aplica. As versões mais recentes do Mesa e do Proton incluídas no SteamOS 3.6 melhoram sensivelmente o desempenho de jogos DX12 e Vulkan, reduzindo a necessidade de perfis agressivos.

## Resumo

- As recomendações de perfil são geradas pelo cliente Steam e gravadas no `localconfig.vdf` quando adotadas.
- Cada gênero de jogo pressiona o Deck de forma diferente: FPS competitivo quer latência, RPG quer constância, indie quer economia.
- `grep -A` no `localconfig.vdf` revela perfis já existentes, incluindo recomendações adotadas.
- A recomendação do sistema é um ponto de partida, não um veredito; ajustes manuais servem para casos pessoais (bateria, conforto).
- Atualizações do Proton e do kernel podem tornar perfis antigos desnecessariamente conservadores.

## Exercícios

1. Liste cinco jogos que você joga no Deck e classifique cada um numa das categorias da tabela de gêneros. Para cada um, escreva qual ajuste você priorizaria.
2. Abra o Modo Jogo e veja se algum título mostra uma recomendação de desempenho. Anote o que a Valve sugere.
3. No `localconfig.vdf`, faça `grep -c "PerformanceProfile"` e compare o número com a quantidade de jogos que você lembra de ter configurado. Há perfis que você não criou?
4. Confira a versão do seu SteamOS com `cat /etc/os-release` e compare com a versão de referência deste curso (3.6). Se for diferente, pesquise a data de lançamento da sua versão.
5. **Desafio.** Escolha um jogo pesado (AAA) e crie dois perfis: um seguindo a recomendação do sistema e outro otimizado para bateria máxima. Jogue 15 minutos com cada e registre a queda percentual da bateria — isso integra monitoramento de sensores da [seção 4](#/cap-013/sec-04) com a criação de perfis da [seção 2](#/cap-013/sec-02).