O SteamOS é um sistema imutável: a partição raiz é somente leitura, e qualquer pacote instalado ali morre no próximo update. Isso cria uma pergunta prática — como instalar novos aplicativos sem quebrar o sistema? A resposta oficial da Valve para essa pergunta tem um nome: Flatpak. Entender o que é Flatpak e por que ele foi escolhido é o primeiro passo para usar o Steam Deck (ou qualquer PC com SteamOS) de verdade, além dos jogos da Steam.

:::objetivos
- Entender o problema de distribuição de software que o Flatpak resolve
- Identificar o Flatpak como a via oficial de instalação no SteamOS imutável
- Conhecer os três pilares do modelo: aplicativo, runtime e sandbox
- Localizar onde os aplicativos Flatpak são armazenados no disco
- Distinguir Flatpak do gerenciador de pacotes tradicional (`pacman`)
:::

## O problema que o Flatpak resolve

Antes do Flatpak, o jeito padrão de instalar software Linux era o gerenciador de pacotes da distribuição. No SteamOS, quem faz esse papel é o `pacman`, herdado do Arch. Ele baixa pacotes, resolve dependências e instala os arquivos nos diretórios do sistema: o binário vai para `/usr/bin`, as bibliotecas para `/usr/lib`, a configuração para `/etc`.

Esse modelo funcionou bem por décadas, mas tem um preço. Cada distribuição empacota o mesmo aplicativo do seu jeito, em versões diferentes, com dependências ligeiramente incompatíveis. O desenvolvedor de um aplicativo precisa lançar um pacote para Ubuntu, outro para Fedora, outro para Arch — e rezar para que a versão da biblioteca que ele testou seja a mesma que está na máquina do usuário. É um problema tão comum que ganhou nome: *dependency hell* (inferno de dependências).

```terminal
$ pacman -Qi firefox | head -8
Name            : firefox
Version         : 129.0.2-1
Description     : Firefox web browser
Architecture    : x86_64
URL             : https://www.mozilla.org/firefox/
Licenses        : MPL GPL LGPL
Installed Size  : 247.92 MiB
Depends On      : gtk3 nss libxt libxdamage ...
```

Repare na última linha: `Depends On` lista as outras bibliotecas que o Firefox precisa. Cada uma delas, por sua vez, tem suas próprias dependências, formando uma teia que o `pacman` resolve na instalação. O problema não é a resolução em si — é que essa teia precisa ser compatível com *todo o resto do sistema ao mesmo tempo*. Se dois aplicativos exigem versões diferentes da mesma biblioteca, um deles quebra.

O Flatpak ataca esse problema pela raiz: em vez de depender das bibliotecas do sistema, cada aplicativo traz consigo — ou aponta para — um **runtime**, um conjunto de bibliotecas empacotado separadamente. O aplicativo roda num ambiente previsível, idêntico em qualquer distribuição que tenha Flatpak instalado.

## O modelo: aplicativo + runtime

A ideia central do Flatpak é separar três coisas que o `pacman` mistura. O **aplicativo** é só o seu código — o binário do Firefox, do GIMP, do VLC. O **runtime** é a base sobre a qual o aplicativo roda: bibliotecas gráficas, ferramentas, o conjunto de dependências comuns que dezenas de aplicativos compartilham. E a **sandbox** é a cerca de segurança que limita o que o aplicativo pode acessar.

Essa separação resolve o inferno de dependências por um motivo simples: o desenvolvedor testa contra um runtime específico, e esse runtime é *o mesmo* em todo lugar. Não importa se você está no SteamOS, no Fedora ou no Ubuntu — o runtime `org.freedesktop.Platform` na versão 24.08 é byte a byte equivalente nas três.

```terminal
$ flatpak list --runtime
Name                        Application ID                          Version           Branch
Freedesktop Platform        org.freedesktop.Platform                24.08.34          24.08
Mesa                        org.freedesktop.Platform.GL.default     24.3.2            24.08
Mesa (Extra)                org.freedesktop.Platform.GL.default     24.3.2            24.08extra
KDE Application Platform    org.kde.Platform                       6.7               6.7
openh264                   org.freedesktop.Platform.openh264       2.3.1             2.4.1
```

Cada linha é um runtime ou uma extensão de runtime. Repare que o `org.kde.Platform` aparece ali: aplicativos escritos com as bibliotecas do KDE usam esse runtime, que por sua vez se apoia sobre o `org.freedesktop.Platform`. É uma cadeia de herança — o runtime do KDE traz as bibliotecas do KDE em cima da base Freedesktop, então não precisa duplicar tudo.

A vantagem para o desenvolvedor é brutal: ele lida com *uma* plataforma de destino, não com dez distribuições. A vantagem para o usuário é que o aplicativo continua funcionando quando o sistema muda — porque o que o aplicativo enxerga é o runtime, e não o sistema lá embaixo.

## Por que isso importa no SteamOS

Num sistema normal, o usuário nem percebe a diferença entre instalar pelo `pacman` ou pelo Flatpak — os dois resultam num aplicativo que abre. No SteamOS, a diferença é decisiva.

