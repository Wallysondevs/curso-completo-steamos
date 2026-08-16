Jogos instalados via Lutris, Heroic e Bottles geram pastas espalhadas por `~/Games`, por `~/.var/app` e por prefixos internos — e o SteamOS tem um disco limitado, que enche rápido. Organizar onde cada coisa mora, mover para o cartão SD quando preciso e fazer backup dos saves é o que transforma uma biblioteca funcional numa biblioteca que sobrevive a reinstalações e trocas de cartão. Esta seção fecha o capítulo com essa camada de manutenção.

:::objetivos
- Mapear onde cada ferramenta guarda jogos, prefixos e saves
- Mover bibliotecas entre disco interno e cartão SD
- Fazer backup de saves, inclusive os escondidos em prefixos
- Liberar espaço removendo prefixos e caches órfãos
- Integrar jogos fora do Steam ao modo de jogo do Deck

:::

## O mapa completo do disco

Antes de mexer em qualquer coisa, vale ter o mapa mental (e real) de onde cada ferramenta escreve:

```terminal
$ ls ~/Games/
stardew-valley  Heroic/
$ ls ~/Games/Heroic/
Epic  GOG  Prefixes
$ ls ~/.var/app/
net.lutris.Lutris  com.heroicgameslauncher.hgl  com.usebottles.bottles
```

O Lutris escreve jogos em `~/Games/<jogo>` e configurações em `~/.var/app/net.lutris.Lutris/`. O Heroic usa `~/Games/Heroic/` para jogos e prefixos. O Bottles guarda as garrafas em `~/.var/app/com.usebottles.bottles/`. São três locais distintos, e um backup completo precisa cobrir os três.

:::dica
O diretório `~/.var/app` concentra dados de *todos* os Flatpaks, não só desses três. Na hora de medir espaço ou limpar, use `du -sh ~/.var/app/*` para ver quem mais consome e identificar órfãos.
:::

## Movendo para o cartão SD

Por padrão, as três ferramentas instalam no disco interno. Com um cartão SD grande, faz sentido mover bibliotecas para lá — mas prefira **apontar o destino** antes de instalar, em vez de mover depois.

```terminal
$ flatpak override --user --filesystem=/run/media/deck/sdcard com.heroicgameslauncher.hgl
$ flatpak override --user --filesystem=/run/media/deck/sdcard net.lutris.Lutris
$ flatpak override --user --filesystem=/run/media/deck/sdcard com.usebottles.bottles
```

O comando `flatpak override` concede, a cada aplicativo, acesso ao ponto de montagem do cartão SD (`/run/media/deck/sdcard`). Sem isso, o sandbox do Flatpak **bloqueia** o acesso ao cartão, e a ferramenta não enxerga a pasta. Este é o erro mais comum ao tentar instalar no SD.

:::atencao
O caminho exato do cartão varia: pode ser `/run/media/deck/<uuid>` em vez de `/run/media/deck/sdcard`. Descubra o seu com `ls /run/media/deck/`. Depois de conceder o acesso, no Heroic você troca o diretório de instalação nas configurações; no Lutris, define o destino por jogo; no Bottles, ajusta o diretório de garrafas.
:::

## Saves: o que mora dentro do prefixo

O item mais negligenciado — e mais doloroso de perder — é o save. Muitos jogos de Windows guardam progresso dentro do prefixo, em `drive_c/users/<nome>/Documents`, `AppData` ou pastas semelhantes.

```terminal
$ find ~/Games/Heroic/Prefixes/Hollow-Knight/drive_c/users -maxdepth 4 -type d -iname '*save*' 2>/dev/null | head -5
$ find ~/Games/Heroic/Prefixes/Hollow-Knight/drive_c/users -type d -iname 'AppData' | head -3
```

O primeiro `find` procura pastas de save; o segundo, a pasta `AppData`, onde muitos jogos guardam configuração e progresso. Se o jogo salva na nuvem (muitos da GOG e Epic têm cloud saves), você tem rede de segurança — mas cloud save não cobre jogos antigos nem títulos indie.

:::perigo
Apagar um prefixo apaga os saves que vivem dentro dele. Antes de remover qualquer prefixo (`rm -rf` ou "Delete bottle"), rode um `find` como o acima e copie para fora qualquer pasta de save que encontrar. É a diferença entre perder 10 minutos e perder 100 horas de jogo.
:::

## Backup na prática

