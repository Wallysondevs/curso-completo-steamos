Além de arquivos e soquetes, os Flatpaks podem declarar acesso a **dispositivos físicos e subsistemas de hardware**. GPU, câmera, impressora, entrada (`evdev`), controladores e até o kernel — cada um desses recursos aparece como um token na seção `devices=` dos metadados. Essas permissões estão entre as menos compreendidas e, por isso mesmo, entre as mais perigosas quando concedidas sem critério.

No Steam Deck, onde o hardware é fixo e conhecido (a APU AMD, a tela, o giroscópio, os controles), auditar permissões de dispositivo ajuda a responder uma pergunta simples: este app realmente precisa falar diretamente com o hardware?

:::objetivos
- Listar os tokens de dispositivo (`dri`, `all`, `kvm`, `input`, `usb`) e o que cada um expõe
- Interpretar a seção `devices=` do `flatpak override --show`
- Avaliar quando negar um dispositivo é seguro e quando quebra o app
- Entender o papel específico dos dispositivos de entrada no Steam Deck
:::

## O vocabulário de dispositivos

A seção `devices=` aceita um conjunto pequeno mas potente de tokens:

| Token | O que expõe |
|---|---|
| `dri` | Acesso direto à GPU via Direct Rendering Infrastructure (necessário para aceleração 3D) |
| `all` | Acesso a **todos** os dispositivos do sistema (equivalente a `--device=all`) |
| `kvm` | Virtualização via KVM (máquinas virtuais, QEMU) |
| `input` | Dispositivos de entrada brutos (`/dev/input/event*`) |
| `shm` | Memória compartilhada POSIX (`/dev/shm`) |
| `/dev/algumacoisa` | Um arquivo de dispositivo literal |

O token `dri` é o mais comum — quase todo app gráfico moderno precisa dele para usar a GPU. Sem `dri`, o app roda com renderização por software (llvmpipe), o que é lento e drena bateria. Negar `dri` raramente é a decisão certa.

O verdadeiro sinal de alerta é `all`. Ele equivale a "este app enxerga e pode interagir com qualquer dispositivo do sistema." Na prática, significa câmera, microfone, entrada, acelerômetro, giroscópio, TPM, e o que mais estiver conectado. É raríssimo um app justificar `devices=all`.

```terminal
$ flatpak override --show org.some.App | grep devices
devices=dri;all;
```

Se você vir essa linha, o app está pedindo a GPU **e** o resto do mundo. Grave isso como suspeito e investigue.

## DRI: o essencial que quase todo app pede

DRI é o subsistema que dá ao espaço de usuário acesso direto ao hardware gráfico. Todo Flatpak que renderiza com aceleração de hardware — navegadores, editores de imagem, jogos, emuladores — precisa de `dri`. Sem isso, o app não consegue alocar buffers na GPU, e o compositor ou o Mesa caem para software rendering.

No SteamOS, com a APU AMD e o driver Mesa RADV para Vulkan, a situação é previsível:

```terminal
$ flatpak override --show org.mozilla.firefox | grep devices
devices=dri;
```

O Firefox pede só `dri` e nada mais. Isso é limpo. O navegador renderiza com aceleração via GPU, mas não fala com o microfone, câmera ou entrada de forma bruta — o acesso a esses recursos passa por portais, não por dispositivos.

:::info
O SteamOS usa o driver Mesa RADV (Vulkan) e radeonsi (OpenGL) para a APU AMD Van Gogh/Aerith. O `dri` no Flatpak mapeia para os nós de renderização `/dev/dri/renderD128` dentro do sandbox, sem dar acesso ao nó de controle (`/dev/dri/card0`), que permitiria modos de vídeo e outras operações privilegiadas.
:::

## Dispositivos de entrada e o Steam Deck

O token `input` expõe os arquivos `/dev/input/event*`, que são a interface bruta de dispositivos de entrada: teclado, mouse, touchpad, giroscópio, controles do Deck. Um app com `input` pode ler cada evento diretamente, sem passar pelo compositor ou pelo libinput.

Você pode ver os dispositivos de entrada exatamente como o kernel os expõe:

