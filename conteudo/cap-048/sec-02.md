Antes de qualquer ajuste fino em shaders ou latência, é preciso ter o RetroArch rodando de forma estável no Deck. Como o SteamOS é um sistema imutável em que a raiz fica somente-leitura no modo normal, a rota oficial é pelo Flatpak, instalado via Discover. Esta seção cobre a instalação, a primeira execução e a organização inicial dos diretórios, deixando o terreno pronto para o resto do capítulo.

:::objetivos
- Instalar o RetroArch via Discover/Flatpak no SteamOS
- Entender por que o Flatpak é a via recomendada num sistema imutável
- Realizar a primeira execução e atualizar assets e bancos de dados
- Localizar o diretório de dados do Flatpak e o `retroarch.cfg`
- Adicionar o RetroArch à biblioteca Steam como atalho
:::

## Por que Flatpak num sistema imutável

O SteamOS mantém a partição raiz em modo *read-only* — o usuário não instala pacotes `apt` direto no sistema, pois uma atualização do sistema pode apagar tudo que não veio dele. Por isso aplicativos de terceiros entram pelo **Flatpak**, que roda cada app num sandbox isolado, com suas próprias bibliotecas em `~/.var/app/`.

O RetroArch tem um Flatpak oficial mantido pela própria Libretro (`org.libretro.RetroArch`). Instalar por ali garante versão atualizada e integração com o ambiente gráfico do Deck.

```terminal
$ flatpak install flathub org.libretro.RetroArch
Looking for matches…
Required runtime for org.libretro.RetroArch/x86_64/stable (runtime/org.freedesktop.Platform) found in remote flathub
Do you want to install it? [Y/n]: Y

Installing… done.
```

No modo Desktop do Deck, dá para fazer o mesmo pela interface do Discover: busque "RetroArch", clique em Instalar e aguarde. O resultado é o mesmo.

:::dica
O Deck alterna entre o Game Mode (Big Picture da Steam) e o Desktop Mode. Instale seus aplicativos sempre no Desktop Mode; depois você adiciona atalhos na Steam para abri-los no Game Mode.
:::

:::info
No SteamOS 3.6 (Noble), o runtime Flatpak é o `org.freedesktop.Platform` 24.08, que inclui as bibliotecas gráficas e o Vulkan Loader. É esse runtime que garante que o RetroArch consiga falar com a GPU do Deck sem depender de nada do sistema imutável.
:::

## Primeira execução e atualização de assets

Na primeira vez que você abre o RetroArch, ele cria toda a árvore de configuração automaticamente. Mas dois pedaços importantes não vêm junto: os **assets** (ícones e fontes do menu) e as **databases** (bancos para reconhecer ROMs nas playlists). Vale atualizar ambos logo.

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/
autoconfig/  config/       downloads/  playlists/
assets/      cores/        logs/       saves/
```

Pelo menu, o caminho é *Main Menu > Online Updater* e, na sequência, *Update Assets*, *Update Databases* e *Update Core Info Files*. O *Core Info Files* é especialmente importante: sem esses arquivos `.info`, o RetroArch não sabe exibir nome e descrição de cada core.

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/cores/*.info | wc -l
14
```

:::nota
A instalação via Flatpak não baixa nem cores nem assets — só o executável e o runtime. Todo o conteúdo de emulação (cores, shaders, info files) é puxado depois, pelo próprio RetroArch, através do *Online Updater*. É por isso que a primeira execução completa pode consumir alguns minutos de download.
:::

## O arquivo retroarch.cfg

Toda configuração que você altera pelo menu é persistida num único arquivo de texto: `config/retroarch.cfg`. Conhecer a versão em disco ajuda a depurar e a fazer backups. É um arquivo de chave-valor simples, sem seções nem hierarquia — cada linha tem o formato `chave = "valor"`.

```terminal
$ grep -n 'video_driver\|audio_driver\|video_fullscreen' \
    ~/.var/app/org.libretro.RetroArch/config/retroarch/retroarch.cfg
video_driver = "vulkan"
audio_driver = "pulse"
video_fullscreen = "true"
$ wc -l retroarch.cfg
324 retroarch.cfg
```

No Deck, o driver de vídeo recomendado é o `vulkan` — é o que tem melhor desempenho e suporte a shaders modernos. O `pulse` como driver de áudio funciona bem com o PipeWire que o SteamOS 3.6 usa por baixo. As mais de trezentas linhas do arquivo cobrem desde o caminho dos diretórios até a sensibilidade do stick analógico. Sempre que você não souber o nome interno de uma chave, abra o arquivo depois de mudar a opção no menu — a última linha gravada é a sua resposta.

:::atencao
Feche o RetroArch **antes** de editar o `retroarch.cfg` à mão. O programa reescreve o arquivo inteiro ao sair, sobrescrevendo qualquer edição feita por fora enquanto ele estava aberto.
:::

## Adicionando à biblioteca Steam

Para jogar no Game Mode sem ir ao Desktop, adicione o RetroArch como um jogo da Steam. No Desktop Mode, abra a Steam, vá em *Add a Game > Add a Non-Steam Game* e procure o atalho `.desktop` do Flatpak — ou, mais simples, instale o app na Steam diretamente pelo Discover, clicando em *Add to Steam* na página do RetroArch.

Depois de adicionado, você pode lançar o RetroArch a partir do Game Mode usando o controle, e ele vira apenas mais um item na sua biblioteca.

```terminal
$ ls ~/.local/share/applications/ | grep -i retro
org.libretro.RetroArch.desktop
```

Esse arquivo `.desktop` é o que a Steam usa para abrir o app. Saber onde ele está ajuda se você quiser criar atalhos customizados ou ajustar parâmetros de lançamento.

:::atencao
Ao rodar o RetroArch a partir do Game Mode, ele herda as propriedades de lançamento definidas na Steam. Se você usar uma configuração de vídeo de janela no Desktop e abrir pelo Game Mode, pode encontrar a janela pequena em vez de tela cheia — confira `video_fullscreen` e, se necessário, salve valores diferentes usando a opção *Settings > On-Screen Display > Notifications* para confirmar qual modo está ativo.
:::

## Resumo

- Num sistema imutável como o SteamOS, o RetroArch entra pelo Flatpak (`org.libretro.RetroArch`), seja via Discover ou `flatpak install`.
- A primeira execução cria `~/.var/app/org.libretro.RetroArch/config/retroarch/` com toda a estrutura.
- Assets, databases e core info files devem ser baixados pelo *Online Updater* logo após instalar.
- Toda configuração vive no `retroarch.cfg`; o driver de vídeo recomendado é `vulkan`.
- Adicionar o RetroArch à Steam permite abri-lo direto do Game Mode com o controle.

## Exercícios

1. Instale o RetroArch pelo Discover e confirme a instalação com `flatpak list | grep -i retro`.
2. Execute o *Update Assets*, *Update Databases* e *Update Core Info Files* e confira quantos `.info` foram baixados.
3. Localize e abra o `retroarch.cfg`; identifique os valores de `video_driver` e `video_fullscreen`.
4. Adicione o RetroArch à biblioteca Steam e abra-o uma vez a partir do Game Mode.
5. **Desafio.** Faça um backup do diretório `config/retroarch/` com `tar` e explique como restauraria sua configuração num Deck recém-formatado.
