Até aqui falamos do Flatpak como bloco: ele instala aplicativos, isola com sandbox, roda em cima de runtimes. Mas o que exatamente é um runtime e como ele funciona? Por que alguns aplicativos usam `org.freedesktop.Platform` e outros usam `org.kde.Platform`? E o que acontece quando dois aplicativos compartilham o mesmo runtime — ele é instalado duas vezes? Esta seção entra nos detalhes da peça mais engenhosa do modelo Flatpak.

:::objetivos
- Entender o que é um runtime e como ele se diferencia de um SDK
- Listar e inspecionar os runtimes instalados no sistema
- Compreender a cadeia de herança entre runtimes (Freedesktop → GNOME/KDE)
- Identificar como o Flatpak evita duplicação de bibliotecas compartilhadas
- Diagnosticar quando um aplicativo pede uma versão de runtime que você não tem

:::

## Runtimes são sistemas operacionais mínimos

A ideia de um runtime é simples e genial: em vez de cada aplicativo empacotar suas bibliotecas (modelo AppImage) ou depender do sistema (modelo `pacman`), os aplicativos Flatpak dependem de um **runtime** — um conjunto autocontido de bibliotecas, estabilizado e versionado, que simula um "mini sistema operacional" estável.

Um runtime contém, tipicamente, a pilha completa para uma determinada tecnologia: `glibc`, `GTK`, `Qt`, `libstdc++`, bibliotecas de multimídia, drivers gráficos. Tudo que um aplicativo precisa para rodar, menos o kernel. O runtime é mantido pelo projeto Freedesktop e pelas comunidades do GNOME e do KDE, então o desenvolvedor não precisa se preocupar com cada biblioteca individual — ele testa contra o runtime, e pronto.

```terminal
$ flatpak list --runtime
Name                        Application ID                          Version           Branch
Freedesktop Platform        org.freedesktop.Platform                24.08.34          24.08
Mesa                        org.freedesktop.Platform.GL.default     24.3.2            24.08
Mesa (Extra)                org.freedesktop.Platform.GL.default     24.3.2            24.08extra
openh264                   org.freedesktop.Platform.openh264       2.3.1             2.4.1
GNOME Application Platform   org.gnome.Platform                      47.0              47
KDE Application Platform    org.kde.Platform                         6.7               6.7
```

Cada linha é um runtime ou uma extensão de runtime. `Mesa` fornece os drivers OpenGL/Vulkan; `openh264` é o codec de vídeo H.264 que, por questões de patentes, não pode ser redistribuído em alguns países. `GNOME Application Platform` e `KDE Application Platform` são runtimes que herdam do Freedesktop Platform e adicionam as bibliotecas específicas de cada ambiente gráfico.

A coluna `Branch` é a versão: `24.08` indica agosto de 2024; `47` e `6.7` são as versões do GNOME e do KDE respectivamente. Um aplicativo declara qual branch de runtime ele quer, e o Flatpak garante que essa branch esteja disponível antes de rodar.

## A diferença entre runtime e SDK

Ao mexer com documentação de Flatpak, você vai encontrar dois termos: **runtime** e **SDK**. Eles são irmãos, mas com papéis diferentes. O runtime é para *rodar* aplicativos; o SDK é para *compilar*.

```terminal
$ flatpak list --runtime | grep -i sdk
$ flatpak remote-ls flathub --runtime | grep -i sdk | head -5
org.freedesktop.Sdk
org.freedesktop.Sdk.Compat.i386
org.gnome.Sdk
org.kde.Sdk
```

O SDK contém tudo que o runtime contém, mais compiladores (`gcc`), headers, ferramentas de build (`cmake`, `pkg-config`). Se você desenvolve aplicativos Flatpak, usa o SDK para compilar e gera um pacote que depende apenas do runtime (menor). Se você só roda aplicativos, nunca precisa instalar um SDK.

:::info
No SteamOS, o espaço em disco é precioso — especialmente no modelo de 64 GB do Steam Deck. Cada gigabyte conta. Por isso, os SDKs geralmente não são instalados por padrão; eles são grandes e o usuário comum não compila aplicativos no deck. Se você quiser experimentar desenvolvimento, conecte um cartão SD e instale o SDK nele.
:::

## A hierarquia de herança

Os runtimes não são ilhas independentes — eles formam uma cadeia. O `org.freedesktop.Platform` é a base universal. O `org.gnome.Platform` estende o Freedesktop adicionando bibliotecas do GNOME (libadwaita, gtk4, libsoup). O `org.kde.Platform` faz o mesmo para o KDE (Qt, KDE Frameworks). Um aplicativo que declara `org.kde.Platform` recebe automaticamente tanto o runtime do KDE quanto o runtime base do Freedesktop.

Essa herança é importante por um motivo prático: bibliotecas comuns são instaladas uma única vez. Se você tem 15 aplicativos Flatpak — alguns GNOME, alguns KDE, alguns neutros — você não tem 15 cópias da `glibc`. Todos compartilham as bibliotecas do `org.freedesktop.Platform`, que é instalado uma vez só. Os aplicativos KDE compartilham adicionalmente o `org.kde.Platform`, e os GNOME o `org.gnome.Platform`.

