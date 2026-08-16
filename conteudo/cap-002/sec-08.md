Até aqui, vimos o mecanismo A/B por fora e o `rauc` por dentro. Falta dominar a ferramenta que põe tudo ao seu alcance: o `steamos-update`, o comando que verifica, baixa e aplica atualizações, e o processo de rollback que ele viabiliza. Esta seção ensina a operar o ciclo completo de atualização e reversão pela linha de comando, com a confiança de quem sabe o que cada etapa faz.

:::objetivos
- Operar o ciclo completo de atualização com `steamos-update`
- Interpretar a saída do `steamos-update checkout`
- Realizar um rollback para a partição anterior
- Diferenciar atualização do sistema de atualização de aplicativos Flatpak
:::

## O steamos-update e seus subcomandos

O `steamos-update` é o front-end de linha de comando do mecanismo A/B. Ele encapsula a verificação de versão, o download e a gravação na partição inativa. Seus subcomandos principais:

| Subcomando | O que faz |
|---|---|
| `steamos-update check` | Verifica se há build nova, sem baixar |
| `steamos-update checkout` | Baixa e grava a build nova na partição inativa |
| `steamos-update status` | Mostra o estado atual da atualização |

A diferença entre `check` e `checkout` é o que mais confunde: `check` só pergunta ao servidor; `checkout` efetivamente faz a troca de conteúdo.

```terminal
$ steamos-update check
Checking for updates...
Current build: 20240926.1
Latest build:  20240926.1
You are up to date.
```

Com o sistema atualizado, `check` informa que a build atual é igual à mais recente. Note que aqui não houve download nem modificação — apenas uma consulta.

## Aplicando uma atualização

Quando existe build nova, o fluxo completo é acionado pelo `checkout`:

```terminal
$ steamos-update checkout
Checking for updates...
Build 20241015.1 is available (current: 20240926.1)
Downloading update (1254/1254 MB)...
Verifying checksum...
Writing update to inactive slot...
Updating bootloader configuration...
Update written to rootfs-B. Reboot to switch.
```

Cada linha merece leitura:

- **`Downloading update`** — baixa a imagem da build (mais de 1 GB), já no formato a ser gravado.
- **`Verifying checksum`** — confirma a integridade do download com um hash; uma falha aqui cancela tudo sem risco.
- **`Writing update to inactive slot`** — grava na partição que **não** está ativa. O sistema em uso segue intocado.
- **`Updating bootloader configuration`** — ajusta o `systemd-boot` para apontar para a nova partição no próximo boot.
- **`Reboot to switch`** — a troca só se concretiza com o reinício.

A atualização não "instala" nada no sistema ativo. O que você tem em mãos ao final é uma partição B pronta e um bootloader configurado para usá-la.

:::dica
Antes de qualquer `checkout`, rode `rauc status` e `steamos-update status` para registrar qual build e qual partição você tem. Se algo der errado depois, esse registro é o seu mapa para o rollback.
:::

## Revertendo com rollback

O rollback é a contrapartida da atualização atômica. Se a build nova apresentar problema — som sem sair, jogo não abre, Wi-Fi instável — você volta para a anterior sem reinstalar nada.

O caminho mais direto é pelo menu de boot: desligue o Deck, depois ligue segurando `[[...]]` (os três pontinhos) + botão de diminuir volume. No menu, você escolhe "SteamOS (anterior)".

```terminal
## Menu de boot do Steam Deck (Boot Manager)
##  1. SteamOS (atual)
##  2. SteamOS (anterior)
## Escolha 2 para dar boot pela partição que estava ativa antes do último update.
```

Ao escolher a opção "anterior", o `systemd-boot` inicia pela partição de reserva — aquela que rodava bem antes do update. Nada é apagado; a build nova continua na partição atual, pronta para uma futura troca.

Também dá para reverter pela linha de comando, com o `rauc`:

```terminal
$ sudo rauc status mark-bad
$ sudo reboot
```

O `rauc status mark-bad` marca o slot atual como defeituoso. No próximo boot, o `systemd-boot` (guiado pelo RAUC) escolhe o slot com status `good`, que é o anterior. É o mesmo efeito do menu de boot, mas disparado por comando.

:::atencao
`rauc status mark-bad` é destrutivo para o slot **atual**: você está declarando que a build em uso é ruim. Só use quando tiver certeza de que quer abandonar a build atual e voltar. Para um teste temporário do build anterior, prefira o menu de boot, que não marca status nenhum.
:::

## Atualização do sistema vs Flatpak

Um erro comum é achar que `steamos-update` também atualiza seus aplicativos. Não atualiza. O `steamos-update` cuida do **sistema** (a imagem A/B). Seus aplicativos Flatpak têm ciclo próprio.

```terminal
$ flatpak update
Looking for updates…
 1. [✓] org.mozilla.firefox     stable    flathub
 2. [✓] org.videolan.VLC        stable    flathub

Updates complete.
```

Os dois ciclos são independentes: o SteamOS pode estar desatualizado enquanto seus Flatpaks estão em dia, e vice-versa. Isso é consequência direta da arquitetura — sistema e apps vivem em lugares separados e se atualizam em tempos separados.

| O quê | Como atualiza | Onde vive |
|---|---|---|
| Sistema (SteamOS) | `steamos-update checkout` (A/B) | `rootfs-A`/`rootfs-B` |
| Apps Flatpak | `flatpak update` | `/home` e `/var/lib/flatpak` |
| Jogos da Steam | Pelo cliente Steam | `/home/deck/.local/share/Steam` |

Cada camada tem sua própria cadência. Saber qual comando atualiza qual camada evita a confusão de "atualizei e nada mudou" quando, na verdade, o que você queria era atualizar os apps.

## O ciclo completo em um fluxo

Junte tudo num cenário real. Você quer atualizar o sistema, verificar os apps, e — se algo der errado — poder voltar.

```terminal
## 1. Antes de tudo, registre o estado atual
$ rauc status | head -8
=== System Info ===
Booted from:    A (rootfs.0)

## 2. Atualize o sistema
$ steamos-update checkout
Build 20241015.1 is available (current: 20240926.1)
Downloading update (1254/1254 MB)...
Writing update to inactive slot...
Update written to rootfs-B. Reboot to switch.
$ sudo reboot

## 3. Após reiniciar, confirme a nova build
$ cat /etc/os-release | grep BUILD_ID
BUILD_ID=20241015.1

## 4. Atualize os apps, em camada separada
$ flatpak update
Updates complete.

## 5. Se algo quebrou, marque o slot atual como ruim e volte
$ sudo rauc status mark-bad
$ sudo reboot
```

Esse fluxo de cinco passos é o nó de tudo o que este capítulo ensinou: imutabilidade, A/B, `rauc` e rollback operando juntos numa rotina de manutenção segura.

## Resumo

- `steamos-update check` só consulta; `steamos-update checkout` baixa e grava a build na partição inativa.
- A troca de partição só acontece no reboot, mantendo o sistema ativo intacto durante o download.
- O rollback se dá pelo menu de boot (`[[...]]` + volume baixo) ou por `sudo rauc status mark-bad` + reboot.
- `rauc status mark-bad` é destrutivo para o slot atual; para um teste temporário, prefira o menu de boot.
- Sistema, Flatpaks e jogos Steam são três camadas com ciclos de atualização independentes.
- Registrar `rauc status` antes de atualizar é o mapa que garante um rollback consciente.

## Exercícios

1. Rode `steamos-update check` e `steamos-update status`. Anote a build atual e a disponível. O que cada comando faz de diferente?
2. Execute `rauc status` e registre qual slot está ativo e o `boot status` de cada um. Escreva uma frase explicando por que esse registro importa antes de um update.
3. Rode `flatpak update` e observe a saída. Compare com o `steamos-update checkout`: por que são processos separados?
4. Leia o `/etc/os-release` com `cat` e confirme o `BUILD_ID` atual. Depois explique como esse número mudaria após um `checkout` + reboot.
5. **Desafio.** Simule um rollback sem estragar nada: entre no menu de boot (`[[...]]` + volume baixo), observe as opções "atual" e "anterior" e saia sem escolher nada (ou volte ao menu principal). Explique, com base no `rauc status` que você leu, qual partição cada opção iniciaria e por que o menu não apaga a build atual.