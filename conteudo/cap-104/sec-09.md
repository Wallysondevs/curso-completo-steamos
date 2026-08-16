Todo o conteúdo deste capítulo — rotina, organização, limpeza, atualização, monitoramento, backup, armazenamento e diagnóstico — converge para uma única ideia: disciplina operacional. Não há comando mágico que mantenha um sistema saudável; há uma sequência de pequenas decisões consistentes, repetidas até virarem hábito. Esta seção fecha o capítulo (e o curso) transformando tudo o que veio antes num ritual que você executa sem pensar.

:::objetivos
- Consolidar os hábitos do capítulo numa checklist mestre acionável
- Automatizar o máximo possível para reduzir dependência da memória
- Documentar mudanças e decisões para o seu "eu do futuro"
- Integrar as ferramentas do capítulo num fluxo único e coerente
- Estabelecer a mentalidade de melhoria contínua, não de perfeição
:::

## A checklist mestre, em três níveis

Disciplina operacional não é fazer tudo sempre; é saber o que fazer em cada ritmo. O erro de quem tenta "ser organizado" é tratar toda tarefa com o mesmo peso, virar escravo da própria lista e abandoná-la em duas semanas. A solução é escalonar por frequência:

**Diário (30 segundos, enquanto espera o Deck ligar):** olhar o `df -h` e o último checkup. Se espaço estável e sem alertas, seguir a vida.

**Semanal (10 minutos, num dia fixo):** a checklist da seção 1 — espaço, logs, temperatura, atualizações, limpeza leve de cache (seção 3), backup incremental (seção 6).

**Mensal (30 minutos):** limpeza profunda de órfãos (seção 3), revisão de runtimes Flatpak, teste de restauração do backup (seção 6), revisão dos logs de alerta do monitoramento (seção 5), e reflexão sobre o que pode ser automatizado a seguir.

Cada nível depende do anterior estar fluido. Quem falha na rotina diária acumula surpresas na semanal; quem falha na semanal herda desastres na mensal.

## Automatizar para não depender de disciplina

A memória é um mecanismo de armazenamento falho. A disciplina é um recurso finito que se esgota em dias ruins. A automação é o único hábito que sobrevive a ambos — porque não depende de nenhum. Tudo o que pode ser agendado deve ser agendado.

| Tarefa | Mecanismo | Seção |
|---|---|---|
| Checkup semanal | systemd timer | 1 |
| Verificação horária de saúde | systemd timer | 5 |
| Snapshots de linha de tempo | snapper | 4, 6 |
| Backup incremental | script + timer | 6 |
| Limpeza de logs | `journalctl --vacuum` + timer | 1, 8 |

O padrão se repete: script fazendo o trabalho, timer agendando, `~/.config/systemd/user/` guardando a configuração. Dominar esse trio é o resumo técnico do capítulo.

```terminal
$ systemctl --user list-timers --no-pager
NEXT                        LEFT    LAST                PASSED  UNIT
Mon 2026-07-13 09:00:00 -03 13h     Mon 2026-07-06 09:00 6 days  checkup.timer
Mon 2026-07-13 12:00:00 -03 16h     Sun 2026-07-12 11:00 1h     health.timer
Mon 2026-07-13 03:00:00 -03 7h      Sat 2026-07-11 03:00 5 days backup.timer
```

Três timers ativos, cada um cumprindo seu ritmo, nenhum dependendo de você lembrar. Esse é o estado final desejado: o sistema cuidando de si, com você no papel de supervisor que só intervém nos alertas.

## Documentar para o seu "eu do futuro"

A automação cuida do presente; a documentação cuida do futuro. O maior erro de manutenção é fazer uma mudança hoje e, seis meses depois, não lembrar por quê. Um `~/lab/CHANGELOG.md` resolve isso com o mínimo de esforço:

```markdown
## 2026-07-12

- Atualizei o kernel para 6.9.4; benchmark de Cyberpunk caiu 4%, reverter para 6.9.3 (snapshot #14).
- Movei `compatdata` para o SD card via link simbólico (caminho novo em symlink-report).
- Limpei 11 GB de shadercache órfão (AppIDs listados abaixo).
- Configurei backup automático para SSD externo toda segunda às 3h.
```

Quatro linhas por mudança, três campos: o quê, quando e por quê. Não é um diário — é um registro de decisões que o seu eu futuro vai agradecer.

Consultar o histórico de decisões também deve ser rápido. Um `grep` pelo pacote, pelo jogo ou pela palavra-chave da mudança responde em segundos:

```terminal
$ grep -n -i kernel ~/lab/CHANGELOG.md
6:  - Atualizei o kernel para 6.9.4; benchmark de Cyberpunk caiu 4%, reverter para 6.9.3.
12:  - Kernel 6.9.3 estável após uma semana de uso normal, sem regressões.
$ grep -n -i compatdata ~/lab/CHANGELOG.md
8:  - Movei `compatdata` para o SD card via link simbólico.
```

O arquivo é texto puro, então qualquer ferramenta do terminal — `grep`, `tail`, `less` — funciona sobre ele sem configuração nenhuma. É a documentação mais barata que existe: um arquivo que você mesmo lê com as mesmas ferramentas que já domina.

:::dica
Regra prática: **se você teve que pensar para solucionar algo, vale uma linha no changelog.** A solução custou tempo e raciocínio; registrar o resultado custa 30 segundos e transforma esse custo em investimento que paga para sempre. O que você documenta você nunca precisa redescobrir.
:::

