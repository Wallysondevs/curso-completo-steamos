Todo SSD conta com uma operação escondida que decide a longevidade e a velocidade dele: o **TRIM**. Sem TRIM, o SSD não sabe quais blocos de dados foram apagados do ponto de vista do sistema, e passa a reescrever blocos "mortos" desnecessariamente. Com o tempo, a escrita fica mais lenta e o desgaste das células aumenta. No Steam Deck, onde o armazenamento é uma peça única e difícil de trocar, cuidar do TRIM é uma das poucas otimizações que protege hardware de verdade.

:::objetivos
- Entender por que SSDs envelhecem e o papel do TRIM
- Diferenciar TRIM contínuo (`discard`) e agendado (`fstrim`)
- Identificar se o TRIM está habilitado no SteamOS
- Executar e verificar uma rodada de `fstrim`
- Correlacionar TRIM com o sistema de arquivos do Deck
:::

## Por que SSD e HD apagam diferente

Num disco magnético (HD), apagar um arquivo é barato: o sistema só marca o setor como "livre" e sobrescreve quando quiser. O disco não se importa. Num SSD, a coisa muda porque o chip NAND não pode sobrescrever um bit — ele precisa **apagar** um bloco inteiro antes de gravar. Apagar é a operação mais cara e a que mais desgasta as células.

Se o controlador do SSD não souber que um bloco está livre, ele gasta uma operação de apagar (e um ciclo de vida) em blocos que o sistema já considerava vazios. O TRIM resolve isso: é o comando que o sistema envia ao SSD dizendo "esses blocos podem ser apagados agora". Assim, o controlador mantém uma fila de blocos livres prontos, e a gravação acontece sem o apagar pesado no meio do caminho.

```terminal
$ lsblk -o NAME,SIZE,ROTA,DISC-GRAN,DISC-MAX,MODEL
NAME        SIZE ROTA DISC-GRAN DISC-MAX MODEL
nvme0n1   476.9G    0       512B      4G Sabrent Rocket Q4
```

A coluna `ROTA=0` confirma que é um SSD (discos rotativos têm `ROTA=1`). `DISC-GRAN` e `DISC-MAX` indicam que o dispositivo suporta `discard`: se esses campos existem e não estão vazios, o TRIM funciona. Um HD comum mostraria esses campos zerados.

## Discard contínuo versus fstrim agendado

Existem duas formas de entregar o TRIM ao SSD:

- **Discard contínuo** (`discard`): a cada `rm` ou `truncate`, o sistema envia o comando TRIM na hora para o bloco afetado. É simples, mas adiciona uma chamada ao controlador a cada apagamento — em cargas com muitas escritas pequenas, isso pode introduzir latência.
- **fstrim agendado**: um processo roda periodicamente (por `systemd` ou cron) e varre o sistema de arquivos achando todos os blocos que viraram livres desde a última rodada, enviando o TRIM em lote. É o padrão recomendado para SSDs do consumidor.

O SteamOS segue a abordagem agendada. O sistema monta os volumes sem a flag `discard` para evitar o custo contínuo, e usa um timer do `systemd` para disparar o `fstrim` de tempos em tempos.

```terminal
$ mount | grep -E 'nvme|mmcblk'
/dev/nvme0n1p4 on /home type ext4 (rw,relatime)
/dev/nvme0n1p2 on / type ext4 (ro,relatime)
```

Repare que as opções de montagem (`rw,relatime`) **não** incluem `discard`, confirmando que o Deck não usa TRIM contínuo. O `fstrim` agenda o trabalho, e o ideal é que ele esteja ativo por uma unidade do `systemd`.

:::info
O SteamOS 3.6 usa ext4 na partição raiz e em `/home`. O ext4 suporta ambos os modos (discard e fstrim). O Btrfs — que alguns usuários usam em cartões microSD — também suporta, mas vale checar se está habilitado no volume onde você instala jogos.
:::

## Verificando e executando o TRIM

