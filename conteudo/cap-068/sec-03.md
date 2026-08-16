Transmitir do Deck para outro PC é o cenário mais comum de Remote Play: você está no escritório, o Deck está na sala, e você quer jogar na tela maior com teclado e mouse. O cliente Steam no PC receptor reconhece o Deck automaticamente na rede local e oferece o stream com um clique. Por trás desse clique, porém, há negociação de codec, resolução e controle que vale a pena entender.

:::objetivos
- Instalar e configurar o Steam no PC cliente para receber streams do Deck
- Parear os dois dispositivos na mesma rede local
- Iniciar e encerrar uma sessão de streaming com o Deck como servidor
- Configurar controle, teclado e mouse no cliente
- Entender as opções avançadas: performance overlay, limite de banda e prioridade de tráfego
:::

## Preparando o PC cliente

O PC que vai receber o stream precisa ter o Steam instalado e conectado à mesma conta Steam do Deck — ou a uma conta autorizada via Family Sharing. Não é preciso ter o jogo instalado no cliente; o jogo roda no Deck e o cliente apenas recebe o vídeo e envia os comandos.

No cliente, vá em Steam > Settings > Remote Play e ative "Enable Remote Play". Em seguida, verifique se "Hardware Decoding" está ligado — todo PC moderno tem suporte, seja via GPU dedicada (NVIDIA NVENC, AMD VCE) ou gráficos integrados (Intel Quick Sync).

```terminal
## No PC cliente (Ubuntu 24.04, com GPU Intel):
$ vainfo | grep -i -E 'h264|hevc'
      VAProfileH264Main               :	VAEntrypointVLD
      VAProfileH264High               :	VAEntrypointVLD
      VAProfileHEVCMain               :	VAEntrypointVLD
      VAProfileHEVCMain10             :	VAEntrypointVLD
```

Com hardware decoding confirmado, o cliente está pronto. Agora, com ambos os Steam abertos na mesma rede, o Deck aparece na biblioteca do cliente com um ícone verde e o texto "In-Home Streaming".

## Iniciando o primeiro stream

No cliente Steam, passe o mouse sobre o botão verde "Stream" ao lado do nome do Deck. Um menu oferece duas opções: "Connect" (conecta ao Deck e mostra o Big Picture remotamente) ou "Stream Game" (inicia um jogo específico diretamente). Para o primeiro teste, use "Connect" — você verá a interface do Deck no PC como se fosse o modo Gaming.

```terminal
## No Deck, enquanto o stream está ativo:
$ ss -tunp | grep steam | head -6
udp   UNCONN 0      0          0.0.0.0:27036       0.0.0.0:*    users:(("steam",pid=1421,fd=38))
udp   UNCONN 0      0          0.0.0.0:27031       0.0.0.0:*    users:(("steam",pid=1421,fd=33))
udp   UNCONN 0      0          0.0.0.0:27032       0.0.0.0:*    users:(("steam",pid=1421,fd=34))
tcp   ESTAB  0      0     192.168.1.50:27036  192.168.1.101:54321 users:(("steam",pid=1421,fd=42))
tcp   ESTAB  0      0     192.168.1.50:27031  192.168.1.101:54322 users:(("steam",pid=1421,fd=44))
udp   ESTAB  0      0     192.168.1.50:27031  192.168.1.101:54323 users:(("steam",pid=1421,fd=45))
```

A saída revela o que está acontecendo na rede. As portas UDP 27031, 27032 e 27036 no Deck são os canais de streaming (vídeo, áudio e controle), e as conexões TCP estabelecidas com `192.168.1.101` (o PC cliente) confirmam o par ativo. Note que há tanto UDP (transporte de vídeo, prioritário) quanto TCP (controle e sincronização).

## Performance Overlay e ajustes em tempo real

Durante o stream, o Steam oferece um overlay de estatísticas que mostra FPS, latência de rede, tempo de codificação e decodificação, e perda de pacotes. Para ativá-lo: no cliente, pressione `[[Ctrl+Shift+Tab]]` durante o stream. A tela exibe algo como:

