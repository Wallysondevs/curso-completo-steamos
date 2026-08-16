O kernel do Linux vê tudo que o hardware faz — cada dispositivo conectado, cada interrupção, cada erro de barramento, cada driver carregado. O `dmesg` imprime o ring buffer do kernel, a memória circular onde o sistema deposita essas mensagens desde o instante em que o bootloader entrega o controle ao núcleo. No Steam Deck, essa ferramenta é a primeira parada quando algo físico não funciona: um pendrive que não monta, um Wi-Fi que não associa, uma tela que pisca.

:::objetivos
- Entender o que é o ring buffer do kernel e como o `dmesg` o lê
- Filtrar mensagens por nível, módulo e carimbo de tempo
- Interpretar erros comuns de hardware que aparecem no buffer
- Usar o `dmesg -w` para monitoramento em tempo real
:::

## O ring buffer do kernel

Toda mensagem que o kernel emite — seja um aviso de que o processador entrou em throttling térmico, seja um erro de leitura do NVMe — passa pelo ring buffer. Ele é circular: quando enche, as mensagens mais antigas são sobrescritas. O `dmesg` lê esse buffer e imprime na ordem cronológica.

```terminal
$ dmesg | head -n 5
[    0.000000] Linux version 6.8.0-valve1-1 (gcc (GCC) 13.2.0)
[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-linux-neptune root=UUID=...
[    0.000000] KERNEL supported cpus: Intel GenuineAMD AMD Extended
[    0.000000] x86/fpu: Supporting XSAVE feature 0x001: 'x87 floating point registers'
[    0.000000] BIOS-provided physical RAM map:
```

As primeiras linhas contam a história do boot: versão do kernel, linha de comando, CPU detectada, mapa de RAM. É a certidão de nascimento do sistema, e todo diagnóstico de hardware começa lendo o começo.

## Níveis de severidade

Nem toda mensagem do kernel é um problema. O sistema classifica cada evento com um nível que vai de `emerg` (catastrófico) a `debug` (informativo). O `dmesg` pode filtrar por esses níveis, e o filtro mais útil para diagnóstico é `err` — tudo que o kernel considerou erro ou pior.

```terminal
$ dmesg --level=err
[    2.134501] tpm tpm0: A TPM error (256) occurred attempting to determine the number of PCRS
[   12.871234] nvme nvme0: I/O error, dev nvme0n1, sector 4123400
```

O segundo exemplo — erro de I/O no NVMe — é grave. Significa que o kernel tentou ler ou escrever no SSD e o dispositivo respondeu com falha. No Steam Deck, onde o armazenamento é soldado (modelos de 64 GB e 256 GB usam eMMC; 512 GB e OLED usam NVMe), esse tipo de mensagem é forte indício de degradação do hardware de armazenamento.

```terminal
$ dmesg --level=warn
[    5.678901] acpi PNP0C14:00: duplicate WMI GUID detected (05901221-D566-11D1-B2F0-00A0C9062910)
[    8.234567] amdgpu 0000:04:00.0: Direct firmware load for amdgpu/gc_11_0_1_mes_2.bin failed with error -2
```

Warnings como falha de carregamento de firmware da GPU podem indicar que o pacote `linux-firmware` está desatualizado — não é hardware quebrado, é software faltando. A distinção entre `warn` e `err` é o primeiro filtro mental que você aplica antes de abrir um chamado.

## Filtrando por módulo

O kernel organiza suas mensagens por subsistema: `amdgpu` para vídeo, `nvme` para armazenamento, `iwlwifi` para rede sem fio, `usb` para periféricos. Filtrar por módulo isola o subsistema suspeito e elimina o ruído de componentes que nada têm a ver com o sintoma.

```terminal
$ dmesg | grep -i amdgpu
[    4.123456] amdgpu 0000:04:00.0: amdgpu: SMU is initialized successfully!
[    4.567890] amdgpu 0000:04:00.0: amdgpu: SE 1, SH per SE 1, CU per SH 8
[    4.890123] amdgpu 0000:04:00.0: amdgpu: ring gfx uses VM inv eng 0 on hub 0
```

Essa saída mostra que a GPU (APU AMD Van Gogh no Steam Deck) inicializou corretamente. Se houvesse erro, a linha seguinte traria `amdgpu: failed to...`. Saber o que é normal é tão importante quanto reconhecer o erro: você não quer diagnosticar um problema inexistente.

