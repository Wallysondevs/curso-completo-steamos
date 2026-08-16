Nem todo homebrew do Steam Deck chega com um instalador gráfico ou um script tão polido quanto o do Decky Loader. Existe um ecossistema paralelo de **utilitários CLI e scripts** mantidos pela comunidade no GitHub, que vão de ajustes finos de swap e VRAM a overclock de display e controles de ventoinha. Eles são menos visíveis, mas frequentemente mais poderosos — e, em muitos casos, o único caminho para certas otimizações.

:::objetivos
- Conhecer os principais utilitários de ajuste da comunidade
- Instalar e usar o cryo_utilities como estudo de caso
- Entender os limites dessas ferramentas e quando evitá-las
- Avaliar a procedência de scripts antes de executá-los como root
:::

## O ecossistema dos scripts comunitários

O GitHub é o lar da personalização do Deck. Alguns nomes onipresentes no fórum e no subreddit:

- **cryo_utilities** — ajusta parâmetros de swap, tamanho de página (huge pages) e swappiness, buscando melhorar a latência em jogos pesados.
- **PowerTools** (plugin do Decky, mas também com versão CLI) — controla SMT (hyperthreading), número de núcleos ativos e TDP.
- **SDL Display Overclock** — destrava refreshes de tela acima de 60 Hz em certas unidades.
- **Deck Settings** — frontend CLI para configurações do kernel e do hardware do Deck que o Steam não expõe.

Cada um desses projetos tem uma filosofia diferente: alguns são `systemd` services, outros são `bash` scripts únicos, outros patches ou kernel modules. O ponto em comum é que **todos exigem o modo leitura desabilitado** se forem tocar em arquivos de sistema — e, portanto, todos compartilham a efemeridade que você já conhece.

## cryo_utilities como estudo de caso

O cryo_utilities é um bom exemplo de como essas ferramentas funcionam. Ele é um script Python instalado clonando o repositório:

```terminal
$ cd ~/Downloads
$ git clone https://github.com/CryoByte33/steam-deck-utilities.git
$ cd steam-deck-utilities
$ ./cryo_utilities
```

Ao rodar, ele abre um menu de terminal que aplica ajustes com confirmação. O principal é a troca do swap: o SteamOS padrão usa swap via zram (comprimido, em RAM); o cryo pode expandir isso para um arquivo de swap em disco e aumentar o tamanho de página para 2 MB (huge pages) — ambos pensados para reduzir microstuttering em títulos que alocam muita memória.

```terminal
$ swapon --show
NAME       TYPE      SIZE  USED PRIO
/dev/zram0 partition  7G  2.3G  100
```

Depois de aplicar:

```terminal
$ swapon --show
NAME       TYPE       SIZE  USED PRIO
/dev/zram0 partition   7G    0B  100
/home/swapfile file    8G    0B   -2
```

A ferramenta também grava recomendações em arquivos de configuração que o kernel lê no boot:

```terminal
$ cat /etc/sysctl.d/cryo_utilities.conf
vm.swappiness=1
vm.page_lock_unfairness=1
```

:::atencao
Arquivos em `/etc/sysctl.d/` são apagados na atualização do sistema, junto com o resto de `/etc`. O cryo_utilities fornece um botão "Reapply" que você deve usar após cada update. A seção 9 trata exatamente dessa automação.
:::

## Avaliando um script antes de executar

O cenário: você encontra um script de ajuste numa thread do Reddit ou num gist do GitHub. Antes de rodar, há perguntas essenciais:

1. **Quem é o autor?** É um mantenedor ativo com várias releases, ou um gist anônimo sem estrelas?
2. **O que o script faz?** Leia o código. Um script de 50 linhas é auditável; um de 5.000 merece mais atenção.
3. **Ele roda como root?** Se `sudo` está envolvido, o dano potencial é total. Se roda como usuário, o escopo é limitado à home.
4. **Ele escreve fora de `/home`?** Se sim, o efeito é temporário e precisa de plano de reaplicação.
5. **As alterações são reversíveis?** A ferramenta oferece `disable`/`uninstall` ou você terá que reverter manualmente?

