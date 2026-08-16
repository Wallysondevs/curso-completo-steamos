Há uma categoria de falha que nenhuma variável de Proton, nenhum runtime e nenhum log resolvem: o anticheat que não foi habilitado para Linux. EasyAntiCheat (EAC) e BattlEye, os dois sistemas de proteção mais usados em jogos multiplayer, rodam em modo kernel no Windows — e no Linux, onde isso não é possível, dependem de um módulo de compatibilidade que o desenvolvedor precisa ativar manualmente. Se o estúdio não ativou, o jogo fecha, trava ou bloqueia o matchmaking, e você não tem como dar bypass. Esta seção explica como saber antes de comprar.

:::objetivos
- Entender a arquitetura do anticheat no Proton
- Identificar se EAC ou BattlEye estão habilitados para o título
- Verificar o estado do anticheat via ProtonDB e SteamDB
- Reconhecer o erro de anticheat no log versus erro de runtime
- Tomar a decisão informada antes da compra
:::

## Por que o anticheat quebra no Proton

Anticheat de kernel como EAC e BattlEye operam como drivers que inspecionam a memória do processo a partir de dentro do kernel do Windows. O Proton não emula kernel — ele traduz chamadas de usuário. O Wine/Proton não roda drivers `.sys`, e mesmo que rodasse, o kernel do Linux não aceitaria um driver arbitrário do Windows se metendo na memória do sistema.

A solução da Valve e dos fornecedores de anticheat foi criar **módulos de compatibilidade**: versões dos anticheats que rodam em espaço de usuário no Linux e se comunicam com o Proton via interfaces documentadas. O desenvolvedor do jogo precisa habilitar essa variante — é um envio de arquivo de configuração e, às vezes, uma biblioteca extra. Quando o estúdio não faz isso, o anticheat não carrega, e o jogo trata o ambiente como inseguro.

:::info
FromSoftware habilitou o EAC para Elden Ring no Linux. Bungie, por outro lado, não habilita o BattlEye para Destiny 2 e bane quem tenta forçar. A decisão é do estúdio, não da Valve, e nenhuma ferramenta deste capítulo consegue contornar isso — a seção de anticheat existe justamente para você identificar os casos sem saída e não perder tempo.
:::

## Sintoma no log

Quando o anticheat não carrega, o jogo fecha ou trava sem o erro de DLL de runtime que você aprendeu a reconhecer. O log do Proton mostra o carregamento (ou a tentativa) do módulo:

```terminal
$ PROTON_LOG=1
$ grep -iE 'easyanticheat|eac|battleye|anticheat' ~/steam-<appid>.log | head
warn:  EasyAntiCheat not loaded (unsupported platform)
err:   Failed to initialize EasyAntiCheat
$ grep -iE 'connect|multiplayer|lobby' ~/steam-<appid>.log | head
fixme: The game may have started but blocked matchmaking due to missing anticheat.
```

A linha `unsupported platform` é a assinatura: o anticheat reconheceu que está no Linux, mas o dev não ativou o módulo de compatibilidade. O jogo pode até abrir o menu principal, mas o multiplayer fica bloqueado.

## Como checar antes de comprar

A melhor prevenção é consultar duas fontes antes de gastar dinheiro:

1. **ProtonDB** — filtre pelo selo Steam Deck e procure menções a "EAC", "BattlEye", "anticheat" ou "multiplayer". Relatórios que dizem "single player funciona, online quebra" são o sinal de anticheat ausente.
2. **SteamDB** (steamdb.info) — busque pelo título e vá na aba de configuração; a seção de anticheat lista se o jogo declara EAC ou BattlEye no manifest da Steam.

Além disso, a Valve mantém uma lista não oficial de títulos com anticheat compatível, que muda com frequência. A referência é o banco do ProtonDB, não um PDF estático.

Como o anticheat vive dentro do prefixo do jogo, você pode inspecionar diretamente as bibliotecas carregadas. Isso confirma se o módulo está presente, independentemente do que o ProtonDB reporta:

```terminal
$ find ~/.steam/steam/steamapps/compatdata/730/pfx -name '*easyanticheat*' -o -name '*battleye*' 2>/dev/null
pfx/drive_c/Program Files (x86)/EasyAntiCheat/EasyAntiCheat_EOS.exe
pfx/drive_c/Program Files (x86)/EasyAntiCheat/easyanticheat_x64.so
```

