Em 2025, a forma mais moderna de organizar conhecimento é um editor de notas que armazena arquivos Markdown em disco, indexa links bidirecionais e renderiza um grafo de conexões. O Obsidian lidera essa categoria. No Steam Deck, ele funciona perfeitamente como flatpak, e o formato aberto dos arquivos garante que suas notas nunca fiquem presas a um aplicativo proprietário.

:::objetivos
- Instalar e configurar o Obsidian como flatpak no SteamOS
- Entender o conceito de vault, nota e link bidirecional
- Dominar a sintaxe Markdown estendida do Obsidian
- Criar um sistema de anotações com backlinks e grafo de conhecimento
- Sincronizar o vault entre o Deck e outros dispositivos
:::

## O vault é só uma pasta

A primeira decisão do Obsidian ao abrir é "qual vault abrir?". Um **vault** não é uma estrutura mágica: é uma pasta comum no sistema de arquivos, cheia de arquivos `.md`. Você pode abri-la com qualquer editor de texto, copiá-la para um pendrive, versioná-la com `git` ou excluí-la pelo Dolphin — o Obsidian só lê e escreve arquivos de texto puro.

```terminal
$ flatpak install flathub md.obsidian.Obsidian
Looking for matches…
 1) app/md.obsidian.Obsidian/x86_64/stable

md.obsidian.Obsidian permissions:
    ipc       network       pulseaudio       wayland
    x11       dri           file access [1]

    [1] home, xdg-run/speech-dispatcher:ro

        ID                          Branch       Op         Remote        Download
 1. [✓] md.obsidian.Obsidian        stable       i          flathub       < 113,6 MB
```

Depois de instalado, abra o Obsidian e clique em **Create new vault**. Escolha um nome como `notas` e aponte para `~/Documents/notas`. Agora explore o que você acabou de criar:

```terminal
$ ls -la ~/Documents/notas/
total 16
drwxr-xr-x  2 deck deck  4096 jan 14 12:00 .
drwxr-xr-x 10 deck deck  4096 jan 14 11:58 ..
drwxr-xr-x  2 deck deck  4096 jan 14 12:00 .obsidian
```

A pasta `.obsidian` contém configurações do aplicativo (temas, plugins, atalhos). Fora ela, tudo é Markdown — arquivos que você pode ler até com `cat`.

## Markdown estendido que vira documento navegável

O Obsidian aceita Markdown padrão: `**negrito**`, `*itálico*`, listas, blocos de código com três crases. Mas o que o distingue são duas extensões que funcionam dentro do vault:

- **Links no estilo wiki**: `[[nome-da-nota]]` cria um link para outra nota. Se ela não existir, um clique cria o arquivo na hora.
- **Tags**: `#tag` indexa a nota sob aquela palavra-chave, mas o Obsidian também gera o grafo e os backlinks automaticamente.

Crie três notas para testar:

```markdown
## nota: aprendendo-flatpak.md

Flatpak é o sistema de pacotes do [[steamos]]. Todo aplicativo de
produtividade que instalamos vem do #flathub.

---

## nota: steamos.md

SteamOS 3.6 roda no [[steam-deck]] e usa kernel 6.8.

---

## nota: steam-deck.md

O hardware que uso para jogar e para [[aprendendo-flatpak|instalar aplicativos]].
```

O texto `[[aprendendo-flatpak|instalar aplicativos]]` é um link com apelido: o alvo é a nota `aprendendo-flatpak`, mas o texto visível é "instalar aplicativos". O Obsidian resolve isso mesmo que você renomeie a nota depois.

:::dica
Pressione `[[Ctrl+E]]` no Obsidian para alternar entre modo de edição (Markdown cru) e modo de leitura (renderizado). No Deck com teclado externo, `[[Ctrl+E]]` é o atalho mais usado depois de `[[Ctrl+N]]` (nova nota).
:::

## O grafo e os backlinks

No painel lateral direito, o ícone de três pontos conectados abre o **grafo de conhecimento**. É um diagrama onde cada bolha é uma nota e cada aresta é um `[[link]]`. Para um vault com 50 notas bem interligadas, o grafo revela ilhas de conhecimento — agrupamentos temáticos que você talvez não tivesse percebido como separados.

Igualmente poderoso é o painel de **backlinks** (painel direito, ícone de setas). Abra a nota `steamos.md`: o painel mostra que `aprendendo-flatpak.md` linka para ela. Você não precisa caçar "quem cita esta nota"; o Obsidian faz isso automaticamente. É o mesmo princípio de citação reversa que o Google usa no PageRank, só que dentro da sua base pessoal de conhecimento.

:::info
O Obsidian é construído com Electron (Chromium embutido), o que significa que ele consome mais RAM do que um editor nativo (~300 MB com 5 plugins). No Deck, esse consumo não é um problema se você estiver com 2 a 3 abas abertas, mas evite carregar 40 plugins simultaneamente.
:::

## Sincronização entre Deck e outros dispositivos

O vault é uma pasta com arquivos de texto. Isso significa que **qualquer ferramenta de sincronização** funciona: Syncthing, Nextcloud, Git, Dropbox (via flatpak), ou o Obsidian Sync (pago, nativo, com histórico de versões).

A opção mais "Linux-way" é o Syncthing, que roda como serviço no Deck e sincroniza o vault via rede local ponto a ponto, sem servidor intermediário:

```terminal
$ flatpak install flathub com.github.zocker_160.SyncThingy
$ syncthing
```

Depois de parear o Deck com outro dispositivo (notebook, celular), a pasta `~/Documents/notas` vira uma réplica em tempo real em todos os aparelhos. O Obsidian Sync pago adiciona criptografia ponta a ponta e fusão de conflitos mais inteligente, mas para uso pessoal o Syncthing resolve.

Outra opção minimalista que elimina o SyncThingy é usar o Git:

```terminal
$ cd ~/Documents/notas
$ git init && git add -A && git commit -m "vault inicial"
$ git remote add origin git@github.com:ana/notas.git
$ git push -u origin main
```

A cada final de dia, `git add -A && git commit -m "terça 14/01" && git push` salva um snapshot. O Obsidian tem um plugin comunitário (chamado "Git") que automatiza esse fluxo com commits periódicos.

## Resumo

- O Obsidian no Deck é instalado com `flatpak install flathub md.obsidian.Obsidian` e usa vaults que são pastas comuns de Markdown.
- Links `[[wiki]]` e tags `#tag` criam navegação e backlinks automáticos entre notas.
- O grafo de conhecimento visualiza as conexões do vault, revelando agrupamentos temáticos.
- A sincronização funciona por Syncthing, Git, Nextcloud ou Obsidian Sync — o formato aberto permite qualquer transporte.
- O Obsidian é Electron, então pese os plugins que instalar; 300 MB de RAM é o consumo típico.

## Exercícios

1. Instale o Obsidian, crie um vault com 5 notas interligadas por `[[links]]` e abra o grafo. Identifique qual nota tem mais conexões.
2. Escreva uma nota usando `[[apelido|texto visível]]` e outra usando `#tag`. Abra o painel de backlinks da nota alvo e veja quem a cita.
3. Abra o vault no Dolphin e edite uma nota com o Kate (editor de texto do KDE). Volte ao Obsidian: a edição externa foi detectada?
4. Ative um plugin comunitário (Settings → Community plugins) — por exemplo, o "Calendar" — e crie uma nota diária.
5. **Desafio.** Sincronize seu vault com outro dispositivo usando Syncthing ou Git. Faça uma edição em cada ponta, resolva o conflito manualmente e explique o que aconteceu com o conteúdo divergente.