Um backup sólido tem duas camadas: jogos (reinstaláveis, então opcionais) e saves/config (insubstituíveis, então obrigatórios). Os saves são Mbytes; os jogos são dezenas de Gbytes.

```terminal
$ mkdir -p ~/backup/saves
$ rsync -av --progress ~/Games/Heroic/Prefixes ~/backup/saves/prefixes-heroic 2>&1 | tail -3
$ du -sh ~/backup/saves/prefixes-heroic
1.2G  /home/deck/backup/saves/prefixes-heroic
```

Copiar os prefixos inteiros é a forma mais à prova de erro de preservar saves, porque pega tudo que mora dentro deles, mesmo os caminhos que você não sabia que existiam. O custo é o tamanho — 1,2 GB no exemplo — aceitável para o que protege.

:::dica
Alguns jogos da GOG oferecem os chamados offline installers, que baixam o jogo inteiro como arquivo `.sh`/`.exe`. Guardar esses instaladores num HD externo é um backup de *jogo* que não depende de servidor nenhum — útil se uma loja sair do ar. O Heroic tem opção para baixar esses instaladores.
:::

## Liberando espaço

Com o disco apertado, a ordem de limpeza é: cache de downloads, prefixos órfãos e, por fim, jogos que você não joga há meses.

```terminal
$ du -sh ~/.var/app/com.heroicgameslauncher.hgl/cache 2>/dev/null
$ du -sh ~/.var/app/net.lutris.Lutris/cache 2>/dev/null
$ du -sh ~/.var/app/com.usebottles.bottles/cache 2>/dev/null
```

O cache guarda instaladores temporários e componentes baixados que não são mais necessários. Apagar o conteúdo do cache é seguro (o aplicativo recria o que precisar), e costuma recuperar vários gigabytes.

```terminal
$ rm -rf ~/.var/app/com.heroicgameslauncher.hgl/cache/* 
```

:::atencao
"Não jogo há meses" não é o mesmo que "posso apagar". Antes de remover um jogo, confirme o estado dos saves (nuvem ou prefixo). Um jogo offline sem cloud save, apagado, é progresso perdido para sempre.
:::

## Integrando ao modo de jogo

O fechamento natural é trazer esses jogos para o modo de jogo do Steam. O Heroic tem a função nativa "Add to Steam"; o Lutris também adiciona atalhos; e qualquer garrafa do Bottles pode virar um non-Steam game apontando para o executável certo.

```terminal
$ ls ~/.local/share/applications/ | grep -iE 'heroic|lutris|bottles' | head -6
com.heroicgameslauncher.hgl.desktop
net.lutris.Lutris.desktop
```

Os arquivos `.desktop` são os atalhos que o Steam importa quando você adiciona um non-Steam game. Quando o Heroic cria um atalho de jogo, ele gera um `.desktop` próprio; adicioná-lo ao Steam faz o jogo aparecer no modo de jogo com a arte de capa — o toque final para uma biblioteca unificada no Deck.

## Resumo

- Lutris, Heroic e Bottles escrevem em locais distintos: `~/Games/` e `~/.var/app/<id>/`.
- `flatpak override --filesystem=/run/media/deck/...` concede acesso ao cartão SD dentro do sandbox.
- Saves em jogos de Windows frequentemente moram dentro do prefixo, em `drive_c/users/.../AppData`.
- Backups de saves copiam os prefixos; jogos são reinstaláveis, saves não.
- Cache dos Flatpaks pode ser apagado com segurança para liberar espaço.
- A função "Add to Steam" e os `.desktop` levam jogos externos ao modo de jogo do Deck.

## Exercícios

1. Mapeie o disco com `du -sh ~/Games/* ~/.var/app/net.lutris.Lutris ~/.var/app/com.heroicgameslauncher.hgl ~/.var/app/com.usebottles.bottles` e anote quem consome mais.
2. Identifique o ponto de montagem do seu cartão SD com `ls /run/media/deck/` e conceda acesso às três ferramentas com `flatpak override`.
3. Procure saves de um jogo instalado com `find ... -iname '*save*'` e copie-os para `~/backup/saves/`.
4. Meça os caches com `du -sh` e limpe o que for seguro; anote quantos gigabytes recuperou.
5. **Desafio.** Adicione um jogo do Heroic ao Steam via "Add to Steam", localize o `.desktop` gerado, e confirme que o jogo aparece no modo de jogo com arte. Depois, escreva um mini-roteiro de restauração completa (jogos + saves) para um Deck recém-formatado.