```terminal
$ ls -la /dev/input/
drwxr-xr-x  2 root root     360 mar 12 09:14 .
drwxr-xr-x 19 root root    4360 mar 12 09:14 ..
crw-rw----  1 root input 13, 64 mar 12 09:14 event0
crw-rw----  1 root input 13, 65 mar 12 09:14 event1
crw-rw----  1 root input 13, 66 mar 12 09:14 event2
crw-rw----  1 root input 13, 67 mar 12 09:14 event3
crw-rw----  1 root input 13, 68 mar 12 09:14 event4
$ cat /proc/bus/input/devices | grep -E 'Name=|Handlers='
N: Name="AT Translated Set 2 keyboard"
H: Handlers=sysrq kbd event0
N: Name="FTS3528:00 2808:1015"
H: Handlers=event1 mouse0
```

Cada arquivo `event*` é um fluxo bruto de eventos. O token `input` no Flatpak dá acesso de leitura a todos eles dentro do sandbox — e é exatamente por isso que um app com `input` pode, em tese, registrar cada tecla digitada em qualquer janela, porque os eventos de teclado são globais e o `/dev/input/event*` entrega tudo.

Para um emulador ou um utilitário de mapeamento de controle, `input` faz sentido: ele precisa dos eventos brutos para remapear botões. Para um editor de texto, não. Auditar isso no Flatseal é rápido: vá em **Devices**, procure o toggle `Input devices` e desligue-o para apps que não são emuladores, utilitários de controle ou launchers de jogos. Teste o app em seguida.

## Compartilhamento de IPC e memória

O token `shm` aparece menos, mas merece menção. Ele expõe `/dev/shm`, a área de memória compartilhada POSIX. Muitos apps usam memória compartilhada para comunicação entre processos, inclusive para trocar buffers com o compositor. Negar `shm` costuma quebrar coisas — mantenha ligado, a menos que você tenha um motivo específico.

O Flatseal exibe `shm` como "Shared memory" na seção Devices. Se estiver herdado (o caso mais comum), deixe como está.

## O fluxo de endurecimento de dispositivos

A receita para a seção Devices:

1. Leia `devices=` com `flatpak override --show <id>`.
2. Se houver `all`, sinal vermelho. Negue com `--nodevice=all` e veja se o app ainda funciona.
3. Mantenha `dri` ligado para apps gráficos — é necessário.
4. Mantenha `shm` ligado — é quase sempre necessário.
5. Desligue `input` a menos que o app seja explicitamente um remapeador, emulador ou utilitário de controle.
6. Desligue `kvm` a menos que o app rode máquinas virtuais (Boxes, QEMU frontend).

No Flatseal, cada token vira um toggle. A seção Devices é a mais curta de auditar porque a maioria dos apps pede apenas `dri` e `shm`. São os que pedem além disso que merecem seu tempo.

:::atencao
Negar `dri` em um app gráfico faz com que ele desabe em software rendering. A bateria do Steam Deck derrete e a performance despenca. Só negue `dri` se você estiver depurando um problema gráfico ou testando comportamento — nunca como política de endurecimento.
:::

## Resumo

- `devices=` controla acesso a GPU (`dri`), entrada (`input`), virtualização (`kvm`), memória compartilhada (`shm`) e todos os dispositivos (`all`).
- `dri` é essencial para aceleração gráfica; negar derruba para software rendering.
- `all` é o token mais perigoso: expõe todo dispositivo do sistema. Raramente justificado.
- `input` dá acesso bruto a teclado, mouse e controles do Deck; só faz sentido para emuladores e remapeadores.
- O Flatseal exibe cada token como um toggle na seção Devices.
- Auditar devices costuma ser rápido: a maioria dos apps pede só `dri` e `shm`.

## Exercícios

1. Rode `flatpak override --show <id>` para cinco apps e liste todos os tokens `devices=` encontrados. Quantos pedem mais do que `dri` e `shm`?
2. Encontre um app com `input` na sua lista (se não houver, instale um emulador como `org.libretro.RetroArch` e verifique). Ele realmente precisa de acesso bruto a dispositivos de entrada?
3. Negue `all` de um app com `flatpak override --user --nodevice=all <id>` e teste se o app funciona.
4. No Flatseal, audite a seção Devices de três apps e tome uma decisão para cada toggle: manter ligado, desligar ou deixar herdado.
5. **Desafio.** Rode `ls -la /dev/input/` no Steam Deck e identifique os arquivos `event*`. Relacione cada um ao hardware do Deck (controles, touchpads, giroscópio, botões de volume). Depois, explique por que um app com `input` poderia ler teclas digitadas em outro app através desses arquivos.