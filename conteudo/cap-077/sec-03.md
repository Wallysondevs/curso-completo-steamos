Acessar os limites da APU pelo Smokeless UMAF funciona, mas exige reinicialização a cada ajuste. Para iterar rápido — testar, medir, ajustar, testar de novo — o que resolve é o **RyzenAdj**, uma ferramenta que escreve diretamente nos registradores do SMU (System Management Unit) da AMD pelo espaço de I/O do kernel, sem reiniciar. Esta seção cobre instalação, leitura e aplicação de ajustes em tempo real no SteamOS.

:::objetivos
- Instalar o RyzenAdj no SteamOS com acesso direto ao SMU
- Ler os limites atuais de PPT, TDC, EDC e temperatura
- Aplicar ajustes temporários e testar antes de gravar na BIOS
- Entender as limitações do RyzenAdj comparado ao Smokeless UMAF
:::

## O que o RyzenAdj escreve de verdade

O SMU é um microcontrolador dentro da APU que gerencia potência, relógios e tensão. Ele expõe registradores no barramento PCI, e o RyzenAdj escreve neles através da porta `0xCF8`/`0xCFC` (PCI config space) ou, em modos mais recentes, pelo driver `ryzen-smu` do kernel.

```terminal
$ lspci -nn | grep -i "host bridge"
00:00.0 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Device [1022:1630]
```

O RyzenAdj precisa de permissão para acessar o espaço de I/O. No SteamOS, isso significa rodar como root ou, preferivelmente, com o bit `CAP_SYS_RAWIO` no binário. Sem isso, qualquer comando vai devolver `pci dev: Init Error`.

## Instalação no SteamOS

O SteamOS é imutável — o diretório `/usr` é read-only. A instalação do RyzenAdj precisa ir para `/home` ou ser empacotada com `distrobox`:

```terminal
$ mkdir -p ~/lab/ryzenadj && cd ~/lab/ryzenadj
$ curl -LO https://github.com/FlyGoat/RyzenAdj/releases/download/v0.16.0/ryzenadj-linux-amd64-v0.16.0.tar.gz
$ tar xzf ryzenadj-linux-amd64-v0.16.0.tar.gz
$ file ryzenadj
ryzenadj: ELF 64-bit LSB executable, x86-64
```

Para executar com privilégio de I/O sem sudo constante:

```terminal
$ sudo setcap cap_sys_rawio=ep ~/lab/ryzenadj/ryzenadj
$ ~/lab/ryzenadj/ryzenadj -i | head -5
CPU Family: Rembrandt (Aerith)
SMU Version: 90.06.00
STAPM LIMIT: 15.000 W
PPT LIMIT FAST: 20.000 W
PPT LIMIT SLOW: 15.000 W
```

O `setcap` grava a capability no binário; numa atualização do SteamOS que limpe `/home` basta refazer o `setcap`. Se preferir não usar `setcap`, crie um alias com `sudo`.

:::atencao
Algumas versões do kernel do SteamOS bloqueiam o acesso ao barramento PCI para o RyzenAdj. Se você receber `Unable to map SMU`, é possível que a Valve tenha desabilitado essa via em updates recentes. A alternativa é usar o Smokeless UMAF — mais lento, mas garantido.
:::

## Lendo o estado da APU

O `ryzenadj -i` (info) é seu comando de diagnóstico mais frequente:

```terminal
$ sudo ~/lab/ryzenadj/ryzenadj -i
CPU Family: Rembrandt (Aerith)
SMU Version: 90.06.00
STAPM LIMIT: 15.000 W  STAPM VALUE: 12.341 W
PPT LIMIT FAST: 20.000 W  PPT VALUE FAST: 14.822 W
PPT LIMIT SLOW: 15.000 W  PPT VALUE SLOW: 13.105 W
TDC LIMIT (VDD): 10.000 A  TDC VALUE (VDD): 7.234 A
TDC LIMIT (SOC): 2.500 A   TDC VALUE (SOC): 1.891 A
EDC LIMIT (VDD): 150.000 A EDC VALUE (VDD): 75.300 A
EDC LIMIT (SOC): 15.000 A  EDC VALUE (SOC): 5.100 A
TEMP: 68.4 C
APU Power: 12.341 W
```

