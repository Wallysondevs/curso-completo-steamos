A maioria dos acessórios que você vai ligar ao Steam Deck fala por dois caminhos: USB (com ou sem fio, através de dock ou hub) ou Bluetooth. O Bluetooth é o mais conveniente — nada de cabos — e também o que mais confunde, porque parear, conectar e "confiar" são três ações diferentes que o sistema trata separadamente. Esta seção estabelece a base: entender o que é o daemon de Bluetooth no SteamOS, como perguntar pelo estado dele e como conduzir um pareamento do começo ao fim pela ferramenta de linha de comando `bluetoothctl`.

:::objetivos
- Entender o papel do daemon Bluetooth e como verificar se ele está ativo
- Explorar o `bluetoothctl` e seus comandos básicos
- Realizar um pareamento completo: escanear, parear, conectar e confiar
- Verificar o estado dos dispositivos pareados após a sessão
:::

## Quem cuida do Bluetooth no SteamOS

No Linux, o Bluetooth é gerido por um daemon chamado `bluetoothd`, que conversa com o hardware através do kernel — especificamente pelo subsistema de rádio que aparece no módulo `btusb`. O `rfkill` (que você verá em detalhe mais adiante) é quem liga e desliga o rádio fisicamente. Acima do daemon, ferramentas gráficas e o `bluetoothctl` dão a você uma interface para mexer nos dispositivos.

O primeiro hábito de diagnóstico é perguntar se o serviço está de pé. No SteamOS, o serviço chamado genericamente de `bluetooth` pelo `systemd` encapsula todo esse caminho:

```terminal
$ systemctl status bluetooth
● bluetooth.service - Bluetooth service
     Loaded: loaded (/usr/lib/systemd/system/bluetooth.service; enabled; preset: enabled)
     Active: active (running) since Sat 2025-08-16 14:05:11 -03; 3h 12min ago
       Docs: man:bluetoothd(8)
   Main PID: 741 (bluetoothd)
     Status: "Running"
      Tasks: 1 (limit: 7684)
     Memory: 2.7M
        CPU: 1.312s
     CGroup: /system.slice/bluetooth.service
             └─741 /usr/lib/bluetooth/bluetoothd
```

O que interessa aqui são três campos: `Active: active (running)`, que diz que o daemon está no ar; `enabled`, que garante que ele sobe sozinho no boot; e o `Main PID`, o processo `bluetoothd`. Se o campo `Active` mostrar `inactive` ou `failed`, nenhum pareamento vai funcionar, não importa o que você tente no `bluetoothctl`.

:::info
O Steam Deck mais recente (modelo OLED) traz Bluetooth 5.3, enquanto o LCD original traz Bluetooth 5.0. A diferença prática é de alcance, estabilidade e latência — os comandos de pareamento que você aprende aqui são idênticos nos dois, porque a interface do `bluetoothctl` não muda com a versão do hardware por baixo.
:::

## Entrando no `bluetoothctl`

O `bluetoothctl` é um shell interativo: você o invoca e, em vez de um comando por linha, cai num prompt próprio (`[bluetooth]#`) onde digita comandos específicos dessa ferramenta. É o jeito mais confiável de fazer um pareamento completo, porque expõe cada etapa separadamente.

```terminal
$ bluetoothctl
Agent registered
[bluetooth]# show
Controller 3C:5A:B4:9F:12:7E (public)
	Name: steamdeck
	Alias: steamdeck
	Class: 0x00010c
	Powered: yes
	Discoverable: no
	Pairable: yes
```

O comando `show` apresenta o adaptador local (o `Controller`), o nome que ele anuncia (`steamdeck`) e três interruptores: `Powered` (o rádio está ligado), `Discoverable` (outros aparelhos conseguem *encontrar* o Deck, o que você normalmente deixa em `no`) e `Pairable` (o Deck aceita receber pedidos de pareamento, o ideal é `yes`). Note que `Discoverable` e `Pairable` são coisas distintas — um dispositivo pode ser pareável sem ser visível nos escaneamentos de terceiros.

Para sair do prompt interativo, digite `exit`. Você também pode pular o modo interativo usando o `bluetoothctl` com um comando como argumento, algo útil em scripts:

```terminal
$ bluetoothctl show
Controller 3C:5A:B4:9F:12:7E (public)
	Name: steamdeck
	...
```

A vantagem do modo interativo é que você encadeia várias etapas sem reescrever o nome do endereço do dispositivo a cada linha — e o auto-completar com a tecla `[[Tab]]` lista os comandos disponíveis.

## Um pareamento de ponta a ponta

O fluxo completo tem quatro passos. Primeiro, com o dispositivo em modo de pareamento (cada fone, controle ou teclado tem seu próprio gesto para isso, geralmente segurar um botão), você escaneia os aparelhos ao redor:

