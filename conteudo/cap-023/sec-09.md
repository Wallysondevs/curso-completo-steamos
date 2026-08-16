Rede quebrada raramente anuncia a causa. O sintoma é genérico — "não abre nada", "cai toda hora", "conecta mas não navega" — e o problema pode estar em qualquer uma das camadas que percorremos. Fechar o capítulo com um roteiro consolidado de solução, cobrindo os sintomas mais comuns e o comando certo para cada um, transforma o que você aprendeu num reflexo que economiza horas.

:::objetivos
- Mapear sintomas comuns de rede do Steam Deck para as causas mais prováveis
- Aplicar um fluxo consolidado de diagnóstico usando as ferramentas anteriores
- Reativar serviços de rede e resetar o Wi-Fi quando o problema é de estado
- Reconstituir o ambiente de rede a partir dos logs quando nada parece explicar a falha
:::

## Sintoma → causa provável

Antes de digitar comandos, observe o sintoma e mire no culpado. Quase todo problema cai numa dessas caixas:

| Sintoma | Causa mais provável | Primeiro comando |
|---|---|---|
| "Não há redes Wi-Fi na lista" | Rádio desligado ou driver | `nmcli radio wifi` |
| "Conecta, mas não navega" | DNS ou rota padrão | `ping 1.1.1.1` seguido de `dig` |
| "Cai toda hora" | Sinal fraco ou economia de energia | `nmcli -f SSID,SIGNAL device wifi list` |
| "O cabo não funciona" | Dock ou velocidade | `ethtool <interface>` |
| "Estava funcionando e parou" | Estado corrompido do serviço | `systemctl restart NetworkManager` |

