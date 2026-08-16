Nas seções anteriores ficou claro que Flatpak e sistema imutável foram feitos um para o outro — mas faltou explicar precisamente *por que* a Valve escolheu esse caminho. Esta seção conecta os pontos: o que significa "imutável" em termos de partição, o que `pacman` faria se pudesse escrever e por que o Flatpak é a única opção que sobrevive a um update sem dores de cabeça.

:::objetivos
- Entender o significado técnico de "sistema imutável" no SteamOS
- Inspecionar a estrutura de partições e verificar o que é somente leitura
- Demonstrar por que `pacman` é incompatível com o modelo de updates do SteamOS
- Explicar como o Flatpak sobrevive aos updates do sistema
- Localizar no disco os diretórios onde o Flatpak armazena seus dados

:::

## O que "imutável" realmente significa

Na frase "SteamOS é imutável", a palavra engana. O sistema não é uma estátua de pedra que nunca muda — ele muda sim, a cada update empurrado pela Valve. O que é imutável é a **partição de sistema sob o ponto de vista do usuário**: você não pode escrever nela.

Isso é implementado em dois níveis. No nível do sistema de arquivos, a raiz (`/`) é do tipo Btrfs e montada com a opção `ro` (read-only). No nível da atualização, o SteamOS usa um esquema A/B: existem duas partições de sistema, e cada update é aplicado na partição que está inativa. Quando você reinicia, o bootloader aponta para a partição recém-atualizada, e a antiga vira o "slot B" de reserva para o próximo update.

```terminal
$ lsblk -o NAME,SIZE,TYPE,MOUNTPOINTS,LABEL | head -12
NAME     SIZE TYPE MOUNTPOINTS                              LABEL
nvme0n1  256G disk
├─nvme0n1p1  64M part /efi                                  efi
├─nvme0n1p2  32M part                                       efi-A
├─nvme0n1p3  32M part                                       efi-B
├─nvme0n1p4   5G part /                                     rootfs-A
├─nvme0n1p5   5G part                                       rootfs-B
├─nvme0n1p6 256M part /var                                  var-A
├─nvme0n1p7 256M part                                       var-B
└─nvme0n1p8  245G part /home                                home
```

Veja o esquema: `rootfs-A` e `rootfs-B` são as duas partições de sistema, cada uma com 5 GB. Só uma está montada em `/`; a outra é o slot inativo. `var-A` e `var-B` seguem o mesmo princípio para os dados variáveis. E o crucial: `/home` não tem "A/B" — é uma partição única, persistente, que sobrevive a todos os updates. Tudo que está em `/home` é seu; tudo que está em `/` e `/var` pertence à Valve e será reescrito.

## O que o pacman faria (se pudesse)

Se o SteamOS não fosse imutável e você rodasse `sudo pacman -S inkscape`, o `pacman` faria o seguinte: baixaria o pacote, extrairia os arquivos e os espalharia em `/usr/bin`, `/usr/lib`, `/usr/share`, `/etc`. Cada um desses diretórios fica na partição de sistema.

Agora imagine o cenário: você instala o Inkscape, edita imagens. Na semana seguinte, a Valve manda um update do SteamOS. O update sobrescreve a partição `rootfs-A` inteira — e lá se foi o Inkscape junto com todas as bibliotecas que o `pacman` copiou. Pior: se alguma biblioteca do sistema foi alterada ou substituída durante a instalação (e o `pacman` pode fazer isso como parte da resolução de dependências), o sistema pode ficar num estado inconsistente que o update da Valve não esperava.

```terminal
$ sudo pacman -Syu
:: Synchronizing package databases...
error: failed to synchronize all databases (unable to lock database)
```

Na verdade, nem chega a esse ponto: a Valve **desabilitou** os repositórios oficiais do Arch no SteamOS. O `pacman` está lá (faz parte da herança do Arch), mas os mirrors estão desativados. Mesmo que você reative os repositórios manualmente, a instalação de qualquer pacote morre com erro de sistema de arquivos somente leitura.

:::perigo
Reativar os repositórios do Arch e forçar uma instalação via `pacman` — por exemplo, remontando a raiz como leitura-escrita com `sudo steamos-readonly disable` — coloca o sistema num estado que a Valve não testou e não suporta. O próximo update pode falhar, deixando o Steam Deck num estado que exige reinstalação via imagem de recuperação. A perda de dados em `/home` é improvável, mas o tempo gasto para restaurar o sistema é real.
:::

## Onde o Flatpak escreve

Agora compare o caminho que um Flatpak percorre. Quando você instala um aplicativo, os arquivos vão para três lugares, todos fora da partição de sistema:

```terminal
$ ls /var/lib/flatpak/
 app/  appstream/  exports/  repo/  runtime/
$ ls ~/.local/share/flatpak/
 app/  db/  exports/  repo/  runtime/
$ ls ~/.var/app/
 org.mozilla.firefox/  org.gimp.GIMP/  org.videolan.VLC/
```

