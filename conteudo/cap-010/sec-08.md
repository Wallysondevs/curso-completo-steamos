Gamescope não é um monolito — ele é construído sobre wlroots, a biblioteca modular que fornece backends Wayland, gerenciamento de DRM e renderização. Essa arquitetura permite que o Gamescope funcione com qualquer GPU suportada pelo kernel Linux, mas também introduz camadas de abstração que, quando mal compreendidas, levam a diagnósticos errados. Entender a integração entre Gamescope, wlroots, Vulkan e o driver RADV é fundamental para depurar problemas que vão além das flags do compositor.

:::objetivos
- Entender a arquitetura interna do Gamescope: wlroots, renderer Vulkan e backend DRM
- Rastrear quais bibliotecas estão em uso via `/proc/<pid>/maps`
- Diferenciar o papel do RADV (driver Vulkan) do papel do Gamescope (compositor)
- Ler e interpretar os logs do Gamescope no journalctl
- Diagnosticar falhas de inicialização relacionadas a DRM e Vulkan
:::

## A pilha de baixo para cima

No fundo da pilha está o kernel AMDGPU, o driver open-source da AMD para GPUs Radeon. Ele expõe três interfaces para userspace: DRM (Direct Rendering Manager) para modos de vídeo e buffers, KMS (Kernel Mode Setting) para configuração de conectores, e a API Vulkan via `/dev/dri/renderD*`.

Uma camada acima está o RADV, o driver Vulkan open-source do projeto Mesa. Ele traduz chamadas Vulkan em comandos de hardware para a GPU AMD. O Gamescope não fala com o hardware diretamente — ele usa Vulkan via RADV para toda a renderização, incluindo composição, FSR e tone mapping HDR.

No topo da pilha de bibliotecas está o wlroots, que fornece abstrações para Wayland: gerenciamento de superfícies, dispositivos de entrada, backends (DRM, headless, Wayland nested) e alocação de buffers via GBM (Generic Buffer Management). O Gamescope importa o wlroots e implementa um compositor enxuto sobre ele.

```terminal
$ sudo cat /proc/$(pgrep gamescope)/maps | grep -E 'libwlroots|libvulkan|libdrm|radv' | head -10
7f8a40000000-7f8a41000000 r-xp 00000000 103:02 1234567  /usr/lib/x86_64-linux-gnu/libvulkan.so.1
7f8a42000000-7f8a43000000 r-xp 00000000 103:02 1234568  /usr/lib/x86_64-linux-gnu/libdrm.so.2
7f8a44000000-7f8a45000000 r-xp 00000000 103:02 1234569  /usr/lib/x86_64-linux-gnu/libdrm_amdgpu.so.1
7f8a52000000-7f8a54000000 r-xp 00000000 103:02 1234577  /usr/lib/x86_64-linux-gnu/libwlroots.so.15
7f8a55000000-7f8a56000000 r-xp 00000000 103:02 1234578  /usr/lib/x86_64-linux-gnu/libvulkan_radeon.so
```

O mapeamento revela a cadeia completa: `libwlroots.so.15` (abstração Wayland), `libvulkan.so.1` (loader Vulkan), `libvulkan_radeon.so` (RADV, o driver Vulkan da AMD) e `libdrm_amdgpu.so` (acesso ao kernel via DRM). Se qualquer um desses arquivos estiver faltando ou em versão incompatível, o Gamescope não sobe.

## O que o journalctl conta sobre a inicialização

Quando o Gamescope não inicia — tela preta, volta para o SDDM, ou mensagem de erro genérica — o primeiro lugar para investigar é o journal do systemd:

```terminal
$ journalctl -b | grep gamescope | head -30
Nov 14 11:30:40 steamdeck gamescope[1432]: wlserver: [backend/drm/backend.c:202] DRM universal planes: primary, cursor, overlay_0, overlay_1
Nov 14 11:30:40 steamdeck gamescope[1432]: wlserver: [backend/drm/drm.c:86] connector eDP-1: 1280x800@60Hz
Nov 14 11:30:40 steamdeck gamescope[1432]: wlserver: [backend/drm/drm.c:107] connector eDP-1: VRR enabled (range: 40-60 Hz)
Nov 14 11:30:40 steamdeck gamescope[1432]: wlserver: [render/vulkan/vulkan.c:340] Using Vulkan device: AMD Radeon Graphics (RADV VANGOGH)
Nov 14 11:30:40 steamdeck gamescope[1432]: wlserver: [render/vulkan/vulkan.c:350] Vulkan driver version: 24.2.0
Nov 14 11:30:40 steamdeck gamescope[1432]: wlserver: HDR output enabled (PQ, rec.2020)
```

Esse log de inicialização bem-sucedida conta uma história completa: DRM detectou os planos de hardware, o conector eDP-1 foi configurado com VRR, o renderer Vulkan encontrou a GPU Van Gogh com RADV 24.2.0, e HDR foi ativado. Quando algo falha, a diferença aparece imediatamente:

```terminal
$ journalctl -b | grep gamescope | grep -i -E 'error|fail|unable'
Nov 14 11:30:40 steamdeck gamescope[1432]: wlserver: [backend/drm/drm.c:300] Failed to find CRTC for connector eDP-1: No such file or directory
```

