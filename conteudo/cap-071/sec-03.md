O Proton é a peça que transforma o Steam Deck de um console Linux de catálogo modesto em uma máquina capaz de rodar a maior parte da biblioteca Windows da Steam. Ele não emula um PC: traduz, em tempo real, as chamadas que o jogo faz ao sistema Windows para o que o Linux entende. O custo disso é um overhead de CPU pequeno e um conjunto honesto de limitações que detalharemos sem romantismo.

:::objetivos
- Entender a composição do Proton: Wine + DXVK + VKD3D + FAudio e o papel da Valve e da CodeWeavers
- Acompanhar o pipeline de tradução DirectX → Vulkan em tempo real
- Diferenciar Stable, Experimental, Hotfix e Proton GE, e escolher a versão por jogo
- Interpretar ratings e relatórios do ProtonDB com senso crítico
:::

## O que o Proton é, camada por camada

Proton não é um programa único, mas uma pilha de componentes.

### Wine: a fundação

O **Wine** ("Wine Is Not an Emulator") carrega binários Windows (`.exe`/`.dll`) em Linux e traduz syscalls e APIs do Windows para equivalentes POSIX. Quando um jogo chama `CreateFileW` ou `ReadFile`, o Wine mapeia para `open()`/`read()` do Linux. Não há virtualização de CPU: o código roda nativo no processador AMD. A Valve mantém o Proton como *fork* do Wine com centenas de patches específicos.

### DXVK: DirectX 9/10/11 → Vulkan

O **DXVK** (criado por Philip Rebohle, hoje na Valve) converte chamadas Direct3D 9/10/11 em Vulkan. É por isso que um jogo "só para DirectX 11" roda com performance próxima do nativo: o DXVK não emula GPU, reescreve *draw calls* para a API Vulkan que o driver RADV executa diretamente.

### VKD3D-Proton: DirectX 12 → Vulkan

O **VKD3D-Proton** — outro *fork* da Valve — traduz o DirectX 12, API de baixo nível totalmente distinta. Destravou títulos como *Cyberpunk 2077* e *Elden Ring*, frequentemente com performance igual ou superior ao Windows.

Além da renderização, o **FAudio** reimplementa o XAudio2; o Steam ainda injeta seu **Steamworks** no lugar das versões Windows. A **CodeWeavers** contribui com engenharia no Wine e na infraestrutura de testes. O modelo não é "a Valve escreveu tudo": é colaboração contínua entre Valve, CodeWeavers e os projetos DXVK/VKD3D.

:::info
**Não é emulação, é tradução de API.** Um emulador reproduz hardware (como o Dolphin faz com o GameCube). O Proton traduz *chamadas de software* entre sistemas operacionais, com o código do jogo rodando no processador real. Por isso o custo de performance é baixo — mas nunca exatamente zero.
:::

## O pipeline em execução

O caminho de um único frame num jogo DirectX 11 via Proton:

1. O binário Windows chama a `d3d11.dll` pedindo o desenho de uma malha 3D.
2. O Wine captura e encaminha para o DXVK.
3. O DXVK traduz a *draw call* para comandos Vulkan (pipelines, buffers, descritores).
4. Esses comandos vão ao driver **RADV** (Mesa), que os submete à GPU Van Gogh.
5. A GPU executa e escreve na tela; em paralelo, arquivos, rede e áudio passam pelo Wine e FAudio.

O gargalo está nas etapas 1-3 (CPU). A Valve mitiga com **cache de shaders**: DXVK/VKD3D compilam shaders na primeira execução e os salvam; nas seguintes o custo já foi pago.

Cada jogo instalado ganha seu próprio prefixo Wine isolado:

```terminal
## Cada AppID da Steam tem seu próprio prefixo Wine
$ ls ~/.steam/steam/steamapps/compatdata/
1245620   1493710   1086940   1229490   292030

## Um prefixo típico contém uma árvore "C:" completa
$ ls ~/.steam/steam/steamapps/compatdata/1245620/pfx/
dosdevices/  drive_c/  system.reg  user.reg  userdef.reg  version
```

O diretório numérico é o **AppID**. Dentro de `pfx/` existe a árvore `drive_c/` imitando o `C:` do Windows — incluindo `windows/system32` com as DLLs do Wine. Cada jogo tem um silo isolado, o que impede que um corrompa as dependências do outro.

