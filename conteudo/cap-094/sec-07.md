O Steam Deck, como todo computador compacto, vive sob a tensão entre desempenho e temperatura. O `sensors` (do pacote `lm_sensors`) lê os medidores físicos da placa-mãe — temperatura da APU, rotação da ventoinha, tensões — e os exibe em texto simples. É a ferramenta de diagnóstico térmico de menor atrito: sem interface gráfica, sem overlay, apenas números que respondem à pergunta mais básica e mais importante: "meu deck está esquentando demais?".

:::objetivos
- Instalar e configurar o `lm_sensors` no SteamOS
- Ler temperaturas da CPU, GPU e sensores auxiliares
- Interpretar limites críticos e a diferença entre repouso e carga
- Usar `watch sensors` para monitoramento contínuo via terminal
:::

## O pacote lm_sensors e a detecção de sensores

O `lm_sensors` é o conjunto canônico de ferramentas para leitura de sensores de hardware no Linux. Ele inclui o comando `sensors` (leitura) e o `sensors-detect` (detecção de quais chips sensores estão presentes). No SteamOS, o kernel já expõe os sensores via `hwmon`, e o `sensors` geralmente funciona sem configuração adicional.

```terminal
$ sudo pacman -S lm_sensors
$ sensors
acpitz-acpi-0
Adapter: ACPI interface
temp1:        +42.0°C  (crit = +105.0°C)

amdgpu-pci-0400
Adapter: PCI adapter
edge:         +58.0°C  (crit = +110.0°C)
fan1:         3800 RPM  (min =    0 RPM, max = 6300 RPM)
```

A saída mostra dois sensores: o `acpitz` (ACPI thermal zone, um sensor genérico da placa) e o `amdgpu` (sensor interno da APU). O `edge` é a temperatura da borda do die da GPU — o valor mais relevante para desempenho. `fan1` mostra a rotação da ventoinha, com mínimo e máximo declarados pelo firmware.

## Sensores no Steam Deck

O Steam Deck (modelos LCD e OLED) tem um conjunto previsível de sensores acessíveis pelo kernel. Os principais:

| Sensor | Caminho hwmon | Significado |
|---|---|---|
| `edge` (GPU) | `amdgpu-pci-0400` | temperatura na borda do die da APU |
| `junction` (GPU) | `amdgpu-pci-0400` | temperatura de junção (ponto mais quente) |
| `fan1` | `amdgpu-pci-0400` | rotação da ventoinha principal |
| `temp1` (acpitz) | `acpitz-acpi-0` | sensor térmico da placa (ACPI) |
| `BAT1` | `BAT1-acpi-0` (via `/sys/class/power_supply/`) | temperatura da bateria (nem sempre exposta) |

```terminal
$ sensors amdgpu-pci-0400
amdgpu-pci-0400
Adapter: PCI adapter
edge:         +72.0°C
junction:     +78.0°C  (crit = +110.0°C)
fan1:         5200 RPM
```

A diferença entre `edge` (+72 °C) e `junction` (+78 °C) é normal — o junction mede o ponto mais quente do die, que sempre é mais alto. Quando o `junction` se aproxima do `crit` (110 °C), o hardware reduz clocks automaticamente.

:::atencao
O valor `crit` não é uma recomendação — é o limite de segurança. Operar consistentemente acima de 95 °C reduz a vida útil do silício. Se seu deck atinge essas temperaturas com frequência, a refrigeração precisa de atenção (poeira, ventoinha, pasta térmica).
:::

## Monitoramento com watch

O `sensors` sozinho tira uma foto; com `watch`, você monta um monitor ao vivo no terminal. O `watch` executa o comando a cada N segundos e redesenha a tela, criando um painel de monitoramento térmico em modo texto.

```terminal
$ watch -n 1 sensors
Every 1.0s: sensors
acpitz-acpi-0: +42.0°C
amdgpu-pci-0400 edge: +58.0°C, fan1: 3800 RPM
```

