O sintoma "o Wi-Fi sumiu" pode significar três coisas muito diferentes: o ícone sumiu da barra (problema de interface gráfica ou do NetworkManager), a rede não detecta redes (problema de driver ou antena) ou o hardware de Wi-Fi nem aparece para o sistema (problema de chip, firmware ou bloqueio físico). Esta seção percorre as três camadas, da mais profunda à mais superficial, e mostra como trazer a rede de volta em cada caso.

:::objetivos
- Separar as três camadas do "Wi-Fi sumiu": hardware, firmware/driver e interface
- Confirmar se o chip de rede está visível com `lspci` e `lsusb`
- Identificar bloqueios de hardware e software com `rfkill`
- Restaurar a conexão com `nmcli` e `iw` sem reiniciar
:::

## Onde foi parar a placa de rede

A primeira pergunta é a mais drástica: o chip de Wi-Fi ainda é reconhecido pelo barramento? Se ele não aparece no PCI ou USB, o sistema nem sabe que tem Wi-Fi ali — pode ser defeito de hardware ou desligamento profundo da antena.

```terminal
$ lspci | grep -iE 'network|wi.?fi|wireless'
02:00.0 Network controller: Qualcomm Atheros QCA6174 802.11ac Wireless Network Adapter (rev 32)
$ lsusb | grep -iE 'bluetooth|wi'
Bus 001 Device 005: ID 0cf3:e300 Qualcomm Atheros Communications
```

Se `lspci` mostra o controlador de rede (a linha `Network controller`), o chip está vivo. Se não mostra nada — nem `lsusb` —, o hardware está fora do barramento, o que pode indicar falha física, chip desligado na BIOS ou o raro caso em que o módulo de Wi-Fi literalmente se soltou do slot interno (mais comum em aparelhos que sofreram quedas).

:::info
No Steam Deck, muitas placas combinam Wi-Fi e Bluetooth no mesmo chip Qualcomm Atheros ou Realtek. Se o Bluetooth também sumiu, a suspeita recai sobre o chip inteiro; se o Bluetooth funciona e o Wi-Fi não, o driver de Wi-Fi ou a antena é o culpado.
:::

## Bloqueios: rfkill é a primeira parada

Se o chip aparece no barramento mas não detecta redes, o próximo suspeito é o bloqueio de rádio. Existem duas camadas de bloqueio: **hard** (chave física, botão de "modo avião" ou interruptor na carcaça) e **soft** (o sistema operacional pediu para desligar).

```terminal
$ rfkill list
0: hci0: Bluetooth
        Soft blocked: no
        Hard blocked: no
1: phy0: Wireless LAN
        Soft blocked: no
        Hard blocked: no
```

`Hard blocked: yes` significa que a antena está fisicamente desligada — procure uma chave ou atalho de teclado. O Steam Deck não tem interruptor físico de Wi-Fi, mas docks com botões extras podem simular esse bloqueio. `Soft blocked: yes` é o mais comum: o NetworkManager ou o modo avião deixou o rádio desligado.

```terminal
$ rfkill unblock wifi
$ rfkill list
1: phy0: Wireless LAN
        Soft blocked: no
        Hard blocked: no
```

O comando `rfkill unblock wifi` resolve o bloqueio por software em maioria esmagadora dos casos de "sumiu e não volta". É seguro e instantâneo — não requer reinicialização.

:::atencao
Uma causa traiçoeira de `Soft blocked` é a suspensão do aparelho: ao acordar, o driver às vezes liga o chip com o estado de "bloqueado" que veio do suspend. `rfkill unblock wifi` resolve na hora, mas se você tiver que fazer isso toda vez, o defeito está no driver e vale reportá-lo.
:::

## Firmware que não carregou

O driver do Wi-Fi está carregado, mas ele, como a GPU, precisa de um binário de firmware para programar o chip. Se esse arquivo sumiu ou corrompeu, o driver carrega mas não inicializa o hardware.