Vejamos qual versão do Proton está instalada:

```terminal
## Versões do Proton presentes no sistema
$ ls ~/.steam/root/steamapps/common/ | grep -i proton
Proton - Experimental/
Proton 9.0/

## Confirma a build de uma instalação
$ cat ~/.steam/root/steamapps/common/Proton\ 9.0/version
9.0-4
```

O `version` é a ferramenta mais confiável de auditoria: diz a build exata. O número `9.0-4` indica Proton 9.0, patch 4 — a cadência de lançamentos é rápida.

## As versões do Proton

Nem todo jogo se dá bem com a versão mais recente. A Steam oferece canais distintos:

- **Stable**: default, madura, testada para a maioria dos títulos.
- **Experimental**: mudanças ainda em validação, atualizada quase diariamente; costuma destravar lançamentos antes da Stable.
- **Hotfix**: canal temporário para uma regressão específica; some quando a correção entra na Stable.
- **Proton GE (Glorious Eggroll)**: da comunidade, criada por Thomas "GloriousEggroll" Crider. Inclui DXVK/VKD3D bleeding edge e codecs de vídeo que a Valve não pode redistribuir por licença — úteis em *cutscenes*. Menos estável, mas resolve títulos que travam nas versões oficiais.

:::dica
**Regra de bolso:** comece na Stable. Se o jogo não abrir ou tiver *cutscene* preta, tente a Experimental. Se ainda falhar, instale o Proton GE via **ProtonUp-Qt** e teste a versão mais recente. Só use Hotfix quando a Valve indicar.
:::

### Escolhendo a versão por jogo

Na interface da Steam: clique direito no jogo → **Propriedades** → aba **Compatibilidade** → marque **"Forçar o uso de uma ferramenta de compatibilidade específica"** → escolha a versão. Se a caixa estiver desmarcada, a Steam escolhe automaticamente.

Ative o log detalhado para auditar quais camadas estão ativas:

```terminal
## Ativa o log e inicia o jogo (1245620 = Elden Ring)
$ PROTON_LOG=1 WINEDEBUG=-all %command%

## O log sai em ~/steam-<appid>.log
$ tail -20 ~/steam-1245620.log
wine: created the configuration directory '.../compatdata/1245620'
dxvk:  Installing DXVK for Direct3D 11 support (DXVK 2.3.1)
vkd3d: D3D12 translation layer active (VKD3D-Proton 2.11.1)
wine:  Started process 'eldenring.exe'
esync: Using kernel eventfd synchronization (faster syscall emulation)
```

Repare nas linhas `dxvk`/`vkd3d` (versões dos tradutores) e `esync` (patch Valve que acelera sincronização de threads via *eventfd*). É um artefato valioso para descobrir qual camada falha.

## ProtonDB: lendo a comunidade com ceticismo

