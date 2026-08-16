Emulação deixou de ser uma atividade solitária. O **netplay** do RetroArch conecta dois ou mais Steam Decks (ou PCs) pela internet para jogar juntos, como se ambos estivessem no mesmo sofá dividindo o controle. A mágica é que cada máquina roda o mesmo jogo ao mesmo tempo, e só a entrada do controlador viaja pela rede. Esta seção mostra como abrir e entrar numa sala, escolher entre os modos de sincronização e contornar os erros mais comuns.

:::objetivos
- Entender a arquitetura do netplay (host e client, estado sincronizado)
- Abrir uma sala como host e entrar como client
- Diferenciar o modo determinístico do modo de entrada com rollback
- Ajustar latência e `input latency` para máquinas com conexões diferentes
- Diagnosticar falhas de conexão e diferenças de versão de core/ROM
:::

## Como o netplay funciona

No netplay, uma máquina vira o **host** e as demais são **clients**. Todos carregam o mesmo core e a mesma ROM; o host autoritário roda o jogo e sincroniza o estado. Há dois modos principais de como esse estado é sincronizado.

O modo clássico é **determinístico**: o jogo só avança quando todos os inputs chegam, o que significa que a partida roda na velocidade do jogador mais lento. O modo alternativo é o **rollback**, usado em jogos de luta, que prevê a entrada do oponente e "desfaz" (rollback) os frames quando a previsão erra — muito mais tolerante a ping.

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/ | grep -i netplay
netplay/
```

Toda sessão de netplay exige que host e client tenham **o mesmo core, a mesma versão dos dois lados e a mesma ROM** (mesmo hash). Qualquer diferença quebra o determinismo e a partida dessincroniza.

## Abrindo e entrando numa sala

Para hospedar, carregue o jogo normalmente, abra *Main Menu > Netplay > Host* e defina um nome de sala. O RetroArch exibe o endereço (IP e porta) que os outros devem usar.

```terminal
Netplay > Start Hosting
Netplay > Port: 55435
Netplay > Host IP Address: 192.168.1.47
```

O client, por sua vez, vai em *Netplay > Connect to Netplay Host* e informa o IP do host. Depois que todos entram, o host inicia o conteúdo e a partida começa em sincronia.

:::dica
Para jogar com alguém fora da sua rede, o host precisa de redirecionamento de porta no roteador (ou usar um túnel/rede virtual). O RetroArch tem uma opção de *Relay Server* que ajuda a atravessar NAT sem abrir porta manualmente — o servidor relay do RetroArch fica como intermediário, e ambos os jogadores conectam a ele.

```terminal
Netplay > Use Relay Server: ON
Netplay > Relay Server Address: nyc.relay.retroarch.com
```

O relay é prático, mas adiciona latência porque o tráfego faz uma escala extra. Para partidas casuais coop funciona bem; para luta competitiva, prefira conexão direta com porta aberta.
:::

## Rollback para jogos de luta

Em jogos de luta, esperar o input lento do oponente destrói a experiência — é onde o determinístico falha. O **input latency com rollback** resolve isso deixando o jogo rodar no ritmo local e prevendo a entrada do adversário.

```terminal
Netplay > Sync Mode: Rollback
Netplay > Input Latency Frames: 2
```

O `Input Latency Frames` é o "orçamento" de atraso: quanto maior, mais tolerante a ping, às custas de possíveis teleports quando a previsão erra. Para jogos de luta, comece em 2 frames e suba conforme a conexão exigir.

:::atencao
O rollback exige um core que suporte o recurso e custa CPU extra, porque o emulador precisa ser capaz de recarregar estados rapidamente. Não use rollback para jogos que não são de luta — o modo determinístico é mais simples e estável para coop ou party games.
:::

## Como o Stream sa deu ruim

Quando a tela "vai para lados diferentes" ou um jogador vê algo que o outro não vê, é a temida **dessincronização**. As causas são quase sempre as mesmas da lista: versões diferentes do core, ROM com hash diferente, ou um dos lados com overrides/settings que afetam o determinismo.

```terminal
$ retroarch --version
RetroArch: 1.18.0
```

Confira a versão nos dois lados com o comando acima. Se host e client estiverem em versões diferentes do RetroArch ou do core, o netplay recusa a conexão ou dessincroniza minutos depois.

:::nota
Diferenças de região de ROM (PAL vs NTSC) também quebram o netplay, porque o jogo roda em velocidades diferentes. Use exatamente o mesmo arquivo dos dois lados — o ideal é um deles exportar a própria ROM para o outro.
:::

## Resumo

- Netplay tem um host autoritário e um ou mais clients, todos rodando o mesmo core e a mesma ROM.
- O modo determinístico espera todos os inputs; o rollback prevê e desfaz frames, ideal para luta.
- `Input Latency Frames` define o orçamento de atraso no modo rollback.
- Host e client precisam de versões idênticas de RetroArch, core e ROM (mesmo hash).
- Dessincronização quase sempre é diferença de versão, região ou hash entre os lados.

## Exercícios

1. Abra uma sala de netplay como host e descreva o IP e a porta exibidos.
2. Entre como client na própria máquina (ou em outra) e confirme que a partida sincroniza.
3. Alterne entre o modo determinístico e rollback num jogo de luta e anote a diferença de resposta.
4. Provoque uma dessincronização usando ROMs de região diferente nos dois lados e observe o sintoma.
5. **Desafio.** Hospede uma partida pela internet usando o relay server e documente os passos de descoberta de endereço, entrada do client e latência configurada.
