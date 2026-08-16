Ter dois Steam Decks — um OLED na sala e um LCD na mochila — é cada vez mais comum. O Steam Cloud resolve o caso básico: você fecha o jogo no Deck A, ele sobe o save, você abre no Deck B, ele desce. Mas a realidade é menos elegante: o Deck B pode estar em modo sleep com o jogo ainda aberto, o Wi-Fi do metrô não alcança o servidor da Valve, e o jogo não fecha de verdade porque foi suspenso. Esta seção trata de como fazer múltiplos dispositivos Steam coexistirem sem guerra de saves.

:::objetivos
- Entender o ciclo de vida da sincronização entre múltiplos dispositivos Steam
- Evitar conflitos ao alternar entre decks com jogos suspensos
- Usar o modo offline de forma segura para não gerar divergência
- Configurar um "deck principal" e "deck secundário" com políticas diferentes
- Diagnosticar silenciosamente qual dispositivo está com a versão mais recente
:::

## O modelo mental: Steam Cloud não é Dropbox

O erro mais comum é tratar o Steam Cloud como se fosse uma pasta sincronizada em tempo real. Não é. O Steam Cloud é um protocolo de **upload no fechamento, download na abertura**. Entre esses dois eventos — que podem estar separados por dias — o servidor não sabe o que acontece no seu disco.

Isso significa que se você abrir Elden Ring no Deck A às 10h, jogar até as 12h, fechar (upload sobe), abrir no Deck B às 14h (download desce), jogar até as 16h e fechar (upload sobe), tudo funciona. O problema aparece quando você **não fecha**:

- Deck A: abre Elden Ring às 10h, joga, põe em sleep mode às 12h sem fechar o jogo.
- Deck B: liga às 15h, abre Elden Ring. O Steam baixa a última versão do servidor — que é de **antes** da sessão do Deck A, porque o Deck A nunca fechou o jogo e nunca subiu o save.

Quando o Deck A sair do sleep e você fechar o jogo, ele vai subir o save das 12h — e aí o diálogo de conflito aparece, porque o servidor agora tem o save do Deck B (das 15h) que o Deck A não conhece.

```terminal
# Deck A: jogo suspenso, save local não subiu
$ stat --format='%y %n' ~/.local/share/Steam/userdata/207304170/1245620/local/ER0000.sl2
2025-04-20 12:03:44 /home/deck/.../ER0000.sl2

# Deck B: fechou o jogo, subiu save
$ ./steamcmd.sh +login ana +cloud_status 1245620 +quit 2>/dev/null | grep remotetime
# remotetime será posterior às 15h

# Resultado: quando Deck A acordar e fechar o jogo, CONFLITO.
```

:::dica
Antes de trocar de dispositivo, crie o hábito de **fechar o jogo completamente** (não só suspender o deck) e esperar o indicador de Cloud sync da biblioteca desaparecer. São 2 a 10 segundos que evitam o diálogo de conflito e a perda de progresso.
:::

## Estratégia: deck principal e deck secundário