```terminal
$ ls /var/lib/flatpak/runtime/
org.freedesktop.Platform/
org.gnome.Platform/
org.kde.Platform/
$ du -sh /var/lib/flatpak/runtime/org.freedesktop.Platform/x86_64/24.08/
1.1G    /var/lib/flatpak/runtime/org.freedesktop.Platform/x86_64/24.08/
$ du -sh /var/lib/flatpak/runtime/org.kde.Platform/x86_64/6.7/
412M    /var/lib/flatpak/runtime/org.kde.Platform/x86_64/6.7/
```

O runtime base ocupa cerca de 1,1 GB. O runtime do KDE adiciona 412 MB — mas repara: esses 412 MB não duplicam o que já está no Freedesktop. O KDE Platform usa *bind mounts* e *symlinks* para apontar para as bibliotecas do Freedesktop Platform sempre que possível.

## Versionamento e upgrades

Runtimes são versionados por branch anual: `24.08`, `23.08`, `22.08`. Essa cadência é deliberada — ela permite que desenvolvedores testem contra uma versão estável por meses, mas também garante que bugs de segurança sejam corrigidos sem quebrar compatibilidade. Dentro de uma branch, as atualizações são apenas de correções; mudanças de API ou ABI só acontecem na branch seguinte.

```terminal
$ flatpak update
Looking for updates...
 1. [✓] org.freedesktop.Platform.GL.default         24.08  u 24.3.0 → 24.3.2
 2. [✓] org.freedesktop.Platform                     24.08  u 24.08.30 → 24.08.34
 3. [✓] org.gnome.Platform                           47      u 47.2 → 47.3
```

O comando `flatpak update` varre todos os runtimes e aplicativos, baixa as versões mais recentes dentro da mesma branch e substitui as anteriores. A atualização é incremental: apenas os deltas são baixados, via OSTree — o sistema de versionamento de arquivos que o Flatpak usa.

:::dica
Runtimes antigos podem se acumular quando você atualiza de uma branch para outra (ex.: de `23.08` para `24.08`). Rode `flatpak uninstall --unused` periodicamente para remover runtimes que nenhum aplicativo está usando. Num Steam Deck de 64 GB, essa limpeza pode liberar vários gigabytes.
:::

## Quando falta o runtime certo

O que acontece quando você tenta instalar um aplicativo que pede uma versão de runtime que você não tem? O Flatpak resolve isso automaticamente — ele baixa o runtime junto com o aplicativo, como dependência. Mas é útil saber diagnosticar essa situação.

```terminal
$ flatpak install flathub com.example.NewApp
Required runtime for com.example.NewApp/x86_64/stable (runtime/org.kde.Platform/x86_64/6.8) is not installed, searching...
Found in remote flathub:
 1. [ ] org.kde.Platform 6.8

Proceed with these changes to the system? [y/N]:
```

O Flatpak detecta que o aplicativo precisa do `org.kde.Platform` versão `6.8`, vê que essa versão não está no sistema, encontra o runtime no Flathub e pergunta se você quer instalar. Ao confirmar, o runtime é baixado, e daí o aplicativo é instalado normalmente.

Essa é outra vantagem do modelo de runtime sobre o `pacman`: o sistema não entra num estado quebrado onde o aplicativo está instalado mas não roda porque falta biblioteca. Ou o runtime está presente e o aplicativo abre, ou o Flatpak se recusa a instalar até que a dependência seja satisfeita — uma decisão que o usuário toma de forma explícita.

## Resumo

- Um runtime é um "mini sistema operacional" com bibliotecas comuns, mantido pelo projeto Freedesktop e pelas comunidades GNOME/KDE.
- O runtime é para rodar aplicativos; o SDK é o runtime mais ferramentas de compilação — você só precisa dele para desenvolver.
- Runtimes formam uma hierarquia: `org.kde.Platform` e `org.gnome.Platform` herdam do `org.freedesktop.Platform`.
- Bibliotecas compartilhadas são instaladas uma única vez, por runtime, e os aplicativos compartilham via bind mounts.
- O Flatpak resolve automaticamente dependências de runtime na instalação e atualiza runtimes dentro da mesma branch de forma incremental.

## Exercícios

1. Liste os runtimes instalados com `flatpak list --runtime` e identifique qual deles ocupa mais espaço. Use `flatpak info` com o ID para ver detalhes.
2. Compare o espaço ocupado por dois runtimes: `du -sh /var/lib/flatpak/runtime/org.freedesktop.Platform` e `du -sh /var/lib/flatpak/runtime/org.gnome.Platform`. Quanto o GNOME adiciona sobre a base?
3. Execute `flatpak uninstall --unused --dry-run` para simular a remoção de runtimes não utilizados (o `--dry-run` não remove nada). Algum runtime apareceria para remoção?
4. Rode `flatpak remote-ls flathub --runtime | grep -i sdk` e compare com `flatpak list --runtime`. Você tem algum SDK instalado? Explique a diferença de propósito.
5. **Desafio.** Instale um aplicativo pequeno qualquer via `flatpak install flathub` e observe, no log de instalação, se algum runtime foi baixado junto. Depois remova o aplicativo com `flatpak uninstall` e veja se o runtime permanece — por que ele não é removido automaticamente?