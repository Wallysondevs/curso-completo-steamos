A contribuição da Valve para o Wine não se resume a empacotar componentes existentes — ela mudou o ecossistema. De 2013 a 2025, a Valve passou de empresa que lançava um sistema operacional baseado em Linux a uma das maiores financiadoras da compatibilidade Windows-no-Linux. Esta seção conta essa história técnica, mostrando quais contribuições de código foram feitas, como elas mudaram o projeto Wine e o que significa o regime de dupla via entre Valve/CodeWeavers e WineHQ.

:::objetivos
- Conhecer a cronologia da contribuição da Valve ao Wine
- Identificar os principais patches e tecnologias que a Valve trouxe ao upstream
- Entender a relação entre CodeWeavers e WineHQ no contexto do Proton
- Avaliar o impacto de cada contribuição no funcionamento dos jogos
- Reconhecer que partes do Proton ainda não estão no Wine vanilla
:::

## O início: Steam Machines e a aposta no Linux

Em 2013, Gabe Newell subiu ao palco do LinuxCon e declarou que o Linux era "o futuro dos jogos". Naquele ano, a Valve lançou o SteamOS 1.0 (baseado em Debian), as Steam Machines e um impulso para que desenvolvedores portassem seus jogos para Linux nativamente. A aposta não deu certo comercialmente: as Steam Machines venderam pouco, os ports nativos não vieram em peso, e a biblioteca Linux do Steam permaneceu uma fração da biblioteca Windows.

Mas o investimento em código não foi perdido. Durante o período 2013-2018, a Valve financiou o trabalho da CodeWeavers e de desenvolvedores independentes no Wine, no driver gráfico Mesa (especialmente `radv`, o driver Vulkan da AMD) e no kernel Linux (patches para o APU customizado do Steam Deck, scheduler, sistema de arquivos). Quando o Steam Deck foi anunciado em 2021, essa base já existia — o Proton era o herdeiro de quase uma década de trabalho acumulado.

O rastro desse investimento está impresso no próprio sistema: o kernel do Steam Deck leva o sufixo `-neptune`, nome interno da árvore de kernel que a Valve mantém com patches próprios, e o driver Vulkan vem empacotado pelo Mesa:

```terminal
$ uname -r
6.5.0-valve21-1-neptune-65
$ glxinfo -B 2>/dev/null | grep -i 'OpenGL renderer'
OpenGL renderer string: AMD Custom GPU 0405 (radeonsi, vangogh, LLVM 17.0.6, DRM 3.54, 6.5.0-valve21-1-neptune-65)
```

A linha do renderer revela três camadas do trabalho da Valve: o `radeonsi`/`radv` (drivers Mesa que receberam patches da Valve), o codinome `vangogh` (o APU customizado do primeiro Deck) e o `-neptune` (o kernel modificado). Tudo isso existia e amadureceu no período que antecede o Proton.

## Os grandes patches que a Valve levou ao Wine

A Valve/CodeWeavers enviaram (e continuam enviando) patches para o Wine em várias frentes. Os principais:

- **Fullscreen virtual (VDX)**: permite que jogos que exigem modo exclusivo de tela cheia rodem como se estivessem em tela cheia, mas numa janela borderless gerenciada pelo Gamescope. Sem esse patch, muitos jogos entram num loop de resolução ou ficam com tela preta.
- **Melhorias no Direct3D 11 via WineD3D**: antes do DXVK se tornar o padrão, a Valve investiu pesado em fazer o wined3d (tradutor D3D→OpenGL) funcionar bem para jogos, incluindo otimizações de textura e buffer.
- **Suporte a Steam Input**: patches no subsistema de entrada do Wine para que controles do Steam Deck (incluindo os trackpads e os botões traseiros) sejam expostos como dispositivos XInput e DirectInput.
- **Steamworks integration**: patches que permitem que a API do Steam (multiplayer, lobbies, achievements, workshop) funcione dentro do Wine.
- **Media Foundation e codecs**: implementação parcial do framework de mídia do Windows usando GStreamer, para que vídeos de jogos sejam reproduzidos.
- **Sincronização de primitivas**: melhorias no `ntdll` e no `kernel32` para que mecanismos de sincronização usados por jogos (`futex`, `event`, `mutex`) tenham a latência esperada.

Nem todos esses patches estão no Wine upstream ainda. O ciclo é: a Valve implementa no Proton, testa com a base de jogos, refina, e depois envia para o WineHQ. Alguns patches levam anos para serem aceitos; outros são reescritos para se adequar aos padrões do projeto.

Você pode ver parte desses patches em ação inspecionando o que o Wine do Proton faz de diferente. O patch de fullscreen virtual, por exemplo, responde ao Wine uma resolução virtual que o Gamescope depois redimensiona — e dá para notar isso consultando a versão do Wine e os módulos carregados:

```terminal
$ ~/.steam/steam/steamapps/common/Proton\ 9.0/dist/bin/wine --version
wine-9.0 (Proton 9.0-4)
$ ~/.steam/steam/steamapps/common/Proton\ 9.0/dist/bin/wine cmd /c echo %WINEARCH%
win64
```

A saída `win64` indica um prefixo de 64 bits, o padrão que o Proton cria. A versão `wine-9.0 (Proton 9.0-4)` deixa explícito que não é o Wine upstream: o parêntese marca a diferença — são os mesmos números de base, mas com a camada de patches da Valve aplicada por cima.

