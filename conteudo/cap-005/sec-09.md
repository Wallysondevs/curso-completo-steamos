Depois de passar por idioma, Wi-Fi, conta Steam, atualização e primeiros comandos, o capítulo fecha com uma verificação sistemática do estado do aparelho. Esta seção é uma "checklist de prontidão": uma sequência de comandos que, rodados do começo ao fim, confirmam que o Steam Deck está 100% operacional para o uso diário. Também prepara o terreno para o capítulo seguinte, onde o terminal vira instrumento de personalização.

:::objetivos
- Executar uma checklist completa de prontidão do sistema
- Consolidar todos os comandos do capítulo em um script de diagnóstico
- Documentar o estado inicial para referência futura (linha de base)
- Identificar o que está estranho e merece investigação
- Preparar o Deck para os próximos capítulos do curso
:::

## Checklist de prontidão

A ideia é percorrer, em ordem, os pontos críticos que o capítulo cobriu. Para cada um, um comando (ou dois) responde "está certo?". Rode isso com o Deck conectado ao Wi-Fi e com bateria acima de 20%:

| # | Verificação | Comando | O que é esperado |
|---|---|---|---|
| 1 | Versão SteamOS | `cat /etc/os-release \| grep VERSION` | `3.6.x` |
| 2 | Kernel | `uname -r` | `6.5.0-valve*-neptune-*` |
| 3 | Hostname | `hostname` | `steamdeck` |
| 4 | Usuário | `whoami` | `deck` |
| 5 | Fuso horário | `timedatectl \| grep "Time zone"` | Sua zona (ex.: `America/Sao_Paulo`) |
| 6 | NTP sincronizado | `timedatectl \| grep synchron` | `yes` |
| 7 | Wi-Fi conectado | `nmcli device status \| grep wlan0` | `connected` |
| 8 | IP obtido | `ip addr show wlan0 \| grep "inet "` | `192.168.xxx.xxx/24` |
| 9 | Espaço em `/home` | `df -h /home \| tail -1` | `Avail` > 10 GB |
| 10 | Serviços de rede | `ss -tlnp \| grep steam` | Portas `8080`, `27060` |
| 11 | Conta Steam logada | `grep AccountName ~/.steam/steam/config/loginusers.vdf` | Seu login |
| 12 | Atualização recente | `journalctl -u steamos-update --no-pager \| tail -3` | `up to date` ou versão recente |

Nenhum desses comandos requer `sudo`, e todos são seguros. Esta tabela também serve como "exame físico" do Deck antes de qualquer procedimento maior.

Para uma amostra rápida dos pontos mais reveladores, rode os quatro comandos que concentram mais informação, um após o outro:

```terminal
$ whoami; hostname; uname -r
deck
steamdeck
6.5.0-valve21-1-neptune-65
$ timedatectl show -p Timezone -p NTPSynchronized --value
America/Sao_Paulo
yes
$ nmcli -t -f DEVICE,STATE device | grep wlan0
wlan0:connected
$ df -h /home | tail -1
/dev/nvme0n1p8  458G  120G  322G  73% /home
```

Em quatro linhas você confirma quem você é, em que máquina está, qual kernel roda, o fuso, a sincronização de hora, a conexão de rede e o espaço livre — a espinha dorsal do diagnóstico de prontidão.

## Script de diagnóstico do primeiro dia

Juntar a checklist num script evita digitar tudo de novo. Crie um arquivo `check.sh` no diretório de laboratório e torne-o executável:

```bash
#!/usr/bin/env bash
## checkout.sh — diagnóstico de primeiro dia do Steam Deck
echo "=== check-deck v1.0 ==="
echo
echo "[1] SteamOS: $(grep VERSION= /etc/os-release | cut -d'"' -f2)"
echo "[2] Kernel:  $(uname -r)"
echo "[3] Host:    $(hostname)"
echo "[4] Usuário: $(whoami)"
echo "[5] Fuso:    $(timedatectl show -p Timezone --value)"
echo "[6] NTP:     $(timedatectl show -p NTPSynchronized --value)"
echo "[7] Wi-Fi:   $(nmcli -t -f DEVICE,STATE device | grep wlan0 | cut -d: -f2)"
echo "[8] IP:      $(ip -j addr show wlan0 2>/dev/null | grep -oP '"local":\s*"\K[^"]+' | head -1)"
echo "[9] /home:   $(df -h /home | tail -1 | awk '{print $4 " livres de " $2}')"
echo "[10] Steam:  $(pgrep -c steam) processos rodando"
echo "[11] Login:  $(grep AccountName ~/.steam/steam/config/loginusers.vdf | tail -1 | awk -F'"' '{print $4}')"
echo
echo "=== fim ==="
```

Salve como `~/lab/check.sh` e execute:

```terminal
$ bash ~/lab/check.sh
=== check-deck v1.0 ===

[1] SteamOS: 3.6.20
[2] Kernel:  6.5.0-valve21-1-neptune-65
[3] Host:    steamdeck
[4] Usuário: deck
[5] Fuso:    America/Sao_Paulo
[6] NTP:     yes
[7] Wi-Fi:   connected
[8] IP:      192.168.0.42
[9] /home:   322G livres de 458G
[10] Steam:  2 processos rodando
[11] Login:  ana

=== fim ===
```