O diretório `/var/lib/flatpak` contém os aplicativos e runtimes instalados no **nível do sistema** (acessíveis a todos os usuários). Ele fica em `/var`, que no SteamOS tem partição própria com esquema A/B — mas, ao contrário da raiz, o conteúdo do Flatpak ali é mantido através das atualizações porque o OSTree do SteamOS preserva os dados de `/var/lib/flatpak` especificamente.

`~/.local/share/flatpak` contém os aplicativos instalados **por usuário** (opção `flatpak install --user`). Esses ficam no `/home`, que nunca é tocado por updates.

E `~/.var/app` é onde cada aplicativo guarda seus **dados**: configurações, cache, downloads. Cada aplicativo tem sua subpasta, e o Flatpak cria essa estrutura automaticamente na primeira execução. Isso é importante: se você precisar resetar um aplicativo para o estado de fábrica, basta apagar a pasta dele em `~/.var/app`.

```terminal
$ ls ~/.var/app/org.mozilla.firefox/
 cache/  config/  data/
$ ls ~/.var/app/org.mozilla.firefox/config/
 pulse/  user-dirs.dirs  user-dirs.locale
```

Aqui vemos a estrutura interna: `cache` para dados efêmeros, `config` para configurações (que o aplicativo enxerga como `~/.config`), e `data` para o equivalente ao `~/.local/share` do aplicativo.

:::dica
Se um aplicativo Flatpak está com comportamento estranho, apagar a pasta dele em `~/.var/app/` equivale a uma reinstalação limpa — você perde as configurações, mas o binário permanece intacto em `/var/lib/flatpak`. É como um "factory reset" por aplicativo, sem reinstalar nada. Para manter backup, copie a subpasta `config/` antes de apagar.
:::

## Updates do sistema vs. updates Flatpak

A separação de responsabilidades entre a Valve e você fica clara quando comparamos o que cada update afeta. O update do SteamOS mexe nas partições `rootfs-*`, atualiza o kernel, os drivers, o modo de jogo, a interface Gaming Mode. Seus aplicativos Flatpak não estão lá — então eles continuam intactos após o update.

Por outro lado, `flatpak update` atualiza apenas os aplicativos e runtimes Flatpak, sem tocar no sistema. São dois mecanismos de atualização independentes que não interferem:

```terminal
$ flatpak update
Looking for updates...
 1. [✓] org.mozilla.firefox                       stable  u 130.0 → 130.0.1
 2. [✓] org.freedesktop.Platform                   24.08  u 24.08.30 → 24.08.34
```

Na saída, `org.mozilla.firefox` é um aplicativo; `org.freedesktop.Platform` é um runtime. Ambos são atualizados pelo `flatpak`, e o kernel e os drivers são atualizados pela Valve. O resultado é que você pode ter o SteamOS mais recente (com os drivers de GPU corrigidos) e, ao mesmo tempo, o Firefox em qualquer versão que a Mozilla distribuir pelo Flathub — sem esperar que a Valve empacote um navegador.

Esse desacoplamento é, em última análise, o motivo da escolha do Flatpak: no SteamOS, a Valve controla o sistema de baixo nível e a experiência de jogo, e você (via Flatpak e Flathub) controla os aplicativos de desktop. Dois mundos que não pisam no pé um do outro.

## Resumo

- A partição raiz do SteamOS é montada como `ro` (read-only); a Valve usa esquema A/B para updates.
- O `pacman` está desativado porque instalaria em `/usr`, que é somente leitura e seria sobrescrito.
- O Flatpak escreve em `/var/lib/flatpak` (nível sistema) e `~/.local/share/flatpak` (usuário), ambos fora da partição raiz.
- Dados de aplicativos Flatpak ficam em `~/.var/app/`, que sobrevive a updates do sistema.
- Updates do sistema (Valve) e updates Flatpak (`flatpak update`) são mecanismos independentes e não interferem.

## Exercícios

1. Verifique a estrutura A/B com `lsblk` e identifique qual partição `rootfs` está montada em `/` e qual está inativa.
2. Confirme que a raiz é somente leitura com `mount | grep ' / '`. Depois tente `touch /usr/teste` e veja a mensagem de erro.
3. Liste o conteúdo de `~/.var/app/` e identifique, para cada aplicativo, o que está armazenado em `cache/`, `config/` e `data/`.
4. Rode `flatpak update` (apenas para verificar, sem confirmar se houver atualizações) e observe se há atualizações de runtime junto com as de aplicativos.
5. **Desafio.** Descreva em poucas frases o que aconteceria se um usuário desativasse a proteção com `sudo steamos-readonly disable`, instalasse um pacote com `pacman` e depois recebesse um update do SteamOS. Qual partição seria sobrescrita? O pacote sobreviveria?