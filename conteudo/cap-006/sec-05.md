Notificações, lista de amigos e chat são as funções "sociais" do Steam, e no Deck elas existem de forma compacta: um sino, uma lista de quem está online e um chat por cima do jogo. O que muita gente não percebe é que tudo isso trafega por uma infraestrutura de rede persistente, com um componente próprio — o `steamwebhelper` — e logs que contam a história de cada reconexão. Saber onde isso vive ajuda a diagnosticar quando as notificações "somem".

:::objetivos
- Entender como o chat e as notificações do Steam se conectam à rede
- Identificar os processos e portas envolvidos na comunicação social
- Localizar os logs de amigo e notificação no disco
- Diagnosticar notificações ausentes com `journalctl` e o log do cliente
- Ajustar as preferências de notificação por jogo

:::

## A infraestrutura por trás do sino

Quando você vê um "fulano entrou online" no Deck, aconteceu uma cadeia longa de eventos: o servidor da Valve notificou o seu cliente através de uma conexão persistente, o `steamwebhelper` (o processo que hospeda as telas de interface em HTML/CEF) recebeu o evento, e a interface de gamepad desenhou o aviso. Nada disso usa polling a cada segundo na prática visível — a Valve usa conexões mantidas abertas (WebSocket/HTTP persistente) para empurrar eventos em tempo quase real.

Você pode observar as conexões ativas do cliente Steam no desktop:

```terminal
$ ss -tnp 2>/dev/null | grep -iE 'steam|webhelper' | head -8
ESTAB 0  0  192.168.1.42:52012  162.254.196.83:443  users:(("steamwebhelper",pid=2231,fd=87))
ESTAB 0  0  192.168.1.42:52014  155.133.248.30:443  users:(("steamwebhelper",pid=2231,fd=91))
ESTAB 0  0  192.168.1.42:52018  162.254.197.48:27021  users:(("steam",pid=2260,fd=44))
```

Repare nos dois tipos de conexão: as do `steamwebhelper` (para a porta `443`, HTTPS — são a loja, o chat web e o friendui) e a do `steam` (para a porta `27021`, o protocolo de *CM* — *connection manager* — do Steam). O *CM* é o serviço histórico do Steam para estado de login, amigos e presença; foi ele que evoluiu para o Steam Friends & Chat moderno. A porta `27021` é uma das endereços do *CM* em produção.

Essa distinção importa no diagnóstico. Se a **loja** abre mas o **chat** não conecta, o problema é provavelmente no *CM*/friendui (portas `270xx`). Se **nada** social funciona, é a conectividade geral.

## Onde ficam os logs sociais

O cliente Steam registra a atividade de amizade e notificações em arquivos próprios. No diretório de logs que você já conhece, há dois candidatos relevantes — o `console-linux.txt` (registro geral, inclui eventos de amizade) e, em builds recentes, logs específicos do *friendui*:

```terminal
$ ls -lh ~/.steam/steam/logs/
total 18M
-rw-r--r-- 1 deck deck 3.2M Aug 15 09:40 bootstrap_log.txt
-rw-r--r-- 1 deck deck 2.1M Aug 15 09:40 content_log.txt
-rw-r--r-- 1 deck deck 4.5M Aug 15 09:40 console-linux.txt
-rw-r--r-- 1 deck deck 1.8M Aug 15 09:41 friendui.txt
-rw-r--r-- 1 deck deck 640K Aug 15 09:41 cloud_log.txt
```

O `friendui.txt` (presença variável entre versões) concentra a interface de amigos: handshakes de login do chat, reconexões e erros de presença:

```terminal
$ grep -iE 'reconnect|login|presence|friend' ~/.steam/steam/logs/friendui.txt | tail -10
[2025-08-15 09:41:02] CClientFriends Reconnecting to friends network...
[2025-08-15 09:41:03] CClientFriends Logged into friends network as 76561198000000000
[2025-08-15 09:41:03] Presence set to online
```

