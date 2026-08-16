A primeira vez que você liga o Steam Deck é um ritual: o aparelho faz o setup inicial guiado, baixa atualizações e te conduz pela interface. Mas por baixo dessa experiência de console existe um Linux completo esperando para ser investigado. Saber o que acontece nesse primeiro boot — e como pular para o modo Desktop para ver tudo — transforma o brinquedo em ferramenta.

:::objetivos
- Entender a sequência do primeiro boot e o setup inicial guiado
- Completar a configuração de idioma, rede e conta Steam
- Navegar entre o modo de jogo e o modo Desktop
- Acessar o terminal e executar seus primeiros comandos de diagnóstico
- Compreender o esquema de usuário `deck` e o conceito de imutabilidade básica
:::

## O primeiro boot e o assistente de configuração

Ao ligar pela primeira vez, o Steam Deck carrega o firmware, o kernel e cai num assistente de boas-vindas que não foge muito de um Android ou iOS: escolher idioma, fuso horário, conectar a uma rede Wi-Fi e fazer login na conta Steam. A Valve caprichou nesse fluxo para que ele seja feito 100% com os controles do próprio aparelho — touchpads e gatilhos funcionam como mouse e clique desde o começo.

```terminal
$ last | head -3
deck     tty2         :0               Mon Feb 17 14:02   still logged in
reboot   system boot  6.8.0-valve1-1   Mon Feb 17 14:01   still running
```

O `last` mostra o histórico de logins. O usuário `deck` entra automaticamente como `tty2` com uma sessão gráfica (`:0`) — não há tela de senha no modo de jogo. O SteamOS é configurado para autologin do `deck` por padrão, porque a experiência-alvo é a de console: ligou, já está dentro.

O assistente também lida com a primeira atualização do sistema, que costuma ser a etapa mais demorada. O SteamOS impede que você use aparelho com firmware e software desalinhados — a atualização é obrigatória antes do primeiro uso completo.

:::dica
Se o primeiro boot travar na tela de Wi-Fi, conecte o Deck a um monitor e teclado pelo dock. O modo Desktop tem ferramentas de rede mais completas (`nmcli`, `connmanctl`) para diagnosticar roteadores que não aparecem na lista do assistente.
:::

## Os dois modos de operação

O Steam Deck alterna entre dois "rostos" do mesmo sistema. O **modo de jogo** (Game Mode) é a interface de console — a Steam Big Picture redesenhada — onde você navega na biblioteca, ajusta desempenho e joga. O **modo Desktop** é o KDE Plasma: um desktop Linux completo com gerenciador de arquivos, navegador, terminal e tudo o que você espera de um PC.

Os dois não são sistemas separados: é o mesmo SteamOS, com sessions (sessões gráficas) distintas. Trocar de um para outro é apenas encerrar a sessão do compositor e iniciar outra.

```terminal
$ loginctl list-sessions
SESSION  UID USER  SEAT  TTY
      2 1000 deck  seat0 tty2
```

O `loginctl` gerencia sessões de login. Há uma única sessão ativa do usuário `deck` (UID 1000). Ao alternar para o modo Desktop, a sessão do modo de jogo é substituída por uma sessão Plasma — o UID e o usuário continuam os mesmos.

Para chegar ao terminal: no modo de jogo, segure o botão de energia e escolha "Switch to Desktop"; no Desktop, abra o Konsole (atalho [[Ctrl+Alt+T]] ou pelo menu iniciar). O Konsole é o emulador de terminal do KDE.

```terminal
$ whoami
deck
$ echo $HOME
/home/deck
$ pwd
/home/deck
```

Você é o usuário `deck`, com home em `/home/deck`. Nota: ao contrário do padrão `ana` que a especificação do curso usa nos exemplos genéricos, no SteamOS real o usuário é `deck`, e o host é `steamdeck`. Nos exemplos deste capítulo, usei `deck`/`steamdeck` por fidelidade ao aparelho.

## Imutabilidade e o que você pode (e não pode) tocar

O SteamOS 3.6 tem o sistema raiz montado como **somente leitura** por padrão — um conceito chamado imutabilidade. As partições de sistema (`/usr`, `/etc` em grande parte) não podem ser modificadas durante o uso normal; as atualizações acontecem de forma atômica pelo esquema A/B que vimos na seção de armazenamento.

Isso tem uma consequência prática importante para quem vem de outros Linux: `sudo pacman -S` (instalar pacote no Arch) ou `apt install` não funcionam como num desktop tradicional, porque o sistema raiz bloqueia escrita. Para instalar software de usuário, você usa o Flatpak (via `flatpak install` ou a loja Discover) ou o Steam.

