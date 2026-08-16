Depois de dominar as plataformas individualmente, falta a parte que transforma um emulador bem configurado numa biblioteca que resiste ao tempo: backup, organização e os detalhes que separam o entusiasta do curioso. Save states, BIOS, caches, arte de capa — cada peça tem um lugar, e perder qualquer uma delas é perder horas de progresso. Esta seção fecha o capítulo amarrando tudo.

:::objetivos
- Organizar saves, save states, BIOS e caches em locais coerentes e sob backup
- Automatizar o backup dos dados de emulação com scripts versionados
- Entender como os save states se relacionam com a BIOS e por que versões diferentes podem divergir
- Diagnosticar os problemas mais comuns com uma rotina metódica
- Consolidar um fluxo único que integra RetroArch, standalone e Steam Rom Manager
:::

## O mapa dos dados que importam

Tudo o que você acumula numa biblioteca de emulação se divide em três categorias com riscos diferentes. As **ROMs/ISOs** são grandes, mas substituíveis (se você tem o backup original do que possui). Os **saves e save states** são pequenos e irreproduzíveis — valem mais que qualquer ROM. As **BIOS, caches e configurações** estão no meio: reconstruíveis, mas caras de reconstruir.

Entender essa hierarquia muda o que você protege primeiro. Um save de 40 horas de um RPG não tem preço; o cache de shaders se refaz jogando de novo; a BIOS, se foi despejada do meu console, só se recupera a partir dele.

```terminal
$ du -sh ~/Emulation/{roms,bios,saves} 2>/dev/null
38G	~/Emulation/roms
64M	~/Emulation/bios
1,2G	~/Emulation/saves
```

Repare na proporção: as ROMs dominam o espaço, mas os saves, com seus 1,2 GB, são o ativo mais valioso por byte. Essa assimetria deve guiar o seu backup: saves e BIOS são prioridade máxima, ROMs dependem de quanto armazenamento você tem disponível para duplicar.

:::nota
**Save state** é um instantâneo do estado completo do emulador (memória, registradores, posição exata) gravado num arquivo. **Save nativo** (in-game) é o save que o jogo grava na memory card/memória interna do console emulado. O save state é mais poderoso (funciona em qualquer ponto), mas é mais frágil: depende da versão exata do core/emulador que o criou.
:::

## Backups com scripts reproduzíveis

A forma mais robusta de não perder nada é transformar o backup num comando único, versionado e executado regularmente. Um script com `rsync` para um destino externo (cartão SD, pendrive ou um servidor via SSH) resolve isso de forma idempotente: rodar de novo não duplica nada, apenas sincroniza o que mudou.

```terminal
$ cat ~/Emulation/tools/backup.sh
#!/bin/bash
DEST="/run/media/deck/BACKUP/emulation"
rsync -a --delete ~/Emulation/bios/   "$DEST/bios/"
rsync -a --delete ~/Emulation/saves/  "$DEST/saves/"
rsync -a          ~/Emulation/roms/   "$DEST/roms/"
echo "backup concluído em $DEST"
```

```terminal
$ bash ~/Emulation/tools/backup.sh
backup concluído em /run/media/deck/BACKUP/emulation
```

O `--delete` garante que arquivos removidos localmente também sumam do backup de BIOS/saves, mantendo-os espelhados. Nas ROMs, o `--delete` é omitido deliberadamente: se você apagar uma ROM grande por acidente, ela continua no backup, dando uma segunda chance.

:::dica
Coloque o script de backup num repositório Git (ou ao menos versionado) e rode-o após sessões longas de jogo. A disciplina do "backup após o progresso" é o que efetivamente protege — um script que ninguém executa não protege nada. Para dados que mudam pouco (BIOS), uma cópia mensal basta; para saves, após cada maratona.
:::

## Save states, BIOS e a armadilha da versão

Um save state é ligado à versão específica do emulador que o criou. Atualize o core (ou o emulador standalone) e, às vezes, os save states antigos param de carregar, porque o layout interno da memória emulada mudou. O save nativo, por outro lado, é portável e sobrevive a atualizações.

A estratégia sensata é **sempre salvar nativo** nos jogos que permitem, e usar save state só como conveniência de conveniência em pontos em que o jogo não deixa salvar. Assim, uma atualização que quebre save states não custa o progresso real.

```terminal
$ ls -lt ~/.var/app/org.libretro.RetroArch/config/retroarch/states/ | head -4
-rw-r--r-- 1 deck deck  5,2M jul 14 22:41 Zeldinha.state
-rw-r--r-- 1 deck deck  5,1M jul 14 21:58 Zeldinha.state.auto
-rw-r--r-- 1 deck deck  5,0M jul 14 21:12 Zeldinha.state
```

