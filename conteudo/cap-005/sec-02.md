Idioma, Wi-Fi e fuso horário são as três escolhas que mais impactam o uso diário logo após o primeiro boot. Elas parecem triviais no assistente gráfico, mas cada uma controla camadas diferentes do sistema: o idioma mexe no modo Gaming e no desktop; o Wi-Fi é gerido pelo NetworkManager; e o fuso horário define como o relógio interpreta a hora. Entender onde cada uma vive permite corrigir qualquer uma delas pelo terminal, sem refazer o assistente.

:::objetivos
- Corrigir o idioma e o fuso horário pelo terminal
- Inspecionar e gerenciar conexões Wi-Fi com `nmcli`
- Verificar endereços de rede com `ip addr`
- Entender a relação entre NTP, RTC e a hora exibida
- Listar redes disponíveis e diagnosticar falhas de conexão
:::

## Idioma e locale

O modo desktop do SteamOS usa as variáveis de *locale* do sistema, que controlam formato de data, moeda, ordem de palavras e codificação de caracteres. O modo Gaming, por sua vez, guarda o idioma em arquivos próprios dentro de `~/.steam`. O ponto de partida para inspecionar o locale ativo é:

```terminal
$ locale
LANG=en_US.UTF-8
LANGUAGE=
LC_CTYPE="en_US.UTF-8"
LC_NUMERIC="en_US.UTF-8"
LC_TIME="en_US.UTF-8"
LC_COLLATE="en_US.UTF-8"
LC_MONETARY="en_US.UTF-8"
LC_MESSAGES="en_US.UTF-8"
LC_PAPER="en_US.UTF-8"
LC_NAME="en_US.UTF-8"
LC_ADDRESS="en_US.UTF-8"
LC_TELEPHONE="en_US.UTF-8"
LC_MEASUREMENT="en_US.UTF-8"
LC_IDENTIFICATION="en_US.UTF-8"
```

Se tudo veio como `en_US.UTF-8` e você escolheu português no assistente, é provável que o assistente só tenha trocado o idioma do cliente Steam, não o do desktop. Para listar os locales disponíveis e gerar o de português do Brasil:

```terminal
$ locale -a | grep -i br
```

Se `pt_BR.UTF-8` não aparecer, ele ainda não foi gerado. No SteamOS (base Arch), os locales disponíveis ficam registrados em `/etc/locale.gen`; descomentar a linha e rodar `locale-gen` torna o locale utilizável. Depois, a variável `LANG` pode ser definida por usuário em `~/.bash_profile` ou `~/.config/locale.conf`.

:::atencao
Mudar o locale do sistema não traduz o modo Gaming. O Steam Deck separa o idioma da interface de jogos (gravado no cliente Steam) do locale do desktop KDE. São duas configurações distintas que podem, e frequentemente ficam, em idiomas diferentes.
:::

## Fuso horário na prática

O fuso horário é definido pelo arquivo `/etc/localtime`, que é um *symlink* (atalho) para uma entrada do banco de zonas em `/usr/share/zoneinfo`. Ver qual zona está ativa é direto:

```terminal
$ cat /etc/timezone
America/Sao_Paulo
$ ls -l /etc/localtime
lrwxrwxrwx 1 root root 35 Jul 28 09:11 /etc/localtime -> ../usr/share/zoneinfo/America/Sao_Paulo
```

O `cat /etc/timezone` funciona em parte das distribuições, mas no SteamOS a fonte mais confiável é o próprio `timedatectl`, porque ele lê a zona direto do sistema, e não de um arquivo de texto auxiliar. Para listar zonas e aplicar uma nova:

```terminal
$ timedatectl list-timezones | grep -i sao
America/Sao_Paulo
$ sudo timedatectl set-timezone America/Sao_Paulo
$ timedatectl | grep "Time zone"
               Time zone: America/Sao_Paulo (-03, -0300)
```

O NTP (Network Time Protocol) é o que mantém o relógio correto. Você pode verificar o estado da sincronização e forçar uma atualização:

```terminal
$ timedatectl show -p NTPSynchronized -p NTP
NTP=yes
NTPSynchronized=yes
```

`NTP=yes` indica que a sincronização está habilitada; `NTPSynchronized=yes` confirma que houve sincronização bem-sucedida com um servidor de hora. Num Deck recém-ligado e ainda sem rede, `NTPSynchronized` pode aparecer como `no` até o Wi-Fi conectar.

