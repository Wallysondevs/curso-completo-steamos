O GeForce NOW não tem um executável para Linux, mas o site `play.geforcenow.com` empacota toda a experiência de streaming em uma Progressive Web App que se comporta como um aplicativo. A sacada é encapsular essa URL dentro de um atalho do Steam que dispara o Chrome em modo *kiosk* — uma janela sem decoração, sem abas e sem barra de endereço — e registrá-lo como um jogo na sua biblioteca. Quando você clica em Jogar, a transição do SteamOS para o streaming é invisível.

:::objetivos
- Criar um atalho no Steam que abra o Chrome apontando para o GeForce NOW
- Entender os parâmetros de linha de comando do Chrome no modo kiosk
- Configurar a arte do atalho e o ícone para o Modo Jogo
- Ajustar permissões para o gamepad ser capturado corretamente
- Testar o atalho no Modo Desktop e no Modo Jogo
:::

## O comando que transforma navegador em app

A mágica está nos parâmetros `--kiosk`, `--no-first-run` e `--window-size`. O modo kiosk elimina toda a chrome em volta da página: sem abas, sem barra de favoritos, sem menu hambúrguer. A flag `--no-first-run` suprime o assistente de boas-vindas. E `--window-size` força a resolução exata da tela do Deck.

```terminal
$ flatpak run com.google.Chrome \
  --kiosk \
  --no-first-run \
  --window-size=1280,800 \
  --user-agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36" \
  "https://play.geforcenow.com"
```

O `--user-agent` personalizado não é cosmético. O site do GeForce NOW detecta o navegador e pode restringir funcionalidades se achar que o dispositivo não é compatível. Um user-agent padrão de desktop Linux evita que o site sirva a versão mobile ou bloqueie o streaming.

A resolução `1280,800` é a nativa do Deck LCD. Se você tem o modelo OLED, o valor correto é `1280,800` também (a tela OLED usa a mesma resolução lógica) — ou `1920,1080` se estiver dockado num monitor externo.

:::dica
Guarde o comando num arquivo de script em `~/.local/bin/` chamado `geforcenow.sh`. Dê permissão de execução com `chmod +x`. Assim, se o atalho do Steam quebrar após uma atualização, você não precisa reconstruí-lo do zero — e ainda pode testá-lo pelo terminal.
:::

## Registrando o atalho no Steam

Com o Steam aberto no Modo Desktop, vá em **Biblioteca > Adicionar um jogo > Adicionar um jogo não Steam**. Na lista de aplicativos, procure por *Google Chrome*. Se o Flatpak não aparecer, clique em **Procurar** e navegue até:

```
/var/lib/flatpak/exports/bin/com.google.Chrome
```

Um atalho genérico "Google Chrome" aparecerá na sua biblioteca Steam. Clique com o botão direito, **Propriedades** e edite:

| Campo | Valor |
|---|---|
| Nome | GeForce NOW |
| Destino | `/var/lib/flatpak/exports/bin/com.google.Chrome` |
| Opções de inicialização | `--kiosk --no-first-run --window-size=1280,800 "https://play.geforcenow.com"` |
| Diretório de trabalho | `/home/deck` |

O campo **Opções de inicialização** é onde a mágica acontece. Tudo que viria depois de `flatpak run com.google.Chrome` no terminal vai aqui — o Steam já chama o executivo do Flatpak pelo campo Destino.

```terminal
$ ls ~/.steam/steam/userdata/*/config/shortcuts.vdf
/home/deck/.steam/steam/userdata/12345678/config/shortcuts.vdf
```