Essa mensagem indica que o DRM não conseguiu associar um CRTC ao conector — tipicamente porque outro processo (como o KWin) já está controlando o DRM, ou porque a GPU não está pronta. A solução é garantir que nenhum compositor esteja ativo antes de lançar o Gamescope.

:::dica
Para filtrar os logs do Gamescope do boot atual, use `journalctl -b | grep gamescope`. Para filtrar os logs de uma unidade systemd específica (se o Gamescope estiver sendo gerenciado por um serviço), use `journalctl -u gamescope-session -b`. Para acompanhar em tempo real durante a depuração: `journalctl -f | grep gamescope`.
:::

## Quando o Vulkan não coopera

O Gamescope depende de Vulkan para renderização. Se o driver RADV não estiver disponível ou estiver desatualizado, o Gamescope falha com mensagens que mencionam `vkCreateDevice` ou `VK_ERROR_INITIALIZATION_FAILED`:

```terminal
$ gamescope -w 1280 -h 800 -- vkcube
wlserver: [render/vulkan/vulkan.c:320] vkEnumeratePhysicalDevices returned 0 devices
wlserver: [render/vulkan/vulkan.c:322] No Vulkan-capable GPU found!
Failed to initialize renderer.
```

Essa falha pode ter várias causas: o pacote `mesa-vulkan-drivers` não está instalado, o usuário `deck` não pertence ao grupo `render`, ou o driver RADV está em blacklist. A verificação rápida:

```terminal
$ ls -l /dev/dri/renderD*
crw-rw----+ 1 root render 226, 128 Nov 14 11:20 /dev/dri/renderD128
$ groups deck
deck : deck users lp wheel render input audio video
$ vulkaninfo --summary 2>&1 | head -5
==========
VULKANINFO
==========
Vulkan Instance Version: 1.3.290
```

O dispositivo `/dev/dri/renderD128` existe com grupo `render`, o usuário `deck` pertence ao grupo `render`, e `vulkaninfo` lista os dispositivos Vulkan. Se qualquer um desses três falhar, o Gamescope não vai conseguir criar o renderer Vulkan.

:::atencao
Em alguns sistemas, o grupo `render` pode não existir — a permissão para `/dev/dri/renderD*` pode ser via `video` ou um grupo diferente. Verifique com `stat /dev/dri/renderD128` e adicione o usuário ao grupo correspondente com `sudo usermod -aG <grupo> deck`. Lembre-se de reiniciar a sessão após a mudança de grupo.
:::

## wlroots e as versões que quebram compatibilidade

O wlroots segue um modelo de versionamento semântico rigoroso: cada versão maior quebra compatibilidade de API, e o Gamescope é vinculado a uma versão específica. No SteamOS 3.6, o Gamescope compila contra wlroots 0.17.x. Se uma atualização do sistema trouxer wlroots 0.18.x sem recompilar o Gamescope, a sessão gráfica quebra.

```terminal
$ ldd /usr/bin/gamescope | grep wlroots
        libwlroots.so.15 => /usr/lib/x86_64-linux-gnu/libwlroots.so.15 (0x00007f8a52000000)
```

O `ldd` mostra a versão exata da biblioteca vinculada. O número `15` em `libwlroots.so.15` é a versão da ABI (Application Binary Interface), não a versão do projeto. wlroots 0.17.x expõe `libwlroots.so.15`; wlroots 0.18.x exporia `libwlroots.so.16`. Se o `ldd` mostrar `not found` para `libwlroots.so.15`, a versão instalada não corresponde à esperada.

## Resumo

- A pilha do Gamescope é: kernel AMDGPU → RADV/Vulkan → wlroots → Gamescope. Cada camada tem responsabilidades bem definidas.
- `/proc/<pid>/maps` revela todas as bibliotecas mapeadas pelo processo Gamescope, da Vulkan ao DRM.
- `journalctl -b | grep gamescope` é o primeiro passo para diagnosticar falhas de inicialização; as mensagens contam a história completa.
- Falhas Vulkan (`vkEnumeratePhysicalDevices returned 0`) geralmente são permissão do grupo `render` ou driver desinstalado.
- `ldd /usr/bin/gamescope | grep wlroots` confirma a versão da ABI; se der `not found`, a versão do wlroots é incompatível com o Gamescope instalado.

## Exercícios

1. Execute `sudo cat /proc/$(pgrep gamescope)/maps | grep -oP '/usr/lib/[^ ]+' | sort -u | head -20`. Quantas bibliotecas únicas o Gamescope está usando?
2. Inspecione a inicialização do Gamescope: `journalctl -b | grep gamescope`. Identifique a versão do driver Vulkan, o conector usado e se HDR está ativo.
3. Verifique as permissões do dispositivo de renderização com `ls -l /dev/dri/renderD*` e `groups`. Seu usuário está no grupo correto?
4. Execute `ldd /usr/bin/gamescope | grep -E 'not found|libwlroots|libvulkan'`. Há bibliotecas faltando? Qual versão da ABI do wlroots está em uso?
5. **Desafio.** Provoque uma falha de inicialização do Gamescope (modo nested) removendo temporariamente o acesso ao dispositivo de renderização: `chmod 000 /dev/dri/renderD128`. Lance o Gamescope e capture a mensagem de erro. Restaure as permissões com `chmod 660 /dev/dri/renderD128`. O que o log revela sobre a sequência de inicialização que falha?