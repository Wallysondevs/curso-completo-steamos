DirectX 12 mudou as regras do jogo. Diferente do DirectX 11, que ainda gerenciava muita coisa por baixo, o DirectX 12 é uma API de baixo nível próxima do metal — e é justamente por isso que traduzi-lo para Vulkan é mais natural do que traduzir para OpenGL. O VKD3D-Proton é a peça que faz esse trabalho no Proton, e entender como ele lida com o DirectX 12 é o que separa quem só "aperta Jogar" de quem resolve problema de verdade.

:::objetivos
- Entender por que DirectX 12 exige uma camada de tradução própria (VKD3D-Proton)
- Distinguir VKD3D original do VKD3D-Proton mantido pela Valve
- Inspecionar a versão do VKD3D-Proton dentro do Proton
- Diagnosticar jogos D3D12 com variáveis de ambiente e logs
- Reconhecer as limitações do VKD3D-Proton em títulos específicos
:::

## DirectX 12 e a virada para o baixo nível

Até o DirectX 11, a API gráfica da Microsoft assumia o papel de "motorista": o programador dizia o que queria desenhar, e o driver decidia como. O DirectX 12 inverteu isso — inspirado no conceito do Vulkan e do Metal (Apple) — e passou a dar ao programador o controle explícito sobre memória, filas de comando e sincronização. É exatamente o mesmo modelo do Vulkan.

Essa semelhança estrutural significa que traduzir DirectX 12 → Vulkan é quase um mapeamento um-para-um: um *command list* vira um *command buffer*, um *descriptor heap* via *descriptor set*, um *fence* vira um *fence*. O VKD3D explora isso. Onde o DXVK (para D3D11) precisa fazer malabarismos para simular um modelo antigo sobre um moderno, o VKD3D apenas transpõe conceitos equivalentes — o que costuma resultar em menos overhead e mais fidelidade.

Isso não quer dizer que seja trivial. DirectX 12 tem recursos sem equivalente direto no Vulkan (como *root signatures* e certos tipos de sombreadores), e o VKD3D precisa emulá-los. Mas o ponto de partida é muito mais favorável do que o do DirectX 9/11.

## VKD3D original vs. VKD3D-Proton

Existem dois projetos com nomes parecidos, e a diferença importa. O **VKD3D** original é mantido pelo WineHQ, com foco precoce em Direct3D 12 sobre Vulkan, mas historicamente mais lento e menos completo em recursos. O **VKD3D-Proton** é o *fork* mantido pela Valve (com contribuições de outros), otimizado para jogos e usado pelo Proton. Quando as pessoas falam de "VKD3D" no contexto do Steam Deck, quase sempre querem dizer o VKD3D-Proton.

```terminal
$ ls ~/.steam/steam/steamapps/common/Proton\ 9.0/dist/lib64/wine/vkd3d-proton/
d3d12.dll
d3d12core.dll
dxil.dll
```

As DLLs do VKD3D-Proton aparecem no prefixo como `d3d12.dll` (o substituto que o jogo carrega) e `d3d12core.dll`. O `dxil.dll` é o compilador DXIL — o bytecode de shader do DirectX 12 — que o VKD3D converte para SPIR-V, o formato de shader do Vulkan. Essa conversão em tempo de execução é uma das partes mais pesadas do processo e é onde surgem muitos bugs.

O VKD3D-Proton evolui rápido, e versões novas chegam junto com novas versões do Proton. Jogos que quebravam numa versão podem funcionar na seguinte, e vice-versa, porque o VKD3D-Proton é o alvo mais ativo de correções da Valve.

## Inspecionando o VKD3D-Proton em ação

Você pode ativar um HUD específico do VKD3D-Proton para ver o que ele está fazendo, e registrar logs detalhados. A variável `VKD3D_CONFIG` controla opções, e `VKD3D_DEBUG` liga o log:

```terminal
$ VKD3D_DEBUG=warn VKD3D_CONFIG=dxr11 \
  ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe 2> vkd3d.log

$ head -20 vkd3d.log
vkd3d-proton: v2.11.1
vkd3d-proton: Build: 2.11.1-1-gabc1234
warn:d3d12:  Unsupported resource state transition (SRV -> RTV)
warn:d3d12:  Emulating fences without timeline semaphore support
info:d3d12:  Creating command queue: DIRECT
```

Cada linha começa com o nível (`info`, `warn`, `err`), seguido do componente (`d3d12`, `vkd3d`, `dxil`). Avisos do tipo *Unsupported resource state transition* ajudam a entender bugs visuais — um efeito que pisca ou não aparece. Erros de `dxil` apontam para shaders que o compilador não conseguiu traduzir.

A versão do VKD3D-Proton empacotada aparece na primeira linha do log, ou pode ser confirmada consultando o arquivo de versão do Proton:

```terminal
$ cat ~/.steam/steam/steamapps/common/Proton\ 9.0/version
9.0-4
```

O número da versão geral do Proton (`9.0-4`) é o que você reporta em bugs; a versão específica do VKD3D-Proton (`2.11.1`) aparece nos logs e é o que os mantenedores do projeto pedem em relatórios.

## Ray tracing e recursos avançados

