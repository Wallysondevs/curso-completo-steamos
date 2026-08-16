Atualizar é uma das operações mais rotineiras do Linux e, paradoxalmente, uma das que mais quebram sistemas quando feita sem método. A diferença entre um usuário que atualiza com tranquilidade e um que teme cada `pacman -Syu` não é sorte: é ter um plano de rollback. Quem sabe voltar atrás atualiza sem medo; quem não sabe vive com um sistema desatualizado por receio de quebrá-lo.

:::objetivos
- Aplicar atualizações com um protocolo que antecede a falha
- Entender o que um snapshot de sistema oferece e como criá-lo no SteamOS
- Usar rollback para reverter uma atualização que deu errado
- Distinguir atualização de sistema, Flatpak e drivers com prioridades distintas
- Manter um registro do que foi atualizado e quando
:::

## O protocolo da atualização segura

O erro clássico é tratar a atualização como um único clique e torcer para dar certo. O protocolo correto é uma sequência: **primeiro saber sair, depois entrar**. Antes de atualizar, você garante que consegue voltar ao estado atual. Só então aplica a mudança e observa.

```terminal
$ sudo steamos-readonly disable
$ sudo pacman -Syu
:: Synchronizing package databases...
 core is up to date
 extra is up to date

:: Starting full system upgrade...
 there is nothing to do
```

No SteamOS, o fluxo tem uma etapa a mais: o sistema de arquivos raiz vem somente-leitura por padrão, protegendo os arquivos de sistema contra alterações acidentais. Antes de qualquer `pacman`, você precisa suspender essa proteção:

```terminal
$ sudo steamos-readonly disable
$ sudo pacman -Syu
$ sudo steamos-readonly enable
```

Desativar e reativar no mesmo ciclo é o hábito correto. Deixar o modo desabilitado "só por enquanto" é esquecer de reabilitá-lo — e aí qualquer pacote, script ou malware ganha acesso de escrita à raiz permanentemente.

:::perigo
O `steamos-readonly disable` remove uma camada de proteção importante do SteamOS. Reative-a imediatamente após a operação (`sudo steamos-readonly enable`). Um sistema que fica em modo leitura-gravação indefinidamente está exposto a alterações acidentais na raiz, que o SteamOS não foi desenhado para tolerar.
:::

## Snapshots: a rede de segurança do rollback

Um snapshot é um retrato do sistema num instante — geralmente feito rápido, graças ao sistema de arquivos Btrfs, que reutiliza blocos em vez de copiar tudo. No SteamOS, o Btrfs está presente na raiz, e você pode criar snapshots manuais antes de cada atualização.

```terminal
$ sudo btrfs subvolume list /
ID 256 gen 98214 top level 5 path @
ID 257 gen 98214 top level 5 path @home
ID 258 gen 98214 top level 5 path @root
$ sudo mkdir -p /mnt/snapshots
$ sudo mount -o subvol=/ /dev/nvme0n1p4 /mnt/snapshots
$ sudo btrfs subvolume snapshot -r /mnt/snapshots /mnt/snapshots/@pre-update-2026-07-12
Create a readonly snapshot of '/mnt/snapshots' in '/mnt/snapshots/@pre-update-2026-07-12'
```

O snapshot é criado com `-r` (read-only), o que o protege de alterações posteriores. O custo é mínimo porque o Btrfs usa copy-on-write: só os blocos que mudarem depois do snapshot é que ocupam espaço novo.

A criação manual é o mecanismo bruto. Ferramentas como `snapper` e `timeshift` automatizam o processo — criando um snapshot antes e depois de cada operação de pacote, e mantendo uma política de retenção (ex.: os últimos 5 diários, 4 semanais). A seção 6 deste capítulo aprofunda o backup; aqui o foco é o snapshot como pré-condição da atualização.

```terminal
$ sudo snapper -c root create --description "antes do pacman -Syu"
$ sudo snapper -c root list
 # │ Type   │ Pre # │ Date                    │ Description
───┼────────┼───────┼─────────────────────────┼──────────────────────────
 3 │ single │       │ Sat Jul 12 09:00:00 2026 │ antes do pacman -Syu
```

## Quando (e como) reverter

Se a atualização quebrou algo — um driver de vídeo sumiu, um serviço parou de subir — o rollback restaura o snapshot anterior. Como o snapshot é read-only e captura o estado exato, voltar é quase garantido.

```terminal
$ sudo snapper -c root list
 # │ Type  │ Pre # │ Date                     │ Description
───┼───────┼───────┼──────────────────────────┼──────────────────────────
 4 │ pre   │       │ Sat Jul 12 10:15:00 2026 │ pacman -Syu
 5 │ post  │     4 │ Sat Jul 12 10:16:20 2026 │ pacman -Syu
$ sudo snapper -c root rollback 3
Creating read-only snapshot of current system. (Snapshot 6.)
Creating writable snapshot of snapshot 3. (Snapshot 7.)
```

