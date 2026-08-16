Depois de percorrer pareamento, controles, teclado, impressora, webcam, USB e diagnóstico, esta seção amarra tudo num protocolo prático de resolução de problemas. O pareamento de Bluetooth é onde a maioria dos usuários trava, e a maioria dos erros não é de configuração — é de estado: um dispositivo "meio pareado", um rádio que dormiu, um daemon que não voltou da suspensão. Aqui você aprende a reconhecer os sintomas, desfazer pareamentos defeituosos e restaurar um estado limpo.

:::objetivos
- Reconhecer os sintomas mais comuns de falha de pareamento
- Remover e reparar dispositivos problemáticos com `remove` e `untrust`
- Diagnosticar o estado do Bluetooth após suspensão
- Restaurar o subsistema Bluetooth a um estado limpo
:::

## Os três sintomas que dominam o suporte

Antes de mergulhar em comandos, vale catalogar o que as pessoas mais relatam, porque cada sintoma aponta para uma camada diferente do diagnóstico.

**"Não apareceu nada no escaneamento."** O `scan on` roda e nenhum `[NEW]` surge. Causas, em ordem de probabilidade: o dispositivo não está em modo de pareamento (o gesto de segurar o botão não foi feito direito), o rádio está bloqueado no `rfkill`, ou o daemon parou. Este é o caso que se resolve com a ordem de diagnóstico da seção anterior: `rfkill list` → `systemctl status bluetooth` → testar outro dispositivo.

**"Pareia, mas desconecta sozinho."** O aparelho pareia e conecta, mas cai segundos depois, ou some ao dormir e acordar o Deck. A causa mais frequente é a falta do `trust`, seguida de interferência/baixo `RSSI` e, em terceiro, perfil de energia que dorme o rádio.

**"Já esteve pareado, mas não conecta mais."** O dispositivo aparece no `devices`, mas o `connect` falha ou fica em loop. Geralmente o estado do par ficou corrompido — e a solução é remover e reparar do zero.

:::info
O SteamOS gerencia energia do adaptador Bluetooth de forma agressiva para economizar bateria. Depois de acordar da suspensão, o rádio pode demorar alguns segundos ou exigir que o dispositivo seja reconectado manualmente. Se o comportamento de "perder e reconectar sozinho" te incomoda, tente marcar o dispositivo como `trusted` (que já permite reconexão automática) antes de mexer em nada mais profundo.
:::

## Removendo um pareamento defeituoso

Quando um par ficou corrompido, remover e recriar é mais rápido e confiável do que insistir. O `bluetoothctl` oferece `remove` (apaga o par e o conhecimento do dispositivo) e `untrust` (só remove a confiança, mantendo o par):

```terminal
[bluetooth]# devices
Device E8:D0:3A:11:7B:C2 WH-1000XM4
[bluetooth]# untrust E8:D0:3A:11:7B:C2
[CHG] Device E8:D0:3A:11:7B:C2 Trusted: no
Changing E8:D0:3A:11:7B:C2 trust succeeded
[bluetooth]# disconnect E8:D0:3A:11:7B:C2
Attempting to disconnect from E8:D0:3A:11:7B:C2
[CHG] Device E8:D0:3A:11:7B:C2 Connected: no
[bluetooth]# remove E8:D0:3A:11:7B:C2
[DEL] Device E8:D0:3A:11:7B:C2 WH-1000XM4
Device has been removed
```

A ordem importa: desconecte primeiro (`disconnect`), depois remova (`remove`). A linha `[DEL]` confirma que o dispositivo sumiu do `devices`. Agora você volta ao `scan on` e refaz o pareamento limpo (com `trust` e `connect`), como na primeira seção.

:::atencao
Depois de um `remove`, o dispositivo pode **não reaparecer no escaneamento imediatamente**, porque alguns aparelhos "lembram" do host remoto e ficam tentando reconectar a ele em vez de se anunciar. Se o aparelho não voltar ao `scan`, desligue-o, espere alguns segundos e coloque-o de novo em modo de pareamento — isso força uma nova anunciação.
:::

## O Bluetooth depois da suspensão

O sintoma "perco o Bluetooth toda vez que o Deck dorme" merece um diagnóstico próprio, porque envolve o ciclo de energia do rádio. Ao acordar, pergunte diretamente ao sistema se o rádio e o daemon sobreviveram:

```terminal
$ rfkill list bluetooth
1: hci0: Bluetooth
	Soft blocked: no
	Hard blocked: no
$ systemctl is-active bluetooth
active
$ bluetoothctl info E8:D0:3A:11:7B:C2 | grep Connected
	Connected: no
```

