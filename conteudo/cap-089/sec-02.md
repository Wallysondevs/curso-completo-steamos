O modo jogo do Steam tem uma identidade visual forte — fundo escuro, azul característico, tipografia própria — e é exatamente ela que você vai querer mudar antes de qualquer outra coisa. A boa notícia é que essa camada visual é, em essência, uma página da web renderizada por um Chromium embutido: o que dá forma ao menu são arquivos de CSS que podem ser sobrepostos. Esta seção mostra onde essa interface vive no disco, como ler sua versão e como preparar o terreno para aplicar skins sem depender de cliques mágicos.

:::objetivos
- Localizar no disco os arquivos que compõem a interface do modo jogo
- Identificar a versão e o canal do cliente Steam instalado
- Entender por que a interface é vulnerável a mudanças de CSS a cada atualização
- Preparar um backup simples do estado atual antes de qualquer skin
- Reconhecer os diretórios de dados do Steam no Steam Deck
:::

## Onde mora a interface do modo jogo

O Steam no Steam Deck não é uma aplicação opcional: ele é o shell do modo jogo. O cliente fica instalado num caminho próprio do SteamOS e, ao contrário do desktop Linux comum, não fica em `~/.local/share/Steam` como app — ele é parte da imagem imutável do sistema.

```terminal
$ which steam
/usr/bin/steam
$ readlink -f /usr/bin/steam
/usr/lib/steam/bin_steam.sh
$ ls /usr/lib/steam
bin_steam.sh  bin32  bin64  linux32  linux64  steamui  ubuntu12_32  ubuntu12_64
```

O diretório que interessa para skins é o `steamui` — é onde o Chromium embutido carrega os recursos da interface, incluindo as folhas de estilo padrão. É conteúdo do sistema, montado como somente-leitura na imagem do SteamOS, o que tem uma consequência prática que se repete ao longo do capítulo: você **não** edita esses arquivos diretamente. Para personalizar, você sobrepõe CSS por cima, em vez de mexer no original.

```terminal
$ ls /usr/lib/steam/steamui
css  fonts  index.html  libraryroot.css  ...
```

A presença de `index.html` e de uma pasta `css` confirma o que foi dito: a interface é uma página web. O Steam carrega esse `index.html` num Chromium sem barra de endereço, e as skins funcionam injetando estilos adicionais que **sobresscrevem** as regras padrão.

## Versão, canal e por que isso importa

Toda vez que a Valve atualiza o cliente, os nomes de classes internos da interface podem mudar. Uma skin que funcionava na versão anterior pode, da noite para o dia, deixar de colorir um menu ou quebrar um canto da tela. Por isso, antes de escolher skin, você precisa saber exatamente qual build do Steam está rodando.

```terminal
$ steam -version 2>/dev/null | head -3
Steam Version: 1738026274
Steam Runtime Version: 0.20241203.1
Steam Client Build Date: 2025-01-28
```

O número `1738026274` é o timestamp do build (em segundos desde a época Unix). Skins respeitáveis declaram, na página do repositório, contra qual build foram testadas; cruzar os dois números evita a frustração de instalar um tema que já nasceu quebrado.

Também vale saber em que canal de atualização você está: estável, beta ou preview. O canal beta recebe mudanças de interface antes, então é o cenário mais hostil a skins.

```terminal
$ grep -r "BetaName" ~/.steam/steam/package/*.vdf 2>/dev/null | head -3
```

O arquivo `package/beta` no diretório do Steam guarda a preferência de canal (`public` para o estável, `beta` para o beta). Manter-se no canal estável é a recomendação padrão de quem usa skins com frequência.

:::nota
O SteamOS em si também tem um canal (`stable`, `beta`, `main`) escolhido nas configurações do sistema — é diferente do canal do cliente Steam. Para skins, o que importa é o canal do **cliente**, pois é ele que muda o DOM da interface.
:::

## Entendendo read-only e a estratégia de sobreposição

