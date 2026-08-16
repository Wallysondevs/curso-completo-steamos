Quando um jogo que roda bem no PC abre uma tela preta no Steam Deck, ou fecha segundos depois do launch, a primeira reação costuma ser reinstalar, mexer em opções aleatórias ou culpar o Proton. Reinstalar não resolve nada, porque o problema raramente está nos arquivos do jogo: ele está em como o Proton tradutor empilha Vulkan, DXVK e os runtimes em cima do título. Resolver problemas com Proton é, antes de tudo, uma disciplina de **diagnóstico**: coletar evidência, isolar variáveis e testar uma mudança por vez.

:::objetivos
- Coletar as informações mínimas antes de mudar qualquer configuração
- Rotular o jogo pelo appid e localizar seu diretório de compatibilidade
- Ativar o log do Proton e identificar em qual etapa ele trava
- Interpretar códigos de retorno e mensagens de falha mais comuns
- Montar uma checklist reproduzível para isolar a causa
:::

## O triângulo do problema

Todo título Windows rodando no Steam Deck atravessa a mesma pilha em três camadas. **Em cima**, o jogo e seus middlewares (DirectX, vídeos, anticheat). **No meio**, o Proton, que traduz chamadas da API do Windows para o Linux. **Embaixo**, a pilha gráfica do Linux: Vulkan, DXVK (que converte Direct3D 9/10/11 em Vulkan) e VKD3D (que faz o mesmo com Direct3D 12). Um crash em qualquer uma dessas camadas produz sintomas diferentes.

- **Tela preta com áudio funcionando** costuma ser a camada gráfica (DXVK/VKD3D ou o driver Vulkan).
- **Fecha imediatamente, sem janela** quase sempre é o Proton ou um runtime ausente.
- **Trava no logo ou no launcher** é middleware do próprio jogo, muitas vezes detectável no log.

Antes de tocar em qualquer coisa, reúna três fatos que você vai precisar em toda esta seção e nas demais deste capítulo.

```terminal
$ ls ~/.local/share/Steam/steamapps/common/
A Short Hike/   Hades/   The Witcher 3/   ...
$ ls ~/.local/share/Steam/steamapps/compatdata/
1245620/  405100/  813780/   ...
```

O primeiro diretório guarda os arquivos instalados do jogo. O segundo, `compatdata`, guarda um **prefixo de compatibilidade** por jogo — uma árvore estilo Windows (`drive_c`, `Program Files`, um `pfx`) criada pelo Proton para cada título. Cada subdiretório tem o nome do **appid**, o número único do jogo na Steam. Você vai precisar desse número em praticamente todos os comandos deste capítulo.

## Descobrindo o appid

O appid aparece na URL da loja do jogo, na propriedade da steam e, para títulos Comprados, direto no disco. Para achá-lo a partir do diretório instalado:

```terminal
$ grep -m1 '"appid"' ~/.local/share/Steam/steamapps/appmanifest_405100.acf
	"appid"		"405100"
	"name"		"Hades"
$ ls ~/.local/share/Steam/steamapps/ | grep acf
appmanifest_405100.acf
appmanifest_813780.acf
appmanifest_1245620.acf
```

Cada arquivo `appmanifest_*.acf` corresponde a um jogo instalado, e o número no nome é o próprio appid. O campo `"name"` confirma qual título é qual.

:::dica
Anote o appid num lugar fixo. Você vai reusá-lo em `protontricks`, no caminho do `pfx` e até em relatórios de bug. Com o jogo em execução, dá para listar o app de um processo com `ps aux | grep -i proton` e conferir o número no caminho do prefixo.
:::

## Ativando e coletando o log do Proton

O Proton escreve um log detalhado quando você adiciona a variável `PROTON_LOG=1` nas opções de launch do jogo. No Steam Deck, abra o jogo, vá em **Propriedades → Geral → Opções de launch** e escreva:

```bash
PROTON_LOG=1 %command%
```

O `%command%` é o marcador que o Steam substitui pelo comando real de lançamento — a variável precisa vir antes dele. Ao rodar, o Proton gera um arquivo no seu `$HOME` com o padrão `steam-<appid>.log`.

```terminal
$ PROTON_LOG=1 ls ~ | grep steam-
steam-405100.log
$ cat ~/steam-405100.log | head -20
======================
Proton: 1694565123 proton-9.0-2
SteamGameId: 405100
Command: ['/home/deck/.local/share/Steam/steamapps/common/Hades/x64/Hades.exe']
Options: {'forcelgadd', 'winedbg'}
======================
wineserver: using server-side synchronization.
wine: RLIMIT_NICE is <= 20, unable to use setpriority safely
...
```