Se você alterna frequentemente entre dois decks, a política mais segura é definir um como "principal" e configurar o `steam_autocloud.vdf` (ver [seção sobre conflitos](#/cap-072/sec-02)) adequadamente em cada um:

**Deck principal:** `autocloudsave = 1` — sempre envia a versão local em caso de conflito. É o deck onde você joga a maior parte do tempo; o save dele é tratado como verdade.

**Deck secundário:** sem `steam_autocloud.vdf` — o comportamento padrão com diálogo. Quando o conflito aparecer, você decide conscientemente.

Isso evita que o deck secundário sobrescreva o principal silenciosamente. Mas requer disciplina: se você jogar 20 horas no secundário e o principal estiver com `autocloudsave = 1`, ao abrir o jogo no principal ele **vai** sobrescrever o save do secundário sem perguntar, porque o arquivo local do principal (mais antigo) será enviado de qualquer jeito.

```terminal
# No deck principal (SteamID 207304170):
$ cat ~/.local/share/Steam/userdata/207304170/steam_autocloud.vdf
"steam_autocloud"
{
        "account"
        {
                "autocloudsave"         "1"
        }
}

# No deck secundário: não crie o arquivo.
```

:::atencao
O `steam_autocloud.vdf` é por SteamID, não por máquina. Se a mesma conta Steam estiver nos dois decks, ambos leem o mesmo arquivo local. Mas como o arquivo está no disco de cada máquina, você pode ter configurações diferentes em cada uma — e é exatamente isso que permite a estratégia de principal/secundário.
:::

## Modo offline e sincronização atrasada

O Steam Deck é um dispositivo portátil — ele passa tempo offline. Quando você joga offline, o Steam Cloud não consegue subir nem descer. Os saves ficam acumulados localmente. Ao reconectar, o cliente Steam detecta que `localtime > remotetime` para vários arquivos e tenta subir todos de uma vez.

O problema: se durante o período offline você também jogou em outro dispositivo (que estava online e sincronizou), o servidor terá saves mais recentes que os seus locais de forma **intercalada** — alguns arquivos são mais novos no servidor, outros no local. O Steam trata cada arquivo independentemente, então você pode acabar com um save híbrido: parte da sessão do deck offline, parte do desktop online.

```terminal
# Simulação: dois arquivos de save, um mudou offline, outro mudou online
# remotecache.vdf do deck que estava offline:
"save/game.sav"
{
        "localtime"     "1745254100"    # 19h, mais recente
        "remotetime"    "1745250500"    # 18h, antigo
}
"save/settings.ini"
{
        "localtime"     "1745250500"    # 18h, antigo
        "remotetime"    "1745254100"    # 19h, mais recente (outro PC)
}
# Resultado: game.sav sobe, settings.ini desce. Save híbrido.
```

Para evitar isso, a melhor prática ao reconectar depois de um período offline é:

1. Antes de abrir qualquer jogo, deixe o Steam online por 2 minutos para completar todas as sincronizações.
2. Verifique com `cloud_status` se há arquivos pendentes.
3. Se houver conflito, **não escolha às cegas** — feche o Steam, faça backup manual, depois decida.

## Diagnóstico: qual máquina tem o save mais recente

Quando você não sabe qual deck usou por último, pode comparar os timestamps diretamente:

```terminal
# Em cada deck, execute:
$ stat --format='%Y' ~/.local/share/Steam/userdata/*/1245620/local/ER0000.sl2
1745254223
```

Se os dois decks estão na mesma rede, é possível fazer essa comparação remotamente com `rsync` ou `scp`:

```terminal
$ ssh deck-oled "stat --format='%Y' ~/.local/share/Steam/userdata/*/1245620/local/ER0000.sl2"
1745254223
$ stat --format='%Y' ~/.local/share/Steam/userdata/*/1245620/local/ER0000.sl2
1745100000
# Deck OLED tem o save mais recente. Use o save dele.
```

:::exemplo
**Cenário real:** Ana tem um Steam Deck OLED em casa e um LCD que leva para o trabalho. Ela joga Hades no trem (offline), chega no escritório, conecta o deck LCD ao Wi-Fi, mas não abre o jogo. À noite, em casa, ela pega o OLED e abre Hades — o Steam baixa o save do LCD que sincronizou de manhã, que é mais recente que qualquer coisa no OLED. Nenhum conflito, nenhuma perda. A chave foi: **o deck LCD sincronizou ao reconectar, antes que o OLED tentasse abrir o jogo**.
:::

## Resumo

- Steam Cloud sincroniza no fechamento (upload) e na abertura (download); jogos suspensos não geram upload.
- Suspender o deck com o jogo aberto é a causa número um de conflitos entre múltiplos dispositivos.
- A estratégia de deck principal (`autocloudsave = 1`) e secundário (sem autocloud) reduz decisões acidentais.
- Jogar offline em dois dispositivos gera saves intercalados que podem produzir um estado híbrido na reconexão.
- Comparar timestamps com `stat --format='%Y'` responde qual máquina tem o save mais recente antes de decidir.

## Exercícios

1. Provoque o cenário de dois decks: abra um jogo no Deck A, suspenda sem fechar. No Deck B, abra o mesmo jogo, jogue 5 minutos e feche. Depois acorde o Deck A e feche o jogo. O que o Steam mostra?
2. Configure o `steam_autocloud.vdf` em um deck e simule um conflito. O comportamento foi o esperado (decisão automática, sem diálogo)?
3. Escreva um script que compare o timestamp local de um save com o `remotetime` do `cloud_status` do SteamCMD e imprima "dispositivo mais recente" ou "servidor mais recente".
4. Documente, para cada jogo que você joga ativamente, o AppID e o caminho exato do save principal (fora ou dentro de `userdata/`). Essa lista será a base dos scripts de backup futuros.
5. **Desafio.** Use `scp` e `stat` para criar um script `sync-decks.sh` que, dado um AppID, compara os timestamps dos saves em dois decks via SSH e copia o mais recente para o outro. Teste com um jogo que você não se importa de perder o save.