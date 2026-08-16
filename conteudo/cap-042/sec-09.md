As oito seções anteriores deste capítulo formam um sistema: diagnosticar pelo log, trocar versão, mexer no prefixo, instalar runtimes e codecs, consultar a comunidade e reconhecer becos sem saída. Esta seção fecha o ciclo com duas ferramentas que concentram o conhecimento espalhado: o `protontricks --gui` e o `winetricks` puro, para quem precisa de controle fino. Também antecipa o que esperar das atualizações futuras do Proton e fecha com um fluxograma mental de reparo que resume o capítulo inteiro.

:::objetivos
- Navegar a interface gráfica do `protontricks` e do `winetricks`
- Instalar e remover componentes individuais via GUI
- Entender as limitações do protontricks e quando usar `WINEPREFIX` manual
- Conhecer o ciclo de atualização do Proton e preparar o sistema
- Aplicar o fluxograma de reparo completo do capítulo
:::

## A interface gráfica do protontricks

O `protontricks --gui` abre o `winetricks` apontado para o prefixo do jogo, oferecendo as mesmas operações que você fez no terminal, mas com navegação visual. É útil para explorar componentes que você não sabe o nome exato, ou para instalar vários de uma vez com caixas de seleção.

```terminal
$ protontricks 405100 --gui
protontricks (405100): running winetricks via /home/deck/.local/bin/protontricks
```

A janela que abre tem menus aninhados: **Select the default wineprefix → Install a Windows DLL or component →** e daí uma lista com centenas de itens marcáveis. Marque `vcrun2022`, `d3dx9` e clique OK — é o equivalente gráfico dos verbos que você conhece.

:::dica
Use `protontricks --gui` para **explorar** o que está instalado (menu "Run uninstaller" mostra programas registrados no prefixo) e para **instalar fontes** (`corefonts`, `tahoma`) quando o jogo mostra texto ilegível ou quadrados no lugar de caracteres. Esse problema é mais comum em jogos japoneses e em launchers antigos.
:::

## winetricks puro, quando você sabe o que fazer

Para situações em que o `protontricks` não cobre bem — prefixos manuais, jogos fora da Steam, ou quando você quer apontar para um `pfx` específico sem depender do appid —, use o `winetricks` diretamente, passando a variável `WINEPREFIX`:

```terminal
$ WINEPREFIX=~/.steam/steam/steamapps/compatdata/405100/pfx winetricks vcrun2022
Using winetricks 20240105 - sha256sum: ...
Executing wine /home/deck/.cache/winetricks/... vcrun2022
[..] Done.
```

A variável `WINEPREFIX` é a forma canônica do Wine de apontar para um prefixo. O `protontricks` faz isso internamente; usar `WINEPREFIX` na mão é o plano B para cenários onde o wrapper não funciona (prefixos de Non-Steam shortcuts com appid sintético, por exemplo).

:::atencao
Se você rodar `winetricks` **sem** `WINEPREFIX` e sem o `protontricks`, o comando age sobre o prefixo padrão do Wine (`~/.wine`), que não é usado pelo Proton. O resultado: runtime instalado no lugar errado e jogo ainda quebrado. Sempre confira se o `WINEPREFIX` está setado.
:::

## O ciclo de vida do Proton e quando atualizar

O Proton segue um ritmo de atualização vinculado ao Wine upstream e à Steam. As versões estáveis (8.0, 9.0) recebem correções de compatibilidade; a Experimental (bleeding edge) recebe patches novos antes de entrarem na linha estável; a GE é mantida pela comunidade e atualiza com frequência variável.

- **Proton Stable**: use como padrão, troque só quando um título pedir.
- **Proton Experimental**: teste quando o jogo acabou de sair ou recebeu patch grande.
- **Proton GE**: use quando codecs, anticheat compatível (EAC) ou correções específicas são necessárias.
- **Proton Hotfix**: versão efêmera para corrigir um título específico; raramente útil depois que o fix entra na Experimental.