Observe o `.state.auto`: o RetroArch grava automaticamente um save state ao sair. Isso é conveniente, mas reforça a dica acima — o `.state.auto` é um save state como qualquer outro, suscetível à mesma fragilidade de versão.

:::atencao
Nunca trate save state como substituto do save nativo, especialmente em RPGs com dezenas de horas. O save state pode ficar incompatível após uma atualização do emulador; o save nativo é lido pelo próprio jogo e sobrevive a trocas de versão e até de emulador. A regra é simples: **save nativo sempre que o jogo permitir; save state só entre checkpoints.**
:::

## Rotina de diagnóstico dos problemas comuns

Quando algo para de funcionar, resistir à vontade de mexer em tudo de uma vez é o que separa o diagnóstico do desastre. Uma sequência fixa limita as variáveis e encontra o problema mais rápido.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -iE 'error|fail|could not|not found' | head -10
[ERROR] [Core]: Failed to load content.
[ERROR] [Core]: Could not read content file.
```

O log `--verbose` é a primeira ferramenta: em vez de adivinhar, ele aponta o erro exato (arquivo não lido, core não encontrado, BIOS faltando). A rotina recomendada, em ordem:

1. **Isolar**: o problema é de um jogo ou de todos? Teste outro título da mesma plataforma.
2. **Refazer o caminho**: BIOS no lugar certo? Nome da pasta de ROM correto? Arquivo íntegro (compare hash/size com o original)?
3. **Desfazer a variável nova**: atualizou o emulador? aplicar patch/upscale recente? Reverta uma coisa por vez.
4. **Ler o log** `--verbose` filtrando por `error|fail|not found`.

:::exemplo
Um save state que "sumiu" após atualizar o RetroArch quase sempre é a armadilha da versão descrita acima: o arquivo está lá, mas o core novo não o lê. A solução não é rebaixar tudo — é carregar o save nativo e criar um save state novo. Diagnosticar pelo log e pela hierarquia de riscos evita o trabalho de reinstalar o que não estava quebrado.
:::

## Um fluxo único, do ROM ao jogo

O capítulo inteiro se resume a um fluxo que você pode repetir para cada jogo novo que entra na biblioteca. Colocar a ROM na pasta certa, deixar o Steam Rom Manager detectar, aplicar o perfil de controle certo, conferir resolução por plataforma e, depois de jogar, fazer o backup dos saves.

```terminal
$ ls ~/Emulation/roms/snes/ | head
Chrono_Trigger.sfc
Final_Fantasy_VI.sfc
Super_Metroid.sfc
```

Daqui, a ROM corretamente posicionada flui para a detecção do SRM, vira atalho com arte, herda o core certo e está pronta no Game Mode. Fechar o ciclo com o backup é o que faz essa biblioteca durar — e é exatamente isso que separa uma pasta solta de ROMs de uma coleção de valor.

## Resumo

- Os dados se dividem em ROMs (substituíveis), saves/save states (irreproduzíveis) e BIOS/caches (reconstruíveis).
- Saves valem mais por byte que qualquer ROM; backup deles tem prioridade máxima.
- `rsync` num script versionado sincroniza BIOS/saves/ROMs de forma idempotente para destino externo.
- Save state é frágil à versão do emulador; save nativo é portável e deve ser o padrão sempre que possível.
- A rotina de diagnóstico em quatro passos (isolar, refazer caminho, desfazer variável, ler log) resolve a maioria dos casos.
- O fluxo completo é: posicionar ROM → detectar no SRM → aplicar controle → ajustar resolução → jogar → fazer backup.

## Exercícios

1. Liste o tamanho de `roms/`, `bios/` e `saves/` com `du -sh` e escreva, em uma frase, por que a hierarquia de risco inverte a ordem de tamanho.
2. Escreva um script `backup.sh` com `rsync` nos moldes do exemplo e execute-o contra um destino externo de teste.
3. Crie um save state num jogo de SNES e um save nativo, atualize (ou simule) a troca de core e verifique qual dos dois sobrevive.
4. Reproduza um erro proposital (ex.: BIOS em pasta errada) e resolva-o usando a rotina de quatro passos e o log `--verbose`.
5. **Desafio.** Monte o fluxo completo de ponta a ponta: adicione uma ROM nova, publique-a no Steam Rom Manager, aplique um perfil de controle, configure a resolução e rode o backup — depois documente, como uma receita replicável, os sete passos do processo.
