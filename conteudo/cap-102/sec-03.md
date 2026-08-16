A biblioteca do Steam Deck é, na maioria, composta por jogos escritos para Windows — e eles rodam. Isso só é possível por uma pilha de compatibilidade que a Valve construiu e mantém, com nomes — Proton, Wine, DXVK, VKD3D — que aparecem em todo canto. Entender cada peça é o que separa quem só joga de quem diagnostica por que um jogo não roda.

:::objetivos
- Entender o papel do Proton como fork do Wine mantido pela Valve
- Diferenciar tradução de API (Wine/Proton) de emulação de CPU
- Compreender como DXVK e VKD3D traduzem DirectX para Vulkan
- Navegar pelos prefixes em `compatdata/` e entender sua estrutura
- Usar ferramentas como ProtonDB e protontricks na prática
:::

## Proton e Wine: tradução, não emulação

O nome **Wine** é um acrônimo recursivo — *Wine Is Not an Emulator*. Um emulador reproduz a CPU de outra arquitetura com custo pesado; o Wine **traduz chamadas de API**: quando um programa Windows chama CreateFileW, o Wine converte para a chamada equivalente do Linux (open) em tempo real.

Como os jogos do Deck já são compilados para x86_64, o código roda nativamente, na velocidade total. Só a "conversa" com o sistema operacional é traduzida. Por isso um jogo Windows roda no Linux com overhead de poucos pontos percentuais, em vez da queda de 10x de um emulador de CPU.

O **Proton** é um *fork* do Wine mantido pela Valve, com patches específicos para jogos. A Valve pega o Wine, aplica correções para títulos populares, empacota os componentes gráficos e distribui tudo integrado ao Steam. Quando você baixa "Proton 9.0" via propriedades de compatibilidade, é esse pacote.

```terminal
$ ls ~/.local/share/Steam/steamapps/common/ | head -10
Proton 9.0 (Beta)
Proton Experimental
Proton - Experimental
...
```

Cada versão do Proton vive em `steamapps/common/`, como se fosse um jogo, ocupando centenas de megabytes. A Valve as mantém separadas porque um jogo pode quebrar numa versão nova e funcionar na anterior.

## DXVK e VKD3D: o coração gráfico da tradução

O DirectX é a API gráfica do Windows, com várias gerações. O **DXVK** traduz Direct3D 9, 10 e 11 para **Vulkan** — a API gráfica de baixo nível que o Linux entende nativamente e que a AMD suporta muito bem. O **VKD3D-Proton** faz o mesmo para Direct3D 12. Ambos rodam dentro do Proton: o jogo fala D3D11, o DXVK converte para Vulkan, e o driver `radv` (da Mesa) executa direto na GPU.

Por que Vulkan? Dá acesso direto ao hardware com overhead mínimo — o OpenGL (opção antiga do Wine) não oferecia isso tão bem. Muitos jogos via DXVK no Deck superam o desempenho em Windows porque a pilha Vulkan da AMD no Linux é madura.

```terminal
$ ls ~/.local/share/Steam/steamapps/common/Proton\ 9.0\ \(Beta\)/files/lib/wine/x86_64-unix/
d3d11.dll
d3d12.dll
d3d9.dll
dxgi.dll
vkd3d-proton
wine64
```

Dentro do Proton, as DLLs do Direct3D (d3d9.dll, d3d11.dll, d3d12.dll, dxgi.dll) são as implementações do DXVK/VKD3D-Proton. O Wine redireciona a busca de DLLs para esses arquivos — é assim que a tradução se materializa em disco.

:::nota
DXVK e VKD3D-Proton começaram como projetos independentes. O DXVK é de Philip Rebohle; o VKD3D-Proton é um fork mantido pela Valve do projeto vkd3d da CodeWeavers/Wine. Hoje os dois são integrados ao Proton, mas continuam existindo como componentes separados.
:::

## Prefix: o "Windows" particular de cada jogo

