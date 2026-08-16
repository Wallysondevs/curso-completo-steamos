O modo portátil do Steam Deck tem seus próprios controles embutidos, mas para jogar na mesa — com o Deck no dock ligado a uma TV ou monitor — nada substitui um controle sem fio na mão: DualSense, DualShock 4, os controles de Xbox ou o Pro Controller da Nintendo. Todos eles falam Bluetooth, e o fluxo de pareamento é o mesmo que você viu na seção anterior; o que muda é o comportamento específico de cada um depois de conectado, sobretudo na latência e na troca de perfis. Aqui você aprende a parear cada família e a interpretar o que aparece no terminal.

:::objetivos
- Parear controles DualSense, DualShock 4, Xbox e Nintendo Pro via `bluetoothctl`
- Diferenciar o comportamento de cada família após a conexão
- Identificar como o controle aparece no sistema em termos de entrada
- Diagnosticar latência e quedas de conexão em controles sem fio
:::

## A variável que ninguém vê: o perfil de entrada

Quando um controle pareia por Bluetooth, o kernel e o Steam enxergam duas coisas diferentes. A primeira é o dispositivo físico no barramento Bluetooth (o MAC que você viu no `devices`). A segunda é o **perfil de entrada** que ele expõe — o jeito como os botões, analógicos e giroscópio são reportados ao sistema. O Steam, rodando no Deck, traduz isso para o padrão do Steam Input.

Isso explica por que o mesmo controle pode aparecer com nomes e comportamentos distintos conforme a conexão: um DualShock 4 por USB e por Bluetooth são, para o sistema, dois dispositivos de entrada diferentes. O `bluetoothctl info` mostra apenas o lado Bluetooth; o lado entrada você inspeciona com ferramentas de dispositivo, mas o essencial é saber que o Steam faz essa ponte automaticamente no Modo Jogo.

```terminal
$ bluetoothctl devices
Device A4:5E:60:1B:9C:74 Wireless Controller
Device DC:0C:2D:5A:8F:33 DualSense Wireless Controller
Device E8:48:B8:2C:F7:91 Pro Controller
```

Repare nos nomes: "Wireless Controller" é o rótulo genérico que os controles de Xbox usam por padrão, "DualSense Wireless Controller" é o DualSense (PS5) e "Pro Controller" é o controle da Nintendo. O nome que aparece no `devices` não é definido por você — vem do próprio controlador, e pode variar entre revisões de firmware.

## Pareando um DualSense ou DualShock 4

Os controles da Sony entram em modo de pareamento segurando o botão **PlayStation** junto com **Share** (no DualShock 4) ou **Create** (no DualSense) até a barra de luz piscar rapidamente. Depois, o fluxo é o de sempre:

```terminal
[bluetooth]# scan on
Discovery started
[NEW] Device DC:0C:2D:5A:8F:33 DualSense Wireless Controller
[bluetooth]# pair DC:0C:2D:5A:8F:33
Attempting to pair with DC:0C:2D:5A:8F:33
[CHG] Device DC:0C:2D:5A:8F:33 Paired: yes
Pairing successful
[bluetooth]# trust DC:0C:2D:5A:8F:33
[CHG] Device DC:0C:2D:5A:8F:33 Trusted: yes
[bluetooth]# connect DC:0C:2D:5A:8F:33
Attempting to connect to DC:0C:2D:5A:8F:33
[CHG] Device DC:0C:2D:5A:8F:33 Connected: yes
```

Um detalhe específico dos controles da Sony: depois de conectado ao Deck, o DualSense costuma reportar eventos de giroscópio, touchpad e gatilhos adaptativos, tudo mapeável pelo Steam Input. O DualShock 4 tem latência um pouco maior e não traz os gatilhos adaptativos, mas o pareamento é idêntico.

:::dica
Se você já pareou o controle no seu PlayStation, ele vai tentar reconectar ao console ao ser ligado. Para que o Deck não "brigue" pelo aparelho, o truque é desligar o console da tomada enquanto pareia, ou usar o modo de pareamento segurando os botões em vez de apenas ligar o controle — assim ele busca um novo host em vez da última conexão.
:::

## Controles de Xbox e o Pro Controller

Os controles de Xbox (Series X|S e a versão com Bluetooth do Xbox One) entram em pareamento segurando o botão de **sincronização** no topo, até o logo piscar. O pareamento é o mesmo, mas há uma nuance: o nome padrão "Wireless Controller" faz com que dois controles de Xbox parecem iguais no `bluetoothctl` — você os distingue pelo MAC.