Atualizar o Proton não afeta os prefixos já criados — eles continuam com os runtimes e configurações que você instalou. Só quando você troca a versão do Proton atribuída ao jogo é que o Proton pode migrar (ou recriar) o prefixo.

```terminal
$ ls ~/.steam/steam/steamapps/common/Proton*/
$ ls ~/.steam/root/compatibilitytools.d/
```

O primeiro caminho lista as versões de Proton oficiais. O segundo, as de terceiros (GE). Manter o GE atualizado é importante porque patches de compatibilidade para títulos novos saem primeiro lá.

## O fluxograma de reparo (resumo gráfico do capítulo)

Este fluxograma não é executável — é um roteiro mental, destilado das 9 seções deste capítulo, para você seguir em ordem quando um jogo falha:

```
Jogo falha:
├─ Ative PROTON_LOG=1 %command%
│  └─ Leia o log (~/steam-<appid>.log)
│     ├─ Tela preta? → vulkaninfo, DXVK_ASYNC=1, PROTON_USE_WINED3D=1
│     ├─ Crash imediato? → Troca versão Proton, testa GE
│     ├─ FMV sem vídeo? → Proton GE ou protontricks <id> mf-install
│     ├─ DLL ausente? → protontricks <id> vcrun2022 / d3dx9 / dotnet48
│     ├─ Anticheat? → ProtonDB, SteamDB; se sem suporte, beco sem saída
│     └─ Áudio/input/artefato? → Variáveis de subsistema (seção 5)
└─ Se nada resolveu → Prefixo limpo (rm compatdata/<id>) + Proton Experimental
```

:::dica
Imprima ou anote esse fluxograma em algum lugar acessível. Quando você estiver frustrado com um jogo que não abre, seguir os ramos na ordem evita o impulso de reinstalar tudo — que, como você já sabe desde a primeira seção, quase nunca resolve.
:::

## O que esperar além deste capítulo

O Proton avança rápido. Cada versão nova do Wine upstream, do DXVK e do VKD3D-Proton fecha dezenas de bugs de compatibilidade. O que hoje exige `protontricks` e tweaks manuais pode virar nativo na próxima atualização. O conhecimento que você construiu aqui — ler logs, isolar camadas, mexer no prefixo com parcimônia — é o que sobrevive às mudanças de versão.

Para os capítulos seguintes do curso, você leva duas competências transferíveis: **diagnóstico sistemático** (uma variável por vez, evidência antes da ação) e **familiaridade com o prefixo Wine** (que aparece também em ferramentas como Bottles, Lutris e Heroic). O Proton é a porta de entrada para um ecossistema maior.

## Resumo

- `protontricks <appid> --gui` abre a interface visual do winetricks apontada ao prefixo do jogo.
- `WINEPREFIX=<pfx> winetricks <verb>` é o caminho manual quando o protontricks não resolve.
- Proton Stable, Experimental, GE e Hotfix formam o ecossistema de versões; cada uma tem seu nicho.
- O fluxograma de reparo condensa o capítulo: log → sintoma → ramo de solução → verificação.
- O diagnóstico sistemático e o manejo do prefixo são competências transferíveis para Lutris, Bottles e Heroic.

## Exercícios

1. Abra `protontricks <appid> --gui` e navegue até "Run uninstaller". Quantos programas estão registrados no prefixo?
2. Use `WINEPREFIX=.../pfx winetricks corefonts` e observe a instalação de fontes; depois confirme com `ls` no diretório `drive_c/windows/Fonts/`.
3. Liste as versões de Proton instaladas no seu Deck com `ls ~/.steam/steam/steamapps/common/ | grep -i proton`.
4. Siga o fluxograma de reparo para um jogo com problema que você ainda não resolveu e documente qual ramo resolveu (ou qual beco sem saída encontrou).
5. **Desafio.** Combine o fluxograma com a [seção de diagnóstico](#/cap-042/sec-01): pegue um jogo desconhecido (que você nunca rodou), aplique o fluxograma cegamente, registre cada decisão e justifique, ao final, por que cada ramo tomado faz sentido — ou por que falhou e o que você tentaria diferente.