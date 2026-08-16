O Flatpak não é o único formato de empacotamento que tenta resolver o problema do "roda em toda distribuição". Existem pelo menos três concorrentes diretos no ecossistema Linux: Snap (mantido pela Canonical), AppImage (formato autocontido) e o Flatpak. Esta seção coloca os três lado a lado, sem propaganda, explicando as diferenças técnicas reais que explicam por que o SteamOS apostou no Flatpak.

:::objetivos
- Conhecer os três principais formatos de empacotamento universal no Linux
- Comparar modelos de isolamento: sandbox (Flatpak, Snap) vs. sem sandbox (AppImage)
- Entender as diferenças de armazenamento e atualização de cada formato
- Avaliar por que o Flatpak foi escolhido para o SteamOS e não o Snap
- Identificar em quais cenários cada formato faz sentido

:::

## Três filosofias de empacotamento

Flatpak, Snap e AppImage são respostas diferentes para a mesma pergunta: como distribuir um aplicativo Linux que funcione em qualquer distribuição, sem depender do gerenciador de pacotes do sistema? Mas as respostas divergem radicalmente na implementação.

O **Flatpak** separa aplicativo de runtime, impõe sandbox, usa OSTree para deduplicação e atualizações incrementais, e tem o Flathub como repositório central comunitário. O **Snap** empacota o aplicativo e suas dependências num único arquivo comprimido (`*.snap`), montado como sistema de arquivos somente leitura, com sandbox via AppArmor e atualizações automáticas forçadas. A **AppImage** é a mais simples dos três: um único arquivo executável que carrega tudo dentro de si — sem runtime separado, sem sandbox, sem mecanismo de atualização embutido.

A tabela resume as diferenças estruturais:

| Característica | Flatpak | Snap | AppImage |
|---|---|---|---|
| Isolamento | Namespaces + cgroups | AppArmor + namespaces | Nenhum |
| Runtime compartilhado | Sim | Parcial (core snaps) | Não (cada AppImage é autocontida) |
| Atualização | `flatpak update` (manual) | Automática (forçada) | Manual (baixar novo arquivo) |
| Loja central | Flathub | Snap Store (Canonical) | AppImageHub (não oficial) |
| Depende de daemon | Não (flatpak CLI) | Sim (`snapd`) | Não |
| Servidor de loja | Aberto (qualquer um pode montar) | Fechado (código proprietário) | Não se aplica |

## Snap: o parente próximo com DNA diferente

O Snap e o Flatpak nasceram mais ou menos na mesma época (2014-2016) e resolveram problemas parecidos de formas parecidas — isolamento, atualização, distribuição universal. Mas divergiram em decisões fundamentais.

O Snap roda sobre o **snapd**, um daemon que gerencia instalação, atualização e execução. O `snapd` monta cada snap como um sistema de arquivos squashfs somente leitura via `/dev/loop`. Isso significa que cada snap aparece como um dispositivo de loop no sistema:

```terminal
$ snap list
Name       Version        Rev    Tracking       Publisher   Notes
firefox    130.0-1        4973   latest/stable  mozilla     -
snapd      2.65           23258  latest/stable  canonical   snapd
$ df -h | grep snap
/dev/loop0   250M  250M     0 100% /snap/firefox/4973
/dev/loop1    75M   75M     0 100% /snap/snapd/23258
```

Cada snap ocupa um dispositivo de loop. Num sistema com muitos snaps, `df` e `lsblk` ficam poluídos com dezenas de entradas. O Flatpak, por outro lado, usa OSTree — um sistema de versionamento de arquivos que armazena os binários como objetos num repositório local, sem dispositivos de loop.

A diferença mais controversa diz respeito à **atualização**. O Snap atualiza automaticamente em segundo plano e, por padrão, o usuário não controla *quando* isso acontece. Você pode adiar, mas não desativar completamente. No Steam Deck, onde cada megabyte de download durante uma sessão de jogo consome banda e CPU que poderiam estar servindo ao jogo, isso é problemático.

:::info
O Snap é desenvolvido majoritariamente pela Canonical (empresa por trás do Ubuntu), e a Snap Store é um serviço de código fechado. Isso significa que ninguém, exceto a Canonical, pode montar um repositório de snaps funcional. O Flatpak e o Flathub, em contraste, são completamente abertos — qualquer pessoa ou empresa pode operar um repositório Flatpak com o `flatpak-builder`.
:::

## AppImage: a simplicidade radical

A AppImage leva a filosofia "um aplicativo, um arquivo" ao extremo. Você baixa um arquivo com extensão `.AppImage`, dá permissão de execução com `chmod +x` e roda. Não há instalação, não há dependências externas, não há daemon, não há loja.

```terminal
$ chmod +x Kdenlive-24.08.0-x86_64.AppImage
$ ./Kdenlive-24.08.0-x86_64.AppImage
Kdenlive abrindo...
```

A mágica é simples: a AppImage é um sistema de arquivos empacotado num único binário. Quando você executa, ela monta o conteúdo num diretório temporário em `/tmp`, executa o aplicativo dali e desmonta ao fechar. Tudo autocontido.

