No fundo de toda a conversa sobre serviços existe um conceito que agrupa tudo: os **targets**. Um target é um ponto de sincronização — um nome coletivo para "o conjunto de unidades que precisa estar de pé para o sistema estar em um certo estado". Boot, troca de modo de vídeo, suspensão e desligamento são todos targets. Entendê-los destrava duas capacidades: ver o mapa do boot e controlar em que modo o sistema entra.

:::objetivos
- Entender o que é um target e como ele agrupa serviços
- Identificar o target padrão do sistema com `get-default` e `default.target`
- Mapear os targets do boot com `systemd-analyze critical-chain`
- Trocar o modo de operação com `systemctl isolate`
- Relacionar targets aos antigos runlevels do SysV
:::

## Targets não são serviços

A confusão mais comum é achar que target é "um serviço grandão". Não é: um target **não executa nada**. Ele é apenas um rótulo que outros units apontam para dizer "quando você quiser que eu suba, procure aqui". O mecanismo é o `Wants=` e o `Requires=` dentro de cada serviço, que declaram de quais targets ele depende.

O target mais importante de todos é o `graphical.target` — o estado de "sistema gráfico completo". Enquanto o SysV init chamava isso de "runlevel 5", o systemd chama assim:

```terminal
$ systemctl get-default
graphical.target
$ systemctl list-units --type=target --all --no-pager
UNIT                  LOAD   ACTIVE   SUB    DESCRIPTION
graphical.target      loaded active   active Graphical Interface
multi-user.target     loaded active   active Multi-User System
basic.target          loaded active   active Basic System
sockets.target        loaded active   active Sockets
...
```

`get-default` responde à pergunta "em que modo o sistema liga?" e devolve o alvo padrão. No Steam Deck, isso é `graphical.target`, que conclui no modo Gaming (ou no desktop KDE, conforme a sessão escolhida). A listagem mostra os targets ativos, cada um representando um degrau atingido no boot — do `basic.target` (fundações) ao `multi-user.target` (sistema multiusuário sem GUI) e ao `graphical.target` (GUI completa).

## A correspondência com os runlevels

Quem vem do SysV init conhece os runlevels (0 a 6). O systemd mapeia cada um para um target, e a tabela abaixo é a ponte entre os dois mundos:

| Runlevel | Target do systemd | Significado |
|---|---|---|
| 0 | `poweroff.target` | Desligar |
| 1 | `rescue.target` | Modo de resgate (usuário único) |
| 2, 3, 4 | `multi-user.target` | Multiusuário, sem GUI |
| 5 | `graphical.target` | Multiusuário com GUI |
| 6 | `reboot.target` | Reiniciar |

Saber essa tabela ajuda a ler documentação antiga e a reconhecer que o runlevel era um número opaco, enquanto o target tem nome descritivo. O restante desta seção usa os nomes do systemd.

## O mapa do boot, de trás para frente

O `systemd-analyze` é o radar do boot. Junto com o `critical-chain`, ele desenha a linha de dependências que levou o sistema do nada até o target ativo — revelando o que atrasa a inicialização:

```terminal
$ systemd-analyze critical-chain
The time when unit became active or started is printed after the "@" character.
The time the unit took to start is printed after the "+" character.

graphical.target @10.021s
└─multi-user.target @10.021s
  └─NetworkManager.service @6.312s +2.14s
    └─network-pre.target @6.301s
      └─systemd-timesyncd.service @5.010s +981ms
        └─systemd-sysusers.service @4.210s +158ms
          └─systemd-tmpfiles-setup.service @3.012s +1.19s
            └─basic.target @2.901s
```

Lendo de baixo para cima, você vê a escada: o `basic.target` é atingido aos 2,9 s, depois vem o setup de temporários, a configuração de usuários do sistema, a sincronização de relógio (`timesyncd`), o `network-pre.target` e, finalmente, o `NetworkManager`, que levou 2,14 s para ficar pronto e destravou o `multi-user.target` e o `graphical.target`, completados aos 10 s.

O `+2.14s` ao lado do `NetworkManager` é o tempo que ele gastou sozinho — o elo mais lento da corrente. Se você quer arrancar mais rápido, é por aí que começa. Para o panorama geral dos maiores retardatários:

