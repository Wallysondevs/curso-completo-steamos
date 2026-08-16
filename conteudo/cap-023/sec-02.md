Conectar o Steam Deck a um Wi-Fi é a operação de rede mais comum do dia a dia, mas a linha de comando permite fazer isso de forma mais rápida e, principalmente, mais audível do que o clique na bandeja. Quando a interface gráfica falha ou você está depurando por SSH, saber escanear, escolher e associar-se a um ponto de acesso pelo `nmcli` é o que separa quem trava de quem resolve.

:::objetivos
- Escanear as redes Wi-Fi disponíveis com `nmcli device wifi list`
- Conectar-se a uma rede aberta e a uma protegida por senha
- Consultar o sinal, a frequência e a segurança de cada ponto de acesso
- Entender por que a senha fica guardada num arquivo restrito do sistema
:::

## Varrendo o espectro

O primeiro passo é pedir ao adaptador que liste o que ele está escutando. O comando exige que o rádio esteja ligado — no SteamOS ele normalmente está, mas se nada aparecer, vale confirmar com `nmcli radio wifi` (a resposta deve ser `enabled`).

```terminal
$ nmcli device wifi list
IN-USE  BSSID              SSID               MODE   CHAN  RATE        SIGNAL  BARS  SECURITY
        3c:37:86:0a:b1:c4  Casa-5G            Infra  36    540 Mbit/s  78      ▂▄▆█  WPA2
*       20:3a:07:11:22:33  Casa-2.4G          Infra  6     130 Mbit/s  45      ▂▄__  WPA2
        a4:91:b1:55:aa:12  Cafeteria-Livre    Infra  11    130 Mbit/s  30      ▂___  --
```

Cada linha é um ponto de acesso. A coluna `SIGNAL` vai de 0 a 100 (maior é melhor), `BARS` desenha um gráfico grosseiro, `CHAN` mostra o canal e `SECURITY` informa se a rede tem criptografia — `WPA2` é a mais comum; `--` significa rede **aberta**, sem senha nenhuma. O asterisco `*` na coluna `IN-USE` marca a rede à qual você já está associado.

Repare que `Casa-5G` e `Casa-2.4G` são o mesmo roteador em duas bandas. A de 5 GHz (canais altos, como 36) tende a ser mais rápida e menos congestionada, mas alcança menos longe; a de 2,4 GHz (canais 1 a 11) penetra paredes melhor. No Steam Deck, preferir 5 GHz costuma reduzir latência em streaming e downloads.

## Conectando a uma rede aberta

Para uma rede sem senha, a associação é imediata. Use o `SSID` exatamente como aparece na listagem:

```terminal
$ nmcli device wifi connect Cafeteria-Livre
Device 'wlan0' successfully activated with '3f57e0c4-...'.
```

O comando bloqueia por alguns segundos enquanto negocia o DHCP e, ao final, confirma que o dispositivo `wlan0` foi ativado. A partir daí a rede vira a conexão ativa e o perfil fica salvo no sistema.

:::atencao
Redes abertas (sem o `WPA` na coluna `SECURITY`) transmitem seus dados sem criptografia no ar. Qualquer pessoa na mesma rede pode, em tese, ler o tráfego não criptografado. Evite digitar senhas ou acessar bancos numa rede aberta; se precisar, use uma VPN como na [seção sobre VPN](#/cap-023/sec-04).
:::

## Conectando a uma rede com senha

Redes protegidas pedem a senha. Há duas formas. A primeira passa a senha diretamente na linha de comando:

```terminal
$ nmcli device wifi connect Casa-5G password senha-secreta-aqui
Device 'wlan0' successfully activated with 'b7e0c2f1-...'.
```

O problema é que a senha fica gravada no histórico do shell (`.bash_history`), visível para quem olhar o arquivo. A segunda forma, mais segura, usa um prompt interativo que não ecoa a senha:

```terminal
$ nmcli --ask device wifi connect Casa-5G
Password: 
Device 'wlan0' successfully activated with 'b7e0c2f1-...'.
```

Com `--ask`, o `nmcli` pergunta a senha de forma oculta. Se o SSID tiver espaços ou caracteres especiais, coloque-o entre aspas. Se houver duas redes com o mesmo nome (como as duas bandas do roteador), o `nmcli` tende a escolher a de sinal mais forte.

:::dica
Quer forçar uma banda específica? Passe o BSSID junto com o SSID: `nmcli device wifi connect "Casa-5G" bssid 3c:37:86:0a:b1:c4`. Isso desempata redes com o mesmo nome e fixa você na banda desejada.
:::

## Onde a senha mora

Depois de conectar, a credencial não fica solta: o NetworkManager guarda cada perfil em um arquivo dentro de `/etc/NetworkManager/system-connections/`, com permissões de acesso restritas.

```terminal
$ ls -l /etc/NetworkManager/system-connections/
total 8
-rw------- 1 root root 324 jun 05 18:30 'Casa-5G.nmconnection'
-rw------- 1 root root 289 jun 05 18:32 'Cafeteria-Livre.nmconnection'
```

O `-rw-------` indica que só o `root` consegue ler esses arquivos — é o que protege a senha de outros usuários. Se você abrir um deles, verá a senha num campo `psk=` (para WPA2):

```terminal
$ sudo cat '/etc/NetworkManager/system-connections/Casa-5G.nmconnection'
[connection]
id=Casa-5G
uuid=e6e1f0a1-9c31-4a86-8f5d-2b3a7d0c9e12
type=wifi

[wifi]
mode=infrastructure
ssid=Casa-5G

[wifi-security]
key-mgmt=wpa-psk
psk=senha-secreta-aqui

[ipv4]
method=auto
```

O bloco `[ipv4]` com `method=auto` é o que diz "pega o IP via DHCP". É esse método que você troca quando configura um IP fixo, como na [seção sobre IP fixo e DNS](#/cap-023/sec-06).

## Resumo

- `nmcli device wifi list` escaneia os pontos de acesso e mostra sinal, canal, banda e tipo de segurança.
- O `*` na coluna `IN-USE` marca a rede atual; `SECURITY` com `--` indica rede aberta, sem senha.
- `nmcli device wifi connect <SSID>` conecta a uma rede aberta; use `--ask` para digitar a senha de forma oculta em redes protegidas.
- Senhas e perfis ficam em `/etc/NetworkManager/system-connections/*.nmconnection`, legíveis só pelo root.
- Prefira 5 GHz para velocidade/latência e 2,4 GHz para alcance através de paredes.

## Exercícios

1. Liste as redes com `nmcli device wifi list` e ordene-as por sinal usando uma coluna: `nmcli -f SSID,SIGNAL,SECURITY device wifi list | sort -k2 -n -r`.
2. Identifique, na lista, quais redes são abertas (segurança `--`) e quais usam WPA2 ou WPA3, e explique o risco de cada tipo aberto.
3. Desconecte temporariamente da rede atual com `nmcli device disconnect wlan0` e reconecte usando `nmcli device wifi connect`.
4. Conecte-se a uma rede protegida usando `nmcli --ask device wifi connect` e confirme, com `ls -l /etc/NetworkManager/system-connections/`, as permissões do arquivo de perfil criado.
5. **Desafio.** Conecte-se a uma rede com duas bandas (mesmo SSID) e force a banda de 5 GHz passando o `bssid` correspondente. Compare a coluna `RATE` antes e depois.
