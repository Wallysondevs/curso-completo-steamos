Instalar a impressora resolve só a metade do caminho; a outra metade é o que acontece depois que você manda um documento e ele entra na fila. O CUPS mantém uma **fila de trabalhos** persistente, cada um com um número, um dono, um tamanho e um estado. Saber enxergar essa fila, cancelar um trabalho preso e diagnosticar um trabalho que "some" é o que transforma a impressão de caixa-preta em algo previsível.

:::objetivos
- Enviar trabalhos de impressão via `lp` e `lpr`
- Listar e interpretar a fila de trabalhos com `lpq`/`lpstat`
- Cancelar trabalhos específicos com `cancel` e `lprm`
- Diagnosticar trabalhos presos na fila
:::

## Enviando um trabalho para a fila

Há duas ferramentas clássicas para mandar um arquivo para impressão, herdadas de dois projetos históricos (System V e BSD) que o CUPS unifica. O `lp` é a da tradição System V; o `lpr` é a da BSD. Ambas fazem praticamente a mesma coisa e aceitam a mesma ideia: imprimir um arquivo, com opções para fila específica, número de cópias e modo rascunho.

```terminal
$ lp relatorio.pdf
request id is MinhaImpressora-23 (1 file(s))
$ lp -n 2 -o sides=two-sided-long-edge relatorio.pdf
request id is MinhaImpressora-24 (1 file(s))
```

Na primeira linha, o trabalho foi entregue à impressora padrão e recebeu o identificador `MinhaImpressora-23` — o nome da fila seguido de um número sequencial. Cada trabalho aceito recebe um `request id` como esse, e é por ele que você referencia o trabalho dali em diante.

O segundo comando mostra duas opções úteis: `-n 2` pede duas cópias, e `-o sides=two-sided-long-edge` pede impressão **frente e verso** (duplex), encadernação pelo lado comprido. As opções `-o` variam conforme a capacidade da impressora — nem toda impressora aceita duplex, e o CUPS simplesmente ignora (ou avisa) as que ela não suporta.

:::dica
Você não precisa imprimir só PDF. O `lp` aceita texto puro, e o conteúdo é formatado na hora. Para algo como uma saída de comando, o padrão `comando | lp` funciona: `cat /etc/os-release | lp` manda a saída direto para a fila, útil para registrar uma configuração em papel.
:::

## Lendo a fila com `lpq` e `lpstat`

Uma vez que há trabalhos na fila, você quer vê-los. O `lpq` (tradição BSD) e o `lpstat -o` (System V) mostram a mesma coisa com formatos ligeiramente diferentes:

```terminal
$ lpq
MinhaImpressora is ready
no entries
```

No caso vazio, `no entries` confirma que a fila está limpa. Com trabalhos pendentes:

```terminal
$ lpstat -o
MinhaImpressora-23         ana             39936   Sat 2025-08-16 15:02:11 -03
MinhaImpressora-24         ana            160512   Sat 2025-08-16 15:03:40 -03
```

Cada linha traz o `request id`, o **dono** do trabalho (`ana`), o **tamanho em bytes** e o **horário** de submissão. Ver o dono importa em qualquer máquina multiusuário (ou quando você divide o Deck com a família): ninguém cancela o trabalho de outro sem saber.

A fila também revela um estado crítico que muitas vezes não está óbvio na interface gráfica: quando a impressora está **sem papel**, **sem tinta**, ou **offline**, o trabalho não some — ele fica parado, na maioria das vezes com a razão visível:

```terminal
$ lpstat -p
printer MinhaImpressora disabled since Sat 2025-08-16 15:10:05 -03 -
	reason: paper tray empty
```

Aqui o `lpstat -p` (veja a seção anterior) aponta que a impressora entrou em `disabled` porque a bandeja de papel acabou. O trabalho `MinhaImpressora-24` continua na fila, esperando. Nada de errado com o spooler — é o hardware que está pedindo papel.

## Cancelando trabalhos com `cancel` e `lprm`

Para remover um trabalho da fila, o `cancel` (System V) e o `lprm` (BSD) são equivalentes. Você referencia pelo `request id`:

```terminal
$ cancel MinhaImpressora-24
$ lpstat -o
MinhaImpressora-23         ana             39936   Sat 2025-08-16 15:02:11 -03
```