:::nota
O relógio interno mantém a hora em UTC e o fuso é aplicado apenas na exibição (`Time zone`). É por isso que um Deck comprado no exterior "adianta" ou "atrasa" horas: o horário UTC está certo, mas a zona de exibição ainda é a de fábrica. Corrigir a zona resolve o sintoma sem tocar no relógio de hardware.
:::

## Wi-Fi via nmcli

Toda a rede do SteamOS é gerida pelo NetworkManager, acessível pela interface gráfica ou pelo comando `nmcli`. Para ver o estado geral e descobrir o nome da interface de rede:

```terminal
$ nmcli device status
DEVICE    TYPE      STATE      CONNECTION
wlan0     wifi      connected  Casa_2.4G
docker0   bridge    unmanaged  --
lo        loopback  unmanaged  --
```

A interface `wlan0` está conectada à rede `Casa_2.4G`. O `docker0` é uma ponte criada por ferramentas de container; o `lo` é a interface de loopback, sempre presente. Para listar as redes Wi-Fi ao alcance do aparelho:

```terminal
$ nmcli device wifi list
IN-USE  BSSID              SSID             MODE   CHAN  RATE        SIGNAL  BARS  SECURITY
*       3C:37:86:0A:B1:C4  Casa_2.4G        Infra  6     130 Mbit/s  78      ▂▄▆_  WPA2
        F8:1D:4F:5C:9A:02  Casa_5G          Infra  44    270 Mbit/s  61      ▂▄▆_  WPA2
        A0:3B:E3:11:22:33  VizinhaNet       Infra  11    130 Mbit/s  34      ▂▄__  WPA2
```

A coluna `IN-USE` com `*` marca a rede atual. A coluna `SIGNAL` (em percentual) e `BARS` mostram a intensidade; abaixo de 40 o sinal começa a causar quedas. Para conectar a uma rede nova a partir do terminal:

```terminal
$ nmcli device wifi connect "Casa_5G" password "minhasenha"
Device 'wlan0' successfully activated with '9e1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c'.
```

O endereço IP atribuído, a rota e o DNS podem ser conferidos com `ip addr` e o comando `resolvectl`:

```terminal
$ ip addr show wlan0
3: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 3c:37:86:0a:b1:c4 brd ff:ff:ff:ff:ff:ff
    inet 192.168.0.42/24 brd 192.168.0.255 scope global dynamic noprefixroute wlan0
       valid_lft 86394sec preferred_lft 86394sec
    inet6 fe80::3e37:86ff:fe0a:b1c4/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
```

O `192.168.0.42/24` é o IP local; o `/24` delimita a sub-rede. `dynamic` significa que o endereço veio do DHCP do roteador. O `valid_lft` é o tempo restante de validade do aluguel desse IP.

:::dica
Se o Wi-Fi conecta mas não navega, o problema quase nunca é o IP — é o DNS. Teste com `ping 8.8.8.8` (IP direto) e depois `ping google.com` (resolução). Se o primeiro funciona e o segundo não, o DNS do roteador está mal configurado em `resolvectl`.
:::

## Resumo

- `locale` exibe as variáveis de idioma do desktop; `pt_BR.UTF-8` precisa ser gerado via `locale-gen`.
- O fuso é definido por `timedatectl set-timezone` e lido de forma confiável com `timedatectl | grep "Time zone"`.
- O relógio guarda UTC; a zona só afeta a exibição, o que explica o sintoma de "hora errada" em aparelhos importados.
- `nmcli device status`, `nmcli device wifi list` e `nmcli device wifi connect` gerenciam o Wi-Fi por completo.
- `ip addr show wlan0` revela o IP, a máscara e a validade do aluguel DHCP; `ping 8.8.8.8` isolando DNS é o primeiro teste de conectividade.

## Exercícios

1. Rode `locale` e identifique qual variável controla o formato de data e hora.
2. Execute `timedatectl list-timezones | grep -i sao` e confirme o nome exato da zona do Brasil.
3. Liste as redes Wi-Fi visíveis com `nmcli device wifi list` e anote o `SIGNAL` da rede mais forte que não é a sua.
4. Mostre o IP do seu Deck com `ip addr show` e explique o significado de `dynamic` e do `/24`.
5. **Desafio.** Desconecte e reconecte o Wi-Fi por `nmcli` (`nmcli device disconnect wlan0` seguido do connect) e, em paralelo, observe as mudanças de IP com `ip addr`. Depois explique como `ping 8.8.8.8` e `ping google.com` juntos diagnosticam um problema de DNS.
