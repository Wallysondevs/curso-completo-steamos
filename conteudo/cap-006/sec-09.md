Fechar o capítulo olhando para os bastidores é a forma correta de amarrar tudo o que você navegou. Toda vez que o Modo Jogo "trava", "demora" ou "não conecta", há um rastro em disco esperando ser lido: o journal do systemd, os logs do cliente Steam e os processos vivos. Esta seção ensina um método de diagnóstico em três camadas — processo, aplicativo, sistema — e como interpretar as saídas mais comuns.

:::objetivos
- Aplicar um método de diagnóstico em três camadas (processo, app, sistema)
- Inspecionar processos do Steam e do Gamescope com `ps` e `pstree`
- Ler os logs do cliente em `~/.steam/steam/logs`
- Consultar o journal do sistema com `journalctl`
- Correlacionar sintoma, evidência e causa provável

:::

## O método das três camadas

Quando algo falha, evite o impulso de "desligar e ligar" como primeira e única ação. Em vez disso, suba as camadas de evidência, da mais viva à mais estática:

1. **Processo** — o que está rodando agora? (`ps`, `pstree`, `ss`, `top`)
2. **Aplicativo** — o que o próprio Steam registrou? (`~/.steam/steam/logs/*`)
3. **Sistema** — o que o kernel/systemd viu? (`journalctl`, `dmesg`)

A ordem importa porque cada camada responde a uma pergunta diferente. O processo diz "está vivo ou morto"; o log do app diz "o que o Steam achou que aconteceu"; o journal diz "o que o sistema fez ao processo". Um travamento de jogo, por exemplo, pode mostrar o processo ainda vivo (`ps`), o Steam reclamando de render (`console-linux.txt`) e o kernel sem nenhum registro — direcionando você para um problema de driver/Proton, não de hardware.

## Camada 1: o processo agora

Comece sempre pela pergunta mais barata: o que está de pé?

```terminal
$ ps aux | grep -E 'steam|gamescope|reaper' | grep -v grep
$ pstree -p $(pgrep -f gamescope | head -1)
```

Com isso você responde: o Gamescope está vivo? O `steam` subiu com `-gamepadui`? Existe um `reaper` segurando um jogo? Já vimos essas peças ao longo do capítulo; aqui elas formam o ponto de partida. Se o `gamescope` não aparece, mas a tela está ligada, você sabe que está no Modo Desktop — ou que a sessão caiu.

A memória também conta. Um `steamwebhelper` com uso de RAM crescente e sem teto é causa clássica de lentidão na interface:

```terminal
$ ps -o pid,%mem,cmd -C steamwebhelper --sort=-%mem | head -5
```

Onde `%mem` alto de forma contínua indica vazamento do CEF (o navegador embutido) — sintoma conhecido, e a solução padrão é reiniciar o Steam para zerar a RAM.

## Camada 2: os logs do cliente

Os logs em `~/.steam/steam/logs` são a memória escrita do Steam. Já mapeamos os principais; o que falta é o método de leitura. O arquivo mais denso é o `console-linux.txt`, e ele merece um `tail` com contexto:

```terminal
$ tail -30 ~/.steam/steam/logs/console-linux.txt
```

Procure, de baixo para cima (o `tail` já faz isso), por palavras de erro: `error`, `fail`, `crash`, `assert`, `vulkan`, `dxvk`, `proton`. A maioria dos problemas de "jogo não abre" está nestas linhas — por exemplo, uma mensagem de Vulkan ausente (`VK_ERROR_...`) aponta para driver de GPU, não para o jogo.

```terminal
$ grep -iE 'error|fail|assert|vulkan' ~/.steam/steam/logs/console-linux.txt | tail -12
```

:::dica
Os logs crescem indefinidamente? Não exatamente — o Steam faz rotação em alguns arquivos, mas o `console-linux.txt` pode acumular. Se ele estiver gigante e lento de abrir, você pode truncá-lo com `: > ~/.steam/steam/logs/console-linux.txt` (com o Steam fechado) sem prejuízo: é apenas registro.
:::

## Camada 3: o journal do sistema

O `journalctl` é o diário do systemd, e no SteamOS ele registra desde o boot até a subida da sessão gráfica. Para investigar o Modo Jogo, três invocações cobrem a maior parte:

```terminal
$ journalctl -b -p err | tail -30
```

`-p err` filtra apenas prioridades de erro ou pior — o mapa geral do que deu ruim desde o boot.

