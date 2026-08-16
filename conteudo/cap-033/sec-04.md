Em um notebook, e-mail se resolve com o navegador. No Deck, com a tela de 7 polegadas e o teclado virtual invocado por [[Steam+X]], digitar um texto longo no Gmail é um exercício de paciência. O Thunderbird resolve isso com uma interface compacta, atalhos de teclado e a capacidade de ficar offline — ele baixa as mensagens e espera você voltar do modo jogo para sincronizar. E é um Flatpak, portanto não altera o sistema imutável do Deck.

:::objetivos
- Instalar o Thunderbird via Flatpak no SteamOS
- Configurar contas IMAP e SMTP com autenticação OAuth2
- Entender o armazenamento de mensagens offline dentro da sandbox
- Integrar o Thunderbird com o calendário do KDE Plasma
:::

## Instalação e configuração da primeira conta

O Thunderbird está no Flathub e a instalação é direta:

```terminal
$ flatpak install org.mozilla.Thunderbird
Looking for matches…
Found ref ‘app/org.mozilla.Thunderbird/x86_64/stable’ in remote ‘flathub’ (system).
Do you want to install it? [Y/n]: Y
Installing… 52%
$ flatpak run org.mozilla.Thunderbird
```

Na primeira execução, o Thunderbird abre o assistente de configuração. Se a sua conta for do Gmail, ele preenche automaticamente os servidores IMAP e SMTP e usa OAuth2 — o mesmo protocolo que o navegador usa para autenticar sem guardar senha. Outros provedores (Proton Mail, Outlook.com, Yahoo) também funcionam, mas alguns exigem "senha de aplicativo" gerada no painel do provedor.

```terminal
$ flatpak run org.mozilla.Thunderbird -ProfileManager
```

O `-ProfileManager` é útil para criar um perfil separado para cada conta. Dentro de uma sandbox Flatpak, todos os perfis vivem em `~/.var/app/org.mozilla.Thunderbird/.thunderbird/`. Criar perfis isolados evita que um bug de sincronização de uma conta trave a outra.

## IMAP offline: o Deck desconectado

Quando você joga, o Deck pode perder o Wi-Fi — seja porque você desligou para economizar bateria, seja porque está no metrô. O Thunderbird, configurado como IMAP com sincronização offline, baixa o conteúdo das pastas enquanto há rede e permite ler, responder e organizar tudo sem conexão.

```terminal
$ flatpak run --command=sh org.mozilla.Thunderbird -c \
  'du -sh ~/.var/app/org.mozilla.Thunderbird/.thunderbird/*.default*/ImapMail/'
534M  /home/deck/.var/app/org.mozilla.Thunderbird/.thunderbird/x9k3m2q.default/ImapMail/
```

Meio gigabyte para uma conta com três anos de e-mails é um número comum. A pasta `ImapMail` contém os arquivos MBOX, um formato antigo mas universal: cada arquivo .mbox é um arquivo texto com as mensagens concatenadas. Você pode até ler com `less` se precisar de uma mensagem antiga sem abrir o Thunderbird — mas cuidado: mexer num arquivo .mbox enquanto o Thunderbird está aberto pode corromper a sincronização, porque o cliente mantém um índice próprio de offsets separado do arquivo.

:::atencao
O Thunderbird usa arquivos `.msf` (Mail Summary File) ao lado de cada `.mbox` para indexar rapidamente as mensagens. Se você copiar apenas o `.mbox` para outro Deck e esquecer o `.msf`, o Thunderbird reconstrói o índice na primeira abertura, mas mensagens marcadas como lidas podem voltar como não lidas. Para um backup íntegro, copie `.mbox` e `.msf` juntos — ou exporte pela interface, que gera um único `.mbox` autocontido.
:::

:::dica
Nas configurações da conta, aba "Synchronization & Storage", marque "Keep message for offline use" para as pastas importantes (Inbox, Sent, Drafts). Pastas de newsletter você pode deixar sem sincronização offline para economizar espaço no SSD.
:::

## Integração com o calendário do KDE

O Thunderbird tem um calendário interno (Lightning) que lê contas CalDAV e Google Calendar. No Deck, a integração com o KDE é indireta: o Thunderbird não escreve no `~/.config` do KDE, então eventos criados dentro dele não aparecem no relógio do painel do Plasma.

O truque é usar uma conta CalDAV que ambos — Thunderbird e KOrganizer — consigam acessar. Um Nextcloud autohospedado ou uma conta Fastmail, por exemplo, expõe a mesma URL CalDAV para os dois clientes.

```terminal
$ flatpak run org.mozilla.Thunderbird -calendar
```

No assistente, escolha "On the network" → CalDAV, cole a URL completa (ex.: `https://cloud.exemplo.com/remote.php/dav/calendars/ana/pessoal/`) e autentique. Depois, no menu KDE, abra o KOrganizer e conecte a mesma URL. A partir daí, os eventos aparecem nos dois lados.

## Onde o Thunderbird guarda os dados

Como todo Flatpak, os dados do Thunderbird ficam isolados:

```terminal
$ find ~/.var/app/org.mozilla.Thunderbird/ -maxdepth 1 -type d
/home/deck/.var/app/org.mozilla.Thunderbird/
/home/deck/.var/app/org.mozilla.Thunderbird/.thunderbird
/home/deck/.var/app/org.mozilla.Thunderbird/config
/home/deck/.var/app/org.mozilla.Thunderbird/data
/home/deck/.var/app/org.mozilla.Thunderbird/cache
```

O diretório `.thunderbird` é o espelho do `~/.thunderbird` que existiria numa instalação tradicional. `config` guarda ajustes do ecossistema Flatpak, `data` tem extensões e `cache` é seguro limpar se o espaço apertar. O backup completo de uma conta se resume a copiar `.thunderbird/<perfil>/` — os arquivos .mbox dentro são autocontidos.

:::info
O Thunderbird Flatpak compartilha o runtime base com o Firefox (`org.mozilla.firefox.BaseApp`), então instalar os dois não duplica o download do runtime. A economia de espaço no SSD de 64 GB faz diferença no Deck de entrada.
:::

## Resumo

- O Thunderbird é o cliente de e-mail nativo do ecossistema Mozilla, instalado via Flatpak.
- A configuração com OAuth2 funciona com Gmail, Outlook e Yahoo sem guardar senha no dispositivo.
- A sincronização IMAP offline baixa as mensagens para o SSD e permite uso sem Wi-Fi.
- Os dados vivem em `~/.var/app/org.mozilla.Thunderbird/.thunderbird/<perfil>/ImapMail/`.
- A integração com calendário KDE funciona via CalDAV compartilhado entre Thunderbird e KOrganizer.

## Exercícios

1. Instale o Thunderbird e configure uma conta com IMAP. Anote os servidores de entrada e saída detectados automaticamente.
2. Ative a sincronização offline para a caixa de entrada e meça o espaço ocupado com `du -sh` no diretório `ImapMail`.
3. Adicione uma conta CalDAV no Thunderbird e depois a mesma conta no KOrganizer do KDE. Crie um evento em cada lado e confirme a sincronização.
4. Crie um perfil separado com `thunderbird -ProfileManager` e configure uma segunda conta de e-mail. Explique a vantagem de isolar perfis.
5. **Desafio.** Exporte uma pasta inteira do Thunderbird como arquivo .mbox e leia as primeiras 20 linhas com `head`. Depois, importe o mesmo .mbox em outro perfil. O que acontece com as mensagens já existentes?