```terminal
$ systemd-analyze blame
9.32s NetworkManager.service
2.14s systemd-tmpfiles-setup.service
1.19s systemd-logind.service
...
```

`blame` lista os serviços ordenados pelo tempo que cada um levou, do pior para o melhor. É a ferramenta obrigatória quando alguém reclama que "o boot está demorando" — em vez de chutar, você mede.

:::dica
`systemd-analyze critical-chain` mostra a corrente crítica (o caminho mais demorado); `systemd-analyze blame` mostra o ranking individual. Use os dois juntos: o `blame` acha o vilão, o `critical-chain` mostra como ele atrasa todo mundo que depende dele.
:::

## Mudando de modo com isolate

Você não precisa reiniciar para ir a um estado diferente. O `systemctl isolate` desloca o sistema de um target a outro, parando o que não pertence ao novo modo:

```terminal
$ sudo systemctl isolate rescue.target
```

Isso derruba a GUI e leva o sistema ao modo de resgate (um terminal único, mínimo, para manutenção). Para voltar ao modo gráfico:

```terminal
$ sudo systemctl isolate graphical.target
```

O mesmo mecanismo é o que os comandos de desligamento usam por baixo: `poweroff` é, na prática, um `systemctl isolate poweroff.target`; `reboot`, um `isolate reboot.target`. Você pode pedir diretamente:

```terminal
$ systemctl isolate reboot.target
```

:::perigo
`isolate` desliga qualquer unidade que não faça parte do target de destino. Isolar `rescue.target` fecha seu jogo, sua sessão e a GUI — tudo sem salvar. Só use quando estiver preparado para perder o trabalho não salvo, e prefira `rescue.target` (que mantém o disco montado) ao invés de desligar na marra.
:::

Nem todo target pode ser isolado à vontade. O alvo precisa declará-lo explicitamente. O comando `systemctl show -p AllowIsolate` confirma:

```terminal
$ systemctl show graphical.target -p AllowIsolate
AllowIsolate=yes
$ systemctl show basic.target -p AllowIsolate
AllowIsolate=no
```

`basic.target` é `AllowIsolate=no` porque isolá-lo deixaria o sistema num estado inutilizável (sem rede, sem login, sem quase nada). Já `graphical.target` e `rescue.target` são pensados para receber o `isolate`. Ao trocar o `default.target`, você muda permanentemente onde o sistema liga:

```terminal
$ sudo systemctl set-default multi-user.target
Removed /etc/systemd/system/default.target.
Created symlink /etc/systemd/system/default.target → /usr/lib/systemd/system/multi-user.target.
```

O `set-default` mexe apenas num symlink: o `default.target` passa a apontar para o alvo desejado. Para voltar ao boot gráfico, basta `set-default graphical.target`.

## Resumo

- Um target não executa nada; ele é um rótulo de sincronização que agrupa services via `Wants=`/`Requires=`.
- `systemctl get-default` mostra o modo de boot padrão (no Steam Deck, `graphical.target`).
- Os runlevels 0–6 do SysV correspondem a targets como `poweroff`, `rescue`, `multi-user` e `graphical`.
- `systemd-analyze critical-chain` e `blame` mapeiam a corrente de dependências e acham o serviço mais lento do boot.
- `systemctl isolate` troca de modo ao vivo; `set-default` muda o modo padrão do boot; apenas targets com `AllowIsolate=yes` aceitam isolamento.

## Exercícios

1. Rode `systemctl get-default` e `systemctl list-units --type=target --no-pager`; escreva, numa frase, em que estado o seu Deck liga.
2. Execute `systemd-analyze critical-chain` e desenhe (em texto) a escada de targets e serviços até o `graphical.target`.
3. Rode `systemd-analyze blame` e identifique o serviço que mais tempo consome no boot; verifique se ele é mencionado na seção 4 deste capítulo.
4. Inspecione com `systemctl show graphical.target -p AllowIsolate` e, no `basic.target`, a mesma propriedade; explique por que os valores diferem.
5. **Desafio.** Use `systemd-analyze plot > boot.svg` para gerar um gráfico SVG do boot e, com o `systemd-analyze critical-chain` em mãos, localize no gráfico o serviço mais lento e proponha uma hipótese de otimização (não é preciso aplicar).