```text
Streaming latency: 18ms
  Display latency: 12.4ms
  Network latency: 2.1ms
  Encode latency: 3.5ms
Packet loss: 0.0%
Encoder: AMD AMF H.264
Resolution: 1920x1080 @ 59.94 FPS
Bitrate: 15.0 Mbps
```

As quatro latências contam a história completa do atraso entre apertar um botão e ver o resultado. A **network latency** (2.1 ms) é o tempo de ida e volta do pacote na rede local — excelente. A **encode latency** (3.5 ms) é o tempo que o Deck gasta comprimindo cada frame. A **display latency** (12.4 ms) é o maior vilão: tempo entre o frame chegar no cliente e ser exibido na tela, dominado pela decodificação e pelo vsync do monitor.

:::dica
Se a display latency estiver acima de 20 ms, tente desligar o VSync no cliente ou reduzir a resolução do stream. Se a encode latency estiver acima de 10 ms, o jogo está pesado demais para o Deck codificar ao mesmo tempo — reduza os gráficos do jogo ou o limite de FPS.
:::

## Controles no PC cliente

O PC cliente pode usar qualquer controle reconhecido pelo Steam (Xbox, PlayStation, Nintendo Switch Pro, ou o próprio Steam Controller) — o Steam Input traduz os comandos antes de enviá-los ao Deck. Teclado e mouse também funcionam, com uma ressalva: o mouse é capturado pelo stream, então `[[Alt+Tab]]` no cliente alterna as janelas do Deck, não as do PC local.

Para liberar o mouse do stream e voltar ao PC local, use `[[Ctrl+Alt+Shift+Esc]]` (ou feche o stream).

```terminal
## No Deck, verificando os dispositivos de entrada ativos durante o stream:
$ ls -l /dev/input/by-path/ | head -8
total 0
lrwxrwxrwx 1 root root 9 Aug 16 15:30 platform-i8042-serio-0-event-kbd -> ../event4
lrwxrwxrwx 1 root root 9 Aug 16 15:30 platform-i8042-serio-1-event-mouse -> ../event5
lrwxrwxrwx 1 root root 9 Aug 16 15:30 platform-AMDI0010:00-event -> ../event9
lrwxrwxrwx 1 root root 9 Aug 16 15:30 platform-AMDI0010:03-event -> ../event13
```

Os dispositivos virtuais criados pelo streaming aparecem como eventos adicionais em `/dev/input`. O Steam no Deck os trata como se fossem controles conectados fisicamente — é por isso que o jogo não sabe (e não precisa saber) que o controle está em outro dispositivo.

## Resumo

- O PC cliente precisa do Steam instalado e logado na mesma conta; o jogo não precisa estar instalado no cliente.
- Hardware decoding no cliente é essencial; verifique com `vainfo` (Linux) ou nas configurações do Steam.
- "Connect" inicia o Big Picture remoto; "Stream Game" vai direto ao jogo.
- Durante o stream, portas UDP 27031–27036 no Deck transportam vídeo, áudio e controle.
- O performance overlay (`[[Ctrl+Shift+Tab]]`) revela latência de rede, codificação e exibição separadamente.

## Exercícios

1. No PC cliente, execute `vainfo | grep -iE 'h264|hevc'` e confirme que o hardware decoder está disponível.
2. Inicie um stream do Deck para o PC e pressione `[[Ctrl+Shift+Tab]]` para abrir o performance overlay. Anote as quatro latências e o packet loss.
3. Durante o stream, no Deck execute `ss -tunp | grep steam` e identifique quais portas estão em uso e se são UDP ou TCP.
4. Conecte um controle ao PC cliente durante o stream e, no Deck, execute `ls /dev/input/by-path/` antes e depois. Novos dispositivos apareceram?
5. **Desafio.** Compare o stream com Hardware Encoding ligado e desligado (no servidor, em Settings > Remote Play > Advanced). Use o performance overlay para medir a diferença de encode latency e explique o impacto no consumo de CPU com `htop` rodando no Deck.