Essa simplicidade tem um preço. Cada AppImage carrega suas próprias bibliotecas — então se você tem três aplicativos AppImage que usam Qt, você tem três cópias do Qt no disco. A atualização é um processo manual: você precisa saber que saiu uma versão nova, baixar o arquivo de novo e substituir o antigo. E, crucial para o SteamOS, não há sandbox: a AppImage roda com os mesmos privilégios do seu usuário e enxerga todo o seu `/home`.

:::atencao
A ausência de sandbox na AppImage não é um defeito de projeto — é uma escolha de simplicidade. Mas no SteamOS, onde a Valve quer garantir uma experiência consistente e segura para usuários que não são administradores de sistema, a sandbox é um requisito. Por isso a AppImage não foi considerada para ser a via oficial.
:::

## O que a AppImage faz melhor

Seria injusto descartar a AppImage como inferior. Ela brilha em cenários específicos. Para testar uma versão de desenvolvimento de um aplicativo sem instalá-lo, por exemplo, uma AppImage é imbatível — baixou, rodou, não gostou, apagou. Para software de nicho que não justifica manter um pacote no Flathub, a AppImage é a forma mais barata de distribuir. E para levar um aplicativo num pendrive e rodar em qualquer máquina, a AppImage é a opção mais portátil.

No Steam Deck, você pode — e muitos usuários fazem — rodar AppImages. Nada impede. Basta dar `chmod +x` e executar. Mas a Valve não vai instalar AppImages para você, não vai atualizá-las, e não vai garantir que funcionem no próximo update do SteamOS. O Flatpak ocupa esse espaço de "via oficial" porque atende aos requisitos de isolamento, atualização e integridade que um console portátil exige.

## Por que Flatpak e não Snap no SteamOS

A decisão da Valve pelo Flatpak não foi técnica em primeiro lugar — foi de governança. O Snap depende do `snapd`, que depende do AppArmor (um módulo de segurança do kernel), e a Snap Store é controlada por uma única empresa. Para a Valve, que quer controlar a experiência do SteamOS de ponta a ponta, depender de um serviço de terceiros para distribuir os aplicativos dos usuários seria arriscado.

O Flatpak, por outro lado, não depende de daemon externo, não impõe atualizações automáticas e, principalmente, tem o Flathub como repositório comunitário independente. A Valve pode — e faz — pré-instalar o Flathub como repositório padrão e recomendar aplicativos verificados, sem que o destino da plataforma dependa de decisões alheias.

Além disso, a arquitetura de runtimes do Flatpak se alinha melhor com um sistema imutável: o runtime base é instalado uma vez, os aplicativos são finos, e as atualizações são incrementais via OSTree. O Snap monta cada pacote como squashfs, o que consome mais espaço e dispositivos de loop — recursos escassos num dispositivo embarcado como o Steam Deck.

Podemos ver a diferença de infraestrutura no próprio SteamOS. O Flatpak funciona com uma CLI pura, sem serviços extras rodando em segundo plano:

```terminal
$ flatpak --version
Flatpak 1.15.10
$ systemctl status snapd 2>&1 | head -4
Unit snapd.service could not be found.
$ flatpak list --app | wc -l
14
```

O `flatpak --version` confirma a ferramenta instalada sem daemon, e o `systemctl status snapd` mostra que o serviço do Snap simplesmente não existe no SteamOS — a Valve optou por não incluí-lo. Enquanto isso, o `flatpak list --app` mostra 14 aplicativos instalados e funcionando, todos sustentados apenas pela CLI e pelo OSTree, sem nenhum processo residente consumindo memória ou CPU de forma permanente.

## Resumo

- Flatpak, Snap e AppImage resolvem o mesmo problema com filosofias diferentes: sandbox + runtime, squashfs + daemon, e arquivo autocontido.
- O Snap depende do daemon `snapd` e impõe atualizações automáticas; a Snap Store é de código fechado.
- A AppImage é um arquivo executável único, sem sandbox e sem mecanismo de atualização.
- A Valve escolheu o Flatpak por ser aberto, não depender de daemon externo e se integrar bem com o sistema imutável.
- AppImages funcionam no Steam Deck, mas não são a via oficial — use com consciência da ausência de sandbox.

## Exercícios

1. Se você tiver acesso a um sistema com Snap (Ubuntu, por exemplo), compare `snap list` com `flatpak list` do Steam Deck. Quantos snaps ocupam dispositivos de loop?
2. Baixe uma AppImage pequena (como o `Subsurface` ou o `AppImageUpdate`) no Steam Deck, execute e depois apague. O que mudou no sistema depois de apagar o arquivo?
3. Compare o espaço em disco: instale um aplicativo pequeno via Flatpak e veja quanto espaço ele ocupa (`flatpak info --show-size`). Pesquise quanto a versão Snap do mesmo aplicativo ocuparia.
4. Leia sobre o OSTree e explique em duas frases por que ele permite atualizações Flatpak mais eficientes que o modelo squashfs do Snap.
5. **Desafio.** Monte um raciocínio: se o SteamOS tivesse escolhido Snap como formato oficial, quais três problemas novos surgiriam — um técnico, um de governança e um de experiência do usuário?