Essa tabela não resolve tudo, mas elimina 80% dos casos ao primeiro comando. O restante pede o fluxo completo que já vimos na [seção de diagnóstico](#/cap-023/sec-08).

## Estado do rádio: a causa invisível

O sintoma "não aparece nenhuma rede" quase nunca é problema de hardware no Deck — é o rádio Wi-Fi desligado. O SteamOS permite desativar o rádio separadamente do sistema, e às vezes ele fica `disabled` sem você perceber:

```terminal
$ nmcli radio
WIFI-HW  WIFI     WWAN-HW  WWAN
enabled  enabled  enabled  enabled
```

`WIFI-HW enabled` (hardware) e `WIFI enabled` (software) são dois níveis diferentes. Se o segundo estiver `disabled`, o hardware está OK mas o sistema mandou o rádio desligar. Reative:

```terminal
$ nmcli radio wifi on
$ nmcli device status
DEVICE          TYPE      STATE                   CONNECTION
wlan0           wifi      disconnected            --
```

Se mesmo com `radio wifi on` a interface não sai de `disconnected`, tente reativar o dispositivo explicitamente:

```terminal
$ nmcli device connect wlan0
```

A interface volta a escanear redes, e o `nmcli device wifi list` volta a popular.

## Reset de estado: reiniciando para limpar

Há uma classe de problema que é puro "estado preso": o NetworkManager ficou num loop de reconexão, o DHCP não renovou, ou o resolvedor engasgou. O remédio universal é derrubar e subir a pilha inteira:

```terminal
$ sudo systemctl restart NetworkManager
$ sudo systemctl restart systemd-resolved
```

Depois de reiniciar, observe o log enquanto o serviço reconstrói o estado:

```terminal
$ journalctl -u NetworkManager -n 25 --no-pager
jun 05 20:15:02 steamdeck NetworkManager[712]: <info>  caught SIGTERM, shutting down normally.
jun 05 20:15:03 steamdeck NetworkManager[890]: <info>  starting...
jun 05 20:15:04 steamdeck NetworkManager[890]: <info>  Loaded device iface: wlan0
jun 05 20:15:07 steamdeck NetworkManager[890]: <info>  Activation (wlan0) Stage 5 of 5 complete
```

O `Stage 5 of 5` confirma a reconexão completa ao Wi-Fi. Se o log mostrar `<error>` repetido no mesmo ponto — por exemplo, `supplicant failed` — o problema é mais profundo (driver ou o `wpa_supplicant`), e aí vale pesquisar pela mensagem exata.

:::dica
Para reiniciar a pilha de rede de fio a pavio num único comando e limpar caches de DHCP/lease, use `nmcli general reload` para recarregar a configuração sem derrubar a conexão, ou o `systemctl restart` completo quando o estado estiver corrompido.
:::

## Lendo logs com sentido

Quando o sintoma é intermitente, o log é sua única testemunha. O `journalctl` filtra por unidade e por período:

```terminal
$ journalctl -u NetworkManager --since "20 minutes ago" --no-pager | grep -E 'warn|error|disconnected|roamed'
jun 05 19:58:11 steamdeck NetworkManager[712]: <warn>  (wlan0): link timed out.
jun 05 19:58:14 steamdeck NetworkManager[712]: <info>  device (wlan0): state change: activated -> disconnected (reason 'carrier-changed')
jun 05 20:01:02 steamdeck NetworkManager[712]: <info>  device (wlan0): state change: disconnected -> activated
```

O padrão `activated -> disconnected -> activated` em sequência, com `reason 'carrier-changed'`, aponta para instabilidade do sinal — o chip está perdendo e recuperando a associação. Nesse caso, o comando a usar é o `nmcli -f SSID,SIGNAL,CHAN device wifi list` para ver o sinal e o canal, e talvez trocar de banda (5 GHz para 2,4 GHz quando o alcance é o problema).

:::atencao
O `reason` na linha de mudança de estado é a informação mais valiosa do log do NetworkManager. `carrier-changed` sugere sinal/alcance; `user-requested` indica que você (ou a GUI) pediu a desconexão; `dhcp-failed` aponta para o servidor DHCP. Antes de qualquer busca no Google, leia o `reason` — ele já diz o rumo da investigação.
:::

## Um caminho de fuga: Redes de teste

Se nada resolve e você suspeita de interferência no seu roteador, há sempre uma rede de teste portátil: o *tethering* do celular. O Steam Deck vê o smartphone como um ponto de acesso comum, e conectá-lo isola variáveis:

```terminal
$ nmcli device wifi list | grep -i iphone
  a4:b1:c2:d3:e4:f5  Meu iPhone       Infra  6  130 Mbit/s  90  ▂▄▆█  WPA2
$ nmcli device wifi connect "Meu iPhone" password "senha-do-hotspot"
```

Se o Deck navega bem no *tethering* mas não no seu roteador, o problema está no roteador, não no Deck. Se falha nos dois, o problema é no próprio aparelho (driver, rádio ou configuração). Esse experimento A/B é o jeito mais rápido de dividir o mundo em "culpa minha" e "culpa deles".

## Resumo

- Mapeie primeiro: cada sintoma tem um comando inicial certeiro (radio, sinal, DNS, dock, serviço).
- `nmcli radio` separa o rádio desligado (software) do hardware, causas de "nenhuma rede aparece".
- Reiniciar `NetworkManager` e `systemd-resolved` limpa estados presos; o log em `Stage 5 of 5` confirma a reconexão.
- No `journalctl`, o `reason` das mudanças de estado (`carrier-changed`, `dhcp-failed`) aponta a direção da causa.
- O *tethering* do celular é um teste A/B que isola problemas do Deck versus problemas da infraestrutura.

## Exercícios

1. Rode `nmcli radio` e desligue/religue o Wi-Fi com `nmcli radio wifi off` e `on`, observando o efeito em `nmcli device status`.
2. Gere um problema controlado: `nmcli device disconnect wlan0`. Depois diagnostique e reconecte usando o fluxo completo.
3. Reinicie a pilha de rede com `sudo systemctl restart NetworkManager systemd-resolved` e acompanhe o log até surgir o `Stage 5 of 5`.
4. Puxe o log do NetworkManager com `journalctl -u NetworkManager --since "30 minutes ago"` e identifique ao menos um `reason` de mudança de estado.
5. **Desafio.** Ative o *tethering* do celular, conecte o Deck a ele e compare latência e estabilidade com a rede Wi-Fi de casa (`ping -c 10` em cada uma). Interprete qual rede teve menor jitter.