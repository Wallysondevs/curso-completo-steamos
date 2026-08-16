O modo Gaming é o coração do Steam Deck, mas por baixo dele roda um KDE Plasma completo, acessível ao trocar para o modo Desktop. Essa transição expõe o terminal, o gerenciador de arquivos, o navegador e todas as ferramentas de um Linux de verdade. Conhecer os atalhos de navegação entre modos e os comandos básicos do primeiro dia evita o desamparo de quem acaba de sair do assistente e se vê diante de uma área de trabalho.

:::objetivos
- Alternar entre modo Gaming e modo Desktop com atalhos
- Abrir o terminal Konsole e navegar pelo sistema de arquivos
- Usar comandos de inspeção do primeiro dia (`whoami`, `hostname`, `date`)
- Entender o papel do Discover (loja Flatpak) e do `flatpak` no terminal
- Explorar a rede com `ss -tlnp` e entender os serviços ativos
:::

## Alternando entre os dois modos

O Steam Deck é, ao mesmo tempo, um console portátil e um PC Linux. Para trocar de um para o outro, há dois caminhos. Do modo Gaming para o Desktop: botão Steam, Power, "Switch to Desktop". Do Desktop para o Gaming: clique duplo no atalho "Return to Gaming Mode" na área de trabalho, ou use o terminal com o comando `steamos-session-select`:

```terminal
$ steamos-session-select gaming
```

Esse comando alterna a sessão do display server. Se você estiver no Desktop e quiser voltar sem mouse, `[[Ctrl+Alt+F1]]` leva ao terminal virtual 1 (onde roda o modo Gaming) e `[[Ctrl+Alt+F2]]` ao terminal virtual 2 (modo Desktop). Os consoles virtuais (`/dev/tty1` a `/dev/tty6`) são sempre acessíveis independentemente do modo.

## Primeiro terminal: Konsole

No modo Desktop, o terminal chama-se Konsole (o terminal padrão do KDE). Para abri-lo: `[[Meta]]` (o ícone do Steam), digite "konsole" e pressione Enter. O prompt padrão aparece assim:

```terminal
[deck@steamdeck ~]$ whoami
deck
[deck@steamdeck ~]$ hostname
steamdeck
[deck@steamdeck ~]$ date
Sat Aug 16 14:22:31 -03 2025
```

Os três comandos mais simples e mais úteis do primeiro dia: `whoami` confirma que você é `deck` (o único usuário humano do sistema); `hostname` confirma o nome da máquina; `date` mostra data e hora, que devem bater com o relógio do painel.

Para explorar o sistema de arquivos, comece pelo diretório `~` (atalho para `/home/deck`):

```terminal
$ pwd
/home/deck
$ ls -F
Desktop/    Downloads/   Music/     Public/     Videos/
Documents/  Games/       Pictures/  Templates/  .steam/
```

O `ls -F` acrescenta uma barra `/` aos diretórios, facilitando a leitura. As pastas seguem o padrão XDG (Desktop, Documents, Downloads etc.), e a oculta `.steam` guarda as configurações do cliente.

## O que é o Discover e como ele opera

O Discover é a loja de aplicativos do KDE, mas no SteamOS ele instala exclusivamente Flatpaks — um formato de empacotamento sandbox que roda em cima da base imutável do sistema. Não há `apt`, `pacman` ou `dnf` usáveis no SteamOS para instalar software novo na raiz (a raiz é somente-leitura, lembra?). Tudo o que você instala além do Steam vem como Flatpak.

Pelo terminal, o comando `flatpak` substitui a loja gráfica:

```terminal
$ flatpak list --app | head -5
Nome                                    Application ID                           Versão
Firefox                                 org.mozilla.firefox                      128.0.2
LibreOffice                             org.libreoffice.LibreOffice              24.8.0.3
GIMP                                    org.gimp.GIMP                            2.10.38
VLC                                     org.videolan.VLC                         3.0.21
```

Cada linha mostra o nome, o Application ID (identificador único do Flatpak) e a versão. O Discover é a interface gráfica para essa mesma lista, e qualquer coisa instalada por ele aparece no `flatpak list`.

:::dica
Se você quiser instalar algo rapidamente sem abrir o Discover: `flatpak install flathub org.mozilla.firefox`. O sufixo `flathub` é o repositório remoto (o principal); `org.mozilla.firefox` é o Application ID. Para procurar: `flatpak search nome-do-app`.
:::

## Serviços de rede ativos

Mesmo no primeiro dia, o Steam Deck tem processos escutando em portas de rede. O comando `ss -tlnp` substitui o antigo `netstat` e mostra sockets TCP que estão ouvindo (`-t`), no estado `LISTEN` (`-l`), com número da porta (`-n`) e o nome do processo (`-p`):

```terminal
$ ss -tlnp
State  Recv-Q  Send-Q  Local Address:Port   Peer Address:Port  Process
LISTEN 0       128     0.0.0.0:8080         0.0.0.0:*          users:(("steam",pid=1421,fd=27))
LISTEN 0       128     127.0.0.1:27060      0.0.0.0:*          users:(("steam",pid=1421,fd=42))
LISTEN 0       128     127.0.0.1:9090        0.0.0.0:*          users:(("deck",pid=2012,fd=15))
```

A porta `8080` no endereço `0.0.0.0` (todas as interfaces, inclusive Wi-Fi) pertence ao processo `steam` e é usada para streaming local (Remote Play, Link). A `27060` é do Steamworks (matchmaking). A `9090`, ligada apenas ao `127.0.0.1` (localhost), é um serviço interno.

Ver quem está escutando na rede importa por dois motivos: segurança (você quer saber o que o Deck está expondo na rede local) e diagnóstico (se uma funcionalidade de streaming falha, a porta certa precisa estar aberta).

:::atencao
O SteamOS expõe alguns serviços na rede local por padrão (Remote Play, streaming). Se você estiver numa rede pública (hotel, café, aeroporto), considere desligar o Wi-Fi ou usar o modo avião quando não estiver jogando online. O `ss -tlnp` mostra o que está exposto no momento.
:::

## Resumo

- `steamos-session-select gaming` ou `[[Ctrl+Alt+F1]]`/`[[F2]]` alternam entre modo Gaming e Desktop.
- Konsole é o terminal do KDE; `whoami`, `hostname` e `date` são os comandos de checklist do primeiro dia.
- `ls -F` e `pwd` começam a navegação no sistema de arquivos do `deck`.
- O Discover instala Flatpaks; `flatpak list --app` e `flatpak search` fazem o mesmo pelo terminal.
- `ss -tlnp` revela quais serviços estão escutando na rede e em quais portas, com o nome do processo.

## Exercícios

1. No modo Desktop, abra o Konsole e rode `whoami`, `hostname` e `date`. Os valores batem com o esperado?
2. Execute `ls -F ~` e identifique os diretórios padrão do perfil `deck`.
3. Liste os Flatpaks instalados com `flatpak list --app` e procure por um app que você não sabia que estava ali.
4. Rode `ss -tlnp` e identifique as portas em que o processo `steam` está escutando, explicando se estão expostas na rede local ou só em localhost.
5. **Desafio.** Compare `flatpak list --app` com o Discover aberto (modo Desktop). Instale um app via terminal (`flatpak install flathub ...`) e confirme que ele aparece nos dois. Depois, rode `ss -tlnp` antes e depois de abrir o Remote Play e explique a diferença.