```terminal
$ mount | grep -E 'on / type|on / type'
overlay on / type overlay (rw,relatime,lowerdir=/dev/nvme0n1p5)
```

A linha de montagem da raiz mostra um `overlay` — uma camada de escrita temporária sobre a raiz somente-leitura. O que você "escreve" em `/` durante a sessão vai para uma camada volátil que se perde no reboot, a menos que a Valve tenha habilitado escrita persistente para aquela parte.

```terminal
$ sudo steamos-readonly disable
```

O comando `steamos-readonly disable` desabilita a proteção e permite escrita persistente na raiz — útil para desenvolvedores que precisam instalar pacotes do sistema. A maioria dos usuários deve manter a proteção ativa: ela é o que torna o SteamOS robusto contra updates quebrados e contra usuário que apaga arquivo errado.

:::atencao
Desabilitar a leitura-somente (`steamos-readonly disable`) e mexer em pacotes do sistema faz com que a próxima atualização do SteamOS **reverta suas mudanças** ou, pior, deixe o sistema em estado inconsistente pelo esquema A/B. Só faça isso se souber o que está fazendo e esteja pronto para reinstalar a partição do sistema.
:::

## Primeiros comandos de diagnóstico

Com o terminal aberto, vale uma rodada de reconhecimento. Os comandos abaixo são seguros, para você se familiarizar com o hardware que estudou nas seções anteriores.

```terminal
$ uname -a
Linux steamdeck 6.8.0-valve1-1 #1 SMP PREEMPT_DYNAMIC Sat, 15 Feb 2025 00:00:00 +0000 x86_64 GNU/Linux
$ lscpu | grep 'Model name'
Model name:             AMD Custom APU 0405
$ free -h | head -2
               total        used        free      shared  buff/cache   available
Mem:            14Gi       2.8Gi       8.9Gi        11Mi       2.6Gi        11Gi
$ df -h / /home
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p5   455G   45G  367G  11% /
/dev/nvme0n1p5   455G   45G  367G  11% /home
$ uptime
 15:22:43 up 3 min,  1 user,  load average: 0.62, 0.48, 0.31
```

Cada comando reconfirma algo já visto: o kernel com patches da Valve, a APU customizada, a memória LPDDR5, o armazenamento NVMe e o tempo desde o boot (`uptime`). O `load average` de 0,62 numa máquina de 4 núcleos indica carga leve — o sistema acabou de subir e ainda está ocioso.

```terminal
$ systemd-analyze
Startup finished in 3.801s (firmware) + 1.409s (loader) + 2.771s (kernel) + 5.102s (userspace) = 13.083s
graphical.target reached after 5.009s in userspace.
```

O mesmo `systemd-analyze` que vimos na seção de ecossistema, agora medido no seu aparelho recém-ligado. A linha final — `graphical.target reached after 5.009s` — é o tempo para a interface gráfica estar pronta após o init do systemd.

## Resumo

- O primeiro boot passa por um assistente que configura idioma, rede e conta Steam, usando só os controles do aparelho.
- Modo de jogo e modo Desktop são sessões gráficas do mesmo SteamOS; o usuário é sempre `deck` (UID 1000), host `steamdeck`.
- O terminal (Konsole) está disponível no modo Desktop e expõe um Linux completo para diagnóstico.
- O SteamOS é imutável: a raiz é somente-leitura com camada overlay; `steamos-readonly disable` libera escrita persistente.
- Comandos como `uname`, `lscpu`, `free`, `df`, `uptime` e `systemd-analyze` dão o primeiro mapa do sistema.

## Exercícios

1. Reinicie o Deck e, no modo Desktop, execute `last | head -4`. Quem entrou no sistema e em que terminal? Há login com senha?
2. Abra o Konsole e rode os cinco comandos de diagnóstico da última seção, um por um. Registre a saída de cada um num arquivo texto para referência futura.
3. Verifique a imutabilidade: rode `mount | grep ' on / '`. A raiz está montada como `overlay`? O que isso indica sobre a escrita em `/`?
4. Execute `loginctl list-sessions` no Desktop e depois volte ao modo de jogo e rode de novo. A sessão mudou? O UID do usuário é o mesmo?
5. **Desafio.** Do modo Desktop, rode `systemd-analyze blame | head -10` para listar os serviços que mais demoram no boot. Identifique o mais lento e investigue, com `systemctl status <serviço>`, para que ele serve. Conclua se vale a pena (e se é seguro) desativá-lo — argumente com base no que aprendeu sobre imutabilidade e o esquema A/B.