A interface padrão do Remote Play esconde a maior parte dos controles de ajuste fino. Mas o Steam guarda um conjunto de opções avançadas — acessíveis via Big Picture Mode e pelo menu de sessão — que permitem controlar áudio, vídeo, entrada e o comportamento da conexão com precisão cirúrgica. Esta seção abre a caixa de ferramentas e explica cada chave que vale a pena tocar.

:::objetivos
- Acessar e entender o menu avançado de Remote Play no Big Picture Mode
- Configurar áudio (dispositivo de saída, microfone, volume) com granularidade
- Ajustar preferências de vídeo avançadas além dos presets automáticos
- Ativar e usar o overlay de diagnóstico dentro da sessão
- Personalizar as opções de entrada e o comportamento do cliente
:::

## O menu de sessão e o menu avançado

Durante uma sessão de streaming, o botão **...** (três pontinhos) do Steam Deck abre o menu rápido de sessão. Nele, além dos presets de qualidade vistos na seção 4, há uma entrada para as **Configurações avançadas**. No PC hospedeiro, as mesmas opções vivem em **Steam → Configurações → Remote Play → Opções avançadas de cliente**.

```terminal
$ steam steam://open/settings/remoteplay
Launching Steam URI: steam://open/settings/remoteplay
```

O protocolo `steam://open/...` abre a página de configuração diretamente, útil quando você está no modo desktop do Deck ou automatizando o setup de vários dispositivos.

O menu avançado expõe estas áreas:

- **Vídeo** — resolução forçada, taxa de quadros, limite de bitrate manual, preferência de codec (H.264/H.265).
- **Áudio** — dispositivo de saída no PC, envio do microfone, volume do streaming.
- **Entrada** — como os controles do Deck são reportados ao jogo, prioridade de entrada.
- **Rede** — priorização, opções de firewall/NAT (relevante só no modo remoto).

:::atencao
Algumas opções avançadas só aparecem com um jogo em execução (streaming ativo). Se você procurar a opção de codec sem sessão aberta e não achar, inicie um streaming primeiro e reabra o menu — o Steam monta o painel dinamicamente.
:::

## Áudio: roteando o som na direção certa

O Remote Play encaminha o áudio do jogo do PC para os alto-falantes ou fone do Deck, mas há armadilhas. O comportamento padrão pode deixar o som **também** saindo nos alto-falantes do PC — útil se você quer que quem está perto acompanhe, irritante se não.

```terminal
$ pactl list short sinks
0	alsa_output.pci-0000_01_00.1.hdmi-stereo	module-alsa-card.c	s16le 2ch 44100Hz	SUSPENDED
1	alsa_output.pci-0000_00_1f.3.analog-stereo	module-alsa-card.c	s16le 2ch 44100Hz	SUSPENDED
```

No PC hospedeiro (se Windows, o mesmo conceito via Painel de Som): o Remote Play captura o som do dispositivo de saída padrão. Para controlar isso, no menu avançado escolha **Dispositivo de saída de áudio** e aponte para o dispositivo correto — ou use "seguir o dispositivo padrão do sistema".

:::dica
Quer silenciar o PC e ouvir só no Deck? No menu avançado, desative "Reproduzir áudio no PC hospedeiro" (ou ajuste o volume do PC para zero). O inverso — ouvir no PC mas não no Deck — se resolve reduzindo o volume do streaming no menu rápido sem tocar no jogo.
:::

O microfone é um caso à parte: se o jogo tem chat por voz e você está no Deck, ative **Transmitir microfone** no menu. O áudio captado pelo microfone do Deck (ou fone com fio) é enviado ao PC como entrada padrão.

## Vídeo: forçando parâmetros manualmente

Os presets (Automática, Rápida, Equilibrada, Bonita) são atalhos. O controle manual fica em **Opções avançadas → Vídeo**:

- **Force resolution / Resolução forçada** — define a resolução de transmissão independente da tela do Deck. Use quando quiser oversample (transmitir 1080p para uma TV dockada) ou undersample (720p para economizar banda).
- **Frame rate limit** — trava a taxa de transmissão. Útil para casar com a taxa da tela (seção 5).
- **Codec preference** — força H.265/HEVC quando o hardware suporta, economizando ~30% de bitrate para a mesma qualidade.
- **Manual bitrate** — desativa o dinâmico e fixa um valor.

```terminal
$ grep -iE "codec|bitrate|resolution" ~/.local/share/Steam/config/config.vdf 2>/dev/null | head -8
	"StreamingClient"		"1"
	"PreferredCodec"		"h264"
```

