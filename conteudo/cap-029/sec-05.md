Você encontrou o aplicativo, leu a descrição, conferiu as permissões. Agora é a etapa mais curta de todo o processo: instalar. No Discover, são literalmente dois cliques — um no botão "Instalar" e outro na confirmação. Mas por trás desses dois cliques, uma cadeia complexa de operações acontece: download do aplicativo e de seus runtimes, verificação de assinaturas, configuração do sandbox e integração com o desktop.

Entender o que acontece durante a instalação ajuda a diagnosticar falhas e a reconhecer quando o processo travou por um motivo banal (como rede instável) ou por algo mais sério (como conflito de runtimes).

:::objetivos
- Realizar uma instalação completa pelo Discover e acompanhar o progresso
- Executar o mesmo processo pelo terminal com `flatpak install`
- Interpretar as etapas da instalação: download, verificação, sandbox
- Diagnosticar falhas comuns de instalação e seus sintomas
:::

## Instalando pelo Discover

O fluxo no Discover é simples:

1. Abra o Discover e busque o aplicativo desejado
2. Clique no resultado para abrir a página de detalhes
3. Clique no botão **Instalar** (canto superior direito)
4. Aguarde a barra de progresso preencher
5. Pronto — o botão muda para "Abrir" ou "Remover"

Durante a instalação, uma barra de progresso aparece no canto inferior do Discover. Se você clicar nela, verá detalhes: quantos MB já foram baixados, velocidade da transferência e qual arquivo está sendo obtido no momento. Em conexões lentas, essa barra é sua melhor amiga — ela confirma que a instalação não travou, só está lenta.

Se o aplicativo depender de um runtime que você ainda não tem (como `org.kde.Platform` ou `org.freedesktop.Platform`), o Discover baixa o runtime primeiro e só depois o aplicativo. Isso pode fazer uma instalação de 50 MB demorar o tempo de um download de 600 MB, porque o runtime ocupa mais espaço. O Discover deixa isso claro mostrando "Baixando dependências..." antes de "Instalando aplicativo...".

## Instalando pelo terminal

O equivalente no terminal é o comando `flatpak install`. Ele é mais verboso, mas mostra exatamente o que está acontecendo:

```terminal
$ flatpak install flathub org.videolan.VLC

Procurando por correspondências...
org.videolan.VLC

O remote flathub contém o seguinte:
  org.videolan.VLC/x86_64/stable

Quer instalá-lo? [S/n]: s

org.videolan.VLC permissions:
    ipc                  network               pulseaudio
    wayland              x11                   devices
    devel                multi-app             file access [1]
    dbus access [2]

    [1] host, xdg-config/kdeglobals:ro, xdg-run/gvfsd:create
    [2] org.freedesktop.UDisks2, org.kde.kded*, org.kde.kio*, ...

        ID                               Ramo           Op   Remote    Download
 1. [✓] org.videolan.VLC.Locale          stable         i    flathub   < 3.3 MB
 2. [✓] org.videolan.VLC                 stable         i    flathub   < 43.2 MB

Instalação concluída.
```

A saída mostra um resumo de permissões (mais completo que o Discover) e depois uma tabela com cada componente sendo baixado. Os checkmarks `[✓]` vão aparecendo conforme cada parte é obtida e verificada.

Se você quiser ver ainda mais detalhes:

```terminal
$ flatpak install --verbose flathub org.videolan.VLC 2>&1 | head -40
F: flatpak_dir_push_remote_refs: Pushing refs for flathub
F: flatpak_dir_pull: Pulling app/org.videolan.VLC/x86_64/stable from flathub
F: flatpak_dir_pull: Using commit metadata: [a3f2c1...]
F: flatpak_dir_pull: Pulled 11/11 objects
...
```

O modo verboso expõe as operações OSTree internas. Não é algo que você precise no dia a dia, mas é inestimável quando uma instalação falha e você precisa de uma pista sobre o motivo.

## O que acontece durante a instalação

Por trás da interface, a instalação de um Flatpak segue estas etapas:

1. **Resolução** — o Flatpak consulta o índice do remote e encontra o ref (referência) exato do aplicativo. Se houver mais de um remote com o mesmo app, ele pergunta qual usar.

2. **Download dos metadados** — o Flatpak baixa o commit do aplicativo e do runtime necessário (se ainda não estiver instalado). Cada commit é um conjunto de objetos OSTree com checksums SHA-256.