Quando o Deck acorda da suspensão, é comum ver exatamente essa sequência: `Reconnecting` seguido de `Logged into` e `Presence set to online`. É o cliente refazendo as conexões que a suspensão derrubou. Se a linha `Reconnecting` aparecer várias vezes seguidas sem `Logged into`, o chat está flutuando — normalmente problema de Wi-Fi ou de DNS.

## Diagnóstico pelo journalctl

Além dos logs do próprio Steam, o systemd registra o que acontece com o serviço. No SteamOS o cliente pode rodar sob uma unidade systemd (dependendo do modo), e o `journalctl` captura o ruído de rede e de sessão:

```terminal
$ journalctl --user -u steam 2>/dev/null | grep -iE 'friend|connect|network' | tail -12
```

Se `--user` não devolver nada (o serviço pode estar no escopo de sistema), tente sem ele:

```terminal
$ journalctl -b | grep -iE 'steam_?webhelper|steam' | grep -iE 'connect|error' | tail -12
```

A ideia é a mesma de qualquer diagnóstico Linux: **três camadas de evidência** — o processo (`ps`/`ss`), o log do aplicativo (`~/.steam/steam/logs`) e o log do sistema (`journalctl`). Notificações ausentes quase sempre deixam rastro em pelo menos uma delas.

:::dica
Um truque rápido para testar se o problema é de **sessão de login** (e não de rede): saia e entre de novo no Modo Jogo (menu → Trocar usuário → sua conta). Isso força um novo handshake do *CM*. Se as notificações voltarem, era a sessão presa; se não, investigue a rede.
:::

## Configurando as notificações

O Steam permite granularidade fina de notificações: por evento (pedido de amizade, convite de grupo, conquista, mensagem) e por jogo. As opções ficam em **Configurações → Notificações**, e as mais importantes são:

- **Notificações de conquista** — ativar/desativar o aviso sonoro e visual quando você desbloqueia uma conquista.
- **Notificações de amigo** — aviso quando alguém entra online (pode ser desligado para não poluir a tela durante o jogo).
- **Pedidos de chat / convites** — se um amigo pode interromper seu jogo.

Essas preferências são persistidas no `localconfig.vdf` também (o arquivo que já apareceu nas coleções), o que reforça a tese do capítulo: quase toda escolha da interface vira um bloco de texto em `userdata/<steamid>/config/`.

```terminal
$ grep -iE 'notification|conquest|achievement' ~/.steam/steam/userdata/76561198000000000/config/localconfig.vdf | head -12
```

A saída mostra chaves como `"SteamDefaultDialog"`, `"Notifications_ShowIngame"` e afins, cada uma mapeando uma das escolhas que você fez na tela.

## Resumo

- Notificações e chat trafegam por conexões persistentes do `steamwebhelper` (HTTPS `443`) e do *CM* do `steam` (portas `270xx`).
- `ss -tnp` mostra as conexões ativas e o processo dono de cada uma.
- Os logs sociais ficam em `~/.steam/steam/logs` (`console-linux.txt`, `friendui.txt`).
- `journalctl` captura reconexões de rede e erros de sessão no nível do sistema.
- Preferências de notificação são gravadas no `localconfig.vdf`, por usuário.
- Reconexões após a suspensão são normais: `Reconnecting` seguido de `Logged into`.

## Exercícios

1. Com o chat aberto no Modo Jogo, volte ao desktop e rode `ss -tnp | grep steam` para identificar as portas `270xx` do *CM*.
2. Procure no `friendui.txt` (ou `console-linux.txt`) a última linha de `Presence` e diga qual é seu estado atual.
3. Desligue todas as notificações de conquista nas configurações e observe a mudança correspondente no `localconfig.vdf` com `grep`.
4. Suspenda o Deck e acorde-o; registre a sequência de reconexão no `friendui.txt` e explique o que cada linha significa.
5. **Desafio.** Simule uma falha de conexão desligando o Wi-Fi pelo menu rápido e observe em `console-linux.txt`/`friendui.txt` as mensagens de desconexão. Depois religue e relacione o que viu com o conceito de conexão persistente (vs. polling) explicado na seção.
