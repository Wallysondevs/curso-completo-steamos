O Steam Deck depende de conectividade para quase tudo: baixar jogos, sincronizar saves, parear controles Bluetooth e acessar a internet. Quando o Wi-Fi desaparece do menu rápido ou o Bluetooth se recusa a conectar, você perde metade das funções do aparelho — e geralmente no pior momento (você abriu o Deck no ônibus, o jogo precisa checar a licença online e... nada). Esta seção mapeia os problemas de rede mais recorrentes.

:::objetivos
- Diagnosticar por que o Wi-Fi sumiu da interface ou não conecta
- Distinguir entre problema de firmware, driver rfkill e configuração NetworkManager
- Consertar Bluetooth ausente, que não pareia ou com áudio quebrado
- Saber os comandos-âncora: `nmcli`, `rfkill`, `iwctl` e `bluetoothctl`
- Recuperar conectividade mesmo quando a GUI não responde — usando só terminal
:::

## Tabela de rede e conectividade

| Sintoma | Causa provável | Solução |
|---|---|---|
| Wi-Fi sumiu completamente, não aparece nenhuma rede | Firmware Wi-Fi não carregou, rfkill bloqueou, kernel não viu interface | `sudo rfkill list`; se *hard blocked*, desligue modo avião; se *soft blocked*, `sudo rfkill unblock wifi` |
| Redes aparecem mas não conecta, pede senha de novo | Senha salva errada, autenticação WPA rejeitada, driver bug | `nmcli device wifi list` confirma a rede; `nmcli connection delete <ssid>` e recrie a conexão |
| Conecta mas internet não funciona, "conectado sem internet" | DNS quebrado, gateway errado, captive portal da Valve | `nmcli device show wlan0 | grep IP4`; confira gateway e DNS; `resolvectl status` |
| Wi-Fi desconecta sozinho após minutos | Power saving do iwd/NetworkManager, sinal fraco, roaming agressivo | `sudo iw dev wlan0 set power_save off`; desmarque "Power Save" nas configurações de rede |
| Internet lenta, downloads em 1 MB/s | Banda 2.4 GHz saturada, Wi-Fi 5 vs Wi-Fi 6, modem longe | `iw dev wlan0 link` mostra a taxa; mude para rede 5 GHz (OLED suporta Wi-Fi 6E) |
| Bluetooth não aparece nas configurações | Firmware btusb não carregou, serviço bluetoothd parado | `sudo systemctl status bluetooth`; se parado, `sudo systemctl start bluetooth` e veja `dmesg \| grep Bluetooth` |
| Bluetooth pareia mas o som falha/corta | Codec inadequado, buffer pipewire, interferência 2.4 GHz | `bluetoothctl info <mac>` confere codec; `wpctl status` mostra o sink de áudio |
| Controle Bluetooth não conecta depois de pareado | Perfil BLE/HID perdeu confiança, slot de pareamento esgotado | `bluetoothctl devices` lista; `bluetoothctl remove <mac>` e refaça o pareamento do zero |

Cada caso pede um pouco mais de contexto do que cabe na tabela. As subseções a seguir detalham os três cenários mais traiçoeiros.

## O Wi-Fi sumiu completamente — a hierarquia de verificação

Quando o ícone de Wi-Fi some e nenhuma rede aparece (nem a sua, nem a do vizinho), o problema está **acima** da camada de conexão — é driver, firmware ou rfkill. Siga esta sequência:

```terminal
# Passo 1: o kernel enxerga a interface?
$ ip link show wlan0
3: wlan0: <BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN mode DORMANT
```

Se o `ip link` não mostrar `wlan0`, o driver não carregou. Confirme com `lspci -k | grep -A3 Network`. Se a interface aparece mas está `DOWN`, vá ao passo 2.

```terminal
# Passo 2: rfkill está bloqueando?
$ sudo rfkill list
0: phy0: Wireless LAN
        Soft blocked: no
        Hard blocked: no
3: hci0: Bluetooth
        Soft blocked: no
        Hard blocked: no
```

**Hard blocked** significa que o modo avião foi ativado por hardware (chave física, atalho do Steam). No Deck, o modo avião do Quick Access Menu aciona soft block. Se ambos dizem "no", siga.

```terminal
# Passo 3: o firmware foi carregado?
$ sudo dmesg | grep -i 'iwlwifi\|firmware\|ath'
[    4.2] iwlwifi 0000:03:00.0: firmware: direct-loading firmware iwlwifi-...
```

Se o `dmesg` mostrar `failed to load firmware`, o arquivo de firmware está faltando (raro em SteamOS, mais comum em distros alternativas). A reinstalação do pacote `linux-firmware` via `sudo pacman -S linux-firmware` resolve.

```terminal
# Passo 4: levante a interface
$ sudo ip link set wlan0 up
$ nmcli device wifi list
```

Depois dos quatro passos, o Wi-Fi voltou em 90% dos casos. Se não voltou, reinicie: o kernel pode ter entrado num estado de driver inconsistente que só um boot limpo resolve.

## Wi-Fi conecta mas a internet não funciona

É o sintoma mais traiçoeiro porque a interface mente para você: "conectado, com força, tudo ok". O problema está na camada IP: o Deck associou ao ponto de acesso, mas não conseguiu endereço IP, gateway ou DNS.