```terminal
[bluetooth]# power on
Changing power on succeeded
[bluetooth]# scan on
Discovery started
[CHG] Controller 3C:5A:B4:9F:12:7E Discovering: yes
[NEW] Device E8:D0:3A:11:7B:C2 WH-1000XM4
[NEW] Device A4:F1:E8:55:2D:09 Xbox Wireless Controller
```

O `scan on` deixa a descoberta rodando em segundo plano e vai imprimindo linhas `[NEW]` conforme encontra aparelhos. Aqui apareceram um fone Sony (`WH-1000XM4`) e um controle de Xbox, cada um com seu endereço MAC de 17 caracteres (seis pares hexadecimais). Anote o endereço do que você quer; ele é a chave de tudo que vem depois.

```terminal
[bluetooth]# scan off
Discovery stopped
[bluetooth]# pair E8:D0:3A:11:7B:C2
Attempting to pair with E8:D0:3A:11:7B:C2
[CHG] Device E8:D0:3A:11:7B:C2 Paired: yes
Pairing successful
[bluetooth]# connect E8:D0:3A:11:7B:C2
Attempting to connect to E8:D0:3A:11:7B:C2
[CHG] Device E8:D0:3A:11:7B:C2 Connected: yes
[bluetooth]# trust E8:D0:3A:11:7B:C2
[CHG] Device E8:D0:3A:11:7B:C2 Trusted: yes
Changing E8:D0:3A:11:7B:C2 trust succeeded
```

Observe a sequência com atenção, porque ela é a causa da maior parte da confusão: `pair` troca as chaves criptográficas e autoriza o aparelho; `connect` estabelece a conexão ativa naquele instante; `trust` diz ao sistema "este aparelho pode reconectar sozinho no futuro, sem pedir autorização". Parear sem confiar significa que, no próximo uso, o Deck pode pedir o pareamento de novo.

:::atencao
Um dispositivo pareado **não** é um dispositivo conectado, e um conectado não é necessariamente confiável. Se um fone "some" toda vez que você dorme e acorda o Deck, o diagnóstico mais comum é justamente a falta do `trust`: parear garante a chave, mas só o `trust` permite a reconexão automática.
:::

## Conferindo o resultado

Depois do pareamento, o comando `devices` lista o que o Deck conhece, e `info` mostra o estado vivo de um aparelho específico:

```terminal
[bluetooth]# devices
Device E8:D0:3A:11:7B:C2 WH-1000XM4
Device A4:F1:E8:55:2D:09 Xbox Wireless Controller
[bluetooth]# info E8:D0:3A:11:7B:C2
Device E8:D0:3A:11:7B:C2 (public)
	Name: WH-1000XM4
	Alias: WH-1000XM4
	Class: 0x00240418
	Paired: yes
	Trusted: yes
	Blocked: no
	Connected: yes
```

Aqui os três campos que você acabou de definir aparecem todos como `yes`, e `Blocked: no` confirma que o aparelho não foi colocado numa lista de bloqueio. É esse `info` que você consulta para saber, de relance, em qual das etapas o pareamento parou.

:::dica
Em vez de digitar o endereço MAC inteiro a cada comando, você pode usar o `menu <MAC>` para entrar num subprompt e depois os comandos simplificados `pair`, `connect` e `trust` operam sobre aquele aparelho. Também dá para referenciar o texto parcial do nome com a tecla `[[Tab]]` para auto-completar o endereço.
:::

## Resumo

- O daemon `bluetoothd`, controlado pelo `systemd` no serviço `bluetooth`, é quem gerencia o rádio no SteamOS.
- `systemctl status bluetooth` mostra se o serviço está ativo, habilitado no boot e qual o PID do daemon.
- `bluetoothctl` é um shell interativo com prompt próprio; `show` exibe o adaptador e os interruptores `Powered`, `Discoverable` e `Pairable`.
- Um pareamento completo é `scan on` → `pair` → `connect` → `trust`, cada etapa com responsabilidade distinta.
- `devices` lista os aparelhos conhecidos e `info <MAC>` mostra o estado de pareamento, conexão, confiança e bloqueio.

## Exercícios

1. Rode `systemctl status bluetooth` e transcreva os campos `Active`, `Loaded` e `Main PID`. O serviço está ativo e habilitado?
2. Entre no `bluetoothctl`, rode `show` e anote os valores de `Powered`, `Discoverable` e `Pairable` do seu adaptador.
3. Coloque um fone ou controle em modo de pareamento, rode `scan on` e registre o endereço MAC que aparece como `[NEW]`.
4. Complete o pareamento com `pair`, `connect` e `trust`, e confirme com `info <MAC>` que os três campos viraram `yes`.
5. **Desafio.** Pareie um dispositivo, conecte-o, reinicie o serviço com `sudo systemctl restart bluetooth` e observe em `info <MAC>` o que acontece com `Connected` quando o aparelho *não* está marcado como `trusted` — relate a diferença após o Deck entrar e sair de suspensão.