```terminal
$ journalctl -b | grep -iE 'gamescope|steam' | tail -30
```

Restringe às menções do Gamescope e do Steam — o coração do Modo Jogo.

```terminal
$ journalctl --user 2>/dev/null | grep -iE 'steam|gamescope' | tail -30
```

Olha o journal **da sessão do usuário** `deck`, onde muitos serviços gráficos (e o próprio Steam em modo user) registram. Se `--user` vier vazio, o Steam roda no escopo de sistema e a segunda invocação já cobre.

A leitura combinada dessas três responde quase tudo: um `-p err` que mostra `amdgpu`/`drm` aponta para a GPU; um grep de `gamescope` com `segfault` aponta para o compositor; um journal limpo confirma que o problema está no aplicativo, não no sistema.

## Sintoma para causa: uma tabela de bolso

Para fechar, um guia de correlação rápida entre o que você **vê** e o que **procurar**:

| Sintoma | Onde olhar | Causa provável |
|---|---|---|
| Tela pisca e volta para o boot | `journalctl -b | grep gamescope` | Queda do compositor (driver/driver desatualizado) |
| Notificações não chegam, jogo online OK | `ss -tnp | grep steam` + `friendui.txt` | Sessão do *CM*/friendui presa |
| Loja não carrega (branca) | `du -sh appcache` + limpar `httpcache` | Cache CEF corrompido |
| Jogo não abre, volta pra biblioteca | `console-linux.txt` (grep `vulkan`/`proton`) | Driver/Proton incompatível |
| Interface lenta | `ps -o %mem -C steamwebhelper` | Vazamento do CEF → reiniciar Steam |
| Steam não sobe no boot | `journalctl -b -p err` | Serviço/falha de sessão |

:::atencao
Evite o hábito de apagar logs "para economizar espaço" sem pensar. Eles são a única janela para diagnósticos posteriores. Trunque com parcimônia e só quando houver motivo real (tamanho excessivo), como descrito na dica acima.
:::

## Um diagnóstico completo, do começo ao fim

Juntando as três camadas numa sessão de verdade, o fluxo para "jogo fecha sozinho" ficaria assim:

```terminal
$ ps aux | grep -E 'steam|gamescope' | grep -v grep
$ tail -20 ~/.steam/steam/logs/console-linux.txt
$ journalctl -b | grep -iE 'oom|killed|gamescope|segfault' | tail -15
```

A última linha é um acréscimo importante: `oom` (out-of-memory) e `killed`. Se o kernel matou o jogo por falta de RAM, a palavra `Killed` (ou `Out of memory`) aparece no journal — e aí o problema não é o Steam, é memória insuficiente para aquele título. Ler isso sozinho já separa "bug do jogo" de "falta de recurso", economizando horas de tentativa e erro.

## Resumo

- Diagnóstico em três camadas: processo (`ps`/`pstree`/`ss`), aplicativo (`logs/*`) e sistema (`journalctl`).
- A camada de processo responde "está vivo?"; a de app, "o que o Steam registrou?"; a de sistema, "o que o kernel fez?".
- `grep` por `error`, `vulkan`, `proton` e `segfault` nos logs isola a maioria das falhas de jogo.
- `journalctl -b -p err` dá o mapa de erros desde o boot; com `grep gamescope` foca no compositor.
- Memória: `ps -o %mem -C steamwebhelper` revela vazamento do CEF; `oom`/`Killed` no journal indica falta de RAM.
- Logs são evidência, não lixo — trunque com critério.

## Exercícios

1. Rode o método completo numa máquina saudável: `ps`, depois `tail` do `console-linux.txt`, depois `journalctl -b -p err`. Descreva o que é normal em cada camada.
2. Identifique os três processos que mais usam memória relatados ao Steam com `ps -o pid,%mem,cmd -C steamwebhelper --sort=-%mem`.
3. Procure no `journalctl` da sessão atual por `gamescope` e transcreva as três linhas mais relevantes, explicando cada uma.
4. Pegue um jogo que já falhou uma vez (ou force uma falha inofensiva) e use o `grep` por `vulkan`/`proton` no `console-linux.txt` para classificar a causa provável.
5. **Desafio.** Integre o capítulo todo: construa um "relatório de saúde" do seu Modo Jogo que inclua (a) o estado do Gamescope, (b) a localização das bibliotecas de jogos, (c) as conexões sociais ativas e (d) os três erros mais recentes do journal. Para cada item, diga o comando usado e a conclusão tirada.
