Volantes e pedais são a categoria de periférico onde o Steam Deck mais surpreende: o kernel Linux tem suporte de alta qualidade para as marcas mais populares, e o projeto `oversteer` substitui com folga o software de configuração proprietário da Logitech. Mas force feedback é um recurso de hardware real — motores no volante, não só código — e a profundidade da experiência depende inteiramente do jogo.

:::objetivos
- Identificar um volante pelo kernel e carregar o módulo `hid-logitech` ou equivalente
- Confirmar o funcionamento de eixos e botões com `evtest`
- Instalar e usar o `oversteer` para ajustar força e range
- Entender como o force feedback é exposto pelo subsistema `ff-memless`
:::

## O que o kernel suporta

Os módulos de volante mais maduros no kernel são `hid-logitech` (Logitech G25, G27, G29, G920, G923) e `hid-thrustmaster` (Thrustmaster T150, T300, TX). Há também suporte via `hid` genérico para marcas como Fanatec e Moza, mas com menos recursos.

```terminal
$ sudo dmesg | grep -iE 'logitech|g29|g920|thrustmaster|wheel'
[  512.331044] logitech 0003:046D:C24F.0012: hidraw10: USB HID v1.11 Joystick [Logitech G29 Driving Force Racing Wheel] on usb-0000:00:14.0-4/input0
[  512.332219] logitech 0003:046D:C24F.0012: Force feedback is supported
```

A segunda linha é a mais importante do capítulo: `Force feedback is supported`. Se ela não aparecer, ou o volante não tem motores, ou o módulo não carregou. Módulos de volante costumam vir no kernel incluído no SteamOS, mas `lsmod` confirma:

```terminal
$ lsmod | grep -E 'logitech|ff_memless|hid_logitech'
hid_logitech          36864  0
ff_memless            20480  2 hid_logitech,xpad
```

`ff_memless` é o subsistema de force feedback simplificado que o Linux usa para motores de vibração padrão. Ele recebe comandos do jogo ("acione o motor direito com força 80%") e os traduz para o protocolo do volante.

## Os eixos de um volante

Conecte o volante, abra `evtest` e gire: você vai ver uma estrutura de eventos mais complexa que a de um controle comum, com eixos que vão de -32767 a +32767 e pedais que ocupam eixos próprios:

```terminal
$ sudo evtest /dev/input/event7
Event: type 3 (EV_ABS), code 0 (ABS_X), value 0          # volante centro
Event: type 3 (EV_ABS), code 0 (ABS_X), value -16384     # girando 180° à esquerda
Event: type 3 (EV_ABS), code 0 (ABS_X), value 16384      # girando 180° à direita
Event: type 3 (EV_ABS), code 1 (ABS_Y), value 0          # acelerador
Event: type 3 (EV_ABS), code 5 (ABS_RZ), value 255       # freio
Event: type 3 (EV_ABS), code 16 (ABS_HAT0X), value -1    # D-pad esquerda
```

Cada volante mapeia os pedais em eixos diferentes — ABS_Y para acelerador e ABS_RZ para freio é o layout típico da Logitech. Isso importa porque, se o jogo não reconhece os pedais, o diagnóstico começa identificando em qual eixo cada um está.

:::atencao
A calibração do centro do volante (valor de repouso) é feita no firmware, não no driver. Se você conecta o volante já com a mão encostada ou fora de posição, o centro pode ficar deslocado. A recomendação é conectar o volante enquanto ele está em repouso absoluto (ou fazer a calibração de centro que os Logitech executam ao girar completamente para cada lado quando energizados).
:::

## Oversteer: o app que a Logitech não fez para Linux

`oversteer` é o configurador de volantes para Linux. Ele lê e grava o range de rotação (90° a 900°), a faixa de força do force feedback e o autocentro. Instalação no SteamOS:

```terminal
$ sudo pacman -S oversteer
resolving dependencies...
looking for conflicting packages...

Packages (1) oversteer-0.8.3-1

Total Installed Size:  2.34 MiB
```

Após instalar, abra o `oversteer` (ele é um app gráfico) e você verá o volante listado com seus parâmetros. A interface é mais enxuta que o Logitech G Hub, mas cobre todos os parâmetros relevantes:

| Parâmetro | O que faz | Faixa típica |
|---|---|---|
| Range (ângulo) | Rotação total do volante (lock a lock) | 180°–900° para Logitech G29 |
| Gain | Ganho geral do force feedback | 0–100% |
| Spring | Força de autocentro (retorno ao centro) | 0–100% |
| Damper | Resistência viscosa (simula peso) | 0–100% |
| Autocenter | Força que puxa o volante de volta ao centro | ativado ou desativado |

O range é o mais importante: jogos de Fórmula 1 exigem rotação curta (270°–360°), simuladores de rali usam rotação longa (540°–900°). O `oversteer` permite salvar perfis com ranges diferentes e trocar conforme o jogo.

```terminal
$ oversteerctl --list
G29 Driving Force Racing Wheel
$ oversteerctl --range 540
Range set to 540 degrees
```

O `oversteerctl` é a contraparte CLI que permite scripts — útil para trocar o range antes de lançar um jogo específico via Steam.

## Force feedback na prática

O force feedback funciona assim: o jogo envia um *efeito* (tipo "motor esquerdo com força 70% por 200 ms"), o `ff_memless` traduz para o protocolo do volante e o motor atua. Efeitos mais complexos (curvas de força variável, efeitos senoidais para terrenos irregulares) são suportados em hardware, mas o Linux só implementa o subconjunto `ff_memless` (efeitos simples). Para força variável, a alternativa é o projeto `new-lg4ff`, que expande o suporte nos modelos Logitech G27/G29/G920.

:::info
O módulo `new-lg4ff` é um fork do driver oficial que adiciona efeitos condicionais (spring, damper, friction e inertia) aos volantes Logitech. Ele vive fora do kernel principal, mas está disponível como módulo DKMS no AUR do Arch e roda no SteamOS após jailbreak. Consulte o [guia do projeto no GitHub](https://github.com/berarma/new-lg4ff).
:::

## Resumo

- O kernel reconhece volantes Logitech e Thrustmaster com os módulos `hid-logitech` e `hid-thrustmaster`.
- A linha `Force feedback is supported` no `dmesg` confirma que os motores funcionam.
- `evtest` mostra cada eixo: volante em `ABS_X`, acelerador em `ABS_Y`, freio em `ABS_RZ`.
- `oversteer` (gráfico) e `oversteerctl` (CLI) ajustam range, ganho e força do volante.
- O subsistema `ff_memless` traduz comandos de vibração do jogo para o protocolo do volante.
- Calibre o centro conectando o volante em repouso e deixando o firmware fazer a calibração inicial.

## Exercícios

1. Conecte o volante e confirme com `sudo dmesg | grep -iE 'logitech|thrustmaster|wheel'` se o módulo correto carregou e se `Force feedback is supported`.
2. Abra `evtest` no nó do volante e gire o aro. Anote os valores mínimo, central e máximo de `ABS_X`.
3. Identifique os eixos dos pedais: acelere e freie devagar no `evtest` e anote qual código (`ABS_Y`, `ABS_RZ`, etc.) corresponde a cada pedal.
4. Instale `oversteer` e mude o range de rotação para 540°. Teste em um jogo que suporte volante e sinta a diferença.
5. **Desafio.** Pesquise se o seu volante é compatível com o `new-lg4ff`. Se for, instale o módulo DKMS, recarregue, e compare a força de autocentro entre o módulo original e o `new-lg4ff` usando `evtest` e um jogo.