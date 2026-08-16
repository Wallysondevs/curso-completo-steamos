Um backup que ninguém testa não é um backup — é uma esperança. Esta seção fecha o capítulo com uma estratégia completa: a regra 3-2-1, a verificação por checksum, a automação com `cron` e a reciclagem de backups antigos. Ao final, você terá uma rotina que funciona sozinha e que você sabe reconstruir em minutos, não em pânico.

:::objetivos
- Aplicar a regra 3-2-1 na prática
- Verificar integridade de backups com checksums
- Automatizar backups com `cron` e scripts
- Implementar retenção e reciclagem de imagens
- Elaborar um plano de recuperação de desastres documentado

:::

## A regra 3-2-1, traduzida para o Deck

A regra clássica de backup diz: **3 cópias** dos dados, em **2 mídias diferentes**, com **1 delas fora do local**. No contexto do Deck, fica assim:

- **Cópia 1** — o disco interno (a fonte, o original).
- **Cópia 2** — um disco externo / NAS na sua casa, com a imagem ou o backup `rsync`.
- **Cópia 3** — uma mídia guardada **fora** (em outro cômodo, na casa de um parente, ou em nuvem), contra incêndio, furto ou surto de energia.

Para a maioria dos usuários, a cópia 3 mais barata é um segundo SSD/HD externo com a imagem do `home`, atualizado mensalmente. Cloud para saves (Steam Cloud, ou um bucket S3 para o resto) cobre bem a parte "fora do local" sem custo alto.

## Verificando integridade com checksum

Backup cego é inútil se a imagem corrompeu durante a cópia ou ficou meses num disco degradado. A solução é o `sha256sum`, calculado na criação e confirmado antes de qualquer restauração:

```terminal
## na criação da imagem
$ sha256sum ssd-deck.img.gz > ssd-deck.img.gz.sha256
$ cat ssd-deck.img.gz.sha256
9f8e7d6c5b4a39281706f5e4d3c2b1a0...  ssd-deck.img.gz

## meses depois, antes de restaurar
$ sha256sum -c ssd-deck.img.gz.sha256
ssd-deck.img.gz: OK
```

O `-c` lê o arquivo de hash, recalcula e compara. Se aparecer `OK`, a imagem está íntegra; se `FAILED`, está corrompida e não deve ser usada. Guarde os `.sha256` ao lado de cada imagem.

:::dica
O `sha256sum` lê o arquivo inteiro, o que leva tempo em imagens grandes. Para backups frequentes via `rsync`, use o próprio `rsync -c` (que compara checksums) em vez de recalcular tudo manualmente.
:::

## Automatizando com `cron`

A estratégia só se sustenta se rodar sozinha. Dois níveis de agendamento funcionam bem:

**Diário (seletivo, via rsync):** backups dos dados que mudam todo dia — saves e configurações.

**Mensal (imagem completa):** imagem `dd`/Clonezilla do disco, pois o custo é alto.

Um `crontab` de exemplo:

```terminal
$ crontab -l
0 3 * * * /home/deck/bin/backup-diario.sh >> /home/deck/logs/backup-diario.log 2>&1
0 4 1 * * /home/deck/bin/backup-mensal.sh >> /home/deck/logs/backup-mensal.log 2>&1
```

A primeira linha roda o backup seletivo às 3h todos os dias; a segunda roda a imagem completa às 4h do dia 1 de cada mês. O `>> log 2>&1` redireciona saída e erros para um arquivo, que você revisa de vez em quando.

O script mensal, além de gerar a imagem, calcula o hash e registra:

```bash
#!/usr/bin/env bash
DEST="/mnt/backup/mensal"
STAMP=$(date +%Y-%m-%d)
mkdir -p "$DEST/$STAMP"
dd if=/dev/nvme0n1 of="$DEST/$STAMP/ssd-deck.img.gz" bs=4M status=progress conv=fsync 2>&1
sha256sum "$DEST/$STAMP/ssd-deck.img.gz" > "$DEST/$STAMP/ssd-deck.img.gz.sha256"
```

