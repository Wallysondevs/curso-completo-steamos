Manter o software atualizado é tão importante quanto instalá-lo. Atualizações corrigem vulnerabilidades de segurança, bugs e trazem melhorias. No SteamOS, há uma separação fundamental que confunde muita gente: **atualizar seus aplicativos Flatpak é diferente de atualizar o sistema SteamOS**. O Discover cuida dos aplicativos; o sistema operacional tem seu próprio mecanismo, controlado pela Valve.

Entender essa separação evita dois erros clássicos: achar que o Discover está "quebrado" porque não atualiza o sistema, e deixar de aplicar correções de segurança porque esperou a atualização automática que nunca vem.

:::objetivos
- Entender a diferença entre atualizar aplicativos Flatpak e atualizar o sistema SteamOS
- Configurar atualizações automáticas de aplicativos no Discover
- Executar atualizações manuais pelo Discover e pelo terminal
- Usar `flatpak update` e `pkcon get-updates` com discernimento
:::

## Duas camadas de atualização

O SteamOS divide o software em duas camadas com políticas de atualização distintas:

1. **Aplicativos Flatpak** — Firefox, VLC, GIMP e tudo que você instala do Flathub. Atualizados pelo Discover (ou pelo `flatpak update`). O Discover pode configurar atualização automática.

2. **Sistema SteamOS** — a imagem imutável `/usr`, que inclui o KDE Plasma, drivers, o próprio Discover, o Gamescope, o kernel e tudo que a Valve empacota. Atualizado pelo processo de atualização do sistema, geralmente via Modo Jogo ou nas configurações do sistema, **não** pelo Discover.

Essa separação é resultado direto da arquitetura imutável do SteamOS. Como `/usr` é somente-leitura e gerenciada por uma imagem atômica assinada pela Valve, não faz sentido o Discover tentar atualizar pacotes individuais dela. O Discover só mexe no que está no `/var/lib/flatpak` e no `/home/deck`.

:::info
Em distribuições tradicionais como Ubuntu ou Fedora, o Discover também atualiza os pacotes nativos do sistema (via PackageKit). No SteamOS, esse componente existe mas fica inativo para esse propósito, porque não há pacotes nativos atualizáveis pelo usuário no modelo imutável. Por isso, se você vier de outra distro, pode estranhar o Discover mostrando menos opções de atualização.
:::

## Configurando atualizações automáticas

Por padrão, o Discover pode ficar rodando em segundo plano e baixar atualizações de aplicativos Flatpak automaticamente. Para verificar e ajustar:

1. Abra o Discover
2. Vá em Configurações (ícone de engrenagem na barra lateral)
3. Procure a opção "Atualizações de software" ou "Verificação automática de atualizações"
4. Escolha a frequência: desativada, diária, semanal ou mensal
5. Opcionalmente, ative "Atualizar automaticamente" para que os aplicativos sejam atualizados sem confirmação

No Steam Deck, essa configuração controla especificamente os Flatpaks. Se você deixar desativada, os aplicativos nunca serão atualizados automaticamente — você terá que abrir o Discover ou rodar `flatpak update` manualmente.

O mesmo comportamento pode ser verificado no terminal, observando se há algum timer systemd para o flatpak:

```terminal
$ systemctl --user list-timers 2>/dev/null | grep -i flatpak
```

Se nenhum timer aparecer, as atualizações automáticas não estão agendadas no seu usuário. No SteamOS, o Discover gerencia isso de forma própria, não via timer systemd, então a ausência de timers não é garantia de nada — é apenas uma pista.

## Atualização manual pelo Discover

Quando há atualizações disponíveis, o Discover mostra um contador na barra lateral, ao lado de "Atualizações". O fluxo manual é:

1. Clique em "Atualizações" na barra lateral
2. Veja a lista de aplicativos com novas versões
3. Clique em "Atualizar tudo" (ou atualize individualmente)

Cada item da lista mostra o aplicativo, a versão atual e a versão nova, junto com o tamanho do download.

