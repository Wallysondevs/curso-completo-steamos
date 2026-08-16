O primeiro app que quase todo mundo instala no modo desktop é um navegador. O Steam Deck traz o modo jogo com um navegador embutido rudimentar, mas para digitar URL, baixar arquivos, sincronizar senhas e usar extensões, você precisa de um navegador completo. O Firefox é a escolha natural: livre, bem mantido no Flathub e com versão nativa para a arquitetura do Deck.

:::objetivos
- Instalar o Firefox via Flatpak no Steam Deck
- Entender o isolamento de rede e arquivos imposto pelo sandbox
- Configurar o Firefox como navegador padrão do modo desktop
- Gerenciar perfis para separar uso pessoal do uso em jogo
:::

## Instalando o Firefox

A instalação é um único comando, como você já viu na abertura do capítulo. O App ID oficial do Firefox no Flathub é `org.mozilla.firefox`:

```terminal
$ flatpak install org.mozilla.firefox
Looking for matches…
Found similar ref(s) for 'org.mozilla.firefox' in remote 'flathub' (system).
Use this remote? [Y/n]: Y
Required runtime for org.mozilla.firefox/x86_64/stable (runtime/org.freedesktop.Platform/x86_64/23.08) is already installed

        ID                                          Branch          Op           Remote           Download
 1. [✓] org.mozilla.firefox                        stable          i            flathub          77,2 MB / 77,4 MB
 2. [✓] org.mozilla.firefox.Locale                 stable          i            flathub         564,4 kB / 564,6 kB

Installation complete.
```

Depois de instalar, ele aparece no menu do modo desktop, geralmente na categoria Internet. Para testar rapidamente pelo terminal:

```terminal
$ flatpak run org.mozilla.firefox --version
Mozilla Firefox 137.0.2
```

## O sandbox e o porquê de ele ser bom no Deck

Todo Flatpak roda isolado, e com o navegador — o programa que mais conversa com a internet — esse isolamento é ainda mais relevante. O Firefox Flatpak só enxerga uma parte do seu disco: por padrão, a pasta `~/Downloads` e pouco mais. Qualquer site malicioso que explorar o navegador fica preso dentro dessa caixa.

Você pode inspecionar as permissões que o aplicativo tem com `flatpak info`:

```terminal
$ flatpak info --show-permissions org.mozilla.firefox
[Context]
shared=network;ipc;
sockets=x11;wayland;pulseaudio;
devices=dri;
filesystems=xdg-download;xdg-run/dconf;~/.mozilla:create;

[Session Bus Policy]
org.freedesktop.portal.*=talk
```

Na linha `filesystems`, veja que o Firefox só tem acesso ao seu `xdg-download` (a pasta de Downloads) e ao próprio diretório `~/.mozilla`. Ele **não** consegue, por exemplo, ler seus documentos sem você dar permissão. Isso é ótimo para um aparelho que você usa para logar em muitas contas.

:::atencao
Por causa do sandbox, se você salvar um arquivo do Firefox numa pasta "proibida" (por exemplo, `/home/deck` diretamente), o navegador pode não conseguir gravar. Na dúvida, salve tudo dentro de `~/Downloads` e mova depois com o gerenciador de arquivos. Para liberar acesso a outras pastas de forma granular, use o aplicativo **Flatseal**, que edita permissões de Flatpak pela interface.
:::

## Tornando-o o navegador padrão

No KDE Plasma — a interface gráfica do modo desktop do SteamOS — os programas são lançados respeitando a preferência de "navegador padrão". Para conferir ou mudar:

```terminal
$ xdg-settings get default-web-browser
org.mozilla.firefox.desktop
```

Se o valor for outro (ou vazio), dá para definir o Firefox como padrão:

```terminal
$ xdg-settings set default-web-browser org.mozilla.firefox.desktop
```

O nome que você passa é o nome do arquivo `.desktop` do Flatpak, que segue a convenção `<App ID>.desktop`. Note que, por causa do sandbox, o Firefox usa um arquivo `.desktop` exportado pelo Flatpak, e não o do sistema. Você pode confirmar que esse arquivo de fato existe olhando o diretório de aplicativos exportados pelo Flatpak:

```terminal
$ ls ~/.local/share/applications/ | grep firefox
org.mozilla.firefox.desktop
```

Assim como todo `.desktop`, esse arquivo descreve ao ambiente gráfico como lançar o programa, qual ícone usar e em que categoria ele aparece no menu. Por isso instalar um Flatpak "já deixa o app no menu" — é a exportação automática desses arquivos que o Flatpak faz ao instalar.

## Perfis separados para jogar e trabalhar

Um truque útil no Deck: manter dois perfis do Firefox — um para uso pessoal/cotidiano e outro só para abrir wikis, guias e o YouTube no modo jogo sem misturar abas. O Firefox gerencia perfis com a flag `-P` combinada com `flatpak run`:

```terminal
$ flatpak run org.mozilla.firefox -P
```

O gerenciador de perfis abre uma janela gráfica onde você cria perfis novos e escolhe qual usar em cada sessão. Alternativamente, lance um perfil específico pelo nome:

```terminal
$ flatpak run org.mozilla.firefox -P jogos --no-remote
```

A flag `--no-remote` permite abrir uma segunda instância do Firefox com perfil diferente, mesmo que outra já esteja rodando. Sem ela, o Firefox tenta reutilizar a instância existente e abre a janela no perfil errado.

:::dica
Para abrir o Firefox no modo jogo (Game Mode), adicione-o como "jogo não-Steam" na interface da Steam e ajuste o nome. Um navegador no modo jogo é útil para consultar mapas, builds e wikis sem trocar para o desktop — e a Steam já gerencia o controle como mouse.
:::

## Resumo

- O Firefox instala com `flatpak install org.mozilla.firefox` e roda isolado num sandbox Flatpak.
- `flatpak info --show-permissions` revela exatamente a quais pastas e sockets o aplicativo tem acesso.
- O sandbox limita o Firefox a `~/Downloads` e `~/.mozilla` por padrão; use Flatseal para liberar mais.
- `xdg-settings` define qual aplicativo é o navegador padrão do modo desktop.
- Perfis separados (`-P`) isolam abas de jogo das abas de uso pessoal.

## Exercícios

1. Instale o Firefox e confirme a versão com `flatpak run org.mozilla.firefox --version`.
2. Examine as permissões com `flatpak info --show-permissions org.mozilla.firefox` e liste, em português, quais três recursos de sistema ele consegue acessar.
3. Defina o Firefox como navegador padrão usando `xdg-settings set` e confirme com `xdg-settings get default-web-browser`.
4. Crie um perfil de nome `jogos` com `flatpak run org.mozilla.firefox -P` e abra-o com `--no-remote` para testar a segunda instância.
5. **Desafio.** Instale o Flatseal via Flathub e use-o para liberar o acesso do Firefox a uma pasta sua (por exemplo, `~/videos`). Depois confirme pelo terminal, com `flatpak info --show-permissions`, que a nova permissão aparece em `filesystems`.