O arquivo `shortcuts.vdf` é onde o Steam persiste os atalhos não Steam. Ele está em formato Valve Data Format, o mesmo de [configurações do Steam](#/cap-064/sec-07). Você pode inspecioná-lo com `cat`, mas editá-lo manualmente exige cuidado — o Steam reescreve o arquivo ao fechar e pode sobrescrever alterações manuais.

## Arte do jogo e identidade visual

Um atalho sem capa fica com a aparência genérica do Chrome no Modo Jogo. O Steam permite definir até cinco imagens: capa vertical (600×900), capa horizontal (920×430), logo (transparente), ícone e banner de fundo.

No Modo Desktop, clique com o botão direito no atalho **GeForce NOW** > **Gerenciar > Adicionar arte personalizada**. Imagens oficiais de alta qualidade estão disponíveis no [SteamGridDB](https://www.steamgriddb.com) — busque por "GeForce NOW".

```terminal
$ mkdir -p ~/.steam/steam/config/grid
$ ls ~/.steam/steam/config/grid/ | grep -i geforce
geforce_now_hero.png
geforce_now_grid.png
geforce_now_logo.png
```

As imagens ficam em `~/.steam/steam/config/grid/` com nomes derivados do ID do atalho. Você pode copiar arquivos diretamente para lá, mas o método pelo cliente Steam é mais seguro porque renomeia os arquivos corretamente.

## Testando antes de ir ao Modo Jogo

No Modo Desktop, clique em **Jogar** no atalho do GeForce NOW. O Chrome deve abrir em tela cheia, direto na página de login da NVIDIA. Faça login e verifique três coisas:

1. O gamepad do Deck é reconhecido (mexa o analógico — o cursor deve se mover na interface do GeForce NOW).
2. O som sai pelos alto-falantes do Deck.
3. O teclado virtual do Steam ([[Steam+X]]) funciona nos campos de login.

Se o gamepad não funcionar, o problema quase sempre é a ordem de carga do Steam Input. Feche o Chrome, volte ao Steam, clique com o botão direito no atalho > **Gerenciar > Layout do controle** e selecione **Gamepad com trackpad de mouse**. Esse template faz o analógico esquerdo emitir WASD, o direito emitir mouse e os gatilhos emitirem cliques — o que o GeForce NOW espera.

```terminal
$ flatpak run com.google.Chrome --kiosk "https://play.geforcenow.com" 2>&1 | head -20
[127:127:1215/143021.123456:ERROR:browser_main_loop.cc(269)] Gtk: cannot open display: :0
```

Se o Chrome reclamar de `cannot open display`, você está tentando rodar de um terminal sem o servidor gráfico. No Modo Jogo isso não acontece porque o Steam já está dentro do compositor (gamescope). No Modo Desktop, rode o comando de dentro de um terminal gráfico (Konsole).

:::atencao
O Chrome Flatpak roda dentro de um sandbox (Bubblewrap). Por padrão, ele não tem acesso ao diretório `~/.local` do host. Se você salvar o script em `~/.local/bin/`, o Flatpak não o vê. Use o caminho absoluto `/var/lib/flatpak/exports/bin/com.google.Chrome` no atalho do Steam.
:::

## Resumo

- O GeForce NOW roda no Deck via Chrome em modo kiosk apontando para `play.geforcenow.com`.
- O atalho do Steam usa como Destino o executável Flatpak do Chrome e as opções `--kiosk`, `--no-first-run` e `--window-size=1280,800`.
- A arte personalizada pode ser obtida no SteamGridDB e aplicada pelo menu **Gerenciar > Adicionar arte personalizada**.
- O layout de controle recomendado é **Gamepad com trackpad de mouse**, que mapeia analógicos como WASD + mouse.
- Teste o atalho no Modo Desktop antes de alternar para o Modo Jogo.

## Exercícios

1. Crie o atalho do GeForce NOW no Steam seguindo os passos da seção. Abra-o no Modo Desktop e faça login na sua conta NVIDIA.
2. Localize o arquivo `shortcuts.vdf` em `~/.steam/steam/userdata/` e abra com `cat`. Identifique a entrada correspondente ao GeForce NOW — reconhece os campos `AppName` e `LaunchOptions`?
3. Instale uma arte de capa do SteamGridDB para o atalho do GeForce NOW. Depois, localize o arquivo de imagem correspondente em `~/.steam/steam/config/grid/`.
4. No Modo Jogo, abra o GeForce NOW e teste o painel Quick Access ([[...]]) — ele sobrepõe a janela ou o Chrome captura o atalho? Experimente ajustar o brilho durante o streaming.
5. **Desafio.** Crie um segundo atalho do GeForce NOW, mas com a flag `--window-size=1920,1080` e o parâmetro adicional `--force-device-scale-factor=1.5`. Conecte o Deck a um monitor externo e compare a experiência com o atalho padrão de 800p.