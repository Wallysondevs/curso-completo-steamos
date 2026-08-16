Todo Flatpak que você instala no SteamOS nasce com um conjunto de permissões: o que ele pode ver no seu disco, quais soquetes ele usa, se enxerga a rede e a quais dispositivos tem acesso. Essas permissões vêm embutidas no pacote pelo mantenedor, e a maioria dos usuários nunca as olha. O problema é que, diferente de um pacote da sua distribuição, um Flatpak pode ter sido empacotado por qualquer pessoa — e confiar cegamente no que vem dentro dele é confiar em código de terceiros rodando na sua máquina.

O SteamOS aposta pesado no Flatpak justamente porque ele isola aplicações. Mas isolamento não é mágica: ele só funciona se as permissões forem as mínimas necessárias. Aqui você vai entender por que auditar permissões é uma prática que separa quem usa Linux com segurança de quem só instala e torce.

:::objetivos
- Entender o modelo de isolamento do Flatpak e por que permissões importam
- Identificar os tipos de permissão que um Flatpak pode ter (filesystem, sockets, dispositivos)
- Reconhecer os riscos concretos de conceder mais do que o necessário
- Diferenciar o que o Flatseal controla do que ele apenas exibe
:::

## O modelo de isolamento do Flatpak

Um Flatpak não roda "solto" no seu sistema. Ele roda dentro de um **sandbox**: uma caixa limitada pelo kernel Linux que decide, através de namespaces e filtros, o que o processo enxerga do mundo lá fora. Quando você instala um aplicativo, o Flatpak lê um arquivo de metadados (o `metadata` do pacote) e monta uma série de permissões padrão em cima dele.

A ideia central é o **menor privilégio**: o app deveria ter acesso apenas ao que precisa para cumprir sua função. Um leitor de PDF não precisa enxergar sua pasta `.ssh`. Um editor de texto não precisa falar com o D-Bus do sistema inteiro. E, no entanto, é comum encontrar apps empacotados com `filesystem=home` ou `filesystem=host`, que dão acesso a praticamente tudo.

A parte difícil é que essas permissões são declaradas em texto puro e ficam escondidas. Para vê-las, você precisa do comando `flatpak override`:

```terminal
$ flatpak override --show org.gnome.Evince
[Context]
filesystems=home;
sockets=x11;wayland;
devices=dri;

[Environment]
DCONF_USER_CONFIG_DIR=.config/dconf
```

A saída tem duas seções. `[Context]` lista o que o sandbox permite (sistemas de arquivos, soquetes, dispositivos). `[Environment]` lista variáveis de ambiente injetadas dentro do sandbox. Cada linha termina em `;`, e a leitura é direta: `filesystems=home` significa "este app vê toda a sua pasta pessoal".

Antes de olhar permissão por permissão, comece com o inventário do que existe instalado no seu Deck:

```terminal
$ flatpak list --app --columns=application,installation
Application ID                Installation
org.mozilla.firefox           system
org.gnome.Evince              system
org.gimp.GIMP                 system
com.github.tchx84.Flatseal    user
```

Cada linha da coluna `Application ID` é o identificador que você vai passar ao `flatpak override --show`. A coluna `Installation` diz se o app veio da instalação de sistema (pré-instalada pela Valve) ou da sua instalação de usuário — uma distinção que volta a importar quando falamos de escopos e overrides.

## Por que permissões erradas doem

A pergunta honesta é: qual o pior que pode acontecer se um app enxerga mais do que deveria? A resposta tem três degraus de gravidade.

Primeiro, **vazamento de dados**. Um app com `filesystem=home` pode ler (e escrever) em `~/.ssh`, `~/.gnupg`, navegadores, tokens. Se o app tem qualquer vulnerabilidade — ou se simplesmente é malicioso — suas chaves e senhas ficam à disposição.

Segundo, **escalonamento lateral**. O sandbox do Flatpak não protege você contra outros processos que rodam no seu **mesmo usuário**. Se um Flatpak ganha acesso a um soquete X11 ou ao D-Bus da sessão, ele pode, em muitos casos, injetar entrada em outras janelas, tirar screenshots ou acionar outros apps.

Terceiro, **falsa sensação de segurança**. "É Flatpak, então é seguro" é uma frase perigosa. O isolamento é uma ferramenta, não uma garantia. A garantia só existe quando as permissões são revistas.

