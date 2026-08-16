O Steam Deck tem duas personalidades: o **Modo Desktop** — um KDE Plasma comum, com mouse, teclado e janelas — e o **Modo Jogo (Game Mode)**, que é a cara padrão do aparelho quando você o liga. O Modo Jogo não é "um programa rodando sobre o desktop": é uma sessão inteira dedicada a rodar a interface Steam em tela cheia, sem que o Plasma precise subir junto. Entender essa diferença evita a confusão clássica de quem abre um terminal no desktop e não encontra os mesmos processos que viu no Modo Jogo.

:::objetivos
- Entender o que distingue o Modo Jogo do Modo Desktop
- Identificar o processo da interface Steam em execução
- Reconhecer o papel do Gamescope como compositor do Modo Jogo
- Localizar os arquivos centrais da instalação do Steam em `~/.steam`
- Alternar entre Modo Jogo e Modo Desktop do jeito correto
:::

## Duas sessões, duas máquinas diferentes

O SteamOS roda sobre um Linux (Arch, baseado no kernel do SteamOS 3.6), e é típico de um sistema Linux conviver com vários *sessions* de login ao mesmo tempo. Um session pode ser o KDE Plasma (Modo Desktop); outro, o próprio Steam em *big picture*. No Steam Deck, a Valve configurou o boot para cair direto numa sessão dedicada onde a única coisa que sobe é o Steam em modo de apresentação, renderizado pelo **Gamescope**. O Gamescope é um *compositor* minimalista feito pela própria Valve: em vez de desenhar janelas como o Plasma faz, ele desenha uma única superfície em tela cheia — a do Steam — e cuida de escala, suavização (FSR) e captura de imagem. Quem se aprofunda no Gamescope encontra o assunto inteiro [na seção dedicada ao compositor](#/cap-010/sec-01); aqui o que importa é saber que ele é o "palco" sobre o qual a interface que você navega é desenhada.

Para enxergar essa divisão, o caminho mais honesto é olhar os processos. No Modo Desktop, abra um terminal e pergunte quem está rodando:

```terminal
$ ps aux | grep -E 'steam|gamescope' | grep -v grep
deck      2214  8.5 14.2 5123456 878912 ?  Ssl  09:12   3:42 gamescope --backend drm --steam --xwayland-count 2
deck      2231  2.1  3.4 1912344 210432 ?  Sl   09:12   0:58 ./steamwebhelper
deck      2260  6.8  9.9 4211100 613456 ?  Sl   09:12   3:01 steam -steamos -gamepadui
deck      2288  1.2  2.1 891234  129876 ?  S    09:12   0:31 ./steam -steamos -gamepadui
```

A linha que interessa agora é a do `gamescope`. Repare na flag `--steam`: ela instrui o Gamescope a se comportar como o compositor do Modo Jogo, e não como um simples rodador de janelas. A linha do `steam` carrega duas opções reveladoras: `-steamos`, que liga o conjunto de comportamentos específicos do SteamOS (como o gerenciamento de suspensão e o menu lateral), e `-gamepadui`, que troca a interface desktop do Steam pela interface de *gamepad* — aquela feita para ser navegada com o analógico e os botões do Deck. É essa combinação que transforma o cliente Steam comum no que você chama de "Modo Jogo".

## Onde o Steam guarda suas coisas

Tudo o que o Steam precisa no nível de usuário vive dentro de um diretório oculto na sua home. No Deck o usuário padrão se chama `deck`, então o caminho é `~/.steam/steam`. Vale separar os dois diretórios:

| Caminho | O que contém |
|---|---|
| `~/.steam/steam` | Binários, `steamapps`, bibliotecas, logs — a raiz real da instalação |
| `~/.steam/root` | Atalho/ligação apontando para `~/.steam/steam` |
| `~/.steam/steam/steamapps` | Jogos instalados, `appmanifest_*.acf` e `libraryfolders.vdf` |
| `~/.steam/steam/userdata` | Dados por conta: screenshots, nuvem, configs por jogo |
| `~/.steam/steam/logs` | Registros do cliente e das atualizações |

A primeira inspeção já mostra o esqueleto:

```terminal
$ ls ~/.steam/steam
appcache        config          package        steamapps
bin             controller_base skins          steamdeps.txt
clientui        friendui        steam          userdata
compatibilitytools.d  logs      steam.sh       ubuntu12_64
$ ls ~/.steam/steam/steamapps
common          libraryfolders.vdf
downloading     temp
shadercache     workspace
```

Dois arquivos merecem atenção já no começo: `libraryfolders.vdf` (que descreve onde os jogos estão instalados, assunto de outra seção) e, dentro de `steamapps`, os arquivos `appmanifest_*.acf`. Cada `.acf` é um manifesto de um jogo instalado, listando seu `appid`, nome e estado de instalação. É menos "interface" e mais "entranha", mas explica por que a biblioteca aparece instantaneamente: o Steam só lê esses arquivos locais, em vez de consultar a rede.

```terminal
$ head -14 ~/.steam/steam/steamapps/appmanifest_70.acf
"AppState"
{
	"appid"		"70"
	"Universe"		"1"
	"name"		"Half-Life"
	"StateFlags"		"4"
	"installdir"		"Half-Life"
	"LastUpdated"		"1723700000"
	"SizeOnDisk"		"1342177280"
	"StagingSize"		"0"
}
```

O `appid` `70` é o *Half-Life*, e o `StateFlags` `4` indica que o jogo está totalmente instalado e pronto. Esse número simples é o mesmo código que aparece nos menus da biblioteca — a ponte entre o que você vê na tela e o que está no disco.

## Navegando pela primeira vez

Ao ligar o Deck, você cai na tela inicial do Modo Jogo: a **biblioteca** à esquerda em formato de lista/grade, e no topo um carrossel do que foi jogado recentemente. A navegação é desenhada para o *gamepad* embutido:

- O **analógico esquerdo** move o cursor de seleção; o **direito** também serve em alguns menus.
- O **botão `A`** confirma, o **`B`** volta.
- O **botão `[[Steam]]`** (o logotipo redondo à esquerda) abre e fecha o **menu rápido** a qualquer momento.
- O **botão `...`** (os três pontinhos, à direita, também chamado de botão QAM — *Quick Access Menu*) abre o menu rápido com configurações rápidas de bateria, brilho e amigos.
- O **botão `Y`** costuma filtrar ou abrir busca contextual, e os **gatilhos `L2`/`R2`** alternam abas.

:::dica
O botão `...` é frequentemente chamado de "botão QAM" nas discussões da comunidade e na documentação da Valve. Você vai ver os dois nomes; são a mesma tecla física.
:::

A ordem dos elementos não é acidental. A Valve priorizou o que você faz mais: chegar no jogo, checar notificação e ajustar brilho. Por isso o menu rápido abre por cima de qualquer tela, sem fechar o que você está vendo.

## Alternando para o Modo Desktop

Existem três formas comuns de sair do Modo Jogo para o Modo Desktop:

1. Pressione `[[Steam]]`, abra o menu **Energia** e escolha **Trocar para o modo Desktop**. A sessão do Modo Jogo é suspensa e o Plasma sobe no lugar — na prática é uma troca de sessão, não um desligamento.
2. Aperte e segure o botão de energia físico por alguns segundos e escolha no menu que aparece (a opção de trocar de modo está ali também).
3. Em alguns casos, há um atalho de sessão configurável, mas o caminho padrão é o menu Energia.

O ponto técnico que vale fixar: trocar de modo **não reinicia o Linux**. Você está alternando entre duas sessões gráficas que compartilham o mesmo kernel e a mesma instalação. É por isso que um processo aberto no desktop (como um servidor SSH) continua vivo enquanto você joga, e vice-versa.

```terminal
$ who
deck     tty1         2025-08-15 09:11
$ loginctl list-sessions
SESSION  UID USER SEAT  TTY
   c1   1000 deck seat0 tty1
   c2   1000 deck seat0
```

Na saída do `loginctl` aparecem duas sessões para o mesmo usuário `deck`: uma é o desktop, a outra o Modo Jogo. A sessão `c2` sem TTY atribuído é justamente a do Gamescope, que roda desligado de um terminal virtual tradicional. Saber ler isso ajuda a diagnosticar quando algo "fica aberto no outro modo".

:::atencao
Não desligue o Deck pelo botão de energia durante uma transferência de arquivos ou uma atualização de jogo no Modo Jogo. A suspensão do Gamescope é limpa, mas um corte brusco de energia pode deixar um `.acf` inconsistente e o Steam passará a "verificar" o jogo no próximo boot.
:::

## Resumo

- O Modo Jogo é uma sessão dedicada onde o Steam roda em `-gamepadui` sobre o compositor Gamescope.
- O Gamescope é o "palco" em tela cheia; o Plasma não sobe junto no Modo Jogo.
- `ps aux | grep steam` mostra `gamescope --steam` e `steam -steamos -gamepadui` em execução.
- A instalação vive em `~/.steam/steam`, com `steamapps` (jogos e manifestos) e `userdata` (dados por conta).
- Cada jogo instalado tem um `appmanifest_*.acf` com `appid`, nome e estado.
- Alternar para o desktop troca de sessão (`loginctl`), sem reiniciar o Linux.

## Exercícios

1. No Modo Desktop, rode `ps aux | grep -E 'steam|gamescope' | grep -v grep` e identifique, no resultado, a flag que indica a interface de gamepad.
2. Liste o conteúdo de `~/.steam/steam` e `~/.steam/steam/steamapps` e explique, com suas palavras, a diferença entre `common/` e os arquivos `appmanifest_*.acf`.
3. Escolha um jogo instalado, leia o `.acf` correspondente e descubra seu `appid`, `name` e `SizeOnDisk`. Confirme batendo com o que a biblioteca mostra.
4. Rode `loginctl list-sessions` e descubra quantas sessões gráficas estão ativas e qual delas pertence ao Gamescope.
5. **Desafio.** Troque para o Modo Jogo, abra um terminal no desktop via a sessão ainda ativa (ou use o `loginctl`) e verifique se o processo `steam` é o mesmo PID nos dois modos. Explique o porquê da sua observação, conectando com a ideia de sessões múltiplas.