O rádio está desbloqueado, o daemon ativo, mas o dispositivo aparece `Connected: no`. Ou seja, a infraestrutura está viva — só a conexão individual caiu. Nesse cenário, reconectar manualmente (`connect <MAC>`) costuma resolver, e o `trust` prévio é o que permite a reconexão automática na maioria dos casos.

Se, por outro lado, o `rfkill` mostrar `Soft blocked: yes` após acordar, é o gerenciamento de energia que bloqueou o rádio durante o sono. Desbloqueie e, se quiser que o comportamento mude, investigue as regras de energia do serviço:

```terminal
$ rfkill unblock bluetooth
$ rfkill list bluetooth
1: hci0: Bluetooth
	Soft blocked: no
	Hard blocked: no
```

:::dica
Para ver o que aconteceu com o Bluetooth exatamente no momento de acordar, o `journalctl` focado no serviço revela a sequência: `journalctl -u bluetooth --since "5 minutes ago"` mostra se o daemon reiniciou ou se o rádio foi bloqueado/reaberto durante a suspensão.
:::

## Restaurando a um estado limpo

Quando nada do que é pontual resolve — dispositivos sumindo, pareamentos caindo, `bluetoothctl` se recusando a conectar — o passo final é reiniciar a pilha inteira. É pouco invasivo e descarta qualquer estado preso na memória do daemon:

```terminal
$ sudo systemctl restart bluetooth
$ systemctl status bluetooth
● bluetooth.service - Bluetooth service
   Loaded: loaded (/usr/lib/systemd/system/bluetooth.service; enabled; preset: enabled)
   Active: active (running) since Sat 2025-08-16 16:45:03 -03; 2s ago
   Main PID: 3210 (bluetoothd)
```

Note o `Main PID` novo (`3210`, antes era outro) e o tempo `2s ago` — o daemon foi reiniciado do zero. Depois disso, os dispositivos marcados como `trusted` devem se reconectar sozinhos; os que não estão, você reconecta manualmente.

Se mesmo após o restart o problema persistir, a última trincheira é limpar o cache de pareamento do controlador e recomeçar com o adaptador desligado e religado:

```terminal
[bluetooth]# power off
Changing power off succeeded
[bluetooth]# power on
Changing power on succeeded
[bluetooth]# scan on
Discovery started
```

O ciclo `power off` → `power on` do controlador força o rádio a reinicializar o hardware, o que limpa estados de baixo nível que o `restart` do serviço não alcança (por exemplo, fila de conexão presa no chip). Combine com um `remove` dos dispositivos problemáticos e um reparamento limpo, e a grande maioria dos casos se resolve sem reinstalar nada.

:::exemplo
Ana tinha um fone que conectava, tocava três segundos e caía, em loop. Ela tentou `connect` várias vezes sem sucesso. O protocolo que resolveu: `remove` do fone no `bluetoothctl`, `sudo systemctl restart bluetooth`, `power off`/`power on` no controlador, e então um pareamento limpo com `trust`. O loop não voltou — o estado corrompido do par anterior tinha sido descartado em todas as camadas.
:::

## Resumo

- Os três sintomas dominantes são: nada aparece no scan, pareia mas desconecta, e "já pareado mas não conecta".
- `untrust` remove só a confiança; `remove` apaga o par inteiro — desconecte antes de remover.
- Após a suspensão, o rádio e o daemon podem estar vivos com a conexão individual caída; `trust` permite a reconexão automática.
- `sudo systemctl restart bluetooth` reinicia o daemon e limpa estados presos, com `Main PID` novo.
- O ciclo `power off` → `power on` no `bluetoothctl` reinicializa o rádio em nível de hardware.

## Exercícios

1. Pareie um dispositivo, marque como `trusted`, e depois remova a confiança com `untrust`. Observe o que muda em `bluetoothctl info`.
2. Reproduza o ciclo completo de limpeza: `disconnect` → `remove` → `scan on` → repareamento limpo com `trust`.
3. Ponha o Deck em suspensão e acorde, depois rode `rfkill list bluetooth` e `systemctl is-active bluetooth` para registrar o estado após o ciclo.
4. Reinicie o serviço com `sudo systemctl restart bluetooth` e compare o `Main PID` antes e depois com `systemctl status bluetooth`.
5. **Desafio.** Combine tudo o que aprendeu neste capítulo: provoque uma falha (remova o par e bloqueie o rádio), e então restaure o sistema com a sequência `rfkill unblock` → `restart bluetooth` → `power on` → `scan` → `pair` → `trust` → `connect`, documentando o estado de cada etapa com os comandos de leitura correspondentes.