Com `-n 1` (atualiza a cada segundo), você vê a temperatura reagir em tempo real: sobe quando o jogo carrega, desce na pausa, estabiliza após alguns minutos de carga constante. Isso é útil para testar curvas de ventoinha ou verificar se uma capa ou suporte está bloqueando a entrada de ar.

```terminal
$ watch -n 1 -d sensors
```

A opção `-d` (diferenças) destaca valores que mudam entre uma leitura e a seguinte — visualmente mais fácil de acompanhar quando a temperatura está oscilando.

## Registrando temperatura ao longo do tempo

Para um diagnóstico mais rigoroso — por exemplo, provar que a temperatura sobe 30 °C em 5 minutos de um jogo específico — você quer um log com carimbos de tempo, não apenas uma olhada na tela.

```terminal
$ while true; do date +"%H:%M:%S" >> temp.log; sensors amdgpu-pci-0400 >> temp.log; sleep 5; done
```

A cada 5 segundos, esse loop grava hora e leitura dos sensores no arquivo `temp.log`. Ao final da sessão de jogo, você tem uma tabela completa. Pode abri-la no editor para ver a evolução ou plotar com uma planilha.

```terminal
$ cat temp.log
10:12:00
edge: +58.0°C, fan1: 3800 RPM
10:12:05
edge: +60.0°C, fan1: 3900 RPM
10:12:10
edge: +63.0°C, fan1: 4100 RPM
...
10:42:00
edge: +82.0°C, fan1: 5500 RPM
```

A sequência mostra a temperatura subindo de 58 °C a 82 °C ao longo de 30 minutos, com a ventoinha respondendo de 3800 a 5500 RPM. Se a ventoinha não tivesse subido — por exemplo, ficasse travada em 3800 RPM com a temperatura subindo — você teria detectado uma falha no controle de rotação.

## Temperatura e desempenho

A temperatura não é apenas um número — ela determina se o deck mantém o clock ou faz throttling. A APU Van Gogh começa a reduzir frequência quando o junction atinge ≈95 °C, e a redução é progressiva até o limite crítico de 110 °C, onde o sistema pode desligar para proteção.

```terminal
$ sensors amdgpu-pci-0400; cat /sys/class/drm/card0/device/pp_dpm_sclk
0: 200Mhz *
1: 400Mhz
2: 600Mhz
3: 800Mhz
4: 1000Mhz
5: 1600Mhz
```

O `pp_dpm_sclk` mostra os patamares de clock disponíveis; o asterisco marca o patamar ativo. Se a temperatura está alta e o clock está baixo mesmo sob carga, você tem confirmação de throttling térmico.

:::dica
Combine `sensors` com `pp_dpm_sclk` em um script simples e rode durante o jogo. Você captura temperatura e clock lado a lado, o que fecha o diagnóstico térmico sem precisar de ferramenta gráfica.
:::

## Resumo

- `lm_sensors` expõe sensores da placa-mãe e da APU via kernel; instale com `sudo pacman -S lm_sensors`.
- `sensors` mostra temperatura (`edge`, `junction`), rotação da ventoinha e limites críticos.
- `watch -n 1 sensors` transforma o terminal num monitor térmico ao vivo.
- Um loop `while` com `date` e `sensors` gera um log cronológico para análise posterior.
- Temperatura acima de 95 °C indica throttling; verifique `pp_dpm_sclk` para confirmar queda de clock.

## Exercícios

1. Instale o `lm_sensors` e execute `sensors`; liste todos os sensores detectados e seus valores atuais.
2. Rode `watch -n 1 -d sensors` enquanto executa um jogo; observe e relate quanto a temperatura sobe nos primeiros 5 minutos.
3. Crie um script que grave temperatura e clock a cada 10 segundos num arquivo; rode durante 15 minutos de jogo e analise a evolução.
4. Compare a temperatura `edge` e `junction` em repouso e sob carga; calcule a diferença média entre elas.
5. **Desafio.** Cruze os dados de temperatura com os de `pp_dpm_sclk` em um log consolidado. Identifique se, em algum momento, o clock caiu por temperatura — e em qual temperatura isso ocorreu.