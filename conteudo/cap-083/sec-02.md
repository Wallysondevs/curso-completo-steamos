O DualSense (controle do PlayStation 5) é hoje o gamepad mais rico em recursos que você pode parear no Steam Deck: gatilhos adaptativos, giroscópio, touchpad multitarefa, alto-falante interno e hápticos com motores de voz. O kernel do SteamOS 3.6 já traz o driver `hid-playstation`, então o aparelho funciona por USB sem nenhuma configuração — mas a conexão sem fio via Bluetooth exige um passeio pelo `bluetoothctl`.

:::objetivos
- Parear um DualSense por Bluetooth usando `bluetoothctl`
- Entender o modo de pareamento e a exclusividade do vínculo
- Confirmar que o driver `hid-playstation` carregou
- Desfazer um pareamento e reconectar de forma confiável
:::

## USB primeiro, para ter certeza

Antes de lutar com rádio, confirme que o controle funciona no caminho mais simples. Conecte o DualSense por USB-C e verifique se o kernel o reconheceu e carregou o driver certo:

```terminal
$ sudo dmesg | grep -iE 'playstation|dualsense' | tail -4
[  217.441212] playstation 0003:054C:0DF2.0009: hidraw7: USB HID v1.11 Gamepad [Sony Interactive Entertainment DualSense Wireless Controller] on usb-0000:00:14.0-1/input0
[  217.443317] playstation 0003:054C:0DF2.0009: Registered DualSense controller hw_version=0x00010112 fw_version=0x00010075
[  217.446921] playstation 0003:054C:0DF2.0009: All the individual LEDs of this device can be enabled
[  217.447110] playstation 0003:054C:0DF2.0009: Using single player color as LED source
```

O `dmesg` mostra o driver `playstation` assumindo o controle e registrando o aparelho como *DualSense Wireless Controller*. A linha do LED avisa que o driver controlará a barra de luz do controle — um sinal de que você não está num modo de compatibilidade reduzido, mas no driver completo.

## O modo de pareamento

Para que o Steam Deck descubra o controle, ele precisa estar em **modo de pareamento** (descoberta). No DualSense, isso se faz segurando juntos o botão **PS** e o botão **Create** (à esquerda do touchpad) até a barra de luz piscar rapidamente em azul. A piscada rápida é o aviso de que ele está anunciando sua presença.

:::atencao
Se o DualSense já está pareado com outro aparelho (PS5, celular, outro Deck), ele ignora o modo de descoberta e tenta reconectar ao parceiro antigo primeiro — ou fica "invisível" para você. Desligue ou esqueça o vínculo no outro aparelho antes de tentar parear aqui. Bluetooth é um vínculo exclusivo entre dois lados.
:::

## Pareando com bluetoothctl

A ferramenta interativa `bluetoothctl` é o jeito mais confiável de controlar o rádio Bluetooth no SteamOS. Entre nela com `sudo` para ter poder de escanear e parear:

```terminal
$ sudo bluetoothctl
Agent registered
[bluetooth]# power on
Changing power on succeeded
[bluetooth]# scan on
Discovery started
[CHG] Controller 04:XX:XX:XX:XX:XX Discovering: yes
[NEW] Device A0:AB:51:XX:XX:XX DualSense Wireless Controller
[bluetooth]# pair A0:AB:51:XX:XX:XX
Attempting to pair with A0:AB:51:XX:XX:XX
[CHG] Device A0:AB:51:XX:XX:XX Connected: yes
Pairing successful
[bluetooth]# trust A0:AB:51:XX:XX:XX
[CHG] Device A0:AB:51:XX:XX:XX Trusted: yes
Changing A0:AB:51:XX:XX:XX trust succeeded
[bluetooth]# connect A0:AB:51:XX:XX:XX
Connection successful
[bluetooth]# exit
```

O fluxo em quatro passos — `scan`, `pair`, `trust`, `connect` — resolve 90% dos casos. O passo `trust` é o que muita gente pula: sem ele, o controle pareia, mas não se reconecta automaticamente nas próximas vezes. A ordem dos endereços MAC (`A0:AB:51:...`) é específica do seu controle; copie a que aparecer no `[NEW] Device`.

## Reconexão automática e o vínculo

Depois de parear e confiar, o comportamento esperado é: ao ligar o controle, ele procura o Steam Deck e reconecta sozinho, sem repetir o ritual. Se isso não acontece, o culpado costuma ser aquele vínculo antigo no PS5, ou o `trust` esquecido.

Para confirmar o estado sem abrir o `bluetoothctl` todo de novo, liste os dispositivos pareados:

```terminal
$ bluetoothctl devices
Device A0:AB:51:XX:XX:XX DualSense Wireless Controller
$ bluetoothctl info A0:AB:51:XX:XX:XX
Device A0:AB:51:XX:XX:XX
	Name: DualSense Wireless Controller
	Paired: yes
	Trusted: yes
	Connected: yes
```

As três linhas finais resumem a saúde do vínculo: `Paired: yes` (o segredo de pareamento foi trocado), `Trusted: yes` (reconexão automática permitida) e `Connected: yes` (link de rádio ativo agora).

:::dica
Se o controle pareado não responde, o atalho mais rápido é desligar e religar o rádio: `bluetoothctl power off` seguido de `power on`. Isso "solta" conexões zumbis sem apagar nenhum pareamento.
:::

## Desfazendo o pareamento

Para desvincular de vez (por exemplo, para devolver o controle a um PS5), use `remove`:

```terminal
$ bluetoothctl remove A0:AB:51:XX:XX:XX
[DEL] Device A0:AB:51:XX:XX:XX DualSense Wireless Controller
Device has been removed
```

Isso apaga o segredo de pareamento dos dois lados. Para o controle voltar ao PS5, você terá que pareá-lo lá novamente via cabo USB ou por Bluetooth.

## Resumo

- O DualSense funciona por USB sem configuração graças ao driver `hid-playstation`.
- O modo de pareamento se ativa segurando PS + Create até a luz piscar em azul.
- O ritual completo é `scan`, `pair`, `trust`, `connect` no `bluetoothctl`.
- O passo `trust` é obrigatório para reconexão automática posterior.
- O endereço MAC do controle aparece na linha `[NEW] Device` durante o scan.
- `bluetoothctl info` revela os estados `Paired`, `Trusted` e `Connected`.

## Exercícios

1. Conecte o DualSense por USB e capture a linha de `sudo dmesg` que usa o driver `playstation`. Quais são os valores de `hw_version` e `fw_version`?
2. Pareie o controle via `bluetoothctl` seguindo os quatro passos e verifique o estado final com `bluetoothctl info`.
3. Desligue o controle (segure o botão PS) e ligue de novo. Ele reconecta sozinho? Se não, verifique se `Trusted` está `yes`.
4. Com o controle conectado, rode `bluetoothctl info` e compare os campos `Paired`/`Trusted`/`Connected` antes e depois de `power off`/`power on`.
5. **Desafio.** Pareie dois DualSense no mesmo Deck e descubra, usando `ls /dev/input/by-id`, como o sistema distingue os dois dispositivos idênticos. Que campo do caminho os diferencia?