## A relação CodeWeavers ↔ Valve ↔ WineHQ

A CodeWeavers é uma empresa com fins lucrativos que vende o CrossOver (uma versão comercial do Wine com suporte a aplicativos de produtividade). A Valve contratou a CodeWeavers para trabalhar especificamente em jogos, e essa parceria criou um arranjo triangular:

```
Valve (financiadora) ──→ CodeWeavers (desenvolvedora) ──→ WineHQ (upstream)
                        ←──                              ←──
                        feedback / jogos / testes         patches aceitos
```

A CodeWeavers implementa no Proton, testa com o catálogo do Steam, envia para o WineHQ. Quando o WineHQ aceita, o Wine "de linha" ganha a melhoria — e versões futuras do Proton podem abandonar o patch local e usar o código upstream, reduzindo a carga de manutenção.

Esse modelo é vantajoso para todos: a Valve tem um Wine mais rápido e compatível, a CodeWeavers é paga para trabalhar em software livre, e o WineHQ recebe patches de alta qualidade que não teria recursos para desenvolver sozinho.

:::info
Em 2024, estima-se que a CodeWeavers tenha cerca de 30 desenvolvedores dedicados ao Proton e ao Wine, financiados pela Valve. É a maior força de trabalho dedicada ao Wine em toda a história do projeto.
:::

## O que o Proton trouxe que o Wine não tinha

A diferença entre "Wine que rodava jogos em 2017" e "Proton em 2018" não foi só quantitativa — foi qualitativa. Antes do Proton, rodar um jogo no Wine exigia horas de configuração: prefixos manuais, `winetricks` para instalar dependências, DLLs copiadas a dedo, regedit. O Proton automatizou tudo isso e adicionou:

- **Detecção automática de dependências**: o Proton sabe que jogos Unity precisam de `vcrun`, que jogos Bethesda usam `d3dx9`, e instala no prefixo automaticamente.
- **Seleção de perfil por jogo**: a base de dados da Valve associa cada appid a uma configuração (versão do Proton, flags específicas, workarounds), atualizada silenciosamente.
- **Fossilize**: o cache de pipelines que elimina o stutter de compilação, integrado ao Steam Cloud.
- **Ambiente isolado (Steam Runtime)**: o jogo não depende das bibliotecas do sistema base, eliminando o "funciona na minha máquina".

Essas quatro inovações são o que transformou o Wine de ferramenta de entusiasta para produto de consumo. E nenhuma delas existia no Wine vanilla em 2018.

## O ecossistema pós-Proton: Wine-GE, Proton-GE e outros forks

O código do Proton é aberto (licença BSD para o Proton em si, com componentes em GPL/LGPL). Isso permitiu que surgissem forks e derivações:

- **Proton-GE (GloriousEggroll)**: uma versão comunitária que inclui patches mais agressivos, codecs adicionais (como WMV e Cinepak via ffmpeg) e suporte a mais mídia. É a escolha preferida de muitos usuários para jogos que não funcionam no Proton oficial.
- **Wine-GE**: a base do Proton-GE, mas sem o empacotamento do Steam — é um Wine com os patches do GE aplicados, para uso fora do Steam.
- **Lutris Wine**: builds do Wine otimizadas para o Lutris, com patches para jogos da Epic, GOG e outras lojas.

A existência desses forks prova que o Proton é modular: você pode trocar o DXVK, o VKD3D-Proton ou o próprio Wine por versões alternativas sem mexer no resto.

```terminal
$ ls ~/.steam/steam/compatibilitytools.d/
GE-Proton9-16/
Proton-9.0-Beta/
```

O diretório `compatibilitytools.d/` é onde ferramentas de compatibilidade de terceiros podem ser instaladas manualmente, e o Steam as reconhece automaticamente. Basta colocar a pasta com o Proton alternativo ali e reiniciar o Steam — a nova ferramenta aparece na lista de seleção de compatibilidade.

## Resumo

- A Valve investe no Wine desde 2013 (Steam Machines), com aceleração após 2018 (Proton/Steam Play).
- Patches de fullscreen virtual, Steam Input, codecs e sincronização vieram da Valve/CodeWeavers.
- A relação Valve→CodeWeavers→WineHQ é de financiamento, desenvolvimento e retorno ao upstream.
- Proton automatizou prefixo, dependências, cache de shaders e isolamento — o que fez o Wine virar produto.
- Forks comunitários como Proton-GE estendem o Proton com codecs e patches extras.

## Exercícios

1. Pesquise no repositório do Wine (`git.winehq.org`) um commit cujo autor seja da CodeWeavers e descreva o que ele corrige.
2. Compare `ls ~/.steam/steam/steamapps/common/Proton*` com `ls ~/.steam/steam/compatibilitytools.d/`. Quais ferramentas oficiais e de terceiros estão instaladas?
3. Instale o Proton-GE (ou apenas baixe-o) e compare a árvore de arquivos com a do Proton 9.0 oficial — liste 3 arquivos ou diretórios que diferem.
4. Em um prefixo de jogo, inspecione o arquivo `version` e determine qual versão do Proton o criou. Se for antigo, descreva o que acontece ao trocar para Proton Experimental.
5. **Desafio.** Escreva um resumo técnico de uma página sobre por que o modelo de "dupla via" (Valve/CodeWeavers → Proton → WineHQ) é sustentável. Compare com o modelo tradicional de software livre (voluntários + patrocínio esporádico) e argumente se esse modelo poderia funcionar para outros projetos.