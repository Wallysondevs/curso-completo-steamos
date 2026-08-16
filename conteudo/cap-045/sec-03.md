Nem todo mod é cosmético. Quando você quer dinheiro infinito, noclip ou zerar o cooldown de habilidades, está no território dos *trainers* — programas que manipulam a memória do processo do jogo em tempo real. No Linux, isso envolve uma camada extra: o trainer precisa enxergar o processo através do Wine, o que introduz desafios e restrições que não existem no Windows.

:::objetivos
- Entender como trainers injetam código na memória de um processo via Wine
- Instalar e usar o Cheat Engine dentro do prefixo Wine
- Configurar permissões de `ptrace` para que o Cheat Engine funcione no Deck
- Usar scanmem e GameConqueror como alternativas nativas Linux
- Identificar os riscos de banimento associados a manipulação de memória
:::

## Como trainers funcionam (e por que o Proton complica)

Um trainer típico faz três coisas: (1) localiza o processo do jogo pelo nome ou PID, (2) escaneia a memória em busca de valores conhecidos (ex.: seu ouro atual = 3847), (3) reescreve esses valores ou injeta código para mantê-los fixos. No Windows, isso é feito com `ReadProcessMemory` e `WriteProcessMemory` da API Win32.

No Proton, o jogo roda como processo Linux comum. O Wine traduz as chamadas Win32 para chamadas Linux equivalentes — e a manipulação de memória passa pelo subsistema `ptrace`. Isso significa que o trainer precisa das mesmas permissões de `ptrace` que um debugger qualquer. O Steam Deck, por padrão, restringe `ptrace` por segurança. A primeira coisa a fazer é:

```terminal
$ sudo sysctl kernel.yama.ptrace_scope=0
kernel.yama.ptrace_scope = 0
```

O valor `0` permite que qualquer processo faça `ptrace` em qualquer outro processo do mesmo usuário. O valor padrão `1` restringe a processos pai/filho. Essa configuração não persiste após reboot — para torná-la permanente:

```terminal
$ echo "kernel.yama.ptrace_scope = 0" | sudo tee /etc/sysctl.d/10-ptrace.conf
kernel.yama.ptrace_scope = 0
```

:::perigo
Desabilitar `ptrace_scope` permite que qualquer programa que você execute leia e modifique a memória de qualquer outro processo. Isso inclui malware. Reative (`ptrace_scope=1`) quando não estiver usando trainers, especialmente se o Deck for usado para tarefas além de jogos.
:::

## Cheat Engine dentro do prefixo

O Cheat Engine é o trainer mais popular do Windows — e funciona no Proton quando instalado dentro do prefixo do jogo-alvo. A instalação é direta:

```terminal
$ protontricks 292030 "C:\users\steamuser\Downloads\CheatEngine75.exe"
## Instalador do Cheat Engine em modo silencioso
## Concluído. Atalhos criados no menu Iniciar do prefixo.
```

Depois de instalado, execute o Cheat Engine diretamente no prefixo:

```terminal
$ protontricks -c 'wine "C:\Program Files\Cheat Engine 7.5\cheatengine-x86_64.exe"' 292030
Cheat Engine 7.5 inicializado.
Aguardando seleção de processo...
```

O Cheat Engine lista os processos visíveis dentro do prefixo. Selecione o `.exe` do jogo (`witcher3.exe`, por exemplo), escolha o tipo de valor (4 bytes para a maioria dos números inteiros), escaneie, faça o valor mudar no jogo e reescaneie até isolar o endereço. O fluxo é idêntico ao do Windows.

```terminal
## No Cheat Engine, após dois scans:
$ ## Endereço encontrado: 0x7FF5A3C0B810
$ ## Valor atual: 8472 (ouro)
$ ## Alterado para: 999999
```

:::atencao
O Cheat Engine tenta instalar software adicional (adware) durante o setup. No instalador, recuse todas as ofertas de "optional software" marcando "Skip" ou "Decline". Melhor ainda: baixe a versão portable do site oficial, que não tem instalador.
:::

## Alternativas nativas: scanmem e GameConqueror

Para quem prefere não depender do Wine, existem ferramentas nativas Linux. O `scanmem` é um scanner de memória via linha de comando, e o GameConqueror é sua interface gráfica.

```terminal
$ sudo apt install scanmem gameconqueror
$ gameconqueror &
```

O GameConqueror é minimalista, mas funcional. Ele escaneia `/proc/<pid>/mem` diretamente, sem camada de tradução. A desvantagem: ele não entende estruturas de memória do Windows — você escaneia o espaço de endereçamento do processo Linux hospedeiro, que é maior e mais ruidoso. Na prática, scans são mais lentos e exigem mais iterações.

O `scanmem` por linha de comando:

```terminal
$ scanmem
> pid 18374
info: maps file located at /proc/18374/maps
> 8472
info: we currently have 428317 matches.
> 9120
info: we currently have 18 matches.
> 9994
info: we currently have 1 matches.
> set 999999
info: setting *0x7f4a1c80b810 to 999999...
```

A diferença de endereços (`0x7FF5...` vs `0x7f4a...`) revela que o `scanmem` enxerga o espaço Linux, não o espaço virtual do Wine. O endereço muda a cada execução por causa do ASLR; você precisa reescanear a cada sessão.

## Riscos de banimento

Manipular memória dispara sistemas anticheat. Mesmo em jogos single-player, alguns títulos com componente online (Dark Souls, Elden Ring, Genshin Impact) banem contas quando detectam `ptrace` ou assinaturas de Cheat Engine em memória. No Proton, a detecção é menos agressiva porque o anticheat roda em userspace — [ver seção sobre anticheat](#/cap-045/sec-07). Ainda assim:

- Nunca use trainers em jogos multiplayer.
- Feche o Cheat Engine antes de abrir qualquer jogo online, mesmo que não seja o alvo.
- Desabilite `ptrace_scope=0` depois de terminar a sessão single-player.

## Resumo

- Trainers manipulam memória via `ptrace`, que precisa ser desbloqueado com `kernel.yama.ptrace_scope=0` no Deck.
- O Cheat Engine funciona dentro do prefixo Wine e opera de forma quase idêntica ao Windows.
- Alternativas nativas como `scanmem` e GameConqueror fazem scans diretos em `/proc/<pid>/mem` sem depender do Wine.
- Endereços de memória diferem entre a visão Wine e a visão Linux; escaneie sempre na camada correta.
- Ferramentas de manipulação de memória disparam anticheat e devem ser usadas exclusivamente offline.

## Exercícios

1. Altere `kernel.yama.ptrace_scope` para 0 e confirme com `sysctl kernel.yama.ptrace_scope`. Depois restaure o valor original.
2. Instale o Cheat Engine dentro do prefixo de um jogo single-player via `protontricks`. Localize e altere um valor numérico simples (vida, munição ou moeda).
3. Repita o exercício 2 usando `scanmem` em vez do Cheat Engine. Compare o número de iterações de scan necessárias.
4. Use o GameConqueror para encontrar e congelar um valor. O que acontece quando você fecha o GameConqueror sem "descongelar" o valor?
5. **Desafio.** Escreva um script bash que lance um jogo, aguarde 15 segundos, execute `scanmem` com um comando pré-definido para alterar um valor, e se encerre. Teste com um jogo que você conhece bem.