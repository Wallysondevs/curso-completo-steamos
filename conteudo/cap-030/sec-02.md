Instalar pelo terminal é a maior diferença prática entre o Flatpak de verdade e o Discover. No Discover você clica e espera; no terminal você escolhe *para quem* instala, *de onde* baixa e *o que* aceita como dependência. O `flatpak install` tem sintaxe rica, e dominá-la evita o erro clássico de instalar um app para o sistema inteiro quando você só queria no seu usuário.

:::objetivos
- Entender a sintaxe completa de `flatpak install`
- Diferenciar instalação `--user` de `--system` e saber qual escolher
- Instalar por ID, por remoto ou por arquivo local
- Atualizar os metadados do remoto antes de instalar

:::
## A sintaxe do install, por extenso

A forma mais comum é instalar pelo Application ID, deixando o Flatpak resolver de qual remoto baixar:

```terminal
$ flatpak install org.gimp.GIMP
Looking for matches…
Found similar ref(s) for ‘org.gimp.GIMP’ in remote ‘flathub’ (system).
Use this remote? [Y/n]: y

org.gimp.GIMP permissions:
    ipc        network       x11        file access [1]
    dri

        ID                     Branch          Op           Remote          Download
 1. [✓] org.gimp.GIMP          stable          i            flathub          < 122.9 MB

Proceed with these changes to the system installation? [Y/n]: y
```

O comando faz três perguntas: confirma o remoto, mostra um resumo das permissões e dos downloads, e pede o "sim" final. Responder `y` e Enter três vezes é o fluxo normal. A tabela de resumo (com `[✓]`, `Op`, `Download`) é o Flatpak prestando contas do que vai acontecer antes de tocar no disco — cada linha é um *ref* (ID + branch + arquitetura) que será baixado, incluindo runtimes.

A forma curta `flatpak install <ID>` esconde uma decisão importante: o **tipo de instalação**. O comando escolhe automaticamente entre `--user` e `--system` conforme o que está disponível e como o remoto está configurado. Vale entender a diferença para assumir o controle.

## `--user` versus `--system`

Existem dois lugares onde um Flatpak pode viver no disco:

| Instalação | Onde fica | Quem usa | Exige root? |
|---|---|---|---|
| `--user` | `~/.local/share/flatpak` | só o seu usuário | não |
| `--system` | `/var/lib/flatpak` | todos os usuários | sim (sudo) |

No SteamOS, o sistema costuma ter o remoto `flathub` configurado como `system`, então o `install` sem flag tende a pedir `sudo` na hora de escrever em `/var/lib/flatpak`. Para instalar sem senha e só para o `deck` ou `ana`, prefira o `--user`:

```terminal
$ flatpak install --user flathub org.mozilla.firefox
Looking for matches…
Required runtime for org.mozilla.firefox/x86_64/stable (runtime/org.freedesktop.Platform/x86_64/24.08) found in remote flathub
Do you want to install it? [Y/n]: y

org.mozilla.firefox permissions:
    ipc        network       x11        dri        file access [1]

        ID                     Branch          Op           Remote          Download
 1. [✓] org.freedesktop.Platform.Locale      24.08       i            flathub          < 17.2 MB
 2. [✓] org.freedesktop.Platform             24.08       i            flathub         < 312.4 MB
 3. [✓] org.mozilla.firefox                  stable       i            flathub          < 78.9 MB

Proceed with these changes to the user installation? [Y/n]: y
```

Repare em duas coisas. Primeiro, o Flatpak detectou que o Firefox precisa do runtime `org.freedesktop.Platform` 24.08 e perguntou se pode instalá-lo junto — runtimes são compartilhados entre vários apps, então um único download serve a todo o resto. Segundo, a última linha agora diz "user installation", confirmando que nada foi gravado em `/var`.

:::dica
O padrão de quem administra uma máquina de uso pessoal (como um Steam Deck de uma pessoa só) é `--user`: não pede senha, mantém tudo sob o seu `$HOME` e é mais fácil de limpar. Use `--system` quando o mesmo app deve valer para vários usuários ou quando você quer um remoto único e "oficial" para a máquina toda.
:::

## Instalando por remoto e por arquivo

Além do ID, o `install` aceita três fontes diferentes, e a sintaxe muda conforme a fonte:

- **Por remoto + ID**: `flatpak install flathub org.gimp.GIMP` — baixa explicitamente daquele remoto.
- **Por arquivo `.flatpakref`**: `flatpak install caminho/para/app.flatpakref` — instala a partir de um arquivo de referência, baixando do remoto apontado nele.
- **Por bundle `.flatpak`**: `flatpak install caminho/para/app.flatpak` — instala um pacote autocontido, sem rede.

Para instalar "tudo o que está disponível" de um remoto, o case mais raro, usa-se só o remoto:

```terminal
$ flatpak install flathub
```

Isso lista todos os apps do Flathub e pergunta um por um — quase nunca é o que você quer. Na prática, o atalho mais usado é:

```terminal
$ flatpak install --user flathub org.audacityteam.Audacity
```

O remoto vem antes do ID nessa forma, forçando a fonte mesmo que outro remoto tenha um pacote de mesmo nome.

:::atencao
Antes de instalar, o Flatpak pode reclamar que o remoto não tem metadados atualizados. Se o `install` falhar com "error: Nothing matches", rode `flatpak update --appstream` para baixar os índices mais recentes do Flathub e tente de novo. Sem esse índice, o `search` e o `install` enxergam uma foto velha do catálogo.
:::

## Aceitando o runtime é normal

Quem instala o primeiro app Flatpak do dia costuma se assustar com o download "inflado" — o GIMP de 122 MB vira 400 MB quando somado o runtime. Isso não é desperdício: é a premissa central do modelo. O runtime (`org.gnome.Platform`, `org.freedesktop.Platform`) traz as bibliotecas de base que todo app daquela família compartilha, e ele é baixado uma única vez. O segundo, terceiro e décimo apps reusam o mesmo runtime, pagando só o tamanho deles.

## Resumo

- `flatpak install <ID>` resolve o remoto automaticamente e pede confirmação antes de baixar.
- `--user` instala em `~/.local/share/flatpak` (sem root); `--system` instala em `/var/lib/flatpak` (com sudo).
- O install mostra uma tabela de refs e permissões antes de tocar no disco; runtimes aparecem como linhas extras.
- A forma `flatpak install <remoto> <ID>` força a fonte, e `.flatpakref`/`.flatpak` instalam de arquivo.
- Runtimes são compartilhados e baixados uma vez; o download "inflado" do primeiro app é normal.

## Exercícios

1. Instale o GIMP no seu usuário com `flatpak install --user flathub org.gimp.GIMP` e anote as três perguntas que o comando fez.
2. Rode `flatpak install --system org.gimp.GIMP` (ou outro ID) e observe a diferença no prompt de senha e na pasta de destino.
3. Liste o que foi baixado com `flatpak list` e identifique quais entradas são o app e quais são runtimes compartilhados.
4. Compare os tamanhos: rode `du -sh ~/.local/share/flatpak` e `du -sh /var/lib/flatpak` e explique por que um deles pode estar vazio.
5. **Desafio.** Sem instalar nada, baixe um arquivo `.flatpakref` do Flathub (use o site do Flathub), inspecione seu conteúdo com `cat` e explique, com base no arquivo, de qual remoto e qual branch o app viria se você executasse `flatpak install app.flatpakref`.
