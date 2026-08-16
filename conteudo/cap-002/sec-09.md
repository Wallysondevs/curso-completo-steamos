Chegamos ao fim, e a pergunta que resta é a que amarra o capítulo: o que, afinal, *é* o SteamOS? Nove seções descreveram peças — Arch, Holo, imutabilidade, A/B, Gamescope, Plasma, Flatpak, pacman, `steamos-update`. Esta seção junta as peças num retrato único, para que você saia com uma definição sólida e um mapa mental de como os dois modos se encaixam num só sistema.

:::objetivos
- Sintetizar uma definição precisa e completa do SteamOS
- Mapear os componentes em camadas (base, sistema, sessão, apps)
- Entender a fronteira entre os dois modos e o que os une
- Consolidar o contraste com um Arch Linux genérico
:::

## Uma definição em uma frase

O SteamOS é um sistema operacional da Valve, construído sobre uma base Arch Linux com uma camada própria chamada Holo, que troca a filosofia "desktop aberto" do Arch por uma filosofia de console: raiz imutável, atualizações atômicas A/B, e aplicativos restritos ao Flatpak. Tudo isso serve a um único propósito — ser o ambiente ideal para rodar jogos — e se desdobra em duas personalidades: o Modo Jogo (Gamescope) e o Modo Desktop (KDE Plasma).

Essa definição carrega cada conceito das seções anteriores. Vamos desdobrá-la em camadas para fixar.

## As camadas do SteamOS

Pense no sistema como uma pilha. Cada camada apoia a seguinte, e cada uma tem uma "dona" diferente.

| Camada | O que é | Quem controla |
|---|---|---|
| Kernel | `linux-neptune`, com patchs para o APU AMD | Valve |
| Base do sistema | `/usr`, `/etc`, `/bin` — imutáveis | Valve |
| Camada de update | Partições A/B + `rauc` + `systemd-boot` | Valve |
| Sessão gráfica | Gamescope (jogo) ou KWin/Plasma (desktop) | Valve |
| Aplicativos | Flatpak sobre os runtimes | Você |

A fronteira crítica é entre a quarta e a quinta camada. Você não controla as quatro primeiras — a Valve as atualiza como um bloco atômico. Você controla a quinta: quais aplicativos instalar, que dados guardar, como configurar seu desktop. E a quinta camada foi desenhada justamente para nunca precisar tocar nas quatro primeiras.

```terminal
$ cat /etc/os-release | grep -E 'NAME|ID_LIKE|VERSION_ID|BUILD_ID'
NAME="SteamOS"
ID_LIKE=arch
VERSION_ID=3.6
BUILD_ID=20241015.1
$ flatpak list --app | wc -l
23
```

Esses dois comandos, lado a lado, resumem a divisão: o `os-release` descreve as quatro primeiras camadas (sistema, pela Valve); o `flatpak list` descreve a quinta (seus 23 aplicativos). Duas soberanias convivendo no mesmo disco.

## A fronteira entre os dois modos

O SteamOS tem dois modos porque tem dois públicos e dois formatos de interação, não porque são dois sistemas. O que os une é mais profundo do que o que os separa.

O Modo Jogo é o Gamescope + o Steam em "Big Picture Mode": tela cheia, gamepad, otimizado para latência e taxa de quadros. O Modo Desktop é o KDE Plasma + KWin: janelas, mouse, terminal, Discover. Alternar entre eles é trocar a sessão gráfica — o que está por baixo (kernel, `/usr`, partições A/B) não muda.

```terminal
$ echo $XDG_CURRENT_DESKTOP
KDE
$ ps aux | grep -E 'gamescope|kwin' | grep -v grep
deck   1234  2.1  1.4 1234567 98765 ?  Ssl  10:23  0:12 /usr/bin/gamescope
deck   2345  0.8  0.9 987654 76543 ?  Ssl  11:02  0:05 /usr/bin/kwin_wayland
```