O `config.vdf` pode exibir as chaves persistidas, mas repito a recomendação da seção 3: **não edite o arquivo à mão**. Use a interface — ela valida os valores e aplica as mudanças sem risco de corromper o arquivo.

:::info
O HEVC (H.265) em streaming local traz ganho real de qualidade-por-bitrate, mas nem sempre reduz latência. Em GPUs mais antigas, o encoder HEVC pode ser ligeiramente mais lento que o H.264. Teste: se a latência subir ao ativar HEVC, volte para H.264 e compense com mais bitrate se a rede permitir.
:::

## Entrada: prioridade e mapeamento

A seção avançada de **entrada** controla como os comandos do Deck chegam ao jogo. A chave mais relevante para streaming é a **Prioridade de entrada**:

- **Priorizar estabilidade** — o Steam aguarda o frame completo antes de enviar estados de entrada, garantindo consistência.
- **Priorizar resposta** — envia a entrada imediatamente, deixando o vídeo ajustar-se ao comando. Menos input lag, risco de micro-inconsistência em certos jogos.

Para jogos de reflexo (luta, ritmo, FPS), priorizar resposta costuma melhorar a sensação. Para estratégia e simulação, a diferença é imperceptível e a estabilidade é preferível.

```terminal
$ lsmod | grep -i "hid\|xpad\|uinput"
uinput                 20480  1
hid_generic            16384  0
usbhid                 65536  0
```

O encadeamento dos drivers de entrada (`hid`, `usbhid`, `uinput`) explica por que o mapeamento funciona: o Steam lê os dispositivos HID do Deck (botões físicos) e os reescreve como um gamepad virtual via `uinput`, que é então serializado e enviado ao PC como entrada unificada.

:::dica
Se um jogo no PC reconhece o Deck como "teclado e mouse" em vez de controle, vá em **Configurações do controle** dentro da sessão streamada e force o layout para "Gamepad". Isso redefine o dispositivo virtual como XInput/DirectInput correto para o jogo.
:::

## O overlay de diagnóstico avançado

Dentro da sessão, o contador de desempenho do Steam tem mais um nível útil para streaming. No nível máximo, ele mostra simultaneamente:

- **Streaming** — bitrate atual em Mbit/s e porcentagem de perda de frames de rede.
- **Frame pacing** — cadência real dos frames decodificados.
- **Latência total estimada** — em versões recentes do SteamOS, uma estimativa do tempo input→pixel.

```terminal
$ steam steam://open/diagnostics
Launching Steam URI: steam://open/diagnostics
```

```terminal
$ ps -o pid,pcpu,pmem,comm -C steamwebhelper
  PID %CPU %MEM COMMAND
 1208  1.2  2.1 steamwebhelper
 2054  0.8  1.7 steamwebhelper
```

O `steamwebhelper` (processo do Steam que roda a interface web embutida) consome pouca CPU durante o streaming; se ele disparar para ~20%+, é sinal de que algum overlay web (chat, navegador embutido) está roubando recursos — feche abas e painéis desnecessários na sobreposição.

## Resumo

- O menu avançado de Remote Play (Big Picture / botão `...`) expõe vídeo, áudio, entrada e rede com controle fino.
- Algumas opções só aparecem com sessão ativa; inicie o streaming antes de procurá-las.
- O áudio captura o dispositivo de saída padrão do PC; o microfone do Deck é enviado de volta como entrada.
- HEVC economiza bitrate mas pode aumentar latência em GPUs antigas — teste antes de fixar.
- O overlay de diagnóstico mostra bitrate, frame drops e cadência em tempo real; o `steamwebhelper` sobrecarregado indica overlay web roubando CPU.

## Exercícios

1. Inicie uma sessão e abra o menu rápido (botão `...`). Liste todas as opções do menu avançado que aparecem com o jogo ativo.
2. Configure o áudio para tocar apenas no Deck (silencie o PC) e confirme que o jogo continua audível no fone.
3. Ative o HEVC (se suportado) e compare a qualidade no mesmo bitrate com o H.264. A latência percebida mudou?
4. Alterne entre "priorizar estabilidade" e "priorizar resposta" num jogo de reflexo e descreva a diferença de sensação.
5. **Desafio.** Use o protocolo `steam://open/settings/remoteplay` para abrir as configurações sem navegar pelos menus, e monitore o `steamwebhelper` durante 5 minutos de streaming para garantir que ele fica abaixo de 10% de CPU.