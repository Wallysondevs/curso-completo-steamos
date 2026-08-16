Instalar um mod por vez é viável para quem usa meia dúzia de modificações. O problema aparece quando você quer gerenciar 80, 150 ou 300 mods com interdependências, ordens de carregamento e conflitos de arquivos. É aí que entram os mod managers — e no Steam Deck, o cenário é surpreendentemente favorável.

:::objetivos
- Instalar e executar mod managers Windows dentro do prefixo Wine
- Configurar o Nexus Mods App (substituto do Vortex) no Steam Deck
- Gerenciar perfis de mods com o MO2 (Mod Organizer 2) via Proton
- Resolver conflitos de arquivos entre mods concorrentes
- Entender as limitações de symlinks e VFS dentro do prefixo Wine
:::

## Por que usar um mod manager

Mods raramente são ilhas. O mod B depende do mod A; o mod C entra em conflito com o mod B porque ambos alteram a mesma textura; o mod D precisa carregar depois do C, mas antes do E. Um mod manager resolve essas três dores:

1. **Resolução de dependências**: se o mod B exige o mod A, o manager avisa e impede a ordem errada.
2. **Resolução de conflitos**: quando dois mods mexem no mesmo arquivo, o manager pergunta qual prevalece.
3. **Perfis**: você mantém um perfil "leve" com 20 mods e outro "total conversion" com 200, sem precisar reinstalar nada.

No Windows, ferramentas como Vortex, Mod Organizer 2 e o novo Nexus Mods App dominam. No Deck, as três funcionam — com graus diferentes de esforço.

## Nexus Mods App: o caminho mais curto

O Nexus Mods App é o substituto moderno do Vortex, com suporte nativo a Linux. Ele está disponível como AppImage e pode ser instalado direto no Deck sem depender do prefixo Wine:

```terminal
$ cd ~/Applications
$ wget https://github.com/Nexus-Mods/NexusMods.App/releases/latest/download/NexusMods.App-x86_64.AppImage
$ chmod +x NexusMods.App-x86_64.AppImage
$ ./NexusMods.App-x86_64.AppImage
```

Na primeira execução, o app detecta automaticamente os jogos instalados via Steam. Ele vasculha `~/.steam/steam/steamapps/common/` e também os prefixos em `compatdata`. O diferencial é que ele entende o *loadout*: você seleciona os mods no catálogo, o app baixa e instala no lugar certo.

```terminal
$ ./NexusMods.App-x86_64.AppImage --game "cyberpunk2077" --loadout "meu-perfil"
[INFO] Carregando loadout... 23 mods ativos
[INFO] Verificando dependências... OK
[INFO] Resolvendo conflitos... 2 conflitos pendentes
```

Para jogos que o app não detecta automaticamente, você aponta o caminho manualmente na interface. A grande vantagem: como o app é nativo Linux, ele gerencia os arquivos diretamente no sistema de arquivos do Deck, sem a sobrecarga de um Wine extra.

:::dica
Se o Nexus Mods App não listar um jogo que está instalado no cartão SD, adicione o caminho manualmente em Settings > Game Paths. O Steam monta o cartão em `/run/media/mmcblk0p1/steamapps`.
:::

## Mod Organizer 2: o veterano dos Bethesda games

Para jogos da Bethesda (Skyrim, Fallout), o Mod Organizer 2 continua sendo a melhor opção, mesmo no Deck. O MO2 usa um sistema de *virtual file system* (VFS) que não toca nos arquivos originais do jogo — ele cria uma sobreposição em tempo de execução. Isso significa que desinstalar um mod é instantâneo e nunca corrompe a instalação base.

A instalação no Deck usa o instalador normal do MO2 dentro do prefixo do jogo:

```terminal
$ protontricks 489830 "C:\users\steamuser\Downloads\Mod Organizer 2 Setup.exe"
```

Depois de instalado, o MO2 fica acessível pelo menu Iniciar do prefixo. Para lançá-lo junto com o jogo, a estratégia recomendada é criar um script de wrapper:

```bash
#!/bin/bash
# ~/bin/launch-mo2-skyrim.sh
APPID=489830
PREFIX="$HOME/.steam/steam/steamapps/compatdata/$APPID/pfx"
export WINEPREFIX="$PREFIX"
protontricks-launch --appid "$APPID" \
  "C:\Program Files\ModOrganizer\ModOrganizer.exe" \
  "C:\Program Files (x86)\Steam\steamapps\common\Skyrim Special Edition\skse64_loader.exe"
```

O script inicia o MO2, que por sua vez lança o SKSE — e o Skyrim carrega com todos os mods ativos. O Steam vê isso como um "jogo" normal.

```terminal
$ chmod +x ~/bin/launch-mo2-skyrim.sh
$ ~/bin/launch-mo2-skyrim.sh
Mod Organizer 2 v2.5.2 - Skyrim Special Edition
Loading profile: "Ultimate-240-mods" ... 238 plugins loaded
SKSE64 initialized. Launching game...
```

:::atencao
O MO2 depende de hooks no sistema de arquivos que podem colidir com a implementação VFS do próprio Proton. Se você notar que o MO2 não "enxerga" os mods após iniciar o jogo, verifique dois pontos: (1) o `protontricks` está atualizado (`flatpak update com.github.Matoking.protontricks`); (2) o Proton Experimental costuma ter melhor compatibilidade com VFS do que as versões estáveis numeradas.
:::

## Gerenciando conflitos na prática

Conflitos são inevitáveis quando dois mods alteram o mesmo arquivo. Um mod manager mostra isso como uma lista de "conflitos pendentes". A regra prática:

| Tipo de conflito | Ação recomendada |
|---|---|
| Textura/malha (.nif, .dds) | O mod mais específico prevalece (ex.: retextura de armadura > retextura global) |
| Script (.pex, .psc) | Sempre use a versão mais recente; mods abandonados causam CTD |
| Plugin (.esp, .esm, .esl) | Ajuste a ordem de carregamento, não sobrescreva |
| DLL nativa (.dll) | Teste um de cada vez — DLLs quebradas são a causa #1 de crashes |

No MO2, arrastar um mod para cima na lista faz com que seus arquivos prevaleçam sobre os de baixo. No Nexus Mods App, a interface mostra um diff lado a lado.

## Resumo

- Mod managers resolvem dependências, conflitos e perfis, viabilizando setups com centenas de mods.
- O Nexus Mods App é nativo Linux e detecta automaticamente jogos Steam no Deck.
- O Mod Organizer 2 funciona dentro do prefixo Wine e é a melhor escolha para jogos Bethesda.
- Conflitos de textura e script têm regras de prevalência diferentes; DLLs conflitantes são a causa mais comum de CTD.
- O Proton Experimental geralmente oferece melhor compatibilidade com VFS para o MO2.

## Exercícios

1. Instale o Nexus Mods App via AppImage e escaneie sua biblioteca Steam. Quantos jogos foram detectados automaticamente?
2. Baixe três mods para um mesmo jogo, instale-os pelo Nexus Mods App e resolva um conflito de arquivos entre dois deles.
3. Instale o Mod Organizer 2 dentro do prefixo de Skyrim SE. Configure-o para lançar o SKSE e teste com cinco mods.
4. Crie dois perfis separados no MO2: um com mods gráficos e outro com mods de gameplay. Troque entre eles e compare o tempo de carregamento.
5. **Desafio.** Monte um loadout de 50+ mods para um Bethesda game no Deck, resolva todos os conflitos, ordene os plugins com LOOT via `protontricks -c` e jogue por 30 minutos sem crash.