O Pro Controller da Nintendo é o caso mais peculiar: ele entra em pareamento segurando o pequeno botão de sincronização na parte de cima, e historicamente o Linux teve suporte irregular para ele, incluindo o problema clássico de se conectar como um dispositivo de entrada errado. No SteamOS 3.6, com o Steam Input ativo, o comportamento está resolvido no Modo Jogo.

```terminal
[bluetooth]# connect E8:48:B8:2C:F7:91
Attempting to connect to E8:48:B8:2C:F7:91
[CHG] Device E8:48:B8:2C:F7:91 Connected: yes
[CHG] Device E8:48:B8:2C:F7:91 ServicesResolved: yes
```

A linha `ServicesResolved: yes` vale atenção: ela indica que o controle terminou de "descrever" ao Deck todos os seus serviços e características Bluetooth. Enquanto esse campo está ausente ou pendente, o Steam pode enxergar o controle como conectado mas ainda não mapear os botões corretamente.

:::atencao
O Pro Controller é conhecido por às vezes parear, conectar, e ainda assim não responder no jogo — o `ServicesResolved` fica pendurado. Se isso acontecer, remova o aparelho com `remove <MAC>`, reinicie o `bluetoothd` com `sudo systemctl restart bluetooth` e repareie do zero com o Steam Input já aberto.
:::

## Latência, quedas e o custo do sem fio

Todo controle Bluetooth introduz alguma latência, e a pergunta inevitável é "quanto". O Bluetooth clássico (o que esses controles usam) tem latência na casa de alguns milissegundos a dezenas de milissegundos, dependendo de interferência e da versão do rádio. O Deck com Bluetooth 5.3 (OLED) tende a sofrer menos quedas em ambientes congestionados que o 5.0 (LCD), mas a diferença não elimina interferência de paredes, micro-ondas e outros rádios de 2,4 GHz.

```terminal
$ bluetoothctl info DC:0C:2D:5A:8F:33 | grep -E 'Connected|RSSI'
	Connected: yes
	RSSI: -47 dBm
```

O campo `RSSI` (Received Signal Strength Indicator) é uma leitura da potência do sinal recebido pelo adaptador. Valores entre `-30` e `-60 dBm` são excelentes (perto, sem obstáculo); entre `-60` e `-80` sinal aceitável; abaixo de `-80`, a conexão fica instável e engolir inputs no meio de uma partida vira regra. Se o RSSI ficar ruim demais, aproxime o controle do Deck, afaste o roteador Wi-Fi de 2,4 GHz ou o hub USB — a interferência quase sempre mora nesses dois últimos.

:::exemplo
Ana pareou um DualSense no Deck para jogar na TV da sala. O controle respondia bem até o marido entrar na cozinha e ligar o micro-ondas: a partir dali, ataques não registravam e o giroscópio "pulava". Ao ler o `RSSI` ela viu `-88 dBm`, e a solução real foi aproximar o Deck do sofá e trocar o canal do Wi-Fi — não havia nada de errado com o pareamento em si.
:::

## Resumo

- Controles DualSense, DualShock 4, Xbox e Nintendo Pro usam o mesmo fluxo de pareamento do `bluetoothctl`.
- O nome exibido em `devices` vem do próprio controlador e não é definido por você.
- Controles da Sony entram em modo de pareamento segurando PlayStation + Share/Create; Xbox e Pro usam botões de sincronização próprios.
- `ServicesResolved: yes` indica que o controle terminou de expor seus serviços ao host.
- O campo `RSSI` mede a força do sinal e ajuda a diagnosticar latência e quedas por interferência.

## Exercícios

1. Coloque um DualSense (ou DualShock 4) em modo de pareamento e realize o pareamento completo no `bluetoothctl`, incluindo o `trust`.
2. Rode `bluetoothctl info <MAC>` e anote o `RSSI` com o controle a 30 cm e a 3 m de distância. A diferença é coerente?
3. Pareie um Pro Controller e observe se a linha `ServicesResolved` aparece como `yes`; registre o que acontece quando ela não resolve.
4. Compare os três controles no `devices`: qual o nome que cada um anuncia e qual a consequência prática de dois deles terem o mesmo nome?
5. **Desafio.** Com um controle conectado, rode `bluetoothctl info` enquanto o micro-ondas ou um download grande no Wi-Fi 2,4 GHz está ativo. Relacione a variação do `RSSI` com a interferência observada e proponha duas mudanças de ambiente que reduziriam as quedas.
