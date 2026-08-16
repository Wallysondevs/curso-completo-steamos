Depois que o Syncthing está pareado, o trabalho de verdade começa: decidir o que sincronizar, o que ignorar e o que fazer quando dois dispositivos modificam o mesmo arquivo. Esta seção cobre o gerenciamento fino de pastas, o arquivo de exclusões e o comportamento de conflitos — as três áreas onde a maioria dos problemas de sincronização nasce.

:::objetivos
- Entender os tipos de pasta (sendreceive, sendonly, receiveonly)
- Usar o arquivo `.stignore` para excluir arquivos e padrões
- Interpretar conflitos e escolher uma regra de versionamento
- Ajustar a varredura para não gastar CPU durante os jogos
- Monitorar conexões e dados transferidos

:::

## Tipos de pasta e seus riscos

Nem toda pasta deve ser bidirecional. O Syncthing distingue três tipos:

- **sendreceive**: envia e recebe. Os dois lados convergem para o estado mais recente.
- **sendonly**: só envia. Útil para um "Deck → NAS" unidirecional, onde o NAS é o cofre e não deve mandar nada de volta.
- **receiveonly**: só recebe. O destino espelha a origem, ignorando qualquer mudança feita localmente.

```terminal
$ curl -s http://127.0.0.1:8384/rest/config/folders | python3 -m json.tool | grep -E '"id"|"type"' | head -8
    "id": "saves-deck",
    "type": "sendreceive",
    "id": "roms-backup",
    "type": "sendonly",
```

A escolha errada é fonte de susto clássico: quem marca uma pasta compartilhada bidirecional como `sendonly` e depois apaga arquivos no dispositivo que só recebe. No `sendonly`, mudanças do lado "somente envio" sobrescrevem o que existe no outro lado — e apagar na origem **apaga** no destino.

:::perigo
Em pastas `sendonly`, deletar um arquivo na origem propaga a deleção para todos os dispositivos. Se a sua intenção é "enviar para sempre uma cópia no NAS e poder apagar no Deck", use `sendonly` com `ignoreDelete` ativado, ou repense usando `rclone` (unidirecional de verdade, seção 7).
:::

## O arquivo `.stignore`

É o equivalente ao `.gitignore` do Syncthing. Um arquivo chamado `.stignore` colocado na **raiz de cada pasta** lista padrões de arquivos que o Syncthing deve ignorar — eles não são enviados nem recebidos, e arquivos que se encaixam no padrão são tratados como se não existissem.

```text
# ~/sync/saves/.stignore
## Nunca sincronize arquivos temporários ou de estado
*.tmp
*.swp
*.part
.Trash-*
## Caches e miniaturas que mudam o tempo todo
*/.cache
**/*.log
## Saves em uso por um emulador aberto
*.lock
*.lck
```

Cada linha é um padrão. O `*` casa qualquer coisa dentro de uma pasta, o `**` atravessa várias pastas. Linhas começando com `!` re-incluem algo que um padrão anterior excluiu; `//` faz comentário inline. Depois de editar, o Syncthing detecta a mudança e reavalia na hora.

```terminal
$ cd ~/sync/saves && printf '*.tmp\n*.log\n' > .stignore
## O painel passa a mostrar os arquivos ignorados como "Não sincronizado: ignorado"
```

Um detalhe importante: o `.stignore` **não** é sincronizado entre dispositivos. Cada máquina tem a sua cópia local. Se você quer que as mesmas exclusões valham em todo lugar, precisa criar o arquivo (ou uma versão equivalente) em cada pasta correspondente.

:::dica
Para o Steam Deck, excluir `*.log`, arquivos `.tmp` e caches é quase obrigatório: emuladores e jogos reescrevem esses arquivos a cada segundo, o que geraria tráfego e conflitos inúteis.
:::

## Conflitos e versionamento

O conflito acontece quando o mesmo arquivo é alterado nos dois dispositivos antes que a sincronização os una. Como o Syncthing não sabe quem está "certo", ele não sobrescreve: ele **preserva as duas versões**.

