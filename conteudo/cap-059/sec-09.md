Cada ferramenta deste capítulo resolve um pedaço do problema — Syncthing entre máquinas, Nextcloud para um servidor próprio, Dropbox para conveniência, rclone para qualquer nuvem. Mas sincronização não é backup, e ter três cópias espalhadas ainda pode deixar você na mão se nenhuma delas for restaurável. Esta seção fecha o raciocínio juntando tudo numa estratégia coerente, com o princípio 3-2-1 como espinha dorsal e um plano de recuperação que funciona de verdade.

:::objetivos
- Entender por que sincronização não substitui backup
- Aplicar a regra 3-2-1 ao ecossistema do Steam Deck
- Desenhar uma hierarquia de dados (irreversíveis vs regeneráveis)
- Construir e testar um procedimento de restauração
- Consolidar as ferramentas do capítulo num plano único
:::

## Sincronização não é backup

A confusão é a mais cara deste capítulo. Sincronização reflete mudanças entre locais **imediatamente**; backup preserva estados ao longo do tempo. A diferença se revela num cenário: um save corrompe, e o Syncthing (ou Dropbox, ou rclone sync) propaga a corrupção para todos os espelhos em segundos. Você tem três cópias idênticas do arquivo **corrompido** e nenhuma do arquivo bom.

```terminal
## Sincronização: todos os lados convergem para o mesmo estado (bom ou ruim)
## Backup: estados passados são retidos para restauração
$ ls ~/sync/saves/
save.srm
$ ls backup/2025-08-14/saves/
save.srm
$ ls backup/2025-08-15/saves/
save.srm    # versão de ontem preservada
```

O backup retém a versão de ontem. A sincronização, não. Para dados insubstituíveis — saves de dezenas de horas, documentos, fotos — a regra é: **sincronize para conveniência, faça backup para segurança**. Um não substitui o outro.

## A regra 3-2-1 no Steam Deck

O princípio 3-2-1 existe há décadas e continua sendo a régua mais útil para saber se seus dados estão protegidos:

- **3** cópias dos dados (a original + 2 backups);
- **2** tipos de mídia diferentes (ex.: SSD interno + HD externo/NAS);
- **1** cópia fora do local físico (off-site).

Transportado para o Steam Deck:

| Cópia | Onde | Mídia | Off-site? |
|---|---|---|---|
| Original | SSD interno do Deck | NVMe | Local |
| Backup 1 | NAS ou HD externo | HDD | Local (sua casa) |
| Backup 2 | Google Drive / S3 / outro servidor | Nuvem | Sim |

```terminal
## Visão consolidada: onde cada cópia vive
$ rclone lsd gdrive:Saves/          # cópia off-site
$ ls /media/deck/backup-disk/saves/ # Backup 1 (HD externo)
$ ls ~/sync/saves/                  # original
```

A cópia local no HD externo protege contra falha do SSD; a cópia off-site protege contra incêndio, roubo ou desastre que leve o Deck e o HD juntos. Se você só tem duas cópias e ambas estão na mesma casa, ainda está desprotegido contra o pior cenário.

## Hierarquia de dados: o que merece cada nível

Nem todo byte merece estar em três lugares. Classificar seus dados antes evita desperdiçar armazenamento e tempo.

**Irreversíveis (máxima proteção).** Saves de jogos sem nuvem, documentos pessoais, fotos, chaves e anotações. Merecem 3-2-1 completo, com histórico de versões.

**Regeneráveis (proteção leve).** ROMs, jogos instalados, ISOs, cache. Podem ser baixados de novo. Bastam uma cópia extra ou até nenhuma, se o tempo de re-download for aceitável.

**Descartáveis (nenhuma proteção).** Cache, miniaturas, temporários. Sincronizá-los é desperdício puro.

```terminal
## Pese o que você tem
$ du -sh ~/sync/saves ~/Emulation/roms ~/.cache 2>/dev/null
1.2G    /home/deck/sync/saves
412G    /home/deck/Emulation/roms
2.1G    /home/deck/.cache
```

Repare na configuração de exemplo: 1,2 GB de saves merecem backup em três lugares; 412 GB de ROMs provavelmente não (são regeneráveis — a não ser que você tenha conjuntos raros ou modificados); 2,1 GB de cache, certamente não.

:::dica
A pergunta que resume tudo: **"se eu perder isso, consigo recuperar de outra forma?".** Se a resposta é "sim, baixo de novo", o dado é regenerável e não precisa de 3-2-1. Se é "não, perdido para sempre", ele é irreversível e merece proteção máxima.
:::

## Procedimento de restauração (e por que testá-lo)

Um backup que não foi testado é uma esperança, não um backup. Você descobre que a restauração falha exatamente no pior momento: quando precisa dela. Por isso o plano precisa incluir um teste periódico.

