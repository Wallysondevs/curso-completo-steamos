As três ferramentas deste capítulo convergem para um mesmo objeto escondido: o prefixo Wine. Saber o que é um prefixo, onde ele fica e como as ferramentas o gerenciam é o que separa quem clica e torce de quem resolve problema. Esta seção trata do prefixo em si — a anatomia, o ciclo de vida e como Lutris, Heroic e Bottles o enxergam — e serve de base para o comparativo da próxima seção.

:::objetivos
- Entender a anatomia de um prefixo Wine (drive_c, registro, DLLs)
- Localizar prefixos criados por Lutris, Heroic e Bottles
- Reconhecer como DXVK e VKD3D atuam dentro do prefixo
- Usar winecfg e winetricks para ajustar um prefixo
- Saber quando recriar um prefixo em vez de consertar

:::

## O que é um prefixo, de fato

Um prefixo Wine é uma pasta que contém uma cópia completa do que um programa Windows espera encontrar: um `C:` virtual, a árvore de `Program Files`, o registro do Windows em formato de arquivo e as DLLs do sistema. O Wine cria isso na primeira execução, "instalando" um Windows mínimo dentro de uma pasta no seu Linux.

```terminal
$ ls ~/Games/Heroic/Prefixes/Hollow-Knight/
dosdevices  drive_c  system.reg  user.reg  userdef.reg  .update-timestamp
```

Cada arquivo tem papel definido. `drive_c` é o disco `C:` virtual, onde os programas são instalados. Os arquivos `.reg` são o registro do Windows serializado: `system.reg` (HKLM), `user.reg` (HKCU) e `userdef.reg`. `dosdevices` é a ponte que mapeia letras de unidade (`C:`, `Z:`) para caminhos reais do Linux.

:::nota
O nome "prefixo" vem da ideia de que cada instalação é prefixada por um caminho próprio, isolada das demais. Nada impede que você tenha cinco prefixos simultâneos, cada um com um Windows ligeiramente diferente. Essa é a base de todo o isolamento que Lutris, Heroic e Bottles oferecem.
:::

## Onde cada ferramenta guarda seus prefixos

Conhecer o caminho certo economiza horas de procura. As três ferramentas divergem de propósito:

```terminal
$ ls ~/Games/ | head -4
stardew-valley
$ ls ~/Games/Heroic/Prefixes/
Hollow-Knight
$ ls ~/.var/app/com.usebottles.bottles/data/bottles/bottles/
jogo-antigo  contabilidade
```

O Lutris costuma colocar o prefixo junto do jogo, dentro de `~/Games/<jogo>` ou num `~/.wine` genérico quando o script não especifica. O Heroic separa os prefixos em `~/Games/Heroic/Prefixes/<jogo>`. O Bottles centraliza tudo em `~/.var/app/com.usebottles.bottles/data/bottles/bottles/<nome>`.

:::dica
Para descobrir qual prefixo um jogo do Lutris está usando sem caçar no disco, abra as configurações do jogo na interface e veja o campo "Wine prefix". O Bottles mostra o caminho na própria tela da garrafa. Guarde esse caminho: ele é o que você vai apontar para outras ferramentas.
:::

## DXVK e VKD3D: a tradução dentro do prefixo

Jogos de Windows falam DirectX com a placa de vídeo. O Linux não entende DirectX nativamente — entende Vulkan. O DXVK (DirectX 9/10/11 → Vulkan) e o VKD3D (DirectX 12 → Vulkan) são as pontes que fazem essa tradução, e ambos vivem dentro do prefixo como DLLs substituídas.

```terminal
$ ls ~/Games/Heroic/Prefixes/Hollow-Knight/drive_c/windows/system32/ | grep -i d3d | head -6
d3d11.dll
d3d9.dll
dxgi.dll
```

Quando o Heroic ou o Lutris "habilitam DXVK", eles estão trocando essas DLLs pelas versões do DXVK, que interceptam as chamadas DirectX e as traduzem para Vulkan. Desligar o DXVK reverte para as DLLs originais do Wine, que fazem uma tradução mais lenta (OpenGL ou a implementação interna).

