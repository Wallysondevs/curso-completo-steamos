Toda máquina Linux que se conecta a uma rede Wi-Fi, a um cabo ou a uma VPN passa pela mesma peça de software no SteamOS: o NetworkManager. Ele é o serviço que descobre redes, associa o adaptador ao ponto de acesso, negocia o endereço IP pelo DHCP e mantém a conexão viva enquanto você joga. Entender como ele está organizado é pré-requisito para tudo o que vem depois neste capítulo.

:::objetivos
- Entender o papel do NetworkManager no SteamOS e como ele se relaciona com o interface gráfica do KDE
- Consultar o estado dos dispositivos e conexões com `nmcli`
- Identificar as interfaces de rede (nomeadas com `ip addr`) e seu estado
- Reiniciar e inspecionar o serviço com `systemctl` e `journalctl`
:::

## Um serviço no meio do caminho

No SteamOS, você quase nunca configura rede editando arquivos em `/etc/network/interfaces` — aliás, esse diretório nem costuma existir. Quem assume o posto é o **NetworkManager**, um daemon que roda em segundo plano e centraliza todo o gerenciamento de conectividade: Wi-Fi, cabeada, VPN, tethering e mais.

A vantagem é que a interface gráfica do KDE (o "Modo Desktop") e a linha de comando falam com o **mesmo** serviço. Quando você clica no ícone de Wi-Fi na bandeja do sistema e escolhe uma rede, o applet está apenas mandando uma ordem para o NetworkManager. Isso significa que qualquer configuração feita por aqui continua visível (e reversível) pela GUI, e vice-versa.

```terminal
$ systemctl status NetworkManager
● NetworkManager.service - Network Manager
     Loaded: loaded (/usr/lib/systemd/system/NetworkManager.service; enabled; preset: enabled)
     Active: active (running) since Wed 2024-06-05 18:22:41 -03; 3h 12min ago
       Docs: man:NetworkManager(8)
   Main PID: 712 (NetworkManager)
      Tasks: 3 (limit: 9145)
     Memory: 13.4M
     CGroup: /system.slice/NetworkManager.service
             └─712 /usr/sbin/NetworkManager --no-daemon
```

O campo `Active: active (running)` confirma que o serviço está de pé, e `enabled` informa que ele sobe automaticamente no boot. É raro você precisar mexer nisso no SteamOS, mas saber que ele existe evita o desespero quando algo para de funcionar.

## A árvore de dispositivos e conexões

O NetworkManager separa duas ideias que é fácil confundir: **dispositivo** e **conexão**. O dispositivo é o hardware — o chip Wi-Fi, a porta de rede do dock, a interface Bluetooth. A conexão é a configuração que se aplica sobre aquele dispositivo: o nome da rede, a senha, o IP fixo, a VPN. Um mesmo dispositivo pode ter várias conexões salvas, e uma conexão pode ser reutilizada em máquinas diferentes.

```terminal
$ nmcli device status
DEVICE          TYPE      STATE                   CONNECTION
wlan0           wifi      connected               Casa-5G
enp3s0f3u1u2    ethernet  unavailable             --
lo              loopback  unmanaged               --
```

Aqui `wlan0` está conectada à rede `Casa-5G`; `enp3s0f3u1u2` é a Ethernet do dock que, sem cabo plugado, aparece como `unavailable`; `lo` é a interface de loopback, sempre presente e sem gerenciamento. A coluna `STATE` é o que você deve olhar primeiro em qualquer diagnóstico.

Já `nmcli connection show` lista as *configurações* salvas, não o hardware:

```terminal
$ nmcli connection show
NAME                UUID                                  TYPE      DEVICE
Casa-5G             e6e1f0a1-9c31-4a86-8f5d-2b3a7d0c9e12  wifi      wlan0
Ethernet direto     77bbf0c2-11a1-41b2-b6c0-f9d1e2c3a4b5  ethernet  --
lo                  b1c2d3e4-5500-4a11-9b22-000000000001  loopback  lo
```

Repare que a conexão `Casa-5G` aparece nas duas listas com papéis diferentes: na primeira ela é o que está *ativo*, na segunda é o perfil *salvo*. Quando editar uma rede pelo clique no KDE, é este perfil que muda.