O Discover também pode exibir notificações no system tray quando atualizações estão disponíveis, informando quantos aplicativos têm versões novas. Clicar na notificação abre o Discover já na aba de atualizações.

## Atualização pelo terminal

O equivalente no terminal:

```terminal
$ flatpak update
Procurando por atualizações...

        ID                               Ramo     Op   Remote    Download
 1. [✓] org.mozilla.firefox              stable   u    flathub   < 74.5 MB
 2. [✓] org.freedesktop.Platform.GL.default 24.08 u    flathub   < 11.2 MB

Alterações: 2 aplicações serão atualizadas.
Prosseguir? [S/n]: s
```

A letra `u` na coluna `Op` significa *update*. O `flatpak update` atualiza todos os aplicativos e runtimes instalados. Para atualizar apenas um:

```terminal
$ flatpak update org.mozilla.firefox
```

Se você quiser apenas ver o que seria atualizado sem aplicar:

```terminal
$ flatpak update --no-deploy --assumeyes 2>&1 | head -20
```

O `--no-deploy` baixa os metadados mas não aplica a atualização. É útil para uma pré-visualização.

## O que o `pkcon` mostra no SteamOS

O comando `pkcon` (interface de linha de comando do PackageKit) é o que o Discover usa internamente para se comunicar com o backend PackageKit. Você pode usá-lo para inspecionar o estado do sistema:

```terminal
$ pkcon get-updates
Getting updates               [=========================]         
Concluído
There are no updates available at this time.
```

No SteamOS, o `pkcon get-updates` tipicamente retorna "não há atualizações" — porque, como vimos, os pacotes nativos atualizáveis pelo PackageKit não existem no modelo imutável. Isso **não** significa que seu sistema está desatualizado; significa apenas que esta camada específica não tem trabalho a fazer.

Para forçar o PackageKit a reindexar o catálogo:

```terminal
$ pkcon refresh force
Refreshing cache              [=========================]         
Concluído
```

Isso é útil quando você suspeita que o catálogo mostrado pelo Discover está desatualizado e quer forçar uma nova consulta aos repositórios.

:::atencao
Não confunda `pkcon get-updates` com `flatpak update`. O primeiro fala com o backend PackageKit (que no SteamOS não tem aplicativos nativos para atualizar); o segundo fala diretamente com o Flatpak e é quem realmente atualiza seus aplicativos. Ver "nenhuma atualização" no `pkcon` enquanto o `flatpak update` mostra dezenas de atualizações é perfeitamente normal.
:::

## Resumo

- No SteamOS, aplicativos Flatpak e sistema SteamOS são atualizados por mecanismos separados; o Discover cuida dos Flatpaks.
- A atualização automática de aplicativos pode ser configurada nas Configurações do Discover.
- `flatpak update` atualiza todos os aplicativos e runtimes; `flatpak update <id>` atualiza apenas um.
- `pkcon get-updates` no SteamOS normalmente retorna "sem atualizações" porque não há pacotes nativos atualizáveis no modelo imutável.
- `pkcon refresh force` reindexa o catálogo do PackageKit quando o Discover parece desatualizado.

## Exercícios

1. Verifique a configuração de atualizações automáticas do Discover. Ela está ativada? Com que frequência? Anote o valor atual.
2. Execute `flatpak update` e observe a saída. Há atualizações disponíveis? Se sim, quantas e de quais aplicativos?
3. Execute `pkcon get-updates` e `pkcon refresh force`. Compare as saídas com `flatpak update`. Como você explicaria a diferença para alguém acostumado com Ubuntu?
4. Atualize apenas um aplicativo que tenha versão nova, usando `flatpak update <id>`. Verifique depois, no Discover, se ele não aparece mais na lista de atualizações pendentes.
5. **Desafio.** Desative temporariamente as atualizações automáticas no Discover, aguarde (ou force) uma nova verificação e observe se algum aplicativo acumula uma atualização pendente. Depois, reative e compare o comportamento. Escreva uma nota sobre quando vale a pena ter atualização automática ligada versus manual.