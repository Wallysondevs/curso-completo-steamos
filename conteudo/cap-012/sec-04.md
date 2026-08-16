Undervolting é a arte de alimentar o chip com menos tensão sem reduzir o clock. É diferente de diminuir o TDP (que abaixa consumo e desempenho) e diferente de fixar o clock (que mexe na velocidade, não na voltagem). O princípio é simples: cada chip sai da fábrica com uma margem de segurança na tensão. Você pode comer um pedaço dessa margem, ganhar eficiência e perder zero FPS.

:::objetivos
- Entender o princípio do undervolting e como ele difere do underclock
- Conhecer os riscos: por que a margem de tensão existe
- Aplicar undervolt de CPU via `ryzenadj` com os parâmetros adequados
- Medir o ganho de eficiência com `sensors` e `ryzenadj --info`
:::

## Por que sobra margem

Na fabricação, cada lâmina de silício produz chips com variações microscópicas. Dois Decks comprados no mesmo dia têm APUs com pequenas diferenças de qualidade. A AMD (e a Valve, ao especificar a tensão) escolhe um valor que funcione em **todos** os chips que saem da linha — inclusive os piores. Se o seu chip saiu melhor que a média, a tensão de fábrica é maior do que ele realmente precisa.

O undervolting testa essa hipótese. Você reduz a tensão e observa: o sistema continua estável? Os benchmarks mantêm o FPS? A temperatura caiu? Se a resposta for sim para as três perguntas, você achou a tensão ideal para **seu** chip específico — um valor que a Valve não pode usar como padrão porque não funciona em todos os Decks.

O ganho prático aparece de duas formas. Primeiro, menos tensão = menos calor, porque a potência dissipada cresce com o quadrado da tensão. Uma redução de 50 mV já é perceptível no ruído da ventoinha. Segundo, com menos calor, o chip pode sustentar clocks mais altos dentro do mesmo TDP — o que significa FPS extra, não menos.

## O que NÃO é undervolting

Uma confusão comum: baixar o TDP **não** é undervolting. Baixar o TDP diz "trabalhe com menos watts", e o chip responde reduzindo clock e tensão **automaticamente**, para caber no limite. Undervolting diz "trabalhe com menos tensão no mesmo clock" — o chip entrega o mesmo desempenho usando menos energia. São alavancas diferentes, com resultados diferentes.

Outra confusão: undervolting não é underclock. Underclock é reduzir o clock mantendo ou não a tensão. Undervolting é reduzir a tensão mantendo o clock. O primeiro tira desempenho; o segundo pode até aumentar desempenho, se o limite anterior era térmico.

:::perigo
Undervolt agressivo pode causar instabilidade silenciosa — o sistema não trava, mas produz resultados errados (um cálculo de física que dá um pixel errado, um hash que não confere). Isso é pior que um crash porque você pode não notar. Teste com benchmarks confiáveis antes de declarar vitória. E jamais mexa em tensão da GPU sem plena consciência de que está fora da especificação da Valve.
:::

## Aplicando undervolt com ryzenadj

O `ryzenadj` oferece um parâmetro de ajuste de tensão chamado CO (*Curve Optimizer*), o mesmo mecanismo usado em Ryzen de desktop. Ele desloca a curva de tensão para baixo em passos que representam uma redução em milivolts indireta. Valores típicos seguros vão de `-5` a `-30`, sendo `-30` agressivo e nem sempre estável:

```terminal
$ sudo ryzenadj -d 10 --set-coall=10
```

A flag `-d` define o deslocamento da curva (valor absoluto), e `--set-coall` aplica o mesmo deslocamento a todos os núcleos da CPU. Um valor de `10` é considerado conservador e ponto de partida seguro. Para desfazer o undervolt, zere os deslocamentos:

```terminal
$ sudo ryzenadj -d 0 --set-coall=0
Sucessfully set coall=0
```

A GPU integrada da APU não recebe o mesmo tratamento via `ryzenadj` — o parâmetro CO atua apenas sobre os núcleos de CPU. Para undervolt de GPU no Deck, as opções são mais limitadas e envolvem modificar parâmetros do driver `amdgpu`, território consideravelmente mais arriscado que o CO da CPU.

## Medindo o antes e o depois

Antes de alterar qualquer coisa, registre a linha de base. O `sensors` mostra a tensão do domínio gráfico (`vddgfx`) e a temperatura:

