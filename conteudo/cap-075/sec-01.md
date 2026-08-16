O Steam Deck liga, mostra a logo, e você sente que a máquina é sua. Essa sensação vem de uma decisão de design que muita gente trata como detalhe: a animação de boot. No SteamOS, ela não é fixa — é um arquivo de vídeo que pode ser trocado por outro, junto com a animação de suspend e os sons de interface. O Animation Changer é o plugin que coloca uma interface amigável em cima desse mecanismo, mas por baixo dele continuam arquivos, diretórios e formatos que vale a pena entender antes de sair trocando tudo.

:::objetivos
- Entender o que é o Animation Changer e como ele se encaixa no Game Mode
- Distinguir o que é feito pelo plugin do que é feito pelo próprio SteamOS
- Identificar os três canais que o plugin controla: boot, suspend e som
- Compreender por que o plugin depende do Decky Loader para existir
:::

## Onde o Animation Changer mora

O Steam Deck tem dois "mundos" de interface. O modo desktop roda uma sessão KDE Plasma comum, com `systemd` convencional e pastas que qualquer usuário de Linux reconhece. O **Game Mode**, a tela que aparece quando o deck liga ou quando você escolhe "Retornar ao modo de jogo", é outra coisa: ele roda sob o **gamescope**, um compositor Wayland feito pela Valve especificamente para jogos, e é administrado pela sessão Steam personalizada.

É dentro desse Game Mode que o Animation Changer atua. Ele não é um programa independente que você instala de fora: é um **plugin do Decky Loader**, que por sua vez é um carregador de plugins para o Game Mode. A cadeia de dependência é o ponto mais importante para o diagnóstico:

```text
Game Mode (gamescope + Steam)
    └─ Decky Loader (injetado na sessão Steam)
          └─ Animation Changer (plugin)
                ├─ boot animations
                ├─ suspend animations
                └─ UI sounds
```

