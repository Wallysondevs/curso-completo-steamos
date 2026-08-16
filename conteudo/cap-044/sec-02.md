Ter o Lutris instalado é só o começo: sem runners e sem fontes configuradas, ele é uma vitrine vazia. Nesta seção você aprende o fluxo completo — instalar pelo Flatpak, conectar contas da GOG e da Epic, baixar os runners de Wine e, por fim, instalar um jogo de verdade a partir de um script da comunidade. O caminho vale por dezenas de jogos futuros, porque é sempre o mesmo.

:::objetivos
- Instalar o Lutris pelo Flatpak no SteamOS
- Conectar contas da GOG, Epic e itch.io como fontes
- Baixar e gerenciar runners (Wine, Proton) dentro do Lutris
- Instalar um jogo via script da comunidade
- Entender onde os prefixos e jogos ficam armazenados
:::

## Instalando pelo Flatpak

No SteamOS, o sistema base é imutável e o pacote oficial da distribuição nem sempre acompanha as versões novas do Lutris. Por isso o Flatpak é o caminho recomendado pelo próprio projeto: ele sempre entrega a build mais recente, isolada do sistema.

```terminal
$ flatpak install flathub net.lutris.Lutris
Looking for matches…
Required runtime for net.lutris.Lutris/x86_64/stable (runtime/org.gnome.Platform/x86_64/47) found in remote flathub
Do you want to install it? [Y/n]: y

 1. net.lutris.Lutris       x86_64  stable flathub
 2. org.gnome.Platform      x86_64  47     flathub

Proceed with these changes to the system installation? [Y/n]: y
```

Complementos como Wine e DXVK não aparecem nessa instalação porque o Lutris os baixa por conta própria, no primeiro uso, para dentro da sua pasta `.var`. Isso é proposital: cada runner de Wine tem dezenas de megabytes, e baixar todos de antemão desperdiça espaço num SSD de 64 GB.

:::atencao
A primeira execução do Lutris via `flatpak run net.lutris.Lutris` pode demorar mais que o normal, porque ele baixa componentes em segundo plano. Tenha paciência e fique de olho na notificação de tarefas concluídas antes de tentar instalar um jogo.
:::

## Conectando suas contas

Antes de instalar qualquer coisa, vale adicionar as fontes. No Lutris, as lojas entram como **integrations**: você autentica uma conta da GOG, da Epic ou da itch.io, e o Lutris passa a enxergar sua biblioteca daquela loja, importando capas, faixas de instalação e, quando possível, os próprios jogos já baixados.

```terminal
$ ls ~/.var/app/net.lutris.Lutris/config/lutris/
lutris.conf  runners/  games/  sources/
```

A integração com a GOG funciona por token: o Lutris abre um navegador embutido, você loga, e ele guarda o token numa pasta de configuração (`sources/`). A Epic funciona de forma parecida, embora historicamente dependa do Heroic e do Legendary por baixo — o próprio Lutris hoje usa o Legendary como backend para a Epic, então convém saber que essa camada existe.

:::dica
Se você já usa o Heroic e tem instaladores da Epic configurados nele, o Lutris pode cooperar com o Legendary já autenticado. Evite reautenticar em dois lugares: mantenha uma loja integrada em uma ferramenta primária e deixe as demais como secundárias.
:::

## Baixando runners

Runner é tudo que executa jogo: Wine, Proton, ou mesmo um runtime nativo. O Lutris traz um gerenciador próprio que baixa versões de Wine testadas pela comunidade, timbradas com nomes como `lutris-GE-Proton` ou `wine-ge`.

```terminal
$ lutris --list-runners 2>&1 | head -12
Runners available:
  wine
  proton
  libretro
  linux
  dosbox

Wine versions available:
  lutris-7.2-2
  lutris-GE-Proton8-15
  wine-ge-8-26
```

