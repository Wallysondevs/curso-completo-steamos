Existe um cenário em que o suspend/resume do Deck falha por design, não por bug: jogos online. Você está no meio de uma partida de um battle royale, aperta o botão de energia para guardar o Deck, e quando retoma minutos depois, a sessão já não existe — o servidor te expulsou. Isso não é defeito do aparelho; é a consequência inevitável do protocolo de rede encontrar um cliente que sumiu sem se despedir.

:::objetivos
- Entender por que conexões TCP de jogos online caem durante a suspensão
- Distinguir o comportamento do servidor de um problema local
- Conhecer o conceito de timeout e keepalive no contexto de jogos
- Identificar estratégias para minimizar a perda de sessão
:::

## O servidor não sabe que você suspendeu

Quando você joga online, seu Deck mantém uma conexão **TCP** (ou um túnel UDP com keepalive) aberta com o servidor do jogo. Dezenas de vezes por segundo, os dois lados trocam pacotes pequenos: sua posição, seus comandos, o estado do mundo. O servidor espera essas mensagens no ritmo combinado.

Ao suspender, o Deck para de enviar tudo, instantaneamente e sem aviso. Do ponto de vista do servidor, o cliente simplesmente ficou mudo. Não há um pacote de "vou dormir" no protocolo da maioria dos jogos — o servidor só percebe o silêncio depois de um tempo.

```terminal
$ ss -tnp state established
State Recv-Q Send-Q Local Address:Port  Peer Address:Port  Process
ESTAB 0      0      192.168.1.40:52341  104.160.131.1:443  users:(("steam",pid=1234,fd=67))
ESTAB 0      0      192.168.1.40:45322  185.60.112.15:27015 users:(("game",pid=8901,fd=12))
```

A segunda linha é a conexão do jogo: porta remota `27015`, um porto clássico de servidores de jogos (Source engine da Valve). Enquanto em `ESTAB`, a conexão está viva. Suspendendo o Deck, o kernel não envia mais nada — e essas conexões começam a apodrecer no servidor.

## Timeouts: a conta regressiva do servidor

Todo servidor de jogo tem um **timeout**: um período máximo que tolera sem receber nada do cliente antes de considerá-lo morto e liberar sua vaga. Esse período varia por jogo e por gênero:

- Jogos competitivos (FPS, MOBA) costumam usar timeouts curtos, de 5 a 30 segundos, para não deixar "fantasmas" ocupando slots numa partida.
- MMOs e RPGs online usam timeouts mais generosos, de minutos, porque reconexões são comuns.
- Jogos casuais com sessões não competitivas podem nem ter timeout efetivo no curto prazo.

Independentemente do valor, o resultado é o mesmo: se o seu tempo em suspensão exceder o timeout do servidor, você volta para uma tela de "conexão perdida" ou "você foi removido da sessão".

```terminal
$ journalctl -u systemd-suspend --since "1 hour ago" | grep -i network
ago 12 22:10:11 steamdeck systemd-sleep[3102]: Running /usr/lib/systemd/system-sleep/network-suspend pre...
ago 12 22:10:12 steamdeck network-suspend[3105]: Bringing down wlan0 before suspend
ago 12 22:10:12 steamdeck systemd-sleep[3102]: INFO: network interfaces taken down.
```

O log revela a segunda parte do problema: o próprio hook de suspensão **derruba a interface de rede** (`wlan0`) antes de congelar. Mesmo que o servidor tivesse um timeout longo, não haveria nem chance de manter a conexão — a interface é desligada deliberadamente.

:::nota
Desligar a interface antes de suspender não é capricho: é higiene de energia. Uma interface Wi-Fi ligada consome energia e pode manter o controlador de rede fora do estado de baixo consumo. A economia justifica a perda da conexão para a maioria dos casos — exceto para quem joga online.
:::

## Por que não dá para simplesmente "manter vivo"

Você pode se perguntar: por que a Valve não mantém a rede ativa durante a suspensão, como alguns laptops fazem com o recurso de "Connected Standby" (S0ix)? Em tese, seria possível manter o Wi-Fi escutando enquanto a CPU dorme, acordando o sistema apenas quando um pacote chega.

O problema é que *manter a conexão de jogo ativa* exige muito mais do que escutar: o servidor espera respostas no ritmo do jogo (tickrate). Para responder, você precisaria da CPU rodando a lógica do jogo — o que contradiz a suspensão. Manter-se "presente" no lobby exige processamento contínuo, e processamento contínuo não é suspensão.

```terminal
$ cat /sys/power/state
freeze mem disk
```

Repare: não existe um estado "suspender mas com rede e jogo ativos". Os três modos — `freeze`, `mem`, `disk` — envolvem parar a CPU em algum grau. Jogo online ativo e CPU parada são mutuamente exclusivos. É uma limitação física, não uma escolha da Valve.

:::dica
Se você joga títulos online casuais em que um "kick" é apenas inconveniente (ex.: salas de chat em MMO, servidores cooperativos com amigos), o timeout generoso de alguns minutos permite suspensões rápidas. Teste com o seu jogo: suspenda por 30 segundos e veja se a sessão sobrevive. Isso calibra o quanto você pode abusar do botão de energia naquele título específico.
:::

## Estratégias para lidar com o kick

**Aceite e reconecte.** Para a maioria dos jogos competitivos, retomar da suspensão e reconectar automaticamente é o fluxo esperado. O jogo detecta a sessão perdida e te coloca de volta no menu ou no lobby.

**Evite suspender em partidas.** Se o jogo pune desconexão (perda de rank, penalidade), trate o botão de energia como um "sair da partida". Termine a partida antes de guardar o Deck.

**Prefira pausar em jogos offline.** Jogos single-player são o território perfeito do suspend/resume. Offline, a suspensão congela o jogo sem nenhuma contraparte remota para se preocupar.

**Use o modo online apenas quando quiser.** A distinção final é simples: o suspend/resume do Deck é uma função de jogo offline/local por excelência. Para online, planeje sessões contínuas.

## Resumo

- Jogos online mantêm conexões TCP/UDP que o servidor monitora continuamente.
- Ao suspender, o Deck desliga a interface de rede antes de congelar; o servidor interpreta o silêncio como desconexão.
- O timeout do servidor define quanto tempo você pode ficar suspenso antes do kick: de segundos (FPS) a minutos (MMO).
- Não há estado de energia que mantenha a CPU parada e a lógica de jogo online ativa simultaneamente.
- Jogos offline são o caso de uso ideal do suspend/resume; online exige sessões contínuas.

## Exercícios

1. Com um jogo online aberto, rode `ss -tnp state established` e identifique a conexão de rede do jogo (porta remota e processo).
2. Suspenda o Deck por 15 segundos durante uma partida casual e observe o que o jogo exibe ao retomar. Descreva o comportamento exato.
3. Repita com 60 segundos de suspensão. A partir dos dois testes, estime o timeout aproximado do servidor daquele jogo.
4. Inspecione o hook de rede com `journalctl -u systemd-suspend | grep -i network` e localize a mensagem de derrubada da interface.
5. **Desafio.** Pesquise o conceito de `TCP keepalive` e verifique, com `sysctl net.ipv4.tcp_keepalive_time`, o valor configurado no Deck. Compare com os timeouts de jogos que você observou e discuta por que pacotes keepalive não salvariam sua sessão de jogo durante S3.