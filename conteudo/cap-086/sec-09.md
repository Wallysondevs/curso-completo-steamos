Saber reparar também é saber quando **não** reparar. Há defeitos que você não consegue (ou não deve) resolver em casa — RAM soldada, APU com defeito, placa-mãe trincada — e aí o caminho certo é acionar a garantia da Valve ou uma assistência especializada. Esta seção ensina a distinguir esses casos, preparar o RMA e proteger seus dados antes de enviar o aparelho.

:::objetivos
- Distinguir reparo caseiro de defeito que exige assistência
- Entender como funciona a garantia da Valve e o processo de RMA
- Coletar o número de série e o histórico de diagnóstico para o suporte
- Preparar o Deck para envio (backup, wipe, embalagem)
- Conhecer alternativas quando a garantia já venceu
:::

## O que você deve (e não deve) consertar em casa

A regra é simples: se a peça é **modular e vendida pelo iFixit**, é reparo caseiro candidato. Se a peça é **soldada ou central**, é caso de assistência.

**Caseiro (via iFixit/Valve):** SSD, ventoinha, bateria, tela, sticks, botões, membranas, tampa traseira, thermal pads.

**Assistência/RMA:** APU com falha, RAM soldada, placa-mãe, controlador de carga da bateria, porta USB-C com trilha rompida, painel com defeito de fábrica.

```terminal
$ sudo dmidecode -t baseboard | grep -iE 'serial|product'
```

O `dmidecode` extrai o número de série da placa-mãe. Anote-o junto com o serial do chassi (etiqueta atrás do Deck): são os dois identificadores que o suporte da Valve pede no RMA.

## Entendendo a garantia da Valve

O Steam Deck tem garantia limitada do fabricante (tipicamente 1 ano, mas varia por país — no Brasil há regras do CDC que podem estender a cobertura legal contra defeitos de fabricação). A cobertura cobre **defeito de fabricação**, não dano por uso, queda, líquido ou abertura indevida.

A Valve, alinhada ao *right to repair*, **não anula a garantia por abrir o aparelho** — mas não cobre dano que *você* causou ao abrir. Ou seja: trocou o SSD e depois a tela pifou por conta própria? Coberto. Trocou o SSD e rasgou um flat cable no caminho? Não coberto.

```terminal
$ sudo dmidecode -t chassis | grep -iE 'serial|version'
```

Guarde também o número do chassi. O processo de RMA pede: número de série, descrição do sintoma e, se possível, o diagnóstico que você já fez (logs do `dmesg`, `smartctl`, etc.).

## Coletando o diagnóstico para o suporte

Antes de abrir um chamado, reúna um "pacote de diagnóstico" que acelera o atendimento:

```terminal
$ mkdir -p ~/rma
$ sudo journalctl -b -p err --no-pager > ~/rma/erros.txt
$ sudo smartctl -a /dev/nvme0n1 > ~/rma/smart.txt
$ sensors > ~/rma/temp.txt
$ sudo dmidecode -t system -t baseboard -t chassis > ~/rma/serials.txt
```

Com esses arquivos, você chega no suporte já com o "onde dói" apontado. O atendente não vai precisar pedir para você rodar tudo de novo.

:::dica
Descrição de sintoma boa tem três partes: **o que** (sintoma observado), **quando** (sempre que ligo / só em carga / depois de X), e **o que já testou** (reinstalei, troquei SSD, rodei smartctl). Isso filtra metade do vai-e-vem do suporte.
:::

## O processo de RMA passo a passo

1. Abra o chamado em Steam Support (help.steampowered.com), selecione o Deck e descreva o problema.
2. O suporte pode pedir logs ou fotos; envie o pacote de diagnóstico.
3. Se aprovado, você recebe uma etiqueta de envio (frete, em geral, coberto pela Valve nos mercados atendidos).
4. Embale o Deck com segurança (caixa original é ideal, ou proteção lateral generosa).
5. A Valve repara ou envia unidade de reposição (muitas vezes outra unidade, não a sua).

```terminal
$ # antes do envio, proteja seus dados:
$ sudo steamos-readonly disable   # se precisar de acesso de gravação
$ # faça backup de /home/deck (jogos, saves) para um drive externo
```

:::atencao
Você pode receber **outra unidade** de volta, não necessariamente a sua. Faça backup de tudo e, se tiver dados sensíveis, faça um wipe (re-imagem ou formatação segura do SSD) antes de enviar. Nunca envie com suas contas logadas.
:::

## Protegendo seus dados antes do envio

O Deck guarda sessões Steam, senhas salvas e arquivos pessoais. Antes do RMA:

```terminal
$ rsync -av --progress /home/deck/ /mnt/backup-deck/
```

Use `rsync` para copiar `/home/deck` (onde ficam saves locais de jogos e configurações) para um drive externo montado em `/mnt/backup-deck`. Depois, deslogue da Steam e faça uma re-imagem limpa (apaga o SSD) para não enviar seus dados.

```terminal
$ sudo dd if=/dev/zero of=/dev/nvme0n1 bs=1M count=100 2>/dev/null
```

Este `dd` sobrescreve o início do SSD com zeros (não é uma limpeza completa, mas já impede recuperação casual). Para apagar de verdade, use um wipe completo ou a "re-imagem" da Valve que reformata as partições.

## Quando a garantia já venceu

Sem garantia, suas opções:
- **iFixit/peças oficiais** — para tudo que é modular.
- **Assistência técnica independente** — para solda (porta USB-C, chips), se você não tem o equipamento.
- **Micro-solda/reballing** — para APU/RAM, especializado e caro; avalie se vale vs. comprar outro Deck.

```terminal
$ sudo smartctl -H /dev/nvme0n1
$ sensors
```

Se uma assistência pedir "qual o defeito?", você entrega o mesmo pacote de diagnóstico. Mesmo com a garantia vencida, quem conserta bem aprecia um cliente que já fez o diagnóstico de software.

## Fechando o capítulo

Reparo e manutenção física fecham o arco que começou com o hardware (capítulo 1): você conheceu o que há dentro, aprendeu a abrir, diagnosticar, trocar e manter. O resumo prático: **ferramenta certa, bateria desconectada, paciência e registro**. Com isso, um Deck bem cuidado atravessa muitos anos — e quando algo falha, você sabe exatamente o caminho.

```terminal
$ echo "Fim do capítulo 86: Reparo e manutenção física."
```
