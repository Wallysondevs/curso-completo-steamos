Aqui está a armadilha mais frustrante do SteamOS: você conecta um disco externo, o Dolphin o vê, o EmuDeck o usa — mas quando abre um aplicativo instalado via Flatpak, ele jura que o disco não existe. Isso acontece porque os aplicativos Flatpak rodam dentro de uma **sandbox** (caixa de isolamento) que limita quais partes do sistema de arquivos eles podem enxergar. Esta seção ensina a conceder acesso a discos externos para aplicativos Flatpak, tanto via GUI quanto pela linha de comando.

:::objetivos
- Entender por que aplicativos Flatpak não enxergam discos externos por padrão
- Conceder acesso a um disco via Flatseal e via `flatpak override`
- Usar o parâmetro `--filesystem=` com caminhos e montagens específicas
- Verificar e auditar as permissões atuais de um aplicativo Flatpak
- Resolver o caso específico do EmuDeck e outros aplicativos com ROMs em disco externo
:::

## A sandbox Flatpak em poucas palavras

Flatpak é o sistema de empacotamento preferido no SteamOS para aplicativos de desktop (Steam, emuladores, navegadores). Cada aplicativo Flatpak roda num contêiner com um sistema de arquivos parcialmente isolado do host. Por padrão, o aplicativo enxerga seu próprio diretório `~/.var/app/<id>/`, seu diretório home e pouco mais.

Um disco montado em `/run/media/ana/DADOS` está **fora** desses caminhos padrão. O resultado é um aplicativo que funciona perfeitamente, mas que abre e diz "nenhum arquivo encontrado" quando você aponta para o disco externo.

```terminal
$ flatpak run org.libretro.RetroArch
## Dentro do app: "Cannot read directory /run/media/ana/DADOS/roms: Permission denied"
```

Não é bug do aplicativo nem do disco. É a sandbox fazendo exatamente o que foi desenhada para fazer: isolar o aplicativo do resto do sistema.

## Flatseal: a fachada gráfica das permissões

O **Flatseal** é o gerenciador gráfico de permissões dos aplicativos Flatpak. Com ele, você concede acesso a pastas sem tocar em linha de comando:

```terminal
$ flatpak install flathub com.github.tchx84.Flatseal
$ flatpak run com.github.tchx84.Flatseal
```

Dentro do Flatseal, selecione o aplicativo na barra lateral (ex.: RetroArch), role até a seção **Filesystem** e adicione o caminho do disco na lista "Other files". O Flatseal escreve as permissões no perfil de override do aplicativo — o mesmo mecanismo que o comando `flatpak override` manipula.

:::dica
Ao navegar no Flatseal, você verá que a maioria dos aplicativos já tem acesso ao diretório home e a `xdg-*`. Discos externos em `/run/media/` ficam fora desse conjunto — por isso você precisa adicioná-los explicitamente.
:::

## flatpak override: a linha de comando

Tudo o que o Flatseal faz tem uma forma equivalente no terminal, através de `flatpak override`:

```terminal
$ flatpak override --user --filesystem=/run/media/ana/DADOS org.libretro.RetroArch
```

O parâmetro se divide em:

- `--user` — aplica a override só para seu usuário (sem `sudo`). Sem ele, `--system` altera todos os usuários.
- `--filesystem=/caminho` — concede acesso de leitura/escrita àquele caminho.
- `org.libretro.RetroArch` — o ID do aplicativo (descubra com `flatpak list`).

Para conceder acesso a **todos** os discos externos de uma vez, use o parâmetro especial de caminho-montagem:

```terminal
$ flatpak override --user --filesystem=/run/media org.libretro.RetroArch
## ou, mais granular, o acesso a todo o /mnt
$ flatpak override --user --filesystem=/mnt org.libretro.RetroArch
```

### Leitura vs. leitura+escrita

Por padrão, `--filesystem=` dá acesso total (leitura e escrita). Para um acesso **somente leitura**, acrescente o sufixo `:ro`:

```terminal
$ flatpak override --user --filesystem=/run/media/ana/DADOS:ro org.libretro.RetroArch
```

Isso é útil para aplicativos de mídia (que não devem modificar seu disco de ROMs) ou para diretórios de backup que você quer proteger.

### Acesso a toda a raiz do host

Existe um atalho para dar a um aplicativo acesso ao sistema de arquivos inteiro, semelhante ao que ele teria fora da sandbox:

```terminal
$ flatpak override --user --filesystem=host org.libretro.RetroArch
```