As primeiras linhas já entregam a versão do Proton, o appid e o executável real. Mais abaixo você encontra a linha exata onde a pilha quebrou.

:::atencao
O log do Proton cresce rápido e sobrevive entre sessões — ele **acumula** no `$HOME`. Se você testar dez vezes, o arquivo é reescrito, não anexado, o que na prática é bom: cada rodada mostra só a última execução. Limpe periodicamente com `rm ~/steam-*.log` para não meter entulho no home.
:::

## Lendo o log como um roteiro

Procure primeiro as linhas de `err` e `fixme`. `fixme` (de *fix me*) são avisos barulhentos mas quase sempre inofensivos; `err` costuma indicar o ponto real da falha. Use o `grep` para focar:

```terminal
$ grep -iE 'err:|trace:|d3d11|vkd3d' ~/steam-405100.log | tail -20
warn:  Skipping Vulkan 1.0 adapter: llvmpipe (LLVM 15.0.7, 128 bits)
err:   D3D11CreateDevice: Failed to create device
err:   Failed to create D3D11 device (0x887a0005)
```

Aqui o erro é claro: o D3D11 não conseguiu criar o dispositivo gráfico, e a pista está numa linha acima — o sistema escolheu o `llvmpipe`, um renderizador de software, em vez da GPU real. Isso indica que o driver Vulkan da GPU (Mesa) não foi detectado, um caso clássico que este capítulo trata a fundo.

:::nota
O Proton tradutor é um projeto da Valve que combina o Wine com bibliotecas próprias (DXVK, VKD3D-Proton, FAudio). Ele está em evolução constante: uma versão nova pode tanto corrigir um bug do seu jogo quanto introduzir outro. Trocar a versão do Proton é sempre uma variável válida de teste — veja [como escolher a versão do Proton](#/cap-042/sec-04).
:::

## A checklist do diagnóstico

Antes de qualquer remédio, percorra esta sequência. Ela existe para você não saltar direto para a solução errada.

1. **Reproduza duas vezes.** Se o crash não for consistente, anote o que fez na última tentativa.
2. **Confirme a versão do Proton** em Propriedades → Compatibilidade.
3. **Ative `PROTON_LOG=1`** e rode de novo, capturando o log.
4. **O jogo usa Direct3D 11/12?** Cheque o site do título ou o log (`d3d11`, `dxvk`, `vkd3d`).
5. **Há anticheat?** EasyAntiCheat e BattlEye são uma categoria própria de falha — ver [a seção de anticheat](#/cap-042/sec-08).

:::dica
Teste **uma mudança por vez**. Se você troca o Proton, força o DXVK_ASYNC e instala um runtime de uma vez, quando funcionar você não saberá qual foi o fator decisivo — e vai repetir todo o ritual no próximo problema.
:::

## Resumo

- Todo jogo Windows no Deck atravessa jogo, Proton e pilha gráfica Linux; cada camada tem sintomas próprios.
- O appid identifica o jogo e nomeia seu `appmanifest_*.acf` e sua pasta em `compatdata/`.
- `PROTON_LOG=1 %command%` gera `~/steam-<appid>.log`, que revela versão do Proton, appid e ponto da falha.
- `err` aponta o problema; `fixme` é aviso normalmente inofensivo.
- Renderizador `llvmpipe` aparecendo no log indica GPU não detectada pelo Vulkan.
- Diagnóstico eficaz testa uma variável por vez, sempre começando pelo log.

## Exercícios

1. Liste seus jogos instalados com `ls ~/.local/share/Steam/steamapps/common/` e cruze cada pasta com um `appmanifest_*.acf` para montar uma tabela nome → appid.
2. Pegue um jogo seu com problema, ative `PROTON_LOG=1 %command%` e rode até falhar. Localize o arquivo `~/steam-<appid>.log` e leia as 30 primeiras linhas.
3. No log anterior, rode `grep -iE 'err:|fixme:' ~/steam-<appid>.log | sort | uniq -c | sort -rn` e identifique as duas mensagens mais frequentes. São `err` ou `fixme`?
4. Encontre o prefixo do seu jogo em `compatdata/<appid>/pfx` e liste o conteúdo de `drive_c` para entender a estrutura estilo Windows.
5. **Desafio.** Quebre de propósito: aponte um jogo para um Proton antigo e registre, pelo log, se a falha acontece *antes* de carregar o DXVK ou *depois*. Use a presença (ou ausência) da linha `dxvk` para localizar a camada responsável.