Um procedimento mínimo de restauração para saves:

```terminal
## 1. Simule a perda: mova a pasta original para um lugar temporário
$ mv ~/sync/saves ~/sync/saves.perdido

## 2. Restaure a partir da nuvem
$ rclone copy gdrive:Saves/ ~/sync/saves/ --progress
Transferred:       1.234 MiB / 1.234 MiB, 100%
Transferred:           342 / 342, 100%

## 3. Verifique a integridade
$ rclone check gdrive:Saves/ ~/sync/saves/
2025/08/15 14:00:01 NOTICE: Saves: 342 hashes checked, 0 differ

## 4. Confirme que os arquivos abrem (não apenas que existem)
$ file ~/sync/saves/zelda.srm
zelda.srm: data
```

O passo 4 é o mais esquecido: `rclone check` garante que os **bytes** são idênticos, mas não que o arquivo é **utilizável**. Um save corrompido na origem será sincronizado corrompido para o backup, e o check passará com zero diferenças. Para ter confiança real, abra periodicamente um save restaurado num emulador e confirme que ele carrega.

:::atencao
Teste de restauração deve ser feito de verdade, não mentalmente. Agende no calendário — por exemplo, a cada 3 meses — e execute o procedimento acima do zero, incluindo tentar abrir um save restaurado de verdade.
:::

## Consolidando o capítulo num plano único

O que você aprendeu nas nove seções pode ser resumido num plano de camadas que aproveita cada ferramenta no que ela faz de melhor:

1. **Syncthing** roda em segundo plano (via systemd, seção 8) espelhando saves entre o Deck e o seu PC/NAS em modo jogo.
2. **rclone sync** (timer diário) empurra saves para a nuvem off-site (Google Drive/S3), garantindo a cópia fora do local.
3. **HD externo / NAS** recebe um backup periódico completo com histórico (usando versionamento do Syncthing ou `rclone copy` para uma pasta com data).
4. **Dropbox/Nextcloud** entram se você já vive nesse ecossistema, tratados como conveniência, não como backup primário.

```terminal
## Um "painel de saúde" do seu plano, tudo num só comando
$ systemctl --user list-timers --no-pager | grep -E 'sync|save'
$ syncthing cli show system 2>/dev/null || curl -s http://127.0.0.1:8384/rest/system/status | python3 -c "import sys,json;print(json.load(sys.stdin)['uptime'])"
$ rclone about gdrive: | grep -E 'Used|Free'
```

O valor não está em nenhuma ferramenta isolada, mas na sobreposição: se o SSD morrer, o Syncthing tem cópia no NAS; se a casa pegar fogo, o rclone guardou tudo off-site; se a nuvem te bloquear, você ainda tem o HD local. Três camadas, três tipos de falha cobertos.

:::exemplo
Um usuário típico deste curso: 300 GB de ROMs (regeneráveis), 2 GB de saves (irreversíveis) e 500 MB de documentos. O plano dele: Syncthing espelha os 2 GB de saves para o PC da casa continuamente; um timer diário de rclone sobe saves + documentos para o Google Drive (off-site); as ROMs vivem num HD externo de 1 TB, sem redundância extra, porque são re-baixáveis. Custo de nuvem: alguns GB. Proteção: completa para o que importa, zero desperdício para o que não importa.
:::

## Resumo

- Sincronização reflete o estado atual; backup preserva estados passados — são coisas diferentes.
- A regra 3-2-1: 3 cópias, 2 mídias, 1 off-site. É a régua de ouro da proteção de dados.
- Classifique dados em irreversíveis (3-2-1), regeneráveis (1 cópia extra) e descartáveis (nenhuma).
- Teste a restauração de verdade, incluindo abrir um save restaurado, a cada poucos meses.
- Camadas se complementam: Syncthing (local), rclone (off-site), HD/NAS (mídia física distinta).

## Exercícios

1. Faça a contagem 3-2-1 dos seus dados atuais: quantas cópias, em quantas mídias, e existe off-site? Registre as lacunas.
2. Classifique três pastas suas como irreversível, regenerável ou descartável, usando a pergunta "consigo recuperar de outra forma?".
3. Implemente um timer diário de `rclone sync` para a nuvem como cópia off-site (ou adapte o timer da seção 8).
4. Execute o procedimento de restauração completo desta seção, do `mv` ao `rclone check`, e abra um save restaurado de verdade.
5. **Desafio.** Desenhe e documente um teste de recuperação de desastre de ponta a ponta: assuma SSD morto, restaure a partir do NAS **e** da nuvem em um novo Deck (ou numa VM), e registre o tempo total e os passos que falharam ou poderiam ser melhorados.