```terminal
$ sudo dmesg | grep -iE 'ath10k|ath9k|rtl|iwlwifi|firmware|failed' | head -10
[    4.573402] ath10k_pci 0000:02:00.0: failed to fetch board data for bus=pci,vendor=168c,device=0042 from ath10k/QCA6174/hw3.0/board-2.bin (-2)
[    4.573441] ath10k_pci 0000:02:00.0: failed to fetch board file (-2)
```

Aqui `ath10k` (driver Qualcomm) reclama que não conseguiu `fetch` o arquivo de *board data*. A mensagem `failed to fetch board file (-2)` é erro de arquivo não encontrado — o firmware não está onde o driver espera. Em sistemas baseados em Arch (como o SteamOS), uma atualização incompleta do pacote de firmware deixa esses binários ausentes e o Wi-Fi some sem deixar rastro visível na interface.

## Testando a interface com iw e nmcli

Com hardware visível, rfkill desbloqueado e firmware carregado, a interface de rede deve aparecer. Verifique:

```terminal
$ iw dev
phy#0
        Interface wlan0
                ifindex 3
                wdev 0x1
                addr 3c:37:86:0a:b1:c4
                type managed
                txpower 22.00 dBm
```

`iw dev` mostra a visão crua do kernel sobre a interface Wi-Fi. Se `wlan0` (ou `wlp2s0` — nomes previsíveis de rede) aparece aqui, a camada de kernel está 100% funcional e o problema está na camada de gerenciamento (NetworkManager).

```terminal
$ nmcli radio wifi
disabled
$ nmcli radio wifi on
$ nmcli device wifi list
IN-USE  BSSID              SSID              MODE   CHAN  RATE        SIGNAL  BARS  SECURITY
        3c:37:86:0a:b1:c4  AnaHome           Infra  44    540 Mbit/s  72      ▂▄▆_  WPA2
$ nmcli device wifi connect "AnaHome" password "senha"
Device 'wlan0' successfully activated with '8a3b4d5c-...'.
```

`nmcli radio wifi` revela se o próprio NetworkManager desligou o rádio (independente do rfkill). `nmcli radio wifi on` reativa; `nmcli device wifi list` escaneia redes; o comando `connect` faz a associação e autenticação numa tacada só.

:::dica
Escaneamento falhando mesmo com tudo certo costuma ser regulamentação local: o chip desliga o scan se detectar que não está autorizado a operar em certos canais. `iw reg get` mostra o domínio regulatório; `iw reg set BR` ajusta para o Brasil. Isso é mais comum em aparelhos importados que vieram travados para FCC americano.
:::

## Resumo

- "Wi-Fi sumiu" tem três camadas: o hardware no barramento, o driver/firmware, e a interface de gerenciamento.
- `lspci` confirma se o chip está no barramento; sem ele a placa não é vista pelo sistema.
- `rfkill` diagnostica e desfaz bloqueios de rádio (hard e soft); `rfkill unblock wifi` resolve a maioria.
- Firmware ausente aparece no `dmesg` como `failed to fetch board file` (-2).
- `iw dev` confirma que a interface de rede está criada; `nmcli radio wifi` e `nmcli device wifi connect` cuidam da conexão.
- Domínio regulatório incorreto (`iw reg get`) bloqueia canais e impede escaneamento em aparelhos importados.

## Exercícios

1. Rode `lspci | grep -iE 'network|wireless'` e `lsusb` e confirme que seu chip de Wi-Fi está visível. Anote o modelo exato.
2. Liste o estado atual dos rádios com `rfkill list all`. Altere o bloqueio para Wi-Fi com `rfkill block wifi` e depois desfaça com `rfkill unblock wifi`, verificando o estado a cada passo.
3. Usando `sudo dmesg | grep -i firmware`, localize todas as linhas de carregamento de firmware do seu hardware e verifique se alguma retornou falha.
4. Execute uma varredura de redes com `nmcli device wifi list` e identifique a rede com maior potência de sinal. Qual a diferença entre `SIGNAL` e `RATE` na saída?
5. **Desafio.** Com `iw reg get` anote seu domínio regulatório atual. Pesquise na documentação do `iw` o que significa a flag `no-ir` nos canais e explique por que um chip configurado para o domínio `US` pode não escanear canais 12 e 13 quando você viaja para o Brasil.