## Carimbos de tempo

O número entre colchetes no início de cada linha (`[    4.123456]`) é o tempo em segundos desde que o kernel iniciou. Esse carimbo permite correlacionar eventos: se o erro de NVMe aparece 12 segundos após o boot, você sabe que aconteceu durante a montagem do sistema de arquivos.

```terminal
$ dmesg --time-format iso
2025-02-20T10:12:33,123456-03:00 nvme nvme0: I/O error, dev nvme0n1
```

O formato ISO (`--time-format iso`) converte os segundos para data e hora reais, usando o relógio do sistema. Isso permite cruzar o `dmesg` com outros logs (journalctl, logs de jogo) que usam carimbo humano. Sem essa conversão, você fica tentando adivinhar "quando" o erro aconteceu.

## Monitoramento em tempo real

O `dmesg -w` (de *wait*) não termina: ele imprime o buffer atual e fica esperando novas mensagens, como um `tail -f` dos eventos do kernel. É a ferramenta ideal para testar hardware ao vivo — conecta um dock, insere um SD card, liga um controle Bluetooth — e vê instantaneamente o que o kernel tem a dizer.

```terminal
$ dmesg -w
[  +0.000123] usb 2-2: new SuperSpeed USB device number 3 using xhci_hcd
[  +0.004211] usb 2-2: New USB device found, idVendor=0bda, idProduct=8153
[  +0.000011] usb 2-2: New USB device strings: Mfr=1, Product=2, SerialNumber=3
```

Ao conectar um dock USB-C com Ethernet, você vê o kernel enumerar o dispositivo, identificar o chip (Realtek 8153, comum em docks baratos) e carregar o driver correspondente. Se em vez disso aparecesse `error -71`, você saberia que a negociação elétrica entre o deck e o dock falhou — o tipo de evidência objetiva que transforma "meu dock não funciona" em diagnóstico técnico.

```terminal
$ dmesg -wH
```

Com `-H` (human-readable), os carimbos saem em formato relativo amigável, e o terminal rola automaticamente conforme novas linhas chegam.

:::dica
Ao diagnosticar um periférico, rode `dmesg -w` *antes* de conectar o dispositivo. Assim você captura exatamente as linhas que aparecem no momento da conexão, sem se perder entre mensagens anteriores.
:::

## Tabela de opções essenciais

| Opção | Efeito | Quando usar |
|---|---|---|
| `dmesg` | imprime o buffer inteiro | visão geral do boot |
| `dmesg \| tail -n 30` | últimas 30 linhas | ver o que aconteceu agora |
| `dmesg --level=err,warn` | só erros e warnings | diagnosticar problemas |
| `dmesg -w` | segue novas mensagens | teste ao vivo de hardware |
| `dmesg -T` | carimbos legíveis | correlacionar com outros logs |
| `dmesg -c` | imprime e limpa o buffer | começar diagnóstico do zero |

## Resumo

- O ring buffer do kernel armazena mensagens desde o boot; `dmesg` lê esse buffer.
- Filtros por nível (`err`, `warn`) e por módulo (`amdgpu`, `nvme`, `usb`) isolam o subsistema relevante.
- Carimbos de tempo permitem correlacionar eventos do kernel com outros logs do sistema.
- `dmesg -w` monitora o kernel em tempo real e é a ferramenta ideal para testar periféricos.
- Erros de I/O (`nvme`), USB (`error -71`) e firmware (`failed with error -2`) têm significados distintos — saber interpretá-los evita diagnóstico errado.

## Exercícios

1. Rode `dmesg` e identifique as primeiras 5 linhas; anote a versão do kernel e a CPU detectada.
2. Execute `dmesg --level=err` e liste todas as mensagens de erro; classifique cada uma como "suspeita de hardware" ou "software".
3. Use `dmesg | grep amdgpu` para inspecionar a inicialização da GPU; verifique se há falhas de firmware.
4. Com `dmesg -w` rodando, conecte um periférico USB e observe as mensagens que o kernel emite; anote idVendor e idProduct.
5. **Desafio.** Gere um erro de I/O simulado (por exemplo, desconectando um dispositivo durante leitura) e capture a mensagem com `dmesg -w`. Interprete o erro e proponha uma causa provável.