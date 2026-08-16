Temperatura é o principal limitador de desempenho de um Steam Deck: não é o clock do APU que define o teto, e sim a capacidade do sistema de dissipar calor antes de o chip decidir reduzir a própria velocidade. Entender de onde vêm os números de temperatura e como o kernel os expõe é o primeiro passo para diagnosticar superaquecimento, barulho de ventoinha e perda de FPS. Aqui você aprende onde o Linux guarda as leituras dos sensores e como lê-las sem depender de interface gráfica.

:::objetivos
- Entender como o kernel expõe sensores de temperatura via `hwmon` e `sysfs`
- Localizar os sensores do APU e da placa dentro de `/sys/class/hwmon`
- Instalar e configurar o pacote `lm-sensors`
- Ler temperaturas, tensões e rotação da ventoinha pela linha de comando
- Reconhecer os limites térmicos oficiais definidos no firmware
:::

## O subsistema hwmon

O kernel Linux não guarda a temperatura dentro de um arquivo de log; ele a expõe como se fosse um arquivo do sistema de arquivos virtual `sysfs`. A interface encarregada disso é o subsistema **hwmon** (hardware monitor), que reúne todos os sensores de temperatura, tensão, corrente e rotação de ventoinha da máquina em um único lugar, em `/sys/class/hwmon/`.

Cada chip sensor ganha um diretório numerado, e dentro dele uma série de arquivos com nomes como `temp1_input`, `fan1_input` e `in0_input`. A leitura é feita com um simples `cat`, porque o kernel atualiza o valor virtualmente a cada acesso:

```terminal
$ ls /sys/class/hwmon/
hwmon0  hwmon1  hwmon2  hwmon3
$ cat /sys/class/hwmon/hwmon0/name
k10temp
```

O arquivo `name` identifica o driver por trás de cada sensor. Esse diretório numerado, porém, não é estável: a ordem pode mudar entre boots, então confiar em `hwmon2` na mão é frágil. A prática correta é mapear pelo nome do driver, como você verá a seguir.

## Descobrindo qual sensor é qual

Para saber qual `hwmon` corresponde ao APU (o processador AMD customizado do Deck), leia o `name` de cada um:

```terminal
$ for h in /sys/class/hwmon/hwmon*; do echo -n "$h: "; cat "$h/name"; done
/sys/class/hwmon/hwmon0: k10temp
/sys/class/hwmon/hwmon1: amdgpu
/sys/class/hwmon/hwmon2: nvme
/sys/class/hwmon/hwmon3: steamdeck-hwmon
```

No Steam Deck aparecem pelo menos três protagonistas. O `k10temp` é o driver AMD de temperatura do processador (família K10 em diante, que inclui os APUs atuais). O `amdgpu` entrega temperaturas e estado do chip gráfico integrado. O `steamdeck-hwmon` é o driver específico da Valve para o controlador embarcado (EC) do Deck, responsável por expor a ventoinha e as temperaturas de fábrica.

:::nota
O `nvme` aparece apenas em unidades com SSD NVMe; modelos com eMMC não o terão. A presença ou ausência de um sensor depende do hardware, não do SteamOS.
:::

## Lendo uma temperatura diretamente

Dentro de cada `hwmon`, os arquivos que terminam em `_input` contêm o valor bruto, quase sempre em **miligraus Celsius** (m°C). Dividir por 1000 converte para °C:

```terminal
$ cat /sys/class/hwmon/hwmon0/temp1_input
61250
$ echo $(( $(cat /sys/class/hwmon/hwmon0/temp1_input) / 1000 ))
61
```

Repare nas convenções: `temp1_input` é o sensor 1 em leitura atual; `temp1_max` seria o teto, quando o chip o expõe; `fan1_input` dá a rotação em RPM. O fato de o valor vir em miligraus — e não em graus — é a primeira armadilha de quem escreve scripts de leitura de temperatura e esquece a divisão.

## O pacote lm-sensors

Ler arquivos um a um funciona, mas é verboso. O pacote `lm-sensors` agrupa uma ferramenta de detecção e uma de leitura que organizam tudo. No SteamOS (base Arch), ele é instalável com `pacman` no modo Desktop, caso ainda não esteja presente:

```bash
sudo steamos-readonly disable
sudo pacman -S --noconfirm lm_sensors
sudo sensors-detect
```

O `sensors-detect` vasculha o barramento (via I2C e SMBus) e pergunta se você quer ativar módulos de kernel para sensores adicionais. Para o APU do Deck ele não é necessário — o `k10temp` já carrega sozinho —, mas pode revelar sensores secundários da placa em docks e periféricos.

:::atencao
O SteamOS mantém a partição raiz em modo somente leitura (`steamos-readonly`). Instalar pacotes exige desativar esse modo temporariamente, e a instalação **será perdida** na próxima atualização do sistema, que restaura a imagem. Para uso recorrente, prefira ferramentas em Flatpak ou scripts que leiam `sysfs` diretamente.
:::

## Lendo tudo com sensors

Com o pacote instalado, o comando `sensors` entrega uma visão consolidada e já convertida para °C:

```terminal
$ sensors
k10temp-pci-00c3
Adapter: PCI adapter
Tctl:         +61.2°C
Tdie:         +61.2°C

amdgpu-pci-0400
Adapter: PCI adapter
edge:         +58.0°C
junction:     +61.0°C
slowPPT:      15.00 W
```

As duas grandezas do `k10temp` merecem atenção. `Tctl` é a temperatura de controle (control temperature), um valor que a AMD pode deslocar artificialmente para cima para fins de acionamento do cooler; `Tdie` é a temperatura real estimada do die. No APU do Deck os dois costumam coincidir, mas em CPUs de desktop há um offset fixo entre eles.

## Resumo

- O subsistema `hwmon` do kernel expõe temperaturas, tensões e RPM como arquivos em `/sys/class/hwmon/`.
- O arquivo `name` identifica o driver de cada sensor (`k10temp`, `amdgpu`, `steamdeck-hwmon`).
- Temperaturas são lidas em miligraus Celsius (`*_input`) e precisam de divisão por 1000.
- `lm-sensors` fornece `sensors-detect` e `sensors` para consolidar as leituras.
- `Tctl` é a temperatura de controle e `Tdie`, a real estimada do die do APU.

## Exercícios

1. Liste os diretórios em `/sys/class/hwmon/` e anote o `name` de cada um. Quantos sensores distintos o seu Deck expõe?
2. Leia `temp1_input` do `k10temp` cru e converta para graus. Depois compare com a saída de `sensors` para o mesmo instante.
3. Descubra se algum sensor expõe `temp1_max` ou `temp1_crit`. Qual é o valor e o que ele representa?
4. Instale `lm-sensors` e rode `sensors-detect`. Identifique quais sensores o script conseguiu (ou não) detectar.
5. **Desafio.** Escreva um script de uma linha que imprima, a cada segundo, apenas a temperatura `Tdie` extraída de `sensors`, sem depender da ordem dos diretórios `hwmon`. Explique por que usar o nome do driver é mais robusto que usar `hwmon2`.