O [ProtonDB](https://www.protondb.com) agrega relatórios de compatibilidade da comunidade.

| Rating | Significado | O que esperar |
|--------|-------------|---------------|
| **Platinum** | Roda perfeitamente | Nenhum ajuste |
| **Gold** | Roda bem | Tweak menor possível |
| **Silver** | Roda com falhas | Bugs ou workaround obrigatório |
| **Bronze** | Roda muito mal | Comprometimentos sérios |
| **Borked** | Não roda | Crasha ou não inicia |

O valor está nos **relatórios**, não no selo. Um jogo "Gold" com relatório recente dizendo *"travou na cinemática do capítulo 3, use Proton GE"* vale mais que um "Platinum" de dois anos atrás. Filtre por data, versão do Proton citada e se o teste foi no **Steam Deck** (hardware idêntico) ou num PC desktop.

:::atencao
**Anti-cheat é o filtro mais importante.** Procure nos relatórios por "EAC", "BattlEye" ou "Vanguard". Alguns jogos multiplayer rodam no single-player mas são bloqueados no online por anti-cheat em nível de kernel que o Proton não consegue reproduzir. O selo pode dizer "Gold" enquanto o modo que você quer jogar simplesmente não funciona.
:::

Casos de sucesso em 2024-2025: **Elden Ring** (D3D12, verificado no Deck, 30-40 FPS em médio), **Cyberpunk 2077** (D3D12, ~30 FPS com FSR 2) e **Baldur's Gate 3** (D3D11/Vulkan, estável a 30 FPS até no ato 3).

## Limitações honestas

O Proton é excelente, mas não é mágica. Três fronteiras permanecem duras.

**Anti-cheat de kernel.** EAC e BattlEye têm modos que rodam no anel do kernel do Windows, que o Proton (espaço de usuário) não reproduz. Alguns jogos habilitam variante "compatível com Linux" e funcionam (*Apex Legends*); outros, como *Valorant* (Vanguard) e *Fortnite*, ficam **deliberadamente bloqueados**. Verifique antes de comprar para competitivo online.

**Codecs de mídia (WMF).** Muitas *cutscenes* usam Windows Media Foundation e codecs proprietários (WMA, WMV, alguns AAC) que a Valve não pode redistribuir. Resultado: vídeos pretos ou travados. O Proton GE contorna parte com MF-MediaFoundation e ffmpeg, mas a cobertura não é total.

**Launchers de terceiros.** Jogos que exigem launchers (Rockstar, EA App, Ubisoft Connect, 2K) adicionam uma camada de risco: o launcher em si é um programa Windows via Proton, e cada update dele pode quebrar o jogo que gerencia.

```terminal
## Um launcher aparece no log como processo filho
$ grep -iE "launcher|rockstar" ~/steam-271590.log | head -3
wine:  Started process 'PlayGTAV.exe'
wine:  Started process 'Rockstar Launcher.exe'
```

Não é o jogo que inicia primeiro — é o launcher — e toda a cadeia precisa sobreviver à tradução.

:::perigo
**Nunca "corrija" anti-cheat com Wine/Proton alternativos.** Forçar *Valorant*, *Fortnite* ou títulos com Vanguard pode burlar a detecção e resultar em **banimento permanente** da conta. Se o jogo exige anti-cheat de kernel incompatível, a resposta honesta é: ele não roda no Steam Deck, e forçar é perder a conta.
:::

## Resumo

- Proton é uma pilha: Wine (syscalls) + DXVK (D3D9/10/11→Vulkan) + VKD3D-Proton (D3D12→Vulkan) + FAudio (áudio), com patches da Valve e engenharia da CodeWeavers
- O pipeline traduz DirectX para Vulkan em tempo real; o código roda nativo, sem emulação de hardware — custo é overhead de CPU, mitigado por cache de shaders
- Há quatro canais: Stable, Experimental, Hotfix e Proton GE (comunidade, codecs bleeding edge)
- A versão por jogo se escolhe em Propriedades → Compatibilidade na Steam
- No ProtonDB, o valor está nos relatórios recentes de Steam Deck, não apenas no selo
- Limitações reais: anti-cheat de kernel (Vanguard, EAC/BattlEye restritos), codecs WMF em cinemáticas e launchers de terceiros instáveis

## Exercícios

1. Execute `ls ~/.steam/steam/steamapps/compatdata/` e identifique pelo AppID ao menos três jogos instalados. Descubra o nome de cada um buscando o número no arquivo `appmanifest_*.acf` correspondente.

2. Execute `cat ~/.steam/root/steamapps/common/Proton*/version` e rode um jogo com `PROTON_LOG=1 %command%`. No arquivo `~/steam-<appid>.log`, identifique as versões de DXVK e VKD3D-Proton ativas e explique o que cada componente faz.

3. Escolha um jogo AAA da sua biblioteca e consulte o ProtonDB. Transcreva um relatório recente feito no Steam Deck, anotando a versão do Proton citada e os workarounds sugeridos.

4. Identifique na biblioteca um jogo multiplayer com anti-cheat (EAC, BattlEye ou Vanguard) e determine, via ProtonDB e fontes oficiais, se o modo online funciona no Deck ou está bloqueado. Documente a diferença entre single-player e online.

5. **Desafio integrador**: monte um "mini-guia de compatibilidade" para um jogo problemático que exija Proton GE. Instale a versão GE via ProtonUp-Qt, force-a em Propriedades → Compatibilidade e rode com `PROTON_LOG=1`. Ao final, redija um relatório no estilo ProtonDB com: jogo, versão GE, o que funcionou (gameplay, áudio, cutscenes), o que falhou e os ajustes de FPS/TDP necessários para desempenho estável.