:::info
Nem todo jogo se beneficia de DXVK; uma minoria comporta-se melhor com o caminho nativo do Wine. Por isso a opção de habilitar/desabilitar existe por jogo. Se um jogo com DXVK ligado apresenta artefatos gráficos ou queda de desempenho, experimente desligar antes de mexer em qualquer outra coisa.
:::

## Ajustes manuais: winecfg e winetricks

Quando as opções da ferramenta não bastam, você abre o próprio Wine. O `winecfg` configura coisas como versão de Windows reportada e bibliotecas; o `winetricks` instala componentes e faz ajustes.

```terminal
$ flatpak run --command=winecfg com.usebottles.bottles -b "jogo-antigo" 2>&1 | head -3
$ flatpak run --command=winetricks com.usebottles.bottles -b "jogo-antigo" 2>&1 | head -3
```

O detalhe importante é o `--command=`: dentro do Flatpak, você não chama `winecfg` diretamente, mas sim pede ao runtime do Bottles para executar esse comando no contexto da garrafa. O mesmo vale para o Lutris e o Heroic, cada um com sua sintaxe de invocação.

:::atencao
Um erro clássico é rodar `winetricks` "solto" no terminal, fora do Flatpak, e ele agir sobre um `~/.wine` que não tem nada a ver com a garrafa do Bottles. Sempre rode `winecfg`/`winetricks` através do Flatpak (ou pelo atalho da interface da ferramenta), senão você ajusta o prefixo errado.
:::

## Quando recriar em vez de consertar

Prefixos Wine acumulam sujeira e quebram de formas difíceis de rastrear. A regra prática: se um jogo rodava e parou de rodar depois de mexer em dependências, e você tem backup (ou o jogo reinstala rápido), recriar o prefixo costuma ser mais barato que diagnosticar uma DLL corrompida.

```terminal
$ rm -rf ~/Games/Heroic/Prefixes/Hollow-Knight
```

No Heroic e no Lutris, apagar a pasta do prefixo faz a ferramenta recriá-lo na próxima execução. No Bottles, preferível "Delete bottle" e criá-la de novo, pois o Bottles registra estado interno além da pasta.

:::perigo
`rm -rf` num caminho de prefixo destrói a instalação Windows virtual inteira, incluindo saves que ficam dentro de `drive_c/users/...`. Antes de apagar, verifique se os saves do jogo não estão dentro do prefixo — muitos jogos guardam progresso lá, e backup externo nem sempre cobre isso.
:::

## Resumo

- Prefixo Wine é uma pasta com `drive_c`, registro (`.reg`) e mapeamento de unidades (`dosdevices`).
- Lutris guarda prefixos junto dos jogos; Heroic em `~/Games/Heroic/Prefixes/`; Bottles em seu diretório de dados.
- DXVK (D3D9/10/11) e VKD3D (D3D12) traduzem DirectX para Vulkan substituindo DLLs dentro do prefixo.
- `winecfg` e `winetricks` ajustam o prefixo, mas devem rodar via Flatpak (`--command=`), não soltos.
- Recriar o prefixo costuma ser mais barato que consertar uma instalação corrompida.
- Saves guardados dentro do prefixo exigem cuidado extra antes de `rm -rf`.

## Exercícios

1. Localize o prefixo de um jogo instalado no Heroic e liste o conteúdo de `drive_c`, `dosdevices` e os arquivos `.reg`.
2. Use `grep -i d3d` em `drive_c/windows/system32/` e identifique quais DLLs de tradução estão presentes no seu prefixo.
3. Abra o `winecfg` de uma garrafa do Bottles via `--command=winecfg` e identifique a "versão do Windows" reportada.
4. Rode `winetricks` via Flatpak numa garrafa do Bottles e instale um componente simples; depois confirme que a DLL correspondente apareceu no prefixo.
5. **Desafio.** Crie dois prefixos manualmente com `WINEPREFIX=/tmp/prefix-a wineboot -u` (se o Wine estiver disponível fora do Flatpak) ou via Bottles, e compare os arquivos gerados. Explique por que dois prefixos do mesmo jogo podem divergir depois de rodar instaladores diferentes.
