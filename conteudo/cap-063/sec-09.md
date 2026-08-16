Depois de tudo instalado e configurado, resta a etapa que mais separa uma instalação funcional de uma instalação afinada: medir onde o sistema perde tempo, eliminar o que drena recursos e descobrir o componente que limita o desempenho. Num portátil como o Deck, o gargalo nunca é um só — mas ele sempre deixa pistas.

:::objetivos
- Diagnosticar gargalos de CPU, GPU e I/O no Windows
- Usar o LatencyMon para encontrar drivers que causam travamentos de áudio e DPC
- Remover processos e serviços que consomem recursos em segundo plano
- Aplicar um checklist de ajustes "pós-instalação" que todo Deck Windows deve ter
- Interpretar benchmarks sintéticos e relacioná-los ao desempenho real

:::

## Ferramentas de diagnóstico no Windows

Antes de mexer em qualquer configuração, você precisa saber o que está acontecendo. As três ferramentas que cobrem o essencial:

| Ferramenta | O que mede |
|---|---|
| **HWiNFO64** | Temperaturas, clocks, consumo, throttling térmico em tempo real |
| **LatencyMon** | Latência de DPC e ISR — drivers que travam o sistema por milissegundos |
| **CrystalDiskMark** | Velocidade sequencial e IOPS do SSD/microSD |

O HWiNFO64 é o mais completo: ele mostra se a APU está sofrendo *thermal throttling* (redução de clock por temperatura), se o VRM está no limite e se o TDP configurado está sendo respeitado de fato. O LatencyMon é a arma secreta para áudio — quando o som estala ou o jogo dá micro-travada, o culpado costuma ser um driver (Wi-Fi, Bluetooth, NVIDIA no caso de eGPU) monopolizando a CPU por tempo demais.

```terminal
$ # HWiNFO em modo sensor + logging:
$ hwinfo64.exe -r sensor.csv
```

## O que o LatencyMon revela sobre seus drivers

O DPC (*Deferred Procedure Call*) é como o Windows agenda tarefas urgentes de driver sem interromper o escalonador. Um driver mal comportado que segura o DPC por mais de 1 ms causa latência que o áudio sente como *crackling* e o jogo sente como *frame-time spike*.

```terminal
$ # No LatencyMon, o diagnóstico típico de um sistema saudável:
Your system appears to be suitable for handling real-time audio
and other tasks without dropouts.
```

Se o LatencyMon reporta problemas, o relatório aponta o driver culpado pelo nome do arquivo `.sys`. Os vilões recorrentes no Deck: `ndis.sys` (pilha de rede do Wi-Fi Mediatek no OLED), `acpi.sys` (firmware ACPI), e `dxgkrnl.sys` (GPU em modo de economia). A solução varia: trocar o driver, atualizar o firmware ou desabilitar o dispositivo que causa o estouro.

:::atencao
Não ignore o LatencyMon com a desculpa de que "não mexo com áudio profissional". O mesmo DPC que estoura o buffer de áudio também trava o pipeline de renderização por um frame inteiro. Latência de DPC alta é latência de jogo alta — o sintoma auditivo é só o mais fácil de notar.
:::

## Ajustes essenciais pós-instalação

Um checklist de coisas que todo Deck Windows deve ter, independentemente dos jogos:

1. **Desabilitar o Game Bar e Game DVR.** Gravam em segundo plano e consomem GPU.
2. **Plano de energia em "Alto desempenho"** — com o slider de energia no mínimo para jogos, máximo na tomada.
3. **Desabilitar inicialização automática do Steam** se você joga mais fora da Steam.
4. **Manter o Windows Update configurado para "notificar antes de baixar"** — atualização no meio do jogo é o clássico "stutter que não era o jogo".
5. **Excluir as pastas de jogos do Windows Defender** (ou adicionar como exclusão de processo).

```terminal
$ # Desabilitar Game DVR via PowerShell como administrador:
$ reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\GameDVR" /v AllowGameDVR /t REG_DWORD /d 0 /f
```

O plano de energia "Alto Desempenho" desabilita estados de economia que podem cortar o clock da GPU no meio de um frame — mas eleva o consumo em idle. Vale a pena durante o jogo, nem tanto no desktop.

:::dica
Crie dois planos de energia e um script `.bat` para alternar: "Performance" (alto desempenho) quando conectado à energia e "Battery" (economia) na bateria. O SDTPerformance já faz algo similar, mas ter o atalho manual ajuda.
:::

## Benchmarks e o gargalo real

Rodar um benchmark sintético como o Cinebench (CPU) ou o Unigine Heaven (GPU) no Deck ajuda a calibrar expectativas e detectar se sua instalação está abaixo do esperado. Compare seus números com os de outras pessoas com o mesmo modelo — um desvio de mais de 10% sugere thermal throttling ou driver errado.

Os números de referência para o Deck LCD (Van Gogh):

| Benchmark | Resultado esperado |
|---|---|
| Cinebench R23 multi-core | ~3800–4100 pts |
| Cinebench R23 single-core | ~850–900 pts |
| CrystalDiskMark seq. read (NVMe) | 2000–3500 MB/s conforme o SSD |
| CrystalDiskMark seq. read (microSD U3) | ~90–100 MB/s |

O microSD como destino de jogos é o gargalo mais comum depois de instalação: o carregamento de fase demora o dobro ou o triplo do SSD interno. Se o jogo que você roda está no cartão, o limite de desempenho provavelmente é I/O, não GPU.

## Resumo

- HWiNFO64 mede temperaturas e throttling; LatencyMon mede latência de driver.
- DPC alto causa crackling de áudio e frame-time spikes — geralmente culpa do Wi-Fi ou firmware.
- Checklist: Game Bar off, plano Alto Desempenho, exclusão no Defender, Windows Update notificado.
- Plano de energia e scripts de alternância ajudam a equilibrar desempenho e bateria.
- Compare benchmarks com referências para detectar instalação abaixo do esperado.

## Exercícios

1. Instale o LatencyMon e rode o teste por 5 minutos com um jogo aberto. Qual driver teve a maior latência de DPC?
2. Gere um relatório de sensor do HWiNFO64 durante 10 minutos de jogo e identifique: a APU sofreu thermal throttling em algum momento?
3. Execute o CrystalDiskMark no SSD interno e no microSD (se tiver). Compare os números de IOPS aleatórios.
4. Aplique o checklist de ajustes pós-instalação e documente cada alteração. Meça o tempo de boot antes e depois.
5. **Desafio.** Integre as métricas do HWiNFO ao overlay do RTSS (via plugin ou memória compartilhada) e monte um painel que mostre, no canto da tela, temperatura, TDP e throttling ao vivo — sem o SDTPerformance. Por que essa integração manual é mais frágil?