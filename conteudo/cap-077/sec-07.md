Um ajuste de tensão ou de clock só passa a valer quando sobrevive a um teste de estabilidade honesto. O erro clássico é aplicar undervolting + overclock e jogar 20 minutos sem travar, concluindo "estável" — para depois o sistema corromper um save duas semanas adiante. Estabilidade real exige carga variada, longa e com checagem de integridade de dados. Esta seção reúne o arsenal de validação no SteamOS.

:::objetivos
- Montar um protocolo de teste em camadas: CPU, GPU, memória e armazenamento
- Usar stress-ng, testes de benchmark e cargas sintéticas da forma certa
- Interpretar MCEs e logs do kernel como sinais de instabilidade
- Saber quando um ajuste está "bom o suficiente" versus "arriscado"
:::

## Por que 20 minutos não bastam

Instabilidade por undervolting costuma ser **não-determinística**: aparece sob combinações específicas de carga, temperatura e transiente de clock. Uma tensão marginal pode funcionar por horas num teste de CPU e falhar em 30 segundos numa cena de jogo que alterna rápido entre GPU e CPU. O protocolo precisa cobrir esses transitórios.

:::nota
A degradação por temperatura também é progressiva. Um undervolt estável hoje pode ficar instável em 6 meses, conforme o silício envelhece. Por isso estabilidade nunca é "para sempre" — é "nas condições atuais", com margem de segurança mantida.
:::

## Camada 1: CPU — a base

Comece validando os núcleos, com o undervolt aplicado:

```terminal
$ stress-ng --cpu 8 --cpu-method ackermann --timeout 1800s
$ stress-ng --cpu 8 --cpu-method matrixprod --timeout 1800s
```

O método `ackermann` gera código com muitas chamadas e branches (estressa cache e branch predictor); `matrixprod` gera multiplicação de matrizes (estressa FPU e gera muito calor, bom para undervolt). Trinta minutos de cada, com temperatura monitorada, é o mínimo razoável.

## Camada 2: GPU e memória compartilhada

A iGPU compartilha a memória com a CPU no Steam Deck — um único pool de RAM. Erros de tensão podem se manifestar como artefatos visuais ou corrupção de textura. Para a GPU, use um benchmark que rode em loop:

```terminal
$ glmark2 --run-forever
```

E monitore o clock efetivo e o consumo durante o loop:

```terminal
$ sudo ~/lab/ryzenadj/ryzenadj -i | grep -E "STAPM|TEMP|EDC"
```

Procure por **artefatos** — pixels coloridos aleatórios, texturas borradas, flashes — que indicam que a iGPU está desenhando errado por tensão insuficiente. Nenhum log aponta isso; é inspeção visual.

:::atencao
Artefato de GPU nem sempre é overclock de clock: pode ser o undervolt cortando tensão da iGPU em carga. Se surgirem artefatos, o primeiro suspeito é o Curve Optimizer, não o clock.
:::

## Camada 3: integridade de dados

O teste que separa amadores de profissionais: verificar se a memória e o disco não sofrem corrupção silenciosa enquanto a APU está no limite.

```terminal
$ sudo dmidecode --type memory | grep -E "Speed|Size"
$ memtester 1G 5
```

O `memtester` aloca 1 GB e faz 5 ciclos de padrões. Num Deck com undervolt + overclock agressivos, rode-o **durante** uma carga de GPU para cruzar os dois estressores:

```terminal
$ ( glmark2 --run-forever & ) && sudo memtester 1G 5
```

Para o disco, gere um arquivo grande, grave, releia e compare:

```terminal
$ dd if=/dev/urandom of=/tmp/integridade.bin bs=1M count=1024 status=progress
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 8.3 s, 129 MB/s
$ md5sum /tmp/integridade.bin
a3f4b5c6d7e8f9a0b1c2d3e4f5a6b7c8  /tmp/integridade.bin
$ dd if=/tmp/integridade.bin of=/dev/null bs=1M status=progress
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 1.2 s, 896 MB/s
$ md5sum /tmp/integridade.bin
a3f4b5c6d7e8f9a0b1c2d3e4f5a6b7c8  /tmp/integridade.bin
$ diff <(md5sum /tmp/integridade.bin) <(echo "a3f4b5c6d7e8f9a0b1c2d3e4f5a6b7c8  /tmp/integridade.bin")
## sem saída = hash idêntico = sem corrupção
```

Se o hash mudar entre as duas leituras, há corrupção silenciosa — o ajuste é instável e perigoso, mesmo sem nenhum crash visível.

## Lendo os sinais do kernel

O kernel registra erros de hardware corrigíveis via MCE (Machine Check Exception) e mensagens de EDAC. Após cada sessão de teste:

```terminal
$ sudo dmesg | grep -iE "mce|machine check|edac|hardware error"
$ journalctl -k | grep -iE "mce|edac"
```

Um único MCE corrigível já é motivo para reduzir a agressividade do undervolt. Vários MCEs significam "pare agora e reverta".

## O veredito: bom o suficiente?

Classifique o resultado do seu protocolo em três níveis:

| Resultado | Significado | Ação |
|---|---|---|
| 3h de carga variada, zero crash, zero MCE, hash íntegro | Estável com boa margem | Pode gravar na NVRAM |
| Crash raro, MCEs esporádicos | Instabilidade marginal | Reduza 1-2 passos de undervolt/clock |
| Crash imediato, artefatos, hash corrompido | Instável e perigoso | Reverta tudo e recomece com valores conservadores |

Nunca grave na NVRAM (Smokeless UMAF) um ajuste que não passou pelo menos 3 horas de carga variada sem qualquer evento adverso.

## Resumo

- Estabilidade exige teste em camadas: CPU, GPU, memória e armazenamento.
- `stress-ng` com `ackermann` e `matrixprod` cobre CPU e calor; `glmark2` cobre GPU.
- Corrupção silenciosa (hash do arquivo mudando) é o sintoma mais perigoso e invisível.
- MCEs e mensagens EDAC no `dmesg` são sinais precoces de instabilidade de tensão.
- Só grave na NVRAM após 3+ horas de carga variada sem eventos adversos.

## Exercícios

1. Rode `stress-ng --cpu 8 --cpu-method matrixprod --timeout 900s` e registre temperatura máxima e clock sustentado durante o teste.
2. Execute `memtester 1G 3` sozinho e depois simultaneamente com `glmark2 --run-forever`. Compare o número de erros (esperado: zero nos dois casos).
3. Gere um arquivo de 1 GB, calcule `md5sum`, releia-o e recalcule o hash. Confirme que os hashes batem.
4. Após aplicar seu undervolt, rode `journalctl -k | grep -i mce` e explique o que cada linha significa (ou confirme a ausência delas).
5. **Desafio.** Projete um protocolo de teste de estabilidade completo para um Deck que você quer entregar a outra pessoa. Justifique a ordem das camadas, o tempo total e qual sinal de instabilidade você trata como "reprovação automática". Integre conceitos de PPT/TDC/EDC e Curve Optimizer das seções anteriores.