:::atencao
Automatizar `dd` exige um cuidado extra: se o disco externo não estiver montado no caminho esperado, o `dd` pode escrever no lugar errado. O script deve **verificar o destino** (checar que `/mnt/backup` é realmente o disco externo, via `mountpoint` ou `df`) antes de escrever, e abortar se não estiver.
:::

## Retenção e reciclagem

Backups antigos ocupam espaço e devem ser reciclados com critério:

- **Backups diários**: mantenha os últimos 7 dias; apague os mais antigos.
- **Backups mensais**: mantenha 3–6 meses de histórico; apague além disso.
- **Uma imagem "marco"**: guarde uma imagem anual, ou de antes de mudanças grandes (troca de SSD, reinstalação), por tempo indeterminado.

A reciclagem deve ser **automatizada e cautelosa** — apagar backup por engano é tão ruim quanto não ter. Um comando seguro para apagar mensais antigos (com proteção de permanecer os 6 mais recentes):

```terminal
$ ls -1t /mnt/backup/mensal/ | tail -n +7 | xargs -I{} rm -rf /mnt/backup/mensal/{}
```

`ls -1t` lista por data (mais novo primeiro); `tail -n +7` pega da sétima linha em diante (os 6 mais recentes ficam); o `xargs` apaga os antigos. Teste o comando com `echo` (no lugar do `rm`) antes de rodar de verdade.

## O plano de recuperação documentado

Backup bom termina num plano escrito. Não precisa ser longo — precisa estar acessível quando você está com pressa e nervoso. Num arquivo `README-recuperacao.md` ao lado do backup, anote:

1. **Onde está cada backup** (disco, NAS, cloud) e como acessá-lo.
2. **Qual mídia bootar** para restaurar (o pendrive Ventoy + Clonezilla).
3. **Os comandos de restauração** prontos para copiar/colar (`dd`, Clonezilla, `rsync`).
4. **Como validar** que a restauração deu certo (checksum, lista de arquivos).
5. **Quem sabe do backup** — não adianta só você saber, se você não estiver por perto.

Teste o plano de verdade, uma vez por ano: finja que o SSD morreu e percorra o fluxo do zero. É o único teste que importa.

:::exemplo
Um cenário real: o SSD do Deck falhou de repente. Com a estratégia acima, a recuperação é: (1) comprar/instalar SSD novo; (2) boot pelo pendrive Ventoy; (3) restaurar a imagem mensal com Clonezilla (ou `dd`); (4) bootar, aplicar `rsync` do backup diário para trazer os saves da última semana; (5) redimensionar `home` se o disco é maior. Em menos de uma hora, você está jogando de novo sem perder nada além de, no pior caso, um dia de sessões.
:::

## Resumo

- A regra 3-2-1 mantém três cópias, em duas mídias, uma delas fora do local.
- `sha256sum -c` verifica a integridade da imagem antes de qualquer restauração.
- `cron` automatiza backup seletivo diário e imagem completa mensal.
- Scripts que escrevem imagem devem validar o destino antes de rodar.
- Retenção: 7 dias de diários, 6 meses de mensais, uma imagem-marco anual.
- Um plano de recuperação documentado e testado é o fecho de toda a estratégia.

## Exercícios

1. Liste seus três locais de cópia (interno, externo, fora do local) e identifique o que falta para completar o 3-2-1.
2. Gere o arquivo `.sha256` de um backup existente e verifique com `sha256sum -c`.
3. Escreva os dois scripts (diário e mensal) e registre-os no `cron`.
4. Implemente a retenção: teste o comando de reciclagem com `echo` e depois aplique de verdade.
5. **Desafio.** Escreva o `README-recuperacao.md` completo, realize o teste anual de recuperação do zero (simulando falha de SSD) e cronometre o tempo total até bootar o sistema restaurado.