Cancelar um trabalho que já começou a imprimir é mais delicado: o CUPS vê que o trabalho está `processing` (sendo enviado à impressora) e pode não conseguir interromper a página que já saiu. O cancelamento vale para o que ainda está no buffer, não para o que o mecanismo de impressão já engoliu.

Para cancelar **todos** os trabalhos de uma fila de uma vez, o `cancel` aceita o nome da fila em vez do id:

```terminal
$ cancel -a MinhaImpressora
```

A opção `-a` (all) limpa a fila inteira. É o botão de emergência quando você manda por engano um erro de 200 páginas e quer abortar antes que o papel acabe.

:::atencao
`cancel`/`lprm` removem o trabalho da fila, mas se a impressora já recebeu o comando e tem memória interna (spool próprio, comum em impressoras de rede maiores), pode sobrar impressão residual. Nesse caso o único cancelamento confiável é no painel da própria impressora ou desligando-a momentaneamente.
:::

## Diagnosticando um trabalho preso

O sintoma clássico: você manda imprimir, o `lp` devolve um `request id`, mas nada sai do papel — e o trabalho nunca some da fila. O diagnóstico segue uma ordem fixa, do mais provável ao mais profundo:

```terminal
$ lpstat -p
printer MinhaImpressora disabled since Sat 2025-08-16 15:10:05 -03 -
	reason: paper tray empty
$ lpstat -o
MinhaImpressora-24         ana           160512   Sat 2025-08-16 15:03:40 -03
```

Primeiro, `lpstat -p` para ver se a fila está `disabled` e o motivo. Depois, se a fila está OK, o problema pode estar na **conexão**: a impressora de rede caiu do Wi-Fi, o cabo USB soltou, ou a URI mudou. O log do CUPS registra a falha:

```terminal
$ sudo tail -5 /var/log/cups/error_log
W [15/Aug/2025:15:12:33 -0300] [Job 24] Unable to connect to printer on socket://192.168.1.40:9100.
E [15/Aug/2025:15:12:33 -0300] [Job 24] The printer is unreachable at this time.
```

As linhas com `E` (erro) e `W` (aviso) contam a história: o trabalho `24` não conseguiu conectar à impressora em `192.168.1.40:9100`. Com o IP certo em mãos, você testa a conectividade com um `ping` e, se a impressora mudou de IP (comum em rede sem IP fixo por DHCP), corrige a URI com `lpadmin -p <nome> -v <nova-uri>`.

:::exemplo
Ana mandou um comprovante para a impressora e nada saiu. No `lpstat -p` viu `disabled` com `reason: disconnected`, e no `error_log` a linha "printer is unreachable". A causa raiz: o roteador tinha dado um IP novo à impressora após um apagão. Corrigir foi `sudo lpadmin -p MinhaImpressora -v ipp://192.168.1.41/ipp/print` seguido de `cupsenable MinhaImpressora` para reabilitar a fila.
:::

## Resumo

- `lp <arquivo>` envia um trabalho e devolve um `request id` no formato `fila-número`.
- Opções `-n` (cópias) e `-o sides=two-sided-long-edge` (duplex) controlam a saída conforme a capacidade da impressora.
- `lpq` e `lpstat -o` listam a fila com dono, tamanho e horário de cada trabalho.
- `cancel <id>` remove um trabalho; `cancel -a <fila>` limpa a fila inteira.
- Trabalhos presos são diagnosticados com `lpstat -p` (estado da fila) e `/var/log/cups/error_log` (motivo da falha de conexão).

## Exercícios

1. Envie um arquivo com `lp <arquivo>` e anote o `request id` devolvido.
2. Liste a fila com `lpstat -o` e identifique dono, tamanho e horário do trabalho que você acabou de enviar.
3. Envie dois trabalhos e cancele apenas o segundo com `cancel <id>`. Confirme com `lpstat -o` que o primeiro ainda está lá.
4. Provocar um estado `disabled` com `cupsdisable <nome>` e observe, via `lpstat -p`, o motivo exibido.
5. **Desafio.** Reproduza um trabalho preso: aponte a impressora para uma URI inexistente com `lpadmin -p <nome> -v socket://192.168.1.99:9100`, envie um trabalho e leia o `error_log` para confirmar a falha. Depois restaure a URI original e reabilite a fila, deixando tudo funcionando.
