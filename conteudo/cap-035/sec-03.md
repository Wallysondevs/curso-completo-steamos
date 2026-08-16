O Steam Deck roda jogos, mas também é um ótimo companheiro de música de fundo enquanto você trabalha, estuda ou navega no modo Desktop. Com o cliente oficial do Spotify e algumas alternativas de código aberto, o Deck se torna um receptor de streaming musical tão capaz quanto qualquer notebook — com a vantagem de caber na mochila e rodar por horas com a tela desligada durante a reprodução.

:::objetivos
- Instalar e configurar o cliente oficial do Spotify via Flatpak
- Controlar a reprodução com atalhos de teclado e integração com o modo Gaming
- Conhecer alternativas de código aberto para streaming de música
- Gerenciar áudio em segundo plano enquanto outros aplicativos estão abertos
:::

## Spotify: instalação e login

O cliente oficial do Spotify está no Flathub. Ele é idêntico ao cliente Desktop para Windows e macOS: playlists, busca, rádio, podcasts e controle de dispositivos (Spotify Connect).

```terminal
$ flatpak install flathub com.spotify.Client
Looking for matches…
com.spotify.Client/x86_64/stable      1.2.45    flathub
Proceed with these changes to the system? [Y/n]: y
Installation complete.
```

No primeiro lançamento, faça login com seu e-mail e senha ou use o código QR para autenticar via celular. O cliente mantém a sessão ativa — você não precisa digitar senha toda vez.

A interface do Spotify é pesada (é essencialmente um aplicativo web empacotado com Electron), mas o Deck lida bem com ela no modo Desktop. Com 16 GB de RAM, o cliente consome entre 400 e 700 MB — significativo, mas perfeitamente gerenciável. Evite abrir o Spotify, o navegador com 15 abas e o Blender ao mesmo tempo.

:::dica
Para reduzir o consumo do Spotify, feche a janela em vez de minimizá-la. O ícone na bandeja do sistema (`system tray`) continua mostrando a faixa atual e permite pausar, avançar e controlar volume sem reabrir a interface completa. Clique com o botão direito no ícone para acessar os controles compactos.
:::

## Atalhos de mídia no modo Desktop

O SteamOS reconhece as teclas de mídia de teclados externos (play/pause, avançar, recuar, volume) e as repassa para o aplicativo de música ativo. Se você estiver com um dock e teclado, os atalhos padrão do Spotify funcionam:

| Ação | Atalho |
|---|---|
| Play / Pause | `[[Espaço]]` (com foco na janela) |
| Próxima faixa | `[[Ctrl+Direita]]` |
| Faixa anterior | `[[Ctrl+Esquerda]]` |
| Aumentar volume | `[[Ctrl+Cima]]` |
| Diminuir volume | `[[Ctrl+Baixo]]` |
| Favoritar (salvar) | `[[Alt+Shift+B]]` |

No modo Gaming (Steam), você pode adicionar o Spotify como um atalho não-Steam e controlá-lo com os botões do Deck. Configure o layout de controle como "Gamepad with Mouse Trackpad" para usar o touchpad como mouse e mapeie os gatilhos para cliques.

Mas a mágica mesmo é o **Spotify Connect**: com o Spotify rodando no Deck (mesmo em segundo plano), você abre o aplicativo no celular, toca no ícone de dispositivos e seleciona o Steam Deck como saída. O celular vira o controle remoto, e o áudio sai pelos alto-falantes do Deck ou pelo fone de ouvido conectado.

## Alternativas: Spotify no navegador e clientes leves

O cliente Flatpak é conveniente, mas pesado. Duas alternativas mais leves:

**Spotify Web (navegador).** Acesse `open.spotify.com` no Firefox ou Chrome. O player web consome menos RAM (a aba do navegador já está aberta de qualquer forma) e suporta todos os recursos, exceto qualidade "Muito Alta" (320 kbps). Para ouvir no Deck com fones, a diferença entre "Alta" (160 kbps) e "Muito Alta" é imperceptível.

**ncspot (terminal).** Um cliente Spotify de terminal, escrito em Rust, com uso de memória na casa dos 30 MB. Instale via `cargo` ou baixe o binário. A navegação é por teclado: busque com `/`, navegue com `h/j/k/l` (estilo Vim) e monte filas de reprodução.

```terminal
$ cargo install ncspot
$ ncspot
```

O ncspot não suporta Spotify Connect, mas é imbatível em leveza. Ideal para sessões de programação ou escrita em que você quer música sem distrações visuais.

:::info
O Spotify no Linux não tem suporte oficial a download offline no plano Free — o catálogo offline depende de DRM Widevine, e o cliente Flatpak usa a mesma engine do Windows, então downloads offline funcionam no plano Premium. Para ouvir offline sem Premium, você precisa de alternativas como baixar arquivos MP3/FLAC e usar o VLC ou o Kodi.
:::

## Streaming de podcasts e rádio

O Spotify também é um player de podcasts, mas se você prefere um aplicativo dedicado, o ecossistema Linux oferece opções:

- **GNOME Podcasts:** Flatpak disponível (`org.gnome.Podcasts`), interface minimalista, busca por nome do podcast e download automático de episódios.
- **Kasts:** Cliente de podcasts do KDE, integra com o Plasma Mobile mas funciona no Deck. Suporta sincronização via GPodder.net.
- **Shortwave:** Rádio online por streaming, com busca por país, gênero e nome da estação. O catálogo cobre rádios brasileiras.

```terminal
$ flatpak install flathub org.gnome.Podcasts
$ flatpak install flathub de.haeckerfelix.Shortwave
```

Para quem gosta de rádio tradicional, o Shortwave acessa o catálogo do radio-browser.info e toca streams AAC e MP3 sem configuração adicional.

## Resumo

- O cliente oficial do Spotify está no Flathub: `flatpak install flathub com.spotify.Client`.
- O Spotify Connect transforma o celular em controle remoto; o áudio sai pelo Deck.
- Alternativas mais leves incluem o player web (open.spotify.com) e o cliente de terminal ncspot (~30 MB de RAM).
- Podcasts têm aplicativos dedicados como GNOME Podcasts e Kasts, ambos via Flatpak.
- Rádio online funciona com Shortwave, que acessa o catálogo do radio-browser.info.

## Exercícios

1. Instale o Spotify e faça login. Reproduza uma playlist e minimize a janela: o ícone na bandeja do sistema ainda mostra os controles?
2. Com o Spotify rodando no Deck, use o Spotify Connect no celular para assumir o controle da reprodução. Depois, transfira a reprodução de volta para o celular — o Deck parou de tocar?
3. Instale o ncspot com `cargo install ncspot`, faça login e navegue pela sua biblioteca usando os atalhos de teclado. Quanto de RAM ele está consumindo? Compare com o Flatpak do Spotify usando `htop`.
4. Instale o GNOME Podcasts ou o Kasts, busque um podcast em português e baixe um episódio para ouvir offline.
5. **Desafio.** Configure o Spotify como um jogo não-Steam no modo Gaming. Use o layout de controle "Gamepad with Mouse Trackpad" e teste a navegação pelos botões do Deck. É prático ou o touchscreen funciona melhor?