O SteamOS monta a partição raiz como **somente leitura**. Isso é intencional: a Valve quer que a imagem do sistema seja idêntica em todos os Steam Decks, para poder testar uma única combinação e empurrar atualizações com confiança. Para o usuário, significa que o update nunca deixa pedaços de um estado antigo para trás — mas também significa que você não pode escrever em `/usr`.

```terminal
$ touch /usr/teste.txt
touch: cannot touch '/usr/teste.txt': Read-only file system
$ mount | grep ' / '
/dev/nvme0n1p4 on / type btrfs (ro,relatime,ssd,space_cache)
```

Veja o `ro` na linha do mount: a raiz é readonly. Qualquer pacote que tentasse instalar em `/usr` simplesmente falharia — ou, pior, se você desativar temporariamente a proteção, a instalação "pega" até o próximo update, quando o sistema sobrescreve a partição e apaga tudo que você pôs lá.

O Flatpak, ao contrário, instala **fora** do sistema. Os aplicativos vão para `/var/lib/flatpak` (quando instalados para todos os usuários) ou para `~/.local/share/flatpak` (por usuário), e os dados de cada aplicativo vão para `~/.var/app`. Nenhuma dessas pastas fica na partição somente leitura — então os aplicativos Flatpak sobrevivem aos updates do sistema.

:::atencao
Não use `pacman` para instalar software no SteamOS. O SteamOS desativa os repositórios do Arch justamente porque instalar via `pacman` escreve em `/usr`, que é somente leitura e será sobrescrito no próximo update — você perde o pacote e pode corromper o estado do sistema. A via oficial e suportada é o Flatpak. Reforce isso sempre que vir um tutorial genérico de Linux mandando `sudo pacman -S algo`.
:::

## A sandbox como segunda proteção

Além de resolver o problema de dependências e de coexistir com o sistema imutável, o Flatpak traz uma camada de segurança que o `pacman` não oferece. Um pacote instalado via `pacman` vira processo comum: ele enxerga seu `/home`, suas chaves, suas fotos. Um aplicativo Flatpak, por padrão, enxerga quase nada.

Essa limitação é a **sandbox**. Ela se apoia em recursos do kernel — *namespaces* (que criam visões isoladas de processos, montagens e rede) e *cgroups* (que limitam o uso de recursos). O Flatpak monta essas estruturas e, na prática, o aplicativo roda numa jaula de vidro: ele não acessa arquivos fora do que foi autorizado, não vê processos de outros aplicativos e frequentemente não tem rede a menos que a permissão seja concedida.

```terminal
$ flatpak ps
Instance   PID   Application                       Runtime     
138338     1234  org.mozilla.firefox               org.freedesktop.Platform
```

O `flatpak ps` mostra os aplicativos Flatpak em execução, com o PID e o runtime. A coluna `Instance` identifica a "instância" da sandbox — um agrupamento do processo junto com suas configurações. Se você olhar de fora, com `ps aux`, verá o processo do navegador rodando normalmente; mas por dentro do seu próprio *namespace*, o mundo dele é bem menor do que o seu.

Isso não quer dizer que a sandbox seja inviolável — ela é uma camada de contenção, não uma muralha absoluta. Mas, comparada a rodar software como processo comum com seu privilégio de usuário, é uma diferença de categoria: um bug num aplicativo Flatpak tem muito menos superfície para alcançar seus arquivos pessoais.

## Resumo

- O `pacman` instala em `/usr`, que no SteamOS é somente leitura e é sobrescrito a cada update.
- O Flatpak separa aplicativo, runtime e sandbox, resolvendo o inferno de dependências entre distribuições.
- Runtimes como `org.freedesktop.Platform` e `org.kde.Platform` dão uma base idêntica em qualquer sistema.
- O Flatpak instala em `/var/lib/flatpak` e `~/.var/app`, fora da partição do sistema, por isso é a via oficial.
- A sandbox usa *namespaces* e *cgroups* do kernel para limitar o que o aplicativo enxerga.

## Exercícios

1. Rode `flatpak --version` e anote a versão instalada no seu SteamOS. Depois rode `flatpak list` e conte quantos aplicativos e quantos runtimes estão presentes.
2. Compare `flatpak list --app` com `flatpak list --runtime`. Explique por que o número de runtimes é menor que o número de aplicativos, mesmo quando os aplicativos usam bibliotecas gráficas diferentes.
3. Execute `mount | grep ' / '` e confirme o `ro` na raiz. Com isso em mente, explique em uma frase por que `sudo pacman -S vlc` é uma má ideia no SteamOS.
4. Rode `flatpak ps` com um aplicativo Flatpak aberto e identifique, na saída, o aplicativo e o runtime em uso.
5. **Desafio.** Inspecione as permissões de um aplicativo com `flatpak info --show-permissions org.mozilla.firefox`. Liste quais acessos ele tem por padrão e proponha uma permissão que você removeria e por quê.
