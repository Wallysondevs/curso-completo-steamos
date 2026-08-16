Um ticket de suporte bem-sucedido é aquele que chega pronto: com o sintoma isolado, a causa provável apontada e as evidências anexadas. Antes de escrever qualquer palavra para a Valve, você precisa fazer o trabalho de casa — separar o que é software (consertável por você) do que é hardware (motivo de RMA). Esta seção ensina a reunir essa prova com os logs do próprio sistema.

:::objetivos
- Isolar o defeito entre software e hardware
- Coletar logs relevantes com journalctl e dmesg
- Registrar o sintoma de forma reproduzível
- Produzir evidência objetiva antes de abrir o chamado
:::

## Software primeiro, hardware depois

A regra número um do diagnóstico de garantia é descartar a causa de software antes de culpar o hardware. Um jogo que trava, uma tela que pisca ou um botão que "não responde" frequentemente são falha de driver, de atualização pendente ou de configuração — e a Valve, corretamente, não troca aparelho por isso.

O fluxo básico é: reproduzir o problema, observar o que o sistema registrou no momento exato, e só então classificar. O `journalctl` guarda tudo que o sistema e os serviços escreveram desde o boot, com carimbo de tempo.

```terminal
$ journalctl -b -p err -n 20
fev 20 10:12:33 steamdeck kernel: mce: [Hardware Error]: Machine check events logged
fev 20 10:12:35 steamdeck kernel: nvme nvme0: I/O error, dev nvme0n1
```

Um "Machine check" ou I/O error no NVMe é sinal forte de problema físico (controladora, disco), não de configuração. Já mensagens de `degraded unit` de um serviço de rede apontam para outra direção. A arte está em ler o log criticamente.

## Reproduzindo o sintoma

Evidência que a Valve leva a sério é **reproduzível**: dá para mostrar que o problema acontece toda vez, sob as mesmas condições. Registrar o passo a passo importa porque o técnico do outro lado não tem seu aparelho na frente — a sua descrição é o instrumento dele.

```terminal
$ dmesg -w
[  +0.000123] usb 1-1: new full-speed USB device number 4 using xhci_hcd
[  +0.004211] usb 1-1: device descriptor read/64, error -71
[  +0.000011] usb 1-1: device descriptor read/64, error -71
```

Rodar `dmesg -w` enquanto você conecta um periférico problemático mostra, em tempo real, o que o kernel vê. O famoso `error -71` ao ler o descriptor de um dispositivo USB indica falha de comunicação física — cabo, conector ou porta. É exatamente o tipo de saída que transforma "meu dock não funciona" em evidência técnica.

:::atencao
Não conclua "hardware" a partir de uma única ocorrência. Repita o teste após reiniciar e, se possível, com outro cabo, outra porta ou outro periférico. Muitos I/O errors somem trocando o cabo — e aí não há RMA nenhum, só compra de cabo.
:::

## Testando componentes com sensores e selftest

Para bateria, temperatura e ventoinha, o SteamOS expõe interfaces que permitem um "pré-teste" objetivo. Medir temperatura sob carga, verificar se a ventoinha gira e ler a capacidade da bateria transformam relato em número.

```terminal
$ sensors
acpitz-acpi-0
Adapter: ACPI interface
temp1:        +42.0°C  (crit = +105.0°C)

amdgpu-pci-0400
Adapter: PCI adapter
edge:         +58.0°C  (crit = +110.0°C)
```

Se a temperatura sobe sem a ventoinha responder, ou se `sensors` não mostra o duto girando, há indício de falha de resfriamento — um dos defeitos mais comuns cobertos por garantia. Registre a leitura sob carga e em repouso para mostrar a diferença.

:::dica
Tire capturas de tela (no modo Desktop) dos logs e das leituras junto com a data e a hora. Uma evidência datada e reproduzível vale mais que um parágrafo de descrição subjetiva.
:::

## Montando o dossiê de evidência

Antes de abrir o chamado, consolide tudo: o modelo e serial (seção anterior), a descrição reproduzível do sintoma, os logs relevantes e o que você já tentou. A Valve descarta de cara pedidos sem informação e devolve pedindo mais detalhes, o que alonga o processo em dias.

```terminal
$ journalctl -b > ~/rma-logs-boot.txt
$ sudo dmesg > ~/rma-dmesg.txt
$ sensors > ~/rma-sensors.txt
```

Gravando três arquivos você já tem o núcleo do dossiê. Some a eles o `dmidecode -t system` da seção anterior e a lista dos passos de reprodução, e o chamado sai praticamente pronto.

## Erros comuns de diagnóstico

O equívoco mais caro é pular direto para "é hardware" sem ter esgotado o lado do software. Um analógico que "drifta" pode ser calibração errada; uma tela que pisca pode ser driver gráfico corrompido (e se resolve com atualização); um botão que não responde pode ser mapeamento perdido. A sequência correta — reiniciar, atualizar, testar com outra conta ou outro jogo — elimina a maioria dos falsos positivos.

```terminal
$ systemctl status steamos-update --no-pager -n 4
● steamos-update.service - SteamOS system update
     Active: inactive (dead)
```

Verificar que o sistema está atualizado e que não há atualização pendente é o pré-teste mais rápido: muitas correções de driver e firmware vêm embutidas em atualizações do SteamOS. Se seu problema já foi corrigido por uma versão mais nova, a Valve simplesmente pedirá que você atualize — e o RMA não será autorizado.

| Comando | O que mostra | Por que importa |
|---|---|---|
| `journalctl -b -p err` | erros do boot atual | flagra falhas de hardware em texto |
| `dmesg -w` | eventos do kernel em tempo real | vê I/O error, USB falhando ao vivo |
| `sensors` | temperatura e ventoinha | testa resfriamento sem abrir o aparelho |
| `systemctl status steamos-update` | estado da atualização | confirma que o sistema está na versão estável |

## Resumo

- Primeiro descarte causa de software, depois culpe o hardware.
- Evidência reproduzível é o que faz a Valve aceitar um RMA.
- `journalctl -p err` e `dmesg -w` revelam erros de hardware como MCE e I/O error.
- `sensors` permite testar temperatura e ventoinha de forma objetiva.
- Consolide logs, serial e passos de reprodução antes de abrir o chamado.

## Exercícios

1. Reproduza um problema real (ou hipotético) e descreva o passo a passo exato que faz ele acontecer.
2. Rode `journalctl -b -p err` e identifique se há alguma mensagem que aponte para falha de hardware.
3. Execute `dmesg -w` enquanto conecta um periférico e observe o que o kernel registra em tempo real.
4. Use `sensors` para medir a temperatura em repouso e, se possível, sob carga; registre ambos os valores.
5. **Desafio.** Monte um dossiê completo em arquivos (`logs`, `dmesg`, `sensors`, identificação) simulando a preparação de um chamado de garantia, e escreva um parágrafo justificando por que cada peça de evidência está ali.