O token `host` significa "todo o sistema de arquivos do host". É conveniente, mas anula grande parte da proteção da sandbox — use com critério em aplicativos nos quais você confia.

:::atencao
`--filesystem=host` é a opção mais permissiva e deve ser reservada para aplicativos confiáveis. Se um aplicativo malicioso escapar da sandbox, ele terá acesso a todo o seu sistema, incluindo o disco interno. Prefira conceder acesso apenas aos discos específicos de que o aplicativo realmente precisa.
:::

## Inspecionando as permissões atuais

Para saber o que um aplicativo já tem de permissão de arquivo, use `flatpak info` com a opção `--show-permissions`:

```terminal
$ flatpak info --show-permissions org.libretro.RetroArch
[Context]
shared=network;ipc;
sockets=x11;wayland;pulseaudio;
devices=dri;
filesystems=/run/media/ana/DADOS;~/.var/app/org.libretro.RetroArch/config;
```

A linha `filesystems=` lista exatamente os caminhos acessíveis. Aqui vemos que o disco em `/run/media/ana/DADOS` foi concedido (além do diretório de configuração padrão do aplicativo).

Para ver também os overrides customizados que você aplicou:

```terminal
$ flatpak override --user --show org.libretro.RetroArch
[Context]
filesystems=/run/media/ana/DADOS;
```

Para remover um override e voltar ao estado padrão:

```terminal
$ flatpak override --user --reset org.libretro.RetroArch
```

## O caso do EmuDeck e ROMs em disco externo

O EmuDeck instala emuladores como Flatpaks (RetroArch, Dolphin, PPSSPP, etc.) e, por padrão, espera ROMs em `~/Emulation/` no disco interno. Se você move a pasta de ROMs para um cartão SD ou disco externo, cada emulador Flatpak precisa de permissão explícita para ler esse local.

O caminho típico do cartão SD no SteamOS é `/run/media/deck/`:

```terminal
$ flatpak override --user --filesystem=/run/media/deck org.libretro.RetroArch
$ flatpak override --user --filesystem=/run/media/deck org.DolphinEmu.dolphin-emu
$ flatpak override --user --filesystem=/run/media/deck org.ppsspp.PPSSPP
```

:::exemplo
Ana moveu a biblioteca de ROMs para um SSD externo USB-C em `/run/media/ana/DADOS/roms`. Depois de conceder `--filesystem=/run/media/ana/DADOS` ao RetroArch, o menu de importação do emulador finalmente listou as ROMs. Antes da permissão, o RetroArch mostrava a pasta vazia como se os arquivos não existissem — a sandbox simplesmente não deixava o aplicativo ler o diretório.
:::

## Resumo

- Aplicativos Flatpak rodam em sandbox e não enxergam discos externos fora de `/run/media/` por padrão.
- Flatseal é a interface gráfica para conceder permissões de sistema de arquivos; `flatpak override` faz o mesmo pela linha de comando.
- `--filesystem=/caminho` concede acesso; o sufixo `:ro` restringe a leitura.
- `--filesystem=host` dá acesso ao sistema de arquivos inteiro — poderoso e arriscado.
- `flatpak info --show-permissions` e `flatpak override --show` auditam as permissões atuais.
- EmuDeck/emuladores precisam de permissão explícita quando as ROMs vivem em disco externo, normalmente em `/run/media/deck/`.

## Exercícios

1. Liste seus aplicativos Flatpak com `flatpak list`. Escolha um emulador (ou o navegador) e veja suas permissões atuais com `flatpak info --show-permissions <id>`.
2. Monte um disco em `/run/media/<usuário>/<rótulo>` e tente abrir um arquivo dele num aplicativo Flatpak (ex.: abrir uma ROM ou uma imagem). Confirme que ele não consegue ver o conteúdo.
3. Conceda acesso ao disco para o aplicativo com `flatpak override --user --filesystem=/run/media/<usuário>/<rótulo> <id>`. Tente abrir o arquivo de novo. Funcionou?
4. Conceda acesso somente leitura com `:ro` a um diretório e tente salvar um arquivo nele pelo mesmo aplicativo. Qual a mensagem de erro? O que isso confirma sobre a opção `:ro`?
5. **Desafio.** Conceda `--filesystem=/run/media` a um aplicativo (acesso a todos os discos), depois use `flatpak override --show` para confirmar o override, e por fim reverta com `flatpak override --reset`. Confirme que a permissão sumiu com `flatpak info --show-permissions`.