## Integrando tudo num fluxo único

Isoladamente, cada hábito deste capítulo é pequeno. Integrados, formam um sistema que se auto-sustenta. O fluxo completo, de trás para frente:

O **monitoramento** (seção 5) roda de hora em hora e registra métricas. Quando algo sai do normal, ele emite um alerta. O **diagnóstico** (seção 8) transforma o alerta numa causa. A **limpeza** (seção 3) e a **realocação** (seção 7) corrigem o problema de espaço. O **backup** (seção 6) garante que nada importante se perdeu no processo. A **atualização** (seção 4) mantém o sistema corrente sem medo de quebrar. E a **rotina** (seção 1) amarra tudo num calendário.

Nenhum pilar sustenta sozinho; juntos, formam a base de um Deck que se mantém saudável e rápido por anos.

```bash
#!/bin/bash
# ~/bin/supervisor — resumo mensal de tudo, em uma execução

echo "=== 1. ESPAÇO ==="; df -h / /home
echo "=== 2. ALERTAS DO MÊS ==="; grep -c ALERTA ~/lab/monitor/metrics.tsv
echo "=== 3. ÓRFÃOS DE PACOTE ==="; pacman -Qtd 2>/dev/null | wc -l
echo "=== 4. SNAPSHOTS ==="; sudo snapper -c root list 2>/dev/null | tail -5
echo "=== 5. ÚLTIMO BACKUP ==="; ls -lt ~/lab/monitor/ 2>/dev/null | head -2
```

Um comando, cinco dimensões da saúde do sistema, um relatório para consultar uma vez por mês.

```terminal
$ ~/bin/supervisor
=== 1. ESPAÇO ===
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p4  456G  310G  123G  72% /
/dev/mmcblk0p1  477G  120G  357G  25% /run/media/deck/sdcard
=== 2. ALERTAS DO MÊS ===
0
=== 3. ÓRFÃOS DE PACOTE ===
2
=== 4. SNAPSHOTS ===
 14 │ single│       │ Sat Jun 28 09:00:00 2026 │ number  │ timeline
 15 │ pre   │       │ Sat Jul 12 14:22:10 2026 │         │ pacman -Syu
 16 │ post  │     15│ Sat Jul 12 14:23:05 2026 │         │ pacman -Syu
=== 5. ÚLTIMO BACKUP ===
-rw-r--r-- 1 deck deck 1042 Jul 12 03:00 backup-2026-07-12.log
```

Leitura de 15 segundos: espaço controlado (72%), zero alertas no mês, dois pacotes órfãos para revisar, snapshots ativos e o último backup rodou na madrugada. Tudo saudável — exceto aqueles dois órfãos, que valem uma olhada na próxima limpeza mensal.

## Melhoria contínua, não perfeição

A armadilha final do "melhores práticas" é o perfeccionismo. Ninguém mantém uma rotina impecável por anos — e não precisa. O objetivo não é nunca falhar, é falhar e retomar rápido. Perdeu a limpeza semanal por três semanas? Retoma na quarta. Esqueceu o backup por um mês? Faz dois backups seguidos e segue.

A melhoria contínua tem um único mandamento: **deixar o sistema um pouco melhor do que estava ontem, na maior parte dos dias.** Com o tempo, esses "um pouco" compõem — e a soma é um Deck que, contrariando a entropia que consome todo sistema, continua tão organizado, rápido e saudável quanto no dia em que você o configurou.

:::nota
Este é o último capítulo do curso, mas não o fim da prática. As 104 seções que você percorreu — do kernel ao benchmarking, dos pacotes à segurança — foram projetadas para serem revistas conforme você encontra novos problemas. Guarde o material como referência viva, não como um livro que se fecha. Um sistema é um organismo; cuidar dele é um hábito contínuo, e agora você tem todas as ferramentas para isso.
:::

## Resumo

- Disciplina operacional é uma sequência de pequenas decisões consistentes, não um comando mágico.
- Escalone por ritmo: diário (30s), semanal (10min), mensal (30min); cada nível depende do anterior.
- Automatize tudo que puder com script + systemd timer; memória e disciplina falham, automação não.
- Documente mudanças no `~/lab/CHANGELOG.md`: o quê, quando e por quê.
- Cada pilar do capítulo integra os outros num ciclo de monitoramento → diagnóstico → correção → prevenção.
- Melhoria contínua, não perfeição: falhe, retome rápido, deixe o sistema um pouco melhor a cada dia.

## Exercícios

1. Monte sua checklist mestre pessoal em três níveis (diário/semanal/mensal), adaptando os comandos deste capítulo à sua realidade e ao tempo que você de fato tem.
2. Crie o arquivo `~/lab/CHANGELOG.md` e preencha a primeira entrada com as três mudanças mais importantes que você fez no seu Deck durante este curso (se não lembrar, comece a registrar de hoje em diante).
3. Liste seus timers ativos com `systemctl --user list-timers` e verifique se cada um corresponde a uma tarefa que ainda faz sentido. Remova os que ficaram obsoletos.
4. Escreva o script `~/bin/supervisor` (ou adapte o exemplo) e rode-o uma vez. Anote quais dimensões precisam de atenção no seu Deck hoje.
5. **Desafio.** Integre os exercícios dos capítulos anteriores: crie um único timer mensal que rode o `supervisor`, o backup, a limpeza de logs (`journalctl --vacuum-size=500M`) e a verificação de órfãos, registrando tudo num único relatório em `~/lab/relatorios/`. Execute e confira o relatório gerado.