O `--list-runners` mostra o que existe; o download em si é feito na interface (em "Preferências > Runners" ou no gerenciador de Wine) ou deixado como efeito colateral da instalação de um jogo, que puxa o runner que o script pede. Para um primeiro teste, a versão `lutris-GE-Proton` é bom ponto de partida: é o Proton com os patches da GloriousEggroll, otimizado para jogos.

## Instalando um jogo da comunidade

Agora o fluxo completo. Suponha um clássico gratuito como um jogo da itch.io ou um instalador `.exe` de uma demo. O modo mais didático é usar o seletor da própria loja dentro do Lutris e aceitar o script sugerido.

```terminal
$ flatpak run net.lutris.Lutris -i 'lutris:gog' 2>&1 | head -8
2025-01-12 18:04:11,101: Initializing lutris
2025-01-12 18:04:11,203: Runtime up to date
2025-01-12 18:04:12,004: Selecting installer for GOG
```

Na prática, a interface oferece busca por título. Escolhido o jogo, o Lutris monta a sequência: baixa o runner de Wine necessário, cria um prefixo em `~/Games/`, roda o instalador original dentro do Wine e, ao final, cadastra o atalho com ícone e configuração de runner.

:::info
O diretório padrão do Lutris para jogos e prefixos é `~/Games/`. Cada jogo vira uma subpasta própria; o prefixo Wine pode ficar lá dentro ou em `~/.wine` dependendo do script. Verifique sempre o caminho declarado no script antes de instalar, pois isso afeta backups.
:::

## Verificando o resultado

Depois da instalação, três coisas devem estar no lugar: o registro do jogo na biblioteca, o prefixo no disco e a capacidade de rodar via CLI.

```terminal
$ lutris --list-games
Name              Runner  Installed  Playtime
------------------------------------------------
Stardew Valley    wine    Yes        34h 12m
$ ls ~/Games/
stardew-valley
```

A listagem mostra o jogo com runner `wine` e status `Installed`. O prefixo associado vive em `~/Games/stardew-valley`, e você pode conferir os binários do Wine que o Lutris baixou para aquele jogo específico.

```terminal
$ ls ~/.var/app/net.lutris.Lutris/data/lutris/runners/wine/
lutris-GE-Proton8-15  wine-ge-8-26  lutris-7.2-2
```

Cada pasta é uma versão de Wine completa, pronta para ser reaproveitada por outros jogos. É por isso que o segundo jogo com o mesmo runner instala bem mais rápido: o Wine já está em cache, sobra apenas criar o prefixo e rodar o instalador original.

## Resumo

- O Flatpak isola o Lutris e os runners do sistema imutável do SteamOS; instale com `flatpak install flathub net.lutris.Lutris`.
- GOG, Epic e itch.io entram como integrações autenticadas, que expõem a biblioteca ao Lutris.
- Runners (Wine, Proton, libretro) são baixados sob demanda e reaproveitados entre jogos.
- O diretório padrão de jogos e prefixos é `~/Games/`, um por jogo.
- `lutris -i` instala por script; `lutris --list-games` confirma o resultado.
- A Epic usa o Legendary como backend, camada que o Lutris e o Heroic compartilham.

## Exercícios

1. Instale o Lutris pelo Flatpak e rode-o uma vez para que os componentes de primeiro uso sejam baixados.
2. Adicione a integração da GOG (ou da itch.io) e confirme que sua biblioteca aparece na interface.
3. No gerenciador de runners, baixe uma versão de Wine GE e observe a pasta criada em `~/.var/app/net.lutris.Lutris/data/lutris/runners/wine/`.
4. Instale um jogo gratuito qualquer pelo script da comunidade e depois verifique `lutris --list-games` e o conteúdo de `~/Games/`.
5. **Desafio.** Instale o mesmo jogo da GOG usando um script baixado manualmente (`lutris -i arquivo.yml`) em vez do seletor da loja, e compare o resultado. Explique onde o prefixo ficou e qual runner foi escolhido.