:::nota
O SteamOS 3.6 (base Noble) usa os nomes de interface **previsíveis** do `systemd/udev`: `wlan0` para Wi-Fi e nomes longos tipo `enp3s0f3u1u2` para Ethernet do dock, derivados da topologia do barramento. O velho `eth0` não existe mais, então não o procure em tutoriais.
:::

## O hardware visto pelo kernel

Antes do NetworkManager, é o kernel que precisa reconhecer a placa. O comando `ip addr` mostra todas as interfaces que o sistema enxerga, estejam elas conectadas ou não.

```terminal
$ ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
2: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 3c:37:86:0a:b1:c4 brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.42/24 brd 192.168.1.255 scope global dynamic noprefixroute wlan0
    inet6 fe80::3e37:86ff:fe0a:b1c4/64 scope link noprefixroute
```

O detalhe `LOWER_UP` nos colchetes `<...>` indica que há sinal elétrico/rádio de verdade na interface — é o equivalente ao LED aceso do roteador. O `inet 192.168.1.42/24` é o endereço que o DHCP entregou, com a nota `dynamic`. Sem esse `inet`, o dispositivo "sobe" mas não tem IP, e nada sai da rede.

:::dica
Comandos novos substituem os antigos: `ip addr` substituiu o `ifconfig`, e `ip route` substituiu o `route`. Se você seguir um tutorial com `ifconfig` e receber "command not found", troque mentalmente por `ip addr`.
:::

## Quando o NetworkManager precisa de ajuda

Se o ícone de rede sumiu da bandeja ou nada conecta, reiniciar o serviço costuma resolver boa parte dos problemas (a conexão cai por alguns segundos):

```terminal
$ sudo systemctl restart NetworkManager.service
```

O log do serviço conta a história do que aconteceu. O `journalctl` filtra pela unidade e mostra as mensagens mais recentes primeiro:

```terminal
$ journalctl -u NetworkManager -n 15 --no-pager
jun 05 18:22:41 steamdeck NetworkManager[712]: <info>  starting...
jun 05 18:22:41 steamdeck NetworkManager[712]: <info>  Loaded settings plugin ifcfg-rh: (c) 2007-2017 Red Hat
jun 05 18:22:42 steamdeck NetworkManager[712]: <warn>  ifupdown: interfaces file /etc/network/interfaces doesn't exist
jun 05 18:23:05 steamdeck NetworkManager[712]: <info>  device (wlan0): state change: unavailable -> disconnected
jun 05 18:23:09 steamdeck NetworkManager[712]: <info>  Activation (wlan0) Stage 4 of 5 complete (IPv4)
```

Linhas `<info>` são o fluxo normal, `<warn>` merecem atenção e `<error>` indicam falha. A transição `unavailable -> disconnected` mostra o momento em que o Wi-Fi foi habilitado e começou a procurar redes, e o `Stage 4 of 5` é o fim da negociação do IPv4 — a partir dali o IP já foi resolvido.

## Resumo

- O NetworkManager é o daemon que gerencia toda a conectividade do SteamOS, e tanto a GUI do KDE quanto `nmcli` falam com ele.
- `nmcli device status` mostra o hardware e seu estado; `nmcli connection show` mostra os perfis de configuração salvos.
- `ip addr` exibe as interfaces reconhecidas pelo kernel e o endereço IP entregue pelo DHCP (`inet`).
- `systemctl status NetworkManager` e `journalctl -u NetworkManager` revelam se o serviço está ativo e o histórico do que aconteceu.

## Exercícios

1. Rode `nmcli device status` e identifique, para cada linha, se é Wi-Fi, cabeada ou loopback, e o que significa o estado da coluna `STATE`.
2. Compare `nmcli device status` com `nmcli connection show` e explique a diferença entre uma conexão que está "ativa" e uma que está apenas "salva".
3. Execute `ip addr` e localize o endereço `inet` da sua interface Wi-Fi. A rede é `192.168.x` ou outro prefixo?
4. Reinicie o serviço com `sudo systemctl restart NetworkManager` e observe com `journalctl -u NetworkManager -n 20` as mensagens geradas pela reinicialização.
5. **Desafio.** Identifique o nome da interface de loopback e o endereço que ela sempre usa. Depois, ligue o dock com um cabo e veja a nova interface Ethernet que aparece em `ip addr`.