```terminal
$ sensors
amdgpu-pci-0300
Adapter: PCI adapter
vddgfx:       +0.87 V
fan1:        2987 RPM
edge:         +68.0°C
slowPPT:      13.20 W
GPU Clock:    1400 MHz

k10temp-pci-00c3
Adapter: PCI adapter
Tctl:         +67.8°C
```

A tensão `vddgfx` sozinha não conta a história inteira — ela é a tensão da GPU, não a da CPU. Para a CPU, o `ryzenadj --info` não mostra tensão diretamente, então o melhor proxy para o efeito do undervolt é a temperatura: rode um benchmark de CPU com e sem o CO aplicado e compare o `Tctl` em `sensors` nas mesmas condições.

Um teste prático: o `stress` do pacote de mesmo nome gera carga pura de CPU, sem tocar na GPU:

```terminal
$ sudo stress --cpu 8 --timeout 30s
stress: info: [5482] dispatching hogs: 8 cpu, 0 io, 0 vm, 0 hdd
stress: info: [5482] successful run completed in 30s
```

Enquanto o `stress` roda, abra outro terminal e monitore:

```terminal
$ watch -n 2 'sensors | grep -E "Tctl|vddgfx|edge"'
```

Anote os picos de temperatura com CO desligado (`-d 0`) e com CO em `10`. Uma queda de 3 a 5 °C é típica para `-d 10` estável. Se a temperatura não mudar, o undervolt pode não ter sido aplicado — confira com `ryzenadj --info` se a versão do `ryzenadj` que você tem suporta o parâmetro `coall`.

:::dica
O undervolt via CO só persiste enquanto o sistema está ligado. No reboot, o firmware da APU recarrega os valores padrão. Para tornar o undervolt permanente, você precisa de um script de inicialização ou de um serviço systemd que aplique o `ryzenadj` no boot — assunto para a seção de automação.
:::

## Até onde ir

O caminho recomendado é incremental: comece com `-d 5`, use o Deck por um dia inteiro com jogos variados. Se zero crash e zero artefato, suba para `10`, depois `15`, e pare no primeiro sinal de instabilidade. Não existe "undervolt mágico" que funcione em todos os Decks — o número certo é o que funciona **no seu silício**.

Sinais de que você foi longe demais:
- Crash completo (tela preta, reinicialização espontânea).
- Artefatos visuais (pontos, linhas ou cores erradas na tela).
- Erros de checksum no sistema de arquivos (`fsck` no boot).
- Quedas de desempenho inexplicáveis (o chip tenta corrigir erros silenciosos).

Qualquer um desses sintomas significa que você deve recuar o valor em pelo menos 5 unidades e testar de novo. A margem de segurança existe por um motivo — respeitá-la é o que separa um ajuste inteligente de um overclock irresponsável.

## Resumo

- Undervolting reduz a tensão mantendo o clock; ao contrário do underclock, não sacrifica desempenho.
- A tensão de fábrica cobre a variação de todos os chips; quase todo Deck tem margem para reduzir.
- `ryzenadj` aplica undervolt de CPU via Curve Optimizer, com o parâmetro `--set-coall` e `-d`.
- O ganho é medido indiretamente: menos temperatura e menos consumo no mesmo clock.
- Avance em passos de 5, teste com carga real, e recue ao primeiro sinal de instabilidade.

## Exercícios

1. Registre a temperatura `Tctl` e a tensão `vddgfx` com `sensors` antes de qualquer ajuste.
2. Aplique `sudo ryzenadj -d 10 --set-coall=10`, rode `stress --cpu 8 --timeout 30s` e compare a temperatura máxima com o valor sem undervolt.
3. Jogue um título exigente por 20 minutos com undervolt aplicado. Houve crash ou artefato? Se não, suba para `-d 15` e repita.
4. Use `ryzenadj --info` antes e depois de aplicar o CO e verifique se o campo `coall` aparece com o valor esperado.
5. **Desafio.** Combine undervolt de CPU (`-d 10`) com limite de TDP (`-a 10000 -b 10000 -c 10000`). Rode o mesmo benchmark de antes e compare FPS e temperatura. O undervolt compensou a perda de TDP? Explique o resultado com base no que você sabe sobre a relação tensão × clock.