Enquanto o Discord domina o bate-papo por voz, o Telegram preenche o outro lado: texto assíncrono, canais de notícias, bots utilitários e transferência de arquivos sem limite prático. O Telegram tem cliente nativo via Flatpak, mas o que torna ele especial no Deck é a sincronização multi-dispositivo — você começa uma conversa no celular, continua no Deck e acessa o histórico inteiro sem depender de backup. E, como todo Flatpak, ele roda sem tocar no sistema imutável.

:::objetivos
- Instalar o Telegram Desktop via Flatpak e autenticar por QR code
- Configurar notificações para não interromperem o modo jogo
- Transferir screenshots do Deck para o celular via Saved Messages
- Comparar Telegram, Signal e outros mensageiros disponíveis no Flatpak
:::

## Instalação e autenticação rápida

O Telegram Desktop está no Flathub e é leve — o download é menor que o de um navegador completo:

```terminal
$ flatpak install org.telegram.desktop
Looking for matches…
Found ref ‘app/org.telegram.desktop/x86_64/stable’ in remote ‘flathub’ (system).
Do you want to install it? [Y/n]: Y
Installing… done
$ flatpak run org.telegram.desktop
```

Na primeira tela, o Telegram oferece autenticação por número de telefone ou por QR code. O QR code é o caminho mais rápido no Deck: abra o Telegram no celular, vá em Settings → Devices → Scan QR Code e aponte para a tela do Deck. Em dois segundos a sessão está ativa, sem digitar número nenhum no teclado virtual.

O Telegram exige um número de telefone como identificador, mas a conta é associada ao número apenas como raiz — depois de autenticada, a sessão no Deck fica independente e sincroniza com o celular por um hash de sessão, não pelo número. É isso que permite ter o Telegram Desktop rodando no Deck, no notebook e no celular ao mesmo tempo, com o histórico completo em todos.

:::info
O Telegram Desktop no Flatpak guarda as sessões ativas em `~/.var/app/org.telegram.desktop/`. Se você quiser encerrar uma sessão de outro dispositivo, vá em Settings → Privacy and Security → Active Sessions e revogue — útil se o Deck for vendido ou emprestado.
:::

## Notificações que não atrapalham o jogo

O Telegram Flatpak dispara notificações via o portal `org.freedesktop.Notifications`, que o KDE renderiza como pop-ups no canto da tela. Durante uma partida, essas notificações podem roubar o foco — e, pior, sobrepor a interface do jogo.

Para silenciar temporariamente:

```terminal
$ flatpak run --command=sh org.telegram.desktop -c \
  'echo "Settings → Notifications → Mute for 8 hours"'
```

Dentro do Telegram, Settings → Notifications → Mute for → 8 hours é o equivalente a "estou jogando, não me chame". O Telegram também tem um modo "Focus" que só deixa passar mensagens de contatos específicos — útil para manter o clã no ar sem se distrair com notícias.

:::dica
Crie um grupo no Telegram só com você mesmo (Saved Messages + canal "Meu Deck"). Encaminhe para lá qualquer link ou nota de voz que você queira acessar tanto no celular quanto no Deck. É o equivalente a um clipboard universal e gratuito.
:::

## Transferindo arquivos entre Deck e celular

O Telegram não tem limite prático de tamanho de arquivo para transferências (até 2 GB no plano gratuito). Isso transforma o Saved Messages numa ponte entre o Deck e o celular:

```terminal
$ cp /home/deck/.var/app/org.mozilla.firefox/.mozilla/firefox/x9k3m2q.default-release/places.sqlite /tmp/favoritos.sqlite
$ flatpak run org.telegram.desktop -- -sendpath /tmp/favoritos.sqlite
```

O comando `-sendpath` é um atalho experimental que abre o Telegram com o seletor de destinatário já apontando para o arquivo. Se quiser fazer o inverso — baixar uma foto do celular no Deck — basta abrir a imagem no Telegram desktop e arrastá-la para a área de trabalho.

:::atencao
Arquivos baixados pelo Telegram Flatpak vão para `~/.var/app/org.telegram.desktop/downloads/`, não para `~/Downloads`. Se você salvar algo lá e depois desinstalar o Telegram, o Flatpak apaga esse diretório junto. Mova o que for importante para `~/Downloads` antes.
:::

## Outros mensageiros: Signal, Slack, Element

O ecossistema Flatpak oferece alternativas ao Telegram que merecem menção:

| Mensageiro | Pacote Flatpak | Diferencial |
|---|---|---|
| Signal | `org.signal.Signal` | Criptografia ponta-a-ponta, código aberto |
| Slack | `com.slack.Slack` | Integração profissional, canais por tópico |
| Element | `im.riot.Riot` | Matrix, federado, autohospedável |

O Signal no Flatpak sofre do mesmo problema de microfone que o Discord: o PulseAudio precisa de permissão via Flatseal. Já o Slack é basicamente um wrapper Electron — pesado, mas funcional para quem já usa no trabalho. O Element/Matrix é a escolha de quem quer autonomia: você roda o servidor Matrix em casa e conecta o Deck como cliente, sem depender de nuvem de terceiros.

```terminal
$ flatpak search signal
Name         Description                          Application ID       Version        Branch   Remotes
Signal       Private messenger                    org.signal.Signal    7.28.0         stable   flathub
```

Instalar qualquer um deles segue o mesmo ritual: `flatpak install`, depois uma visita ao Flatseal se o microfone ou notificações não funcionarem de primeira.

## Resumo

- O Telegram Desktop via Flatpak autentica por QR code, dispensando digitação no teclado virtual.
- Notificações podem ser silenciadas por 8 horas para não atrapalhar partidas.
- Saved Messages funciona como clipboard universal e ponte de arquivos entre Deck e celular.
- Downloads do Telegram Flatpak vão para `~/.var/app/org.telegram.desktop/downloads/` — mova o que for importante.
- Signal, Slack e Element também têm Flatpaks; microfone exige Flatseal na maioria.

## Exercícios

1. Instale o Telegram Desktop e autentique por QR code. Envie uma mensagem do celular para o Deck e responda do Deck.
2. Tire um screenshot no Deck com `[[Steam+R1]]` e envie para si mesmo pelo Saved Messages.
3. Silencie as notificações por 2 horas e verifique se o Telegram respeita a configuração durante uma partida.
4. Baixe um arquivo pelo Telegram e confirme com `ls -la` que ele está em `~/.var/app/org.telegram.desktop/downloads/`.
5. **Desafio.** Instale o Signal Flatpak e faça uma chamada de voz entre o Deck e o celular. Documente o que funcionou e o que exigiu Flatseal.