```terminal
$ ls ~/sync/saves/
nota.txt
nota.sync-conflict-20250815-142301-ABCDE12.txt
```

O arquivo `nota.sync-conflict-...` é a versão que "perdeu" o conflito, renomeada para não sobrescrever nada. A versão vencedora fica no nome original. Você resolve o conflito manualmente: compara as duas, escolhe a boa e apaga a outra.

O **versionamento** é uma camada extra, independente de conflito: ele mantém versões antigas de arquivos que foram alterados ou deletados. Existem vários modos:

| Modo | Comportamento |
|---|---|
| Nenhum | Nada é guardado; deleção e alteração são imediatas |
| Simple file versioning | Mantém N versões antigas de cada arquivo |
| Staggered file versioning | Mantém versões espaçadas no tempo (1h, 1 dia, 1 semana…) |
| Trash can | Move deletados para uma lixeira em vez de apagar |

Com o *simple file versioning* configurado para manter, digamos, 3 versões, uma alteração acidental não é mais irreversível.

```terminal
## Pastas versionadas guardam cópias em .stversions (ou no caminho configurado)
$ find ~/sync/saves/.stversions -type f 2>/dev/null | head -5
/home/deck/sync/saves/.stversions/nota~20250815-142301.txt
```

## Controlando o consumo de recursos

O Syncthing é leve, mas num Steam Deck a CPU importa — cada núcleo disputado com o jogo vira frame perdido. Você pode reduzir a frequência da varredura full e desligar o monitoramento de sistema de arquivos se necessário.

A varredura completa (`rescan`) varre a pasta em busca de mudanças. Por padrão o *filesystem watcher* já faz o grosso do trabalho em tempo real, e a varredura periódica é uma rede de segurança para coisas que o watcher perdeu.

```terminal
$ curl -s -X POST "http://127.0.0.1:8384/rest/db/scan?folder=saves-deck" -o /dev/null -w "%{http_code}\n"
200
```

O painel gráfico também expõe, por pasta, o intervalo de varredura (`rescanIntervalS`). Aumentá-lo de 3600 para, digamos, 43200 segundos reduz a atividade periódica em segundo plano. Durante sessões de jogo pesadas, outra opção é pausar todas as pastas de uma vez.

:::info
Para pausar tudo programaticamente, a API oferece `/rest/system/pause` e `/rest/system/resume`. Quem automatiza o Deck costuma disparar `pause` ao iniciar a Steam em modo jogo e `resume` ao voltar para o desktop — assim o Syncthing não compete por I/O durante a partida.
:::

## Resumo

- `sendreceive` converge, `sendonly` só envia e `receiveonly` só recebe; `sendonly` propaga deleções.
- O `.stignore` lista padrões ignorados (inc. `*.tmp`, `*.log`, caches); ele é local a cada máquina.
- Conflitos são resolvidos preservando as duas versões com sufixo `sync-conflict-...`.
- Versionamento simples, escalonado ou lixeira protege contra deleção e alteração acidentais.
- A varredura e o watcher podem ser ajustados para poupar CPU durante jogos, ou pausados via API.

## Exercícios

1. Crie um `.stignore` na sua pasta `teste-deck` que exclua `*.tmp` e `*.log`, adicione alguns arquivos desses tipos e confirme que não são sincronizados.
2. Transforme a pasta `teste-deck` em `sendonly` e verifique o que acontece ao apagar um arquivo no Deck. Depois volte para `sendreceive`.
3. Edite o mesmo arquivo simultaneamente em dois dispositivos e observe o conflito `sync-conflict-...`. Resolva-o guardando a versão correta.
4. Ative o *simple file versioning* mantendo 3 versões, altere um arquivo três vezes e liste as versões em `.stversions`.
5. **Desafio.** Use a API REST para pausar todas as sincronizações (`/rest/system/pause`), confirme o estado em `/rest/system/status`, e escreva um pequeno script que pause ao iniciar um jogo e retome ao sair.