```terminal
$ nmcli device show wlan0 | grep -E 'IP4|DNS|GATEWAY'
IP4.ADDRESS[1]:     192.168.0.42/24
IP4.GATEWAY:        192.168.0.1
IP4.DNS[1]:         1.1.1.1
```

Se o campo `IP4.ADDRESS` está vazio, o DHCP falhou:

```terminal
$ sudo nmcli device reapply wlan0        # renegocia DHCP
$ sudo nmcli connection down <ssid> && sudo nmcli connection up <ssid>
```

Se o IP existe mas o DNS está vazio ou errado, force um DNS público:

```terminal
$ nmcli connection modify <ssid> ipv4.dns "1.1.1.1 8.8.8.8"
$ nmcli connection down <ssid> && nmcli connection up <ssid>
```

O SteamOS puxa DNS via DHCP por padrão; alguns roteadores entregam o próprio IP como DNS e depois não resolvem. O `resolvectl status` mostra se a resolução está funcional:

```terminal
$ resolvectl status wlan0
Link 3 (wlan0)
    Current DNS Server: 1.1.1.1
    DNS Servers: 1.1.1.1 8.8.8.8
```

:::dica
O OLED tem Wi-Fi 6E (ao contrário do LCD, limitado a Wi-Fi 5). Se você tem um roteador 6E mas o Deck LCD insiste em 5 GHz saturado, trocar de banda resolve mais do que mexer em configuração. Veja a seguir.
:::

## Bluetooth: do pareamento ao codec

O Bluetooth do Steam Deck faz três coisas: controles, áudio e transferência de arquivos. Cada uma tem seu próprio perfil e seus próprios problemas.

**Controle que não conecta** — o mais comum é o slot de pareamento ter esgotado no controle, não no Deck. Muitos gamepads guardam um número limitado de hosts (o DualSense guarda 1, o Xbox guarda 2 por perfil). Remova o dispositivo e refaça:

```terminal
$ bluetoothctl
[bluetooth]# devices
Device XX:XX:XX:XX:XX:XX DualSense Wireless Controller
[bluetooth]# remove XX:XX:XX:XX:XX:XX
[bluetooth]# scan on
Discovery started
...
[bluetooth]# pair XX:XX:XX:XX:XX:XX
```

**Áudio Bluetooth com atraso ou corte** — a raiz quase sempre é o codec. O SteamOS, via PipeWire, suporta codecs como SBC, AAC, aptX e LDAC. O SBC (obrigatório, sempre presente) tem latência alta para jogos. Forçar AAC reduz o delay:

```terminal
$ bluetoothctl info XX:XX:XX:XX:XX:XX
...
        Audio Sink
                Codec: SBC
```

A negociação de codec é automática entre o host e o dispositivo; se o fone só suporta SBC, não há o que fazer no lado do Deck. Mas se suporta AAC/LDAC e está usando SBC, o problema está no perfil do PipeWire — o capítulo de áudio do curso cobre o ajuste em `/etc/pipewire/media-session.d/`.

**Bluetooth simplesmente não aparece** — é o equivalente de rede do Wi-Fi que sumiu. Verifique o serviço:

```terminal
$ sudo systemctl status bluetooth
● bluetooth.service - Bluetooth service
     Loaded: loaded (/usr/lib/systemd/system/bluetooth.service; enabled)
     Active: active (running)
```

Se estiver `inactive` ou `failed`, o motivo aparece em `journalctl -u bluetooth`. O driver `btusb` precisa do firmware; confira com `sudo dmesg | grep -i bluetooth` se houve erro ao carregar.

:::nota
Os capítulos de referência para esta seção são: rede e conectividade (cap. 23), `nmcli` e NetworkManager (cap. 23), Bluetooth e áudio (cap. 24), e Wi-Fi 6E no modelo OLED (cap. 4). Consulte-os para diagnóstico profundo de cada subsistema.
:::

## Resumo

- Wi-Fi que sumiu → `rfkill`, `dmesg` por firmware, `ip link` pela interface. Nessa ordem.
- Wi-Fi que conecta mas não navega → DHCP falhou ou DNS zoado; `nmcli device show wlan0` revela qual.
- Bluetooth que não aparece → `systemctl status bluetooth`; se parado, `start`.
- Bluetooth que não conecta → `remove` + `pair` do zero; controle pode ter esgotado os slots.
- Wi-Fi OLED (6E) vs LCD (Wi-Fi 5): o hardware dita o teto; se a rede está saturada em 2.4 GHz, mude de banda.

## Exercícios

1. Desligue e ligue o Wi-Fi pelo Quick Access Menu e execute `rfkill list` antes e depois. O soft block acompanha a alternância?
2. Com o Wi-Fi conectado, execute `nmcli device wifi list` e identifique a rede à qual seu Deck está associado. Qual a intensidade do sinal? Compare com `iw dev wlan0 link`.
3. Desconecte da rede, apague a conexão salva com `nmcli connection delete <ssid>` e reconecte do zero. O procedimento resolveu algum problema antigo?
4. Entre no `bluetoothctl`, execute `devices` e liste tudo que está pareado. Para cada dispositivo, execute `info <mac>` e anote os perfis suportados (HID, HSP, A2DP etc.).
5. **Desafio.** Force o Deck a usar um DNS diferente do fornecido pelo DHCP — por exemplo, `1.1.1.3` (Cloudflare com filtro de malware). Navegue por 30 minutos e veja se algum site legítimo foi bloqueado. Depois restaure o DNS original.