Repare: num único `ps`, os dois compositores podem até aparecer como processos distintos (em momentos diferentes, ou em sessões diferentes). Mas em uma dada tela, um só deles domina. O `XDG_CURRENT_DESKTOP=KDE` diz que, naquele instante, é o KWin quem está no comando — e o Gamescope, se aparecer na lista, está em outra sessão ou parado.

:::nota
Existe uma situação em que Gamescope e desktop coexistem: rodar o Steam no Modo Desktop. Nesse caso, o Steam pode usar o Gamescope como uma janela aninhada dentro do Plasma, para ter escala/HDR em jogos individuais, sem abandonar o desktop. É a exceção sutil que confirma a regra: os dois são compositores, e compositores podem se aninhar, mas nunca dois dominam a mesma tela.
:::

## O mapa mental definitivo

Para fechar, cole no seu raciocínio estas equivalências, de trás para frente:

- **"SteamOS é fácil de quebrar."** Mentira. Raiz imutável + A/B tornam o sistema quase impossível de quebrar — desde que você não force a barra com o `pacman`.
- **"SteamOS é Arch com Steam."** Mentira. É Arch como *motor*, mas com contrato invertido: imutável, atômico, Flatpak. Quem trata como Arch quebra na primeira atualização.
- **"Modo Desktop é outro sistema."** Mentira. É o mesmo sistema com outra sessão gráfica. Kernel e `/usr` idênticos.
- **"Não posso instalar nada."** Mentira. Você instala o que quiser via Flatpak, sem tocar na raiz — e isso, surpreendentemente, é o que o torna livre para instalar.

```terminal
$ sudo steamos-readonly status
Filesystem is readonly at this time.
```

Essa única linha final encapsula o capítulo. A frase "Filesystem is readonly" não é uma limitação — é a garantia de que, amanhã, depois de um update, depois de um rollback, seu Steam Deck continua sendo exatamente o que a Valve projetou e o que você configurou.

:::dica
Guarde estes três comandos como seu "kit de reconhecimento" do SteamOS. Rode-os em qualquer Deck e você saberá, em segundos, o que está vendo:

```terminal
$ cat /etc/os-release        ## qual build de sistema
$ rauc status                ## qual partição e se o boot é sadio
$ flatpak list --app         ## quais apps você instalou
```

Sistema, boot, apps. As três camadas do capítulo, em três comandos.
:::

## Resumo

- SteamOS é Arch Linux + a camada Holo, com contrato de console: raiz imutável, updates A/B e apps via Flatpak.
- O sistema é uma pilha em cinco camadas; você controla apenas a camada de aplicativos (Flatpak), a Valve controla o resto.
- Modo Jogo (Gamescope) e Modo Desktop (KDE Plasma) são duas sessões gráficas do mesmo sistema, não dois sistemas.
- Alternar de modo troca a sessão gráfica; kernel, `/usr` e partições A/B permanecem idênticos.
- O pacman é ferramenta da Valve para construir a imagem; instalar com ele quebra na próximo update; a via correta é Flatpak.
- `cat /etc/os-release`, `rauc status` e `flatpak list --app` resumem as três camadas: sistema, boot e apps.

## Exercícios

1. Com seus próprios termos, escreva uma definição do SteamOS em até três frases, obrigatoriamente usando os conceitos de imutabilidade, atualização atômica e Flatpak.
2. Rode `cat /etc/os-release`, `rauc status` e `flatpak list --app`. Monte uma "ficha do seu Deck" com as três informações e explique o que cada uma representa.
3. Liste mentalmente as cinco camadas apresentadas e atribua cada uma a quem a controla: você ou a Valve. Onde fica a fronteira entre as suas mudanças e as da Valve?
4. Explique por que a afirmação "SteamOS é Arch com Steam" é errada, citando pelo menos três diferenças concretas que vimos no capítulo.
5. **Desafio.** Integre este capítulo ao anterior: com o que você aprendeu sobre kernel na seção sobre Linux, explique por que o `linux-neptune` (da Valve) é um exemplo concreto de "kernel mantido por uma distribuição", e relacione o `uname -r` com a ideia de que Modo Jogo e Modo Desktop compartilham o mesmo kernel. Escreva um parágrafo conectando as duas seções.