A forma mais direta de confirmar que o TRIM está rodando é checar o timer do `systemd`. Nas distribuições baseadas em systemd, o job chama-se `fstrim.timer`:

```terminal
$ systemctl status fstrim.timer
● fstrim.timer - Discard unused blocks once a week
     Loaded: loaded (/usr/lib/systemd/system/fstrim.timer; enabled; vendor preset: enabled)
     Active: active (waiting) since Mon 2025-01-20 09:12:33 UTC; 3 days ago
    Trigger: Mon 2025-01-27 00:00:00 UTC
   Triggers: ● fstrim.service
```

O status `active (waiting)` e a linha `Trigger` mostram quando a próxima rodada vai acontecer — aqui, semanalmente. Se estiver `inactive`, o TRIM agendado está desligado e nada está mantendo o SSD saudável.

Para rodar na hora, use o comando `fstrim` diretamente. O primeiro argumento é o ponto de montagem:

```terminal
# fstrim -v /home
/home: 187.9 GiB (201740963840 bytes) trimmed
```

A opção `-v` (verbose) imprime quanto espaço foi liberado. Rodar manualmente devolve a mesma limpeza que o timer faria, útil logo após desinstalar vários jogos grandes.

:::atencao
`fstrim` é seguro para o SSD, mas não o rode abusivamente. Uma rodada semanal é suficiente; rodar a cada boot é desperdício. O que você **não** deve confundir é TRIM com zero-fill (gravar zeros no disco), que desgasta as células sem benefício de desempenho no SSD.
:::

## O microSD tem suas próprias regras

Muitos usuários instalam jogos num cartão microSD para expandir o espaço. O microSD é flash NAND como um SSD, mas a gambiarra de adaptação e o controlador embutido são mais simples, e o suporte a TRIM pode variar. Alguns cartões não anunciam suporte a `discard` corretamente, e mandar TRIM pode não surtir efeito.

```terminal
$ fstrim -v /run/media/deck/EXTGAME
fstrim: /run/media/deck/EXTGAME: the discard operation is not supported
```

Se o `fstrim` devolver essa mensagem, o cartão (ou a montagem dele) não suporta TRIM. Nesse caso, a melhor proteção é manter espaço livre no cartão — o controlador usa o espaço vago como área de *over-provisioning* para nivelar o desgaste, mesmo sem TRIM.

:::dica
Deixe sempre 10-15% do SSD ou microSD livres se possível. Espaço livre é o que dá ao controlador material para nivelamento de desgaste e para manter uma fila de blocos prontos. Encher o disco até o último gigabyte é uma das formas mais rápidas de degradar um SSD.
:::

## Resumo

- SSD não sobrescreve; ele apaga blocos inteiros antes de gravar, e TRIM avisa o controlador quais blocos podem ser apagados.
- TRIM contínuo (`discard`) age a cada apagamento; `fstrim` agendado limpa em lote e é o padrão do SteamOS.
- `fstrim.timer` do systemd deve estar `active (waiting)`; `fstrim -v <ponto>` roda a limpeza manualmente.
- O SteamOS não usa `discard` na montagem, confirmável pelas flags sem `discard` no `mount`.
- microSD pode não suportar TRIM; nesse caso, manter espaço livre é a proteção essencial.

## Exercícios

1. Confirme que seu disco é SSD com `lsblk -o NAME,ROTA,DISC-MAX`. O campo `DISC-MAX` está preenchido?
2. Verifique o estado do `fstrim.timer` com `systemctl status fstrim.timer`. Qual é a próxima data de rodada?
3. Rode `sudo fstrim -v /home` e interprete o número de bytes liberados. Compare com o espaço total da partição.
4. Inspecione as flags de montagem de todos os volumes com `mount | grep -E 'nvme|mmcblk'`. Algum usa `discard`?
5. **Desafio.** Explique por que rodar `fstrim` toda hora não melhora o SSD, e como o conceito de *over-provisioning* (espaço livre reservado) se relaciona com a saúde de longo prazo do armazenamento.