```terminal
$ # Antes de fazer:
$ curl -s https://raw.githubusercontent.com/user/repo/main/script.sh
$ # Leia, entenda e só depois:
$ chmod +x script.sh
$ ./script.sh
```

:::perigo
Um script que você não leu e que roda como root pode fazer qualquer coisa — inclusive apagar `/home`, modificar firmware ou alterar parâmetros de tensão do processador. Mesmo em comunidades confiáveis, a dica vale: audite antes de executar. O autor pode ter boas intenções e um bug que destrói dados da mesma forma.
:::

## Quando evitar uma ferramenta de ajuste

Nem todo ajuste é necessário. A comunidade produz ferramentas para todo gosto, e muitas delas resolvem problemas que a maioria dos usuários não tem. Sinais de que uma ferramenta provavelmente não vale a pena:

- Ela promete ganhos genéricos de FPS ("+15% em todos os jogos!").
- Ela ajusta parâmetros do kernel sem explicar *qual* problema está resolvendo.
- Ela é mantida por um único autor que não responde issues há meses.
- Ela exige um kernel customizado ou um patch de driver não-mainline — isso pode quebrar com cada atualização do SteamOS e exigir compilação manual.

A recomendação conservadora: só aplique ajustes de sistema quando você tiver um problema mensurável (ex.: stuttering em jogos que alocam >10 GB de RAM) e quando a ferramenta for mantida ativamente. O resto é preciosismo que custa tempo a cada update.

## Onde a comunidade se reúne

Os hubs de discussão que alimentam esse ecossistema:

- **GitHub** — `SteamDeckHomebrew` (Decky) e dezenas de projetos solo.
- **r/SteamDeck** — discussões gerais, anúncios e reviews de ferramentas.
- **Discord do Steam Deck Homebrew** — suporte em tempo real para plugins e desenvolvimento.
- **Steam Deck HQ** — benchmarks e reviews de otimizações.

Essas fontes são onde você descobre novas ferramentas e onde os mantenedores publicam updates. É recomendável acompanhar pelo menos uma delas.

## Resumo

- O ecossistema de scripts comunitários (cryo_utilities, PowerTools, etc.) oferece ajustes de sistema não expostos pela UI oficial.
- Essas ferramentas geralmente exigem modo leitura desabilitado e têm efeito temporário (apagadas a cada update).
- O cryo_utilities ajusta swap, swappiness e huge pages para reduzir stuttering; alterações em `/etc` precisam de reaplicação.
- Antes de executar qualquer script como root: leia o código, verifique a autoria, entenda o que ele altera e como reverter.
- Evite ajustes sem um problema mensurável; prefira ferramentas com manutenção ativa e propósito claro.

## Exercícios

1. Clone o cryo_utilities e inspecione o que ele altera (execute sem aplicar — use o modo informativo se disponível). Liste os arquivos que ele modifica em `/etc/` e em `/home/`.
2. Verifique sua configuração atual de swap (`swapon --show`) e swappiness (`sysctl vm.swappiness`). Anote os valores antes de qualquer alteração.
3. Aplique um ajuste de swap com o cryo_utilities e depois execute um jogo que antes apresentava stuttering. Houve diferença perceptível?
4. Encontre um script de ajuste da comunidade no GitHub que você ainda não conhece. Leia o código fonte e escreva um parágrafo explicando o que ele faz *por baixo*.
5. **Desafio.** Crie um script shell em `~/bin/reapply-tweaks.sh` que reaplique as configurações de swap e swappiness do cryo_utilities de forma idempotente — ou seja, que possa ser rodado várias vezes sem acumular entradas duplicadas. Teste-o em modo "simulação" (sem `sudo`) primeiro.