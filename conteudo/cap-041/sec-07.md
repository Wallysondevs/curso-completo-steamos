O Wine é um tradutor pesado: para cada chamada de API do Windows, ele coordena threads, manipula sincronização e negocia com o kernel Linux. Parte desse custo está no mecanismo de sincronização entre threads — e é aí que entra o Fsync. A variável `WINEFSYNC` liga um backend de sincronização mais rápido que o padrão, reduzindo a sobrecarga de CPU em jogos que dependem muito de threads, como títulos com CPU-bound pronunciado.

:::objetivos
- Entender o que o Fsync muda na sincronização de threads do Wine
- Ativar o Fsync com `WINEFSYNC=1`
- Verificar se o kernel suporta o mecanismo usado pelo Fsync
- Medir o efeito em jogos com gargalo de CPU
- Reconhecer quando o Fsync não ajuda ou não é suportado
:::

## Por que sincronização custa caro

Um jogo moderno roda com dezenas de threads: a principal, as de renderização, as de áudio, as de streaming de textura. Essas threads precisam se coordenar — uma espera a outra terminar de escrever num buffer, sinaliza eventos, protege regiões críticas. No Windows, isso usa um conjunto de primitivas de sincronização que o Wine precisa **emular** sobre as primitivas do Linux.

O comportamento padrão do Wine usa primitivas que funcionam em qualquer ambiente. O Fsync troca por um mecanismo mais eficiente baseado no `futex` do Linux — especificamente as operações do `futex_waitv` — que permitem aguardar múltiplos futex de uma vez. Menos chamadas ao kernel, menos troca de contexto, menos CPU gasta só para "esperar".

```text
WINEFSYNC=1 %command%
```

O efeito prático: nos jogos em que a CPU é o gargalo, o Fsync libera ciclos que o Wine gastava com sincronização, e o jogo roda mais liso.

:::nota
Existe também o Esync (`WINEESYNC=1`), predecessor do Fsync, baseado no `eventfd`. Foi uma melhoria histórica importante, mas foi amplamente substituído pelo Fsync quando o kernel chegou a 5.16 com o `futex_waitv`. O Fsync é mais rápido e menos propenso a esgotar descritores de arquivo.
:::

## Verificando suporte

O Fsync depende de um recurso do kernel recente. No SteamOS 3.6 (kernel nobre, linha 6.x), o suporte está presente. Para confirmar na sua máquina, pergunte ao próprio Wine ou verifique o kernel:

```terminal
$ uname -r
6.5.0-valve21-1-neptune-65
```

A linha `-valve21` e a versão 6.5 indicam um kernel com o `futex_waitv` já disponível (entrou no kernel 5.16). O segundo sinal é o log: rode o jogo com o log do Proton ativo e procure a mensagem de inicialização do backend de sincronização.

```terminal
$ WINEFSYNC=1 PROTON_LOG=1 steam -applaunch 1234560
$ grep -i "fsync" ~/steam-1234560.log
fsync: up and running.
```

A linha `fsync: up and running.` no log do Proton confirma que o backend Fsync foi carregado com sucesso. Se em vez disso aparecer uma mensagem de *fallback*, é sinal de que o kernel ou a configuração não permitiu o mecanismo, e o Wine voltou ao comportar padrão silenciosamente.

:::atencao
Fsync quase sempre é seguro, mas há casos raros de jogos que se comportam mal com ele (travamentos ou corridas de dados que o backend padrão mascarava). Se um jogo começar a travar após ligar o Fsync, desligue e teste. O custo de reverter é zero.
:::

## Onde o Fsync ajuda de verdade

O Fsync não aumenta o FPS de forma uniforme. Ele ajuda quando a CPU está saturada e uma fração significativa desse tempo é gasta em sincronização:

- Jogos de estratégia e simulação com muitos atores (CPU-bound clássico).
- Jogos com física pesada e muitas entidades independentes.
- Emuladores que usam threads abundantes.

Em jogos limitados pela GPU (a maioria dos títulos AAA no Deck), o Fsync tem efeito pequeno ou nulo, porque a CPU nem era o gargalo. Medir é essencial para não perseguir ganho ilusório.

```terminal
$ WINEFSYNC=1 MANGOHUD=1 %command%
```

Com o MangoHud mostrando o uso de CPU por núcleo, você vê se a CPU está perto do teto. Se estiver abaixo de 70% na média e o FPS estiver travado, o gargalo é a GPU e o Fsync não vai mudar quase nada.

Um refinamento importante: o gargalo de CPU pode estar em **um único núcleo** saturado, mesmo quando a média geral é baixa. Jogos com um thread principal pesado (física, lógica de script) exibem isso claramente:

```terminal
$ mpstat -P ALL 2 5 | tail -10
02:15:31 PM  CPU    %usr  %nice   %sys  %idle
02:15:33 PM  all   24.08   0.00   4.62  71.30
02:15:33 PM    0   92.05   0.00   6.50   1.45
02:15:33 PM    1   12.00   0.00   2.00  86.00
02:15:33 PM    7    8.50   0.00   1.50  90.00
```

Aqui o núcleo `0` está em `92%` enquanto os demais quase ociosos. Isso é CPU-bound num único thread — cenário típico em que o Fsync tem mais chance de ajudar, ao reduzir a disputa de sincronização que o thread principal sente. Para essa medição, o pacote `sysstat` (que fornece o `mpstat`) pode ser instalado no desktop do Deck.

:::dica
A ordem de experimentação eficiente: primeiro descubra onde está o seu gargalo (CPU ou GPU) com o MangoHud. Só invista tempo em `WINEFSYNC` se a CPU estiver saturada. Caso contrário, seus ciclos de otimização rendem mais em resolução/FSR ou nas flags de GPU.
:::

## Resumo

- `WINEFSYNC=1` liga o backend de sincronização Fsync, baseado no `futex_waitv` do Linux.
- O Fsync reduz a sobrecarga de CPU do Wine na coordenação entre threads.
- Exige kernel 5.16+; o SteamOS 3.6 já o suporta.
- `fsync: up and running.` no log do Proton confirma que o backend foi carregado.
- O ganho aparece quando a CPU é o gargalo; em jogos limitados pela GPU, é quase inexpressivo.

## Exercícios

1. Confirme o suporte do kernel com `uname -r` e verifique se a versão é igual ou superior a 5.16.
2. Rode um jogo com `WINEFSYNC=1 PROTON_LOG=1 steam -applaunch <appid>` e procure por `fsync` no log.
3. Use o MangoHud para identificar se um jogo seu é CPU-bound ou GPU-bound.
4. Teste um jogo CPU-bound com e sem `WINEFSYNC=1` e compare o FPS médio.
5. **Desafio.** Relacione Fsync, Esync e o cache de shaders: explique em que cada um atua (sincronização vs. compilação) e monte uma linha única que ligue Fsync e o HUD de pipelines do DXVK.