O VKD3D-Proton é também responsável pelo suporte a **DirectX Raytracing (DXR)**, o recurso de traçado de raios do DirectX 12. O DXR mapeia para os recursos de ray tracing do Vulkan (`VK_KHR_ray_tracing_pipeline`), e o Steam Deck — com GPU RDNA2 que suporta esses recursos — consegue rodar DXR em muitos jogos, ainda que com perdas de desempenho esperadas.

```terminal
$ VKD3D_CONFIG=dxr11 ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe
```

A opção `dxr11` (antiga: `dxr`) habilita o mapeamento de ray tracing. Em jogos com opção de RT, ela precisa estar ativa para que o efeito seja traduzido; sem ela, o jogo pode cair para um fallback sem ray tracing ou apresentar tela preta.

Outros recursos frequentemente negociados pelo VKD3D-Proton incluem *variable rate shading* (VRS), *mesh shaders* e *work graphs* (em DirectX 12 Ultimate). Cada um tem correspondência parcial ou nula no Vulkan, e o VKD3D-Proton emula o que pode e desabilita o que não consegue.

:::nota
`VKD3D_CONFIG` aceita múltiplas opções separadas por vírgula (ex.: `dxr11,force_static_cbv`). Uma lista vazia desativa tudo. Os nomes mudam entre versões do VKD3D-Proton; consulte a documentação de `VKD3D_CONFIG` no repositório do projeto para a sua versão específica, pois opções antigas podem ser ignoradas silenciosamente.
:::

## Diagnóstico de jogos D3D12 problemáticos

Quando um jogo DirectX 12 não abre no Steam Deck, o roteiro de diagnóstico segue uma ordem lógica. Primeiro, confirme que o jogo realmente usa DirectX 12 (muitos títulos oferecem D3D11 e D3D12):

```terminal
$ VKD3D_DEBUG=info ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe 2>&1 | grep -i -E 'd3d12|dxil|vkd3d' | head -10
info:d3d12:  vkd3d-proton 2.11.1
info:d3d12:  Loaded Wine DLL "d3d12.dll"
info:dxil:   Compiled DXIL shader to SPIR-V (1245 instructions)
```

Se o log mostra `d3d12.dll` carregado e shaders sendo compilados, o DirectX 12 está de fato em uso. Se você vê apenas `d3d11.dll`, o jogo caiu para DirectX 11, e o problema é outro.

O passo seguinte é testar variáveis que contornam bugs conhecidos. A variável `VKD3D_SHADER_CACHE_PATH` permite redirecionar o cache de shaders DLX (equivalente ao Fossilize para D3D12):

```terminal
$ VKD3D_SHADER_CACHE_PATH=/tmp/vkd3d-cache \
  ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe
```

Se o jogo funciona com o cache apontado para um diretório limpo, o cache anterior estava corrompido. Esse é um dos diagnósticos mais rápidos e menos documentados para problemas de D3D12.

:::atencao
Jogos D3D12 com anti-cheat (EAC, BattlEye) que não têm suporte a Linux são o caso mais comum de "não abre". Nenhuma configuração de VKD3D-Proton resolve isso — o anti-cheat bloqueia a execução por decisão do kernel ou do serviço, não por falha gráfica. Não gaste horas em logs de VKD3D quando o problema é anti-cheat; verifique primeiro a compatibilidade do título no banco de dados da Valve (ProtonDB).
:::

## Resumo

- DirectX 12 é uma API de baixo nível, estruturalmente próximo do Vulkan, o que facilita a tradução pelo VKD3D.
- VKD3D original (WineHQ) difere do VKD3D-Proton (Valve), que é o usado pelo Proton e o mais ativo.
- O VKD3D-Proton empacota `d3d12.dll` e converte shaders DXIL para SPIR-V em tempo real.
- `VKD3D_DEBUG` gera logs detalhados (info/warn/err), e `VKD3D_CONFIG=dxr11` ativa ray tracing.
- `VKD3D_SHADER_CACHE_PATH` permite testar problemas de cache de shaders DLX.
- Anti-cheat incompatível não é problema de VKD3D-Proton e não se resolve com configuração gráfica.

## Exercícios

1. Gere um log com `VKD3D_DEBUG=info` para um jogo DirectX 12 e identifique a linha que confirma a versão do VKD3D-Proton em uso.
2. Compare as DLLs em `dist/lib64/wine/dxvk/` (seção 3) com as de `dist/lib64/wine/vkd3d-proton/`. Liste quais versões do DirectX cada conjunto cobre.
3. Rode um jogo D3D12 com `VKD3D_DEBUG=warn` e encontre um aviso. Pesquise se ele é inofensivo ou indica um bug conhecido.
4. Teste um jogo D3D12 com ray tracing, com e sem `VKD3D_CONFIG=dxr11`, e descreva a diferença visual e de desempenho.
5. **Desafio.** Um jogo D3D12 apresenta texturas que "piscam" e travamentos aleatórios. Monte um plano de diagnóstico usando `VKD3D_DEBUG`, `VKD3D_SHADER_CACHE_PATH` e a comparação com a versão anterior do Proton, e justifique a ordem dos passos.