A presença do `.so` (objeto compartilhado do Linux) ao lado do `.exe` indica que o estúdio empacotou o módulo de compatibilidade. Se só existir o `.exe`, o módulo Linux não foi incluído — e o jogo não vai passar da verificação de integridade do anticheat.

:::atencao
Alguns títulos ativam o anticheat para Linux mas depois desativam em atualizações futuras, ou vice-versa. Apex Legends, por exemplo, funcionou por anos no Deck até que a EA/Respawn removeu o suporte ao Linux. Sempre cheque a data dos relatórios antes de decidir.
:::

## Existe gambiarra? (Não, e nem tente)

Você pode encontrar tutoriais sugerindo substituir o `.so` do EAC por uma versão de outro jogo, ou aplicar patches de terceiros. **Não faça isso.** EAC e BattlEye operam com assinatura criptográfica do binário — qualquer modificação na cadeia de carregamento do anticheat é detectada como adulteração e resulta em banimento permanente da conta. É a categoria de falha que este capítulo conscientemente não resolve, porque não tem solução técnica lícita.

Se o multiplayer é essencial para você, a decisão é anterior à instalação: verifique a compatibilidade no ProtonDB, e se não houver suporte, jogue no desktop com Windows ou espere anúncio do estúdio.

## Onde pressionar

A rota de influência que funciona: contate o desenvolvedor ou publisher educadamente, explicando que o módulo de compatibilidade EAC/BattlEye para Linux é uma ativação simples (um binário fornecido pelo próprio fornecedor do anticheat) e que a base de jogadores no Steam Deck é relevante. A Epic (dona do EAC) e a BattlEye disponibilizam documentação para devs. O gargalo é vontade do estúdio, não tecnologia.

Uma última checagem técnica: o manifest de instalação e os arquivos do jogo registram se o título declara proteção, o que permite cruzar o que o ProtonDB diz com o que está no seu disco:

```terminal
$ grep -riE 'easyanticheat|battleye' ~/.local/share/Steam/steamapps/common/Project\\ Zomboid/ 2>/dev/null | head -3
easyanticheat: eac_server.so present
$ grep -iE 'anticheat|eac|battleye' ~/.local/share/Steam/steamapps/appmanifest_108600.acf
```

Quando não há nenhuma menção no prefixo, no manifest e nem no disco, e o ProtonDB confirma multiplayer bloqueado, você esgotou a investigação — o caso é um beco sem saída legítimo, não um problema de configuração que você deixou de corrigir.

:::nota
O Steam Deck validado (aqueles com o selo verde "Verified") já passa pelo crivo do anticheat: a Valve testa o multiplayer e marca como "Playable" ou "Unsupported" quando o anticheat bloqueia. O selo Steam Deck não é infalível, mas é um filtro útil.
:::

## Resumo

- EAC e BattlEye rodam em modo kernel no Windows; no Linux dependem de módulo de compatibilidade ativado pelo dev.
- No log, `unsupported platform` e `Failed to initialize EasyAntiCheat` indicam anticheat ausente.
- ProtonDB (filtrando por Steam Deck) e SteamDB são as duas fontes de consulta pré-compra confiáveis.
- Não existem bypasses seguros de anticheat no Proton — tentar resulta em banimento.
- A decisão sobre compatibilidade é do estúdio; a rota de influência é contato direto e pressão comunitária.

## Exercícios

1. Pesquise no ProtonDB por um jogo multiplayer que você joga, filtre por Steam Deck e localize dois relatórios recentes que mencionem EAC ou BattlEye.
2. No SteamDB, busque o mesmo título e confirme na aba de configuração se o anticheat está declarado.
3. No log do Proton (`PROTON_LOG=1`) de um título com anticheat, grep` por `anticheat`/`battleye` e capture a linha que confirma carregamento ou recusa.
4. Compare dois jogos do mesmo gênero: um com anticheat habilitado para Linux e outro sem. Anote o que os diferencia nos relatórios do ProtonDB.
5. **Desafio.** Escreva uma mensagem curta (em inglês, ~100 palavras) para o suporte de um estúdio cujo jogo você adora mas não tem suporte a anticheat no Deck, explicando que a ativação do módulo de compatibilidade é simples e que a comunidade Linux pede. Não envie — é um exercício de redação convicta e polida.