O sistema operacional do Steam Deck usa uma raiz imutável por padrão: a partição do sistema é montada somente para leitura, e atualizações substituem a imagem inteira em vez de acumular arquivos. Isso é ótimo para estabilidade e péssimo para quem quer editar `/usr/lib/steam/steamui` na mão.

```terminal
$ mount | grep -E " / (ro|rw)"
/dev/nvme0n1p4 on / type btrfs (rw,relatime,space_cache=v2,subvolid=5,subvol=/@)
```

Em instalações padrão a raiz aparece montada como somente-leitura em `/` (e o `/usr` junto); o que é gravável fica nos overlays e em `/home`. Qualquer tentativa de escrever em `/usr` exige desativar a proteção (`sudo steamos-readonly disable`), e é algo que o curso deliberadamente **não** recomenda para skins — existe caminho limpo por cima.

A estratégia das ferramentas de skin é justamente não tocar no sistema: elas gravam os estilos num diretório do **usuário** e fazem o cliente Steam carregá-los como extras. Assim a imagem do sistema continua íntegra e a reversão é trivial.

:::atencao
Desativar o modo somente-leitura (`steamos-readonly disable`) para editar arquivos do sistema é uma porta larga para problemas, e a Valve pode reverter isso numa atualização apagando suas mudanças. Para o escopo deste capítulo — skins e aparência — nunca será necessário desativar o read-only. Se um tutorial pedir isso, desconfie.
:::

## Backup mínimo antes de mexer

Por mais que skins sejam reversíveis, um backup dos seus dados de Steam custa segundos e salva horas quando algo sai errado. O que importa preservar é o que é **seu**, não os arquivos do sistema:

```terminal
$ mkdir -p ~/lab/backup-steam
$ cp -r ~/.steam/steam/userdata ~/lab/backup-steam/userdata.bak
$ cp ~/.steam/steam/config/shortcuts.vdf ~/lab/backup-steam/ 2>/dev/null
$ ls -la ~/lab/backup-steam
total 12
drwxr-xr-x 2 ana ana 4096 Feb 10 14:02 .
drwxr-xr-x 3 ana ana 4096 Feb 10 14:01 ..
-rw-r--r-- 1 ana ana 3021 Feb 10 14:02 shortcuts.vdf
drwxr-xr-x 3 ana ana 4096 Feb 10 14:02 userdata.bak
```

O `~/.steam/steam/userdata` concentra configurações por usuário (incluindo as pastas de grade de capas), e o `shortcuts.vdf` guarda os atalhos externos. É o mesmo conjunto que aparece em capítulos sobre biblioteca e arte; preservá-lo antes de instalar plugins é higiene básica.

## Resumo

- A interface do modo jogo vive em `/usr/lib/steam/steamui` e é uma página web (HTML + CSS) num Chromium embutido.
- Skins sobrepõem CSS por cima do padrão; os arquivos do sistema não são editados diretamente.
- `steam -version` revela o build; skins devem ser checadas contra essa versão.
- O canal do cliente Steam (estável vs. beta) muda o risco de quebra das skins.
- O SteamOS usa raiz imutável, então a personalização grava no diretório do usuário, não em `/usr`.
- Backup de `~/.steam/steam/userdata` e `shortcuts.vdf` preserva o que é seu antes de qualquer plugin.

## Exercícios

1. Rode `steam -version` e anote o número do build. Guarde-o para usar como referência ao escolher skins.
2. Liste `ls /usr/lib/steam/steamui` e confirme a existência de uma pasta `css` e de um `index.html`. Explique, em uma frase, o que a presença deles implica.
3. Verifique o canal do cliente Steam (`package/beta`) e diga se você está no canal estável, beta ou preview.
4. Faça o backup mínimo (`userdata` e `shortcuts.vdf`) para `~/lab/backup-steam` e confirme com `ls` que os arquivos chegaram.
5. **Desafio.** Tente explicar por que desativar o modo somente-leitura do SteamOS não é necessário para aplicar uma skin — e o que aconteceria com uma skin gravada em `/usr` na próxima atualização do sistema.