Quando qualquer elo dessa cadeia quebra, o sintoma é o mesmo: a animação não troca, o som não toca, ou o menu do plugin some. Por isso a seção 2 [cobre a instalação do Decky](#/cap-075/sec-02) antes de mexer em qualquer tema.

Você pode confirmar em qual "mundo" está executando comandos checando se a sessão está sob o gamescope:

```terminal
$ echo $XDG_SESSION_TYPE
wayland
$ pgrep -a gamescope | head -2
1742 /usr/bin/gamescope --xwayland-count 2 --backend sdl --hdr-enabled
$ echo $HOME
/home/deck
```

A variável `XDG_SESSION_TYPE` respondendo `wayland` confirma o compositor; o `pgrep` mostra o processo do gamescope em execução com seus argumentos. No modo desktop, o gamescope não está rodando — é isso que separa, na prática, onde o plugin funciona e onde você vai operar os arquivos por linha de comando.

:::info
O Animation Changer começou como um projeto da comunidade e hoje vive no repositório oficial de plugins do Decky Loader. Ele é mantido de forma independente da Valve, então quando o SteamOS atualiza, o plugin pode quebrar por uma ou duas semanas até os mantenedores ajustarem a compatibilidade.
:::

## O que o plugin realmente faz

É tentador achar que o Animation Changer "injeta" a animação em algum lugar escondido. Na prática, o que ele faz é bem menos mágico e bem mais educativo:

1. **Baixa** temas de um servidor da comunidade para uma pasta local.
2. **Registra** o tema escolhido no arquivo de configuração que o SteamOS lê.
3. **Invoca** o mecanismo nativo do SteamOS que aplica a animação.

O passo 3 é a chave do entendimento. O SteamOS já vem com um mecanismo de animação de boot personalizada — é ele que a Valve usa para mostrar o vídeo da logo Steam na inicialização. O plugin só preenche os campos certos: qual arquivo usar, e em qual canal (boot ou suspend).

```terminal
$ ls -la /etc/steamos-logo* 2>/dev/null
/etc/steamos-logo.webm
/etc/steamos-logo.mp4
```

A existência de caminhos como `/etc/steamos-logo` mostra que a personalização do boot é uma porta que a Valve deixou aberta. O Animation Changer apenas a explora. Isso tem uma consequência prática importante: se você aprender a mexer nos arquivos diretamente, consegue o mesmo resultado sem o plugin — e essa é a ponte para [criar animações autorais na seção 7](#/cap-075/sec-07).

## Os três canais de personalização

O plugin divide seu trabalho em três frentes, que viram as próximas seções do capítulo:

- **Boot animations** — o vídeo exibido durante a inicialização, do logo até o menu principal. Costuma ser um arquivo WebM curto.
- **Suspend animations** — o vídeo (ou imagem) mostrado quando o deck entra em modo de suspension, ao fechar a tampa ou apertar o botão de energia.
- **UI sounds** — os efeitos sonoros da interface: o som de navegação, o de confirmação, o de notificação e o som de boot.

O erro mais comum de quem começa é tratar os três como um bloco só. Eles têm formatos, pastas e mecanismos diferentes. Um tema de boot em WebM não substitui um som de interface em WAV; cada canal tem sua própria regra, e o plugin esconde isso atrás de uma única interface.

A separação dos canais aparece também no disco, onde cada um tem seu próprio espaço:

```terminal
$ ls -la ~/homebrew/plugins/AnimationChanger/ 2>/dev/null
drwxr-xr-x deck deck 4096 Mar  1 12:00 animations/
drwxr-xr-x deck deck 4096 Mar  1 12:00 sounds/
```

A pasta `animations/` abriga os vídeos (boot e suspend, que são vídeo), e a `sounds/` abriga os arquivos de áudio. Dois mundos de mídia, três canais de personalização, uma única árvore — a seção 6 abre isso com lupa.

:::atencao
O Animation Changer não troca a logo do firmware (UEFI/BIOS) nem o splash que aparece antes do kernel carregar. Aquela primeira fração de segundo, com o logo da Valve sobre fundo preto, é responsabilidade do firmware da placa e não é afetada por nenhum plugin. O que dá para trocar começa na etapa do sistema operacional.
:::

## Por que fazer isso além do visual

Personalizar boot e suspend tem usos práticos que vão além da estética. Um vídeo de boot mais curto reduz o tempo que você olha para a tela antes de jogar. Uma suspensão com imagem clara confirma visualmente que o deck dormiu de verdade. E os sons de interface — ou a ausência deles — ajudam quem usa o deck em ambiente silencioso ou com restrição auditiva.

O ponto que conecta tudo isso ao resto do curso: por trás de cada tema existe um arquivo, um caminho e um formato. As seções a seguir desmontam o mecanismo uma camada por vez, começando pela instalação do carregador que torna tudo isso possível.

## Resumo

- O Animation Changer é um plugin do Decky Loader, que roda dentro do Game Mode sob o gamescope.
- A cadeia de dependência é Game Mode → Decky Loader → Animation Changer; quebrar um elo afeta todo o resto.
- O plugin não injeta nada: ele baixa, registra e aciona o mecanismo nativo do SteamOS de animação de boot.
- Existem três canais independentes: boot animations, suspend animations e UI sounds, cada um com formato e caminho próprios.
- A personalização não afeta o splash do firmware, apenas a etapa do sistema operacional.

## Exercícios

1. Ligue o Steam Deck e identifique, cronometrando, em que momento a animação de boot começa e termina. Ela aparece antes ou depois do logo do firmware?
2. No Game Mode, abra o menu lateral (botão `...`) e localize o ícone do Decky Loader. O Animation Changer já aparece na lista de plugins? Se não, que elo da cadeia pode estar faltando?
3. Liste os arquivos relacionados ao logo executando `ls /etc/ | grep -i steam` no modo desktop e anote quais caminhos o sistema reserva para essa personalização.
4. Explique, com suas palavras, a diferença entre trocar a animação de boot e trocar a logo do firmware. Por que a segunda não é possível com o plugin?
5. **Desafio.** Sem instalar nada ainda, levante a versão atual do SteamOS com `cat /etc/os-release` e pesquise se essa versão tem incompatibilidade conhecida com a versão atual do Decky Loader. Relacione a cadeia de dependência da seção com o que encontrar.