3. **Verificação de assinatura** — a assinatura GPG do remote é verificada contra a chave pública configurada. Se a verificação falhar, a instalação é abortada.

4. **Checkout OSTree** — os objetos são extraídos e montados no diretório do Flatpak em `/var/lib/flatpak/app/<id>/`. O OSTree usa hardlinks, então aplicativos que compartilham runtimes não duplicam arquivos em disco.

5. **Configuração do sandbox** — permissões declaradas nos metadados do Flatpak são aplicadas. O bubblewrap (`bwrap`) é configurado com os binds de sistema de arquivos e namespaces apropriados.

6. **Integração com o desktop** — arquivos `.desktop` e ícones são exportados para `~/.local/share/applications/` e `~/.local/share/icons/`, respectivamente. É por isso que o aplicativo aparece no menu imediatamente após a instalação.

:::dica
Se você clicar em "Instalar" e o Discover parecer travado, abra o terminal e execute `flatpak install flathub <id>` com `--verbose`. O terminal mostra qual etapa está em andamento, o que ajuda a identificar se o problema é rede, espaço em disco ou conflito de dependências.
:::

## Diagnosticando falhas de instalação

Falhas de instalação no Discover são frustrantes porque a interface muitas vezes mostra apenas uma mensagem genérica: "Falha ao instalar". O terminal oferece mais pistas.

**Sintoma: "Connection refused" ou timeout**

```terminal
$ flatpak install flathub org.videolan.VLC
error: Unable to load summary from remote flathub: While fetching https://dl.flathub.org/repo/summary: Could not connect: Connection refused
```

Causa: rede offline, proxy mal configurado, ou o Flathub está temporariamente indisponível.

**Sintoma: "Out of disk space"**

```terminal
$ flatpak install flathub org.videolan.VLC
error: While pulling app/org.videolan.VLC/x86_64/stable from remote flathub: Writing content object: No space left on device
```

Causa: o diretório `/var/lib/flatpak/` (ou `/home/`) está sem espaço. Verifique com `df -h /var/lib/flatpak`.

**Sintoma: conflito de runtime**

```terminal
$ flatpak install flathub some.app
error: The Application some.app requires the runtime org.kde.Platform/x86_64/6.7 which is not installed
```

Causa: o runtime necessário não está disponível em nenhum remote configurado. Adicione o remote do runtime ou instale-o manualmente.

:::atencao
No Steam Deck, o espaço em disco é particularmente valioso. Flatpaks podem ocupar bastante: um aplicativo "leve" com 50 MB pode puxar um runtime de 600 MB. Antes de instalar vários aplicativos grandes, verifique o espaço livre com `df -h /home` e `flatpak list --columns=name,size`.
:::

## Resumo

- A instalação pelo Discover são dois cliques: Instalar → Confirmar; uma barra de progresso mostra o andamento.
- No terminal, `flatpak install flathub <id>` é mais verboso e mostra permissões e etapas detalhadas.
- A instalação Flatpak envolve seis etapas: resolução, download, verificação GPG, checkout OSTree, configuração do sandbox e integração desktop.
- Falhas comuns incluem erros de rede, falta de espaço em disco e conflitos de runtime.
- `flatpak install --verbose` é a ferramenta de diagnóstico para qualquer falha misteriosa.

## Exercícios

1. Escolha um aplicativo pequeno (ex.: `org.gnome.Calculator`) e instale-o pelo Discover. Cronometre o tempo e anote as etapas visíveis na barra de progresso.
2. Remova o aplicativo instalado no exercício 1 com `flatpak uninstall org.gnome.Calculator`. Depois, reinstale-o pelo terminal com `flatpak install flathub org.gnome.Calculator`. Compare os tempos e as informações exibidas.
3. Execute `flatpak install --dry-run flathub org.libreoffice.LibreOffice`. O `--dry-run` simula a instalação sem baixar nada. Quanto espaço em disco a instalação ocuparia?
4. Instale um aplicativo pelo Discover e, durante o download, monitore o uso de rede com `nethogs` ou `iftop` (se disponíveis) para observar quais servidores do Flathub estão sendo acessados.
5. **Desafio.** Force uma falha de instalação: desconecte a rede, tente instalar um aplicativo no Discover e depois no terminal. As mensagens de erro são iguais? Qual ferramenta oferece informação mais útil para diagnosticar o problema? Reconecte a rede e instale o aplicativo normalmente.