:::atencao
`filesystem=home` dá acesso de leitura **e escrita** à sua pasta pessoal. Não é "só leitura": o app pode criar, modificar e apagar arquivos em `~`. Flatpaks legítimos às vezes pedem isso por conveniência, mas é um dos pedidos mais abrangentes que existem.
:::

## Onde o Flatseal entra nessa história

Editar essas permissões na mão é possível, mas frustrante. Você precisaria lembrar a sintaxe de `flatpak override`, os nomes corretos dos soquetes (`x11`, `wayland`, `pulseaudio`, `system-bus`) e o formato exato. Um erro de digitação pode quebrar o app ou, pior, abrir mais do que fechar.

O **Flatseal** é exatamente a interface gráfica para esse trabalho. Ele lê os metadados e as sobras de `override` de cada Flatpak instalado, mostra tudo em categorias visuais (Filesystem, Sockets, Devices, Session Bus, Environment) e traduz cada clique em uma chamada de `flatpak override` por baixo dos panos.

A relação é importante de fixar: o Flatseal **não inventa** nada. Ele é uma camada amigável sobre o mesmo subsistema que você controlaria no terminal. Tudo o que ele faz você poderia reproduzir com `flatpak override`, e tudo o que o terminal faz aparece refletido no Flatseal na próxima vez que você abrir o app.

## Instalando e abrindo o Flatseal

O Flatseal em si é um Flatpak, disponível no Flathub. No SteamOS você instala pelo terminal:

```terminal
$ flatpak install flathub com.github.tchx84.Flatseal
Looking for matches…
Remotes found with refs similar to 'com.github.tchx84.Flatseal':

   1) flathub (system-or-remote) com.github.tchx84.Flatseal

Which do you want to use (0 to abort)? [0-1]: 1

        ID                                   Branch  Op  Remote   Download
 1. [✓] com.github.tchx84.Flatseal           stable  i   flathub   1.1 MB

Installation complete.
```

Ao abrir, a janela mostra a lista de aplicativos Flatpak instalados no painel esquerdo. Clicar em um deles exibe, no painel direito, todos os grupos de permissão daquele app. Cada linha tem um interruptor (toggle) que pode estar ligado, desligado ou "herdado" — este último é o padrão, quando a permissão vem do próprio pacote e ninguém alterou.

:::dica
Antes de mexer em qualquer coisa, instale o Flatseal e **apenas observe**. Percorra três ou quatro apps que você usa todo dia e perceba o padrão: quase todos têm `filesystems=home` ou `host` por padrão. Isso já muda sua noção de "instalar e usar".
:::

## Resumo

- Flatpak roda apps dentro de um sandbox definido por permissões declaradas nos metadados do pacote.
- As permissões cobrem filesystem, soquetes (sockets), dispositivos (devices) e variáveis de ambiente.
- `flatpak override --show <id>` exibe as permissões atuais de um app em duas seções: `[Context]` e `[Environment]`.
- `filesystem=home` dá acesso amplo de leitura e escrita à sua pasta pessoal.
- O Flatseal é uma GUI sobre o `flatpak override`; tudo o que ele faz pode ser feito — e verificado — no terminal.
- O princípio central é o menor privilégio: conceder só o que o app precisa para funcionar.

## Exercícios

1. Liste seus Flatpaks com `flatpak list --app` e escolha três. Rode `flatpak override --show <id>` para cada um e registre quantos têm `filesystems=home` ou `filesystems=host`.
2. Instale o Flatseal com `flatpak install flathub com.github.tchx84.Flatseal` e confirme que ele aparece na lista com `flatpak list --app | grep Flatseal`.
3. Abra o Flatseal, selecione um app, e compare o que você vê na janela com a saída de `flatpak override --show` do mesmo app. As duas visões concordam?
4. No Flatseal, identifique um app com `filesystem` herdado e anote a seção `[Context]` dele. O que cada linha `sockets=` e `devices=` significa?
5. **Desafio.** Use `flatpak info -m <id>` (que mostra os metadados brutos do pacote) e compare com `flatpak override --show`. Separe mentalmente o que veio do pacote e o que veio de uma alteração sua — e verifique essa separação na próxima seção.
