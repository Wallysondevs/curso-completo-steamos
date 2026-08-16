Energia é o acessório invisível que sustenta todos os outros. Um dock, um hub ou um simples cabo de carregamento errados podem fazer o Steam Deck descarregar durante o uso — e, pior, degradar a bateria no longo prazo. A boa notícia é que a negociação de energia por USB-C é inteiramente legível pelo sistema: dá para ver, com precisão, quantos watts o carregador oferece e se o Deck aceitou a oferta.

:::objetivos
- Entender a negociação USB Power Delivery (PD) e os perfis de tensão do Deck
- Distinguir carga em 15 V de cargas de celular a 5 V ou 20 V
- Ler o estado da bateria e a negociação PD pelos nós do `/sys`
- Reconhecer quando um dock "alimenta" mas o Deck descarrega mesmo assim
- Escolher fonte e cabo que respeitem a saúde da bateria
:::

## A negociação que acontece em segundos

O Steam Deck carrega via **USB Power Delivery** (PD), um protocolo em que o carregador e o aparelho conversam e combinam tensão e corrente. O Deck pede, idealmente, **15 V / 3 A**, resultando nos 45 W nominais. Se o carregador não oferecer 15 V, a negociação cai para perfis inferiores — 5 V, 9 V ou até 20 V, dependendo do que a fonte anuncia.

```terminal
$ cat /sys/class/power_supply/BAT1/voltage_now
14998000
$ cat /sys/class/power_supply/BAT1/current_now
2471000
```

Os valores em microvolts e microampères mostram 14.998 V e 2.471 A — ou seja, a bateria está recebendo energia perto do perfil ideal de 15 V. Multiplicando tensão por corrente, você obtém a potência instantânea aproximada: cerca de 37 W entrando na bateria.

:::nota
A potência que você calcula de `voltage_now` × `current_now` é a que **entra na bateria**, não a que a fonte entrega. Parte da energia fornecida alimenta o aparelho em operação, e há perdas por calor. Para saber o que a fonte oferece, o caminho certo é ler a negociação PD no controlador USB-C.
:::

## Lendo a negociação do controlador USB-C

O chip que gerencia o conector USB-C expõe suas capacidades no `/sys`. É nele que você descobre o perfil que o carregador anunciou.

```terminal
$ ls /sys/class/power_supply/ | grep -i ucsi
ucsi-source-psy-0-00072
$ cat /sys/class/power_supply/ucsi-source-psy-0-00072/online
1
$ cat /sys/class/power_supply/ucsi-source-psy-0-00072/voltage_max
15000000
$ cat /sys/class/power_supply/ucsi-source-psy-0-00072/current_max
3000000
```

`online 1` confirma que há um fornecedor conectado. `voltage_max` de 15 V e `current_max` de 3 A revelam que a fonte oferece exatamente o perfil de 45 W que o Deck prefere. Quando esses campos mostram 5 V ou um `current_max` baixo, você já sabe que está diante de uma fonte fraca antes mesmo de notar a bateria caindo.

:::dica
Nem todo dock é carregador. Muitos hubs USB-C "passam" energia de uma fonte externa, mas se você plugar um dock que não tem entrada de energia própria, ele pode simplesmente **não carregar o Deck** — ou carregar a conta-gotas roubando corrente dos periféricos. Sempre confirme `online` e `voltage_max` depois de montar todo o conjunto.
:::

## O sintoma clássico: descarregando na tomada

O Deck consome até ~15 W só de APU em carga máxima, sem contar tela, áudio e periféricos. Se a fonte ofertar menos do que o Deck puxa, a diferença vem da bateria — e o status mostra `Discharging` mesmo com cabo plugado.

```terminal
$ cat /sys/class/power_supply/BAT1/status
Discharging
$ cat /sys/class/power_supply/BAT1/capacity
82
$ cat /sys/class/power_supply/ucsi-source-psy-0-00072/online
1
```

Repare na contradição: o fornecedor está conectado (`online 1`), mas a bateria descarrega e a capacidade cai. É o retrato de um carregador que negocia, mas não entrega os watts prometidos — problema comum em fontes de celular que anunciam 65 W mas só nos oferecem 20 V, tensão que o Deck não usa no perfil ideal.

:::atencao
Carregadores de celular "rápidos" costumam implementar protocolos proprietários (QC, VOOC, SuperVOOC) **em vez de** PD. Sem PD, o Deck cai para o perfil básico de 5 V / 1,5 A (~7,5 W) — insuficiente até para manter a carga em repouso sob jogo. Um carregador de 120 W pode entregar 7,5 W ao Deck se não falar PD direito. Verifique sempre `voltage_max`.
:::

## Protegendo a bateria no longo prazo

A bateria do Deck é de íons de lítio e degrada mais rápido em dois cenários: calor e permanência em 100%. Quando você usa o Deck plugado num dock para jogar horas a fio, a bateria fica quente **e** cheia ao mesmo tempo — a pior combinação.

```terminal
$ cat /sys/class/power_supply/BAT1/temp
36800
```

`temp` de 36.800 (36,8 °C) está dentro do aceitável, mas tende a subir sob carga com o dock. O SteamOS tem proteções, mas o limite real para preservar a bateria é o seu hábito.

```terminal
$ cat /sys/class/power_supply/BAT1/charge_control_end_threshold
100
```

Em alguns kernels o nó `charge_control_end_threshold` permite limitar a carga máxima. No Deck com SteamOS ele nem sempre está disponível, mas vale consultar: se existir, setar 80% preserva a bateria em uso contínuo no dock.

:::exemplo
Um cenário real: ana joga títulos pesados no dock por 3 horas toda noite, com o Deck sempre a 100%. Após alguns meses, `energy_full` já caiu de 40 Wh para cerca de 36 Wh. Ao remover o game loop pesado do dock (jogar no modo portátil acaba a sessão em 80% naturalmente) e usar um carregador PD correto, a queda estabilizou. A bateria agradece, e o `/sys` confirma.
:::

## Resumo

- O Deck negocia USB Power Delivery e prefere o perfil de 15 V / 3 A (45 W).
- `voltage_now` e `current_now` da bateria dão a potência que **entra** na bateria; o controlador `ucsi` revela o que a fonte **oferece**.
- `online 1` com `status Discharging` significa fonte conectada mas insuficiente — leia `voltage_max` para achar o perfil real.
- Fonte de celular sem PD entrega só ~7,5 W ao Deck, insuficiente sob carga.
- Calor + 100% permanente degradam a bateria; limite de carga (quando disponível) e hábitos ajudam.

## Exercícios

1. Com o carregador original, leia `voltage_max` e `current_max` do `ucsi-source-psy` e calcule a potência ofertada. Bate com os 45 W nominais?
2. Leia `voltage_now` e `current_now` da bateria em repouso e depois sob um jogo pesado. Explique a diferença de potência.
3. Conecte um carregador de celular (não-PD) e leia `voltage_max`. Qual perfil ele oferece ao Deck? A bateria carrega ou descarrega?
4. Verifique se `charge_control_end_threshold` existe na sua máquina (`ls /sys/class/power_supply/BAT1/`). Se existir, anote o valor; se não, explique o que isso significa.
5. **Desafio.** Monte um teste de 20 minutos: rode um jogo pesado com o dock conectado ao carregador original, amostrando a cada 1 minuto `status`, `capacity`, `temp` e `voltage_now`. Construa uma mini-tabela e identifique o pico de temperatura e se a capacidade subiu, desceu ou ficou estável. Relacione com o que aprendeu sobre Power Delivery nesta seção.