Os campos `LIMIT` mostram o teto configurado (na BIOS ou pelo Smokeless). Os campos `VALUE` mostram o consumo **atual**, lido em tempo real. É a diferença entre os dois que diz se a APU está limitada ou não: se `STAPM VALUE` = `STAPM LIMIT`, você atingiu o teto térmico.

## Ajustando limites ao vivo

Para subir o STAPM para 20 W temporariamente (volta ao default no reboot):

```terminal
$ sudo ~/lab/ryzenadj/ryzenadj --stapm-limit=20000
$ sudo ~/lab/ryzenadj/ryzenadj -i | grep STAPM
STAPM LIMIT: 20.000 W  STAPM VALUE: 13.012 W
```

O RyzenAdj aceita todos os parâmetros de uma vez. Para aplicar a receita conservadora da seção anterior num único comando:

```terminal
$ sudo ~/lab/ryzenadj/ryzenadj \
    --stapm-limit=20000 \
    --fast-limit=22000 \
    --slow-limit=20000 \
    --tctl-temp=95 \
    --vrm-current=120000 \
    --vrmmax-current=160000
```

Aqui, `--tctl-temp` define a temperatura máxima da APU antes do throttling (95°C), `--vrm-current` é o TDC e `--vrmmax-current` é o EDC. Os valores estão em mA (miliamperes) e os de potência em mW.

:::dica
Use o RyzenAdj para iterar valores rapidamente: ajuste, rode um benchmark curto (5 minutos), meça. Quando achar uma combinação estável, grave os mesmos valores no Smokeless UMAF para persistir entre reinicializações.
:::

## O que o RyzenAdj NÃO faz

O RyzenAdj ajusta potência, corrente e temperatura — mas não mexe em tensão por núcleo (isso é domínio do Curve Optimizer, acessível só pelo Smokeless UMAF) e nem em clocks mínimos ou máximos da GPU integrada de forma fina. Ele também não persiste: ao desligar, os valores voltam ao que está gravado na NVRAM da BIOS. Isso é uma limitação e uma vantagem — você pode testar extremos sem medo de brick, porque o reboot cura tudo.

## Resumo

- O RyzenAdj escreve nos registradores do SMU da AMD pelo espaço de I/O do PCI, sem reiniciar.
- Instala-se em `/home` e precisa de `sudo` ou `setcap cap_sys_rawio=ep` para acessar o barramento.
- `ryzenadj -i` mostra os limites configurados e o consumo atual — a diferença indica se há headroom.
- Ajustes via RyzenAdj são voláteis; para persistir, grave os valores no Smokeless UMAF.
- O RyzenAdj não controla tensão por núcleo nem clocks fixos de GPU; isso requer o Curve Optimizer.

## Exercícios

1. Instale o RyzenAdj no diretório `~/lab/ryzenadj` e execute `ryzenadj -i`. Anote os seis valores de limite e os seis valores atuais.
2. Suba o STAPM para 18 W com `ryzenadj --stapm-limit=18000` e rode `ryzenadj -i` novamente. O `STAPM VALUE` subiu? Por que ele não atinge o teto instantaneamente?
3. Aplique os três limites ao mesmo tempo (PPT, TDC, EDC) com os valores conservadores da seção 2 e meça o FPS num benchmark leve (qualquer jogo com contador de FPS).
4. Execute `watch -n 1 'ryzenadj -i | grep -E "STAPM|TEMP"'` enquanto um jogo roda. Descreva o que acontece com o consumo quando a temperatura ultrapassa 80°C.
5. **Desafio.** O RyzenAdj escreve em registradores do SMU via portas PCI. Investigue por que o SteamOS imutável bloqueia essa operação em certas versões e proponha uma solução com `steamos-readonly disable` que respeite a integridade do sistema após o teste.