Cada jogo rodando via Proton tem um **prefix** — um diretório que simula um sistema de arquivos Windows completo, com seu `drive_c/`, seu registro (`system.reg`, `user.reg`) e sua árvore de `Program Files`. É como se cada jogo vivesse num mini-Windows isolado. No Steam, esses prefixes ficam em `~/.local/share/Steam/steamapps/compatdata/`, um diretório por App ID.
Cada jogo via Proton tem um **prefix** — diretório que simula um sistema de arquivos Windows com drive_c/, registro (system.reg, user.reg) e Program Files. É como se cada jogo vivesse num mini-Windows isolado. No Steam, os prefixes ficam em compatdata/, um por App ID.
```terminal
$ ls ~/.local/share/Steam/steamapps/compatdata/
1086940
1172620
1245620
...
$ ls ~/.local/share/Steam/steamapps/compatdata/1172620/pfx/drive_c/users/steamuser/Documents/
My Games
```

O diretório `1172620` é o App ID de um jogo; dentro, `pfx/` é o prefix. Ali está `drive_c/users/steamuser/`, equivalente ao `C:\Users\seunome\` do Windows — e é na pasta `Documents/My Games` que muitos jogos guardam saves locais, configs e perfil. É o primeiro lugar a olhar para backup de save não sincronizado à nuvem.

```terminal
$ ls -la ~/.local/share/Steam/steamapps/compatdata/1172620/pfx/
total 20
drwxr-xr-x  5 deck deck  4096 Jan  3 14:22 .
drwxr-xr-x  3 deck deck  4096 Jan  3 14:22 ..
-rw-r--r--  1 deck deck  8192 Jan  3 14:22 system.reg
-rw-r--r--  1 deck deck  4351 Jan  3 14:22 user.reg
-rw-r--r--  1 deck deck  8192 Jan  3 14:22 userdef.reg
drwxr-xr-x  3 deck deck  4096 Jan  3 14:22 drive_c
```

`system.reg` e `user.reg` são o registro do Windows em formato texto — legíveis com qualquer editor. O `drive_c/` é a raiz do disco C: virtual. Tudo é criado na primeira execução de cada jogo, e cada prefix pode chegar a dezenas ou centenas de megabytes.

:::dica
Para remover um jogo e seus resíduos, apagar pelo Steam normalmente já remove o prefix. Se sobrar lixo, o diretório de App ID em `compatdata/` pode ser apagado manualmente — mas confirme antes que você não quer os saves ali dentro e que o jogo não usa cloud save.
:::

## Steam Play, Proton GE e o ecossistema ao redor

**Steam Play** é a funcionalidade da Steam que orquestra tudo isso. Ganhou a opção *"Enable Steam Play for all titles"*, que faz a Steam oferecer o Proton para qualquer jogo Windows, mesmo os que a Valve ainda não validou. Sem essa marcação, só os títulos da lista branca ("Deck Verified") rodam automaticamente.

O **Proton Experimental** é a linha de testes da Valve, atualizada quase diariamente. O **Proton GE** (GloriousEggroll), compilação não-oficial de Thomas Crider, inclui codecs que a Valve não pode distribuir e costuma rodar jogos que falham nas versões oficiais.

O **Proton Experimental** é a linha de testes da Valve, atualizada quase diariamente. O **Proton GE** (GloriousEggroll), compilação não-oficial de Thomas Crider, inclui codecs que a Valve não pode distribuir e costuma rodar jogos que falham nas versões oficiais.

```terminal
$ protontricks --list
Found the following games:
Non-Steam shortcut: NON-STEAM (0)
1172620  (game name here)
1086940  (another game)
1245620  (third game)
$ protontricks 1172620 winecfg
```

O **protontricks** aplica funções do winetricks dentro do prefix de um jogo. protontricks --list mostra App ID e nome; protontricks <id> winecfg abre as configurações do Wine para trocar a versão do Windows simulada ou alterar DLLs.

## Runtime: as bibliotecas que o Proton espera

O Proton, como programa Linux, espera bibliotecas Linux para funcionar — glibc, fontconfig, X11/Wayland. O problema: essas bibliotecas mudam entre distribuições, e um Proton compilado contra uma versão pode quebrar noutra. A Valve resolveu com os **runtimes**: ambientes empacotados, entregues via container, que fornecem exatamente as bibliotecas que o Proton espera.

| Runtime | Base | Uso |
|---|---|---|
| Scout | Ubuntu 12.04 | Jogos Linux nativos antigos |
| Soldier | Debian 10 | Proton (a maioria dos jogos) |
| Sniper | Debian 11 | Proton mais recente e novos nativos |

O Soldier e o Sniper rodam num sandbox baseado em containers (o *Steam Linux Runtime*), isolado do sistema do usuário. É por isso que o Proton funciona igual no Deck e num desktop com Arch ou Ubuntu: o jogo não enxerga as bibliotecas do seu sistema, e sim as do runtime da Valve.

```terminal
$ ls ~/.local/share/Steam/steamapps/common/ | grep -i runtime
SteamLinuxRuntime_sniper
SteamLinuxRuntime_soldier
```

Esses diretórios aparecem em `common/` como se fossem jogos, mas são os runtimes. Quando o Steam lança um jogo via Proton, primeiro monta o runtime, depois executa o Proton dentro dele, e só então o Proton inicia o jogo — uma cadeia de três camadas que explica a demora do "aquecimento" no primeiro lançamento.

:::atencao
Confundir o runtime com o Proton é um erro comum de diagnóstico. Se um jogo falha com erro sobre "libcurl" ou "steamclient", o problema está na camada do runtime, não no Proton. Atualizar o Proton não resolve; atualizar (ou reparar) o Steam Linux Runtime resolve. Nas propriedades do jogo, o campo de compatibilidade mostra as duas peças separadas por um motivo.
:::

## Resumo

- Wine traduz chamadas da API do Windows para as do Linux em tempo real; não emula CPU, então jogos x86_64 rodam em velocidade nativa.
- Proton é o fork do Wine mantido pela Valve, com patches por jogo e componentes gráficos integrados.
- DXVK traduz Direct3D 9/10/11 para Vulkan; VKD3D-Proton traduz Direct3D 12 para Vulkan.
- Cada jogo tem um prefix em `compatdata/<AppID>/pfx/` com um `drive_c/` completo, registro e saves locais.
- Steam Play, Proton Experimental e Proton GE oferecem opções de compatibilidade; ProtonDB classifica jogos de Platinum a Borked.
- Os runtimes Scout, Soldier e Sniper fornecem as bibliotecas Linux que o Proton espera, isoladas do sistema.

## Exercícios

1. Execute `ls ~/.local/share/Steam/steamapps/common/ | grep -i proton` e liste as versões do Proton instaladas. Alguma delas é a Experimental?
2. Entre em `~/.local/share/Steam/steamapps/compatdata/` e identifique alguns App IDs. Descubra a qual jogo pertence um deles usando `grep` nos arquivos `appmanifest_*.acf` (procure `"name"` e `"appid"`).
3. Navegue até `pfx/drive_c/users/steamuser/Documents/` de um jogo conhecido e localize uma pasta de saves. Copie-a para backup e verifique se o jogo usa cloud save.
4. Rode `protontricks --list` (instale via `sudo pacman -S protontricks` ou `flatpak` se necessário). Anote um App ID e rode `protontricks <id> winecfg` para abrir o painel do Wine.
5. **Desafio.** Abra `user.reg` de um prefix com um editor de texto e procure a chave `Software\Wine\Drivers`. Explique, com base no conteúdo dessa chave, a relação entre o prefix e a escolha do driver gráfico — e relacione isso com o papel do DXVK aprendido nesta seção.