O `snapper rollback` transforma o snapshot antigo em uma nova raiz gravável, e na próxima reinicialização o sistema parte dele. O snapshot `3` (antes da atualização) vira o estado ativo, e o `6` guarda o estado quebrado para você inspecionar depois, se quiser.

Antes de reverter, pergunte: **o que exatamente quebrou?** Às vezes o problema não é o sistema inteiro, mas um pacote. Reverter tudo é a solução nuclear; reinstalar a versão anterior de um pacote específico pode ser suficiente:

```terminal
$ sudo pacman -U /var/cache/pacman/pkg/mesa-24.2.5-1-x86_64.pkg.tar.zst
```

É aqui que o cache preservado pelo `pacman -Sc` (seção 3) se paga: você tem a versão antiga pronta para reinstalar.

## Priorizando as atualizações

Nem toda atualização tem o mesmo peso. Tratar tudo como igual leva ao caos — ou a atualizar demais à noite antes de dormir, ou a nunca atualizar por medo. A prioridade prática no Steam Deck:

| Tipo | Frequência sugerida | Risco |
|---|---|---|
| Firmware/BIOS do hardware | Quando disponível | Baixo, difícil de reverter |
| Kernel e drivers gráficos | Acompanhar release estável | Médio — pode afetar desempenho |
| Pacotes do sistema (`pacman`) | Semanal | Médio |
| Flatpak (aplicativos) | Semanal | Baixo, isolado em sandbox |
| Proton/steam runtime | Automático pelo Steam | Baixo |

Os aplicativos Flatpak, por rodarem em sandbox com runtimes versionados, quebram menos o sistema. Os pacotes do systema, em contraste, mexem na raiz e merecem o snapshot antes. O kernel e drivers gráficos (Mesa) são os que mais afetam o desempenho de jogos — atualize com atenção e meça antes/depois com as técnicas do [capítulo de benchmarking](#/cap-099/sec-06).

## Um registro de atualizações

Manter um histórico do que foi atualizado e quando transforma o "o que mudou?" numa pergunta respondível. O próprio pacman guarda um log, mas ter o seu é mais legível:

```terminal
$ grep -E 'installed|upgraded' /var/log/pacman.log | tail -5
[2026-07-12T10:15:03-0300] [ALPM] upgraded mesa (1:24.2.4-1 -> 1:24.2.5-1)
[2026-07-12T10:15:03-0300] [ALPM] upgraded linux (6.9.3.arch1-1 -> 6.9.4.arch1-1)
[2026-07-12T10:15:04-0300] [ALPM] upgraded vim (9.1.0400-1 -> 9.1.0401-1)
```

O log do pacman é a fonte da verdade. Complemente com uma nota pessoal no seu checkup semanal (seção 1): "atualizei mesa, benchmark de Cyberpunk caiu 4%, reverti para 24.2.4". Essa linha crua vale ouro quando, meses depois, você tenta reproduzir uma regressão.

## Resumo

- Atualização segura começa com a possibilidade de voltar atrás, não com o comando de atualizar.
- No SteamOS, desative o modo somente-leitura, atualize e reative no mesmo ciclo.
- Snapshots Btrfs (manuais ou via snapper) são a rede de segurança do rollback.
- `snapper rollback` restaura um estado anterior e guarda o estado quebrado para inspeção.
- Nem toda atualização tem o mesmo peso: pacotes de sistema merecem mais cautela que Flatpak.
- `pacman.log` registra o histórico; complemente com notas pessoais sobre desempenho.

## Exercícios

1. Execute o fluxo completo de atualização no seu Deck, desativando e reativando `steamos-readonly` corretamente, e registre o resultado de `pacman -Syu`.
2. Crie um snapshot manual do Btrfs antes de qualquer mudança com os comandos `btrfs subvolume snapshot`. Confirme que ele aparece em `btrfs subvolume list`.
3. Se tiver `snapper` disponível, crie um snapshot descrito "antes de atualizar", rode uma atualização pequena e liste os snapshots para ver o par pré/pós.
4. Simule um rollback: crie um arquivo no `/etc`, tire um snapshot, apague o arquivo e restaure via rollback. Confirme que o arquivo voltou.
5. **Desafio.** Instale uma versão anterior de um pacote usando um `.pkg.tar.zst` do cache (`sudo pacman -U`). Depois, rode `pacman -Syu` de novo para voltar à versão atual e explique, em prosa, quando reinstalar um pacote é preferível a reverter o sistema inteiro.