A saída é um retrato instantâneo do aparelho. Sugiro rodar depois de cada atualização grande, guardando a saída num arquivo com data (`bash check.sh > ~/lab/baseline-$(date +%F).txt`) para ter uma linha de base cronológica.

## O que olhar quando algo foge do esperado

Cada linha do diagnóstico aponta para uma seção deste capítulo. Se o NTP não sincronizar (`[6] NTP: no`), volte à seção de fuso horário. Se o Wi-Fi estiver desconectado (`[7] Wi-Fi: disconnected`), `nmcli device wifi list` e o `ip addr` da seção de rede resolvem. Se o espaço em `/home` estiver crítico (`[9] /home` com menos de 5 GB livres), é hora de abrir o `du` e caçar os maiores ocupantes.

Alguns alertas comuns de primeiro dia e seus remédios:

| Sintoma | Provável causa | Comando para investigar |
|---|---|---|
| Hora errada | Fuso ou NTP offline | `timedatectl`, `timedatectl set-timezone` |
| Wi-Fi conecta sem internet | DNS | `ping 8.8.8.8`, `ping google.com` |
| Atualização travada | Espaço insuficiente | `df -h /home`, `du -sh ~/Downloads` |
| Modo Desktop não abre | Sessão travada | `steamos-session-select desktop` |
| Jogos não aparecem | Conta errada logada | `grep AccountName ... loginusers.vdf` |

Para investigar um sintoma típico — Wi-Fi conectado mas sem navegação — a sequência de diagnóstico é:

```terminal
$ nmcli device status | grep wlan0
wlan0     wifi      connected  Casa_2.4G
$ ping -c 2 -W 2 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=12.3 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=118 time=11.8 ms

--- 8.8.8.8 ping statistics ---
2 packets transmitted, 2 received, 0% packet loss
$ ping -c 2 -W 2 google.com
ping: google.com: Name or service not known
```

O primeiro `ping` (para um IP) funciona, o segundo (para um nome) falha. Diagnóstico fechado: DNS quebrado. O remédio está no resolvectl ou no roteador, não no Wi-Fi em si.

:::dica
Guarde este capítulo como referência de diagnóstico rápido. A maioria dos problemas do primeiro mês de Steam Deck se resolve com os 12 comandos da checklist. Se um problema não estiver nela, anote os comandos que você usou para resolvê-lo — eles serão seu complemento pessoal à checklist.
:::

## Preparando para os próximos capítulos

Com o sistema verificado e a conta Steam logada, o Deck está pronto para o que vem a seguir. O capítulo 6 mergulha no sistema de arquivos do SteamOS — a raiz somente-leitura, a partição de dados, as permissões e os primeiros scripts. O que você aprendeu aqui (navegar por `/sys`, ler sensores, usar `nmcli` e `journalctl`) é a fundação que todo o restante do curso vai usar.

Antes de virar a página, confirme três coisas: (a) você sabe abrir o terminal Konsole no modo Desktop; (b) você tem pelo menos 10 GB livres em `/home`; (c) o `check.sh` rodou sem erros. Se as três são verdadeiras, siga em frente. Se não, volte à seção que falta.

:::exemplo
**Cenário: Deck importado.** Ana comprou o Deck nos EUA e o configurou no Brasil. Depois de rodar `check.sh`, viu `[5] Fuso: America/Chicago` e `[6] NTP: no`. O relógio marcava 3 horas a mais. Ela corrigiu com `sudo timedatectl set-timezone America/Sao_Paulo`, conectou o Wi-Fi (`nmcli device wifi connect "Casa_2.4G"`) e o NTP sincronizou em segundos. A checklist acusou o problema antes que ele atrapalhasse os saves.
:::

## Resumo

- A checklist de 12 itens cobre versão, kernel, hostname, fuso, NTP, Wi-Fi, IP, espaço, rede, Steam, login e atualização — tudo sem `sudo`.
- O script `check.sh` automatiza o diagnóstico e gera uma linha de base com data (`baseline-AAAA-MM-DD.txt`).
- Problemas comuns do primeiro dia têm comandos específicos de investigação listados na tabela de sintomas.
- O capítulo fecha com o Deck pronto para o capítulo 6, que explora o sistema de arquivos imutável do SteamOS.

## Exercícios

1. Rode a checklist completa (tabela de 12 itens) e anote os resultados lado a lado com os esperados.
2. Salve o script `check.sh` no diretório `~/lab`, torne-o executável com `chmod +x` e execute-o, capturando a saída com `bash check.sh > baseline.txt`.
3. Compare sua saída com a do exemplo da seção. Há alguma diferença importante? Investigue com os comandos do capítulo.
4. Simule um problema: desconecte o Wi-Fi (`nmcli device disconnect wlan0`), rode `check.sh` novamente e observe quais linhas mudaram. Reconecte em seguida.
5. **Desafio.** Modifique o `check.sh` para incluir a medição de saúde da bateria (`charge_full / charge_full_design`) e a temperatura atual do hotspot do APU. Execute-o num momento de jogo pesado e num momento ocioso, e compare as diferenças de temperatura e de consumo de rede.