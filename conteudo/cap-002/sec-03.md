A forma como um sistema se atualiza diz mais sobre sua filosofia do que a escolha do gerenciador de pacotes. O SteamOS não faz atualização incremental no lugar, como um `pacman -Syu` faria no Arch. Ele troca a partição de sistema inteira por uma nova, num esquema atômico A/B que permite reverter o update com um reboot. Esta seção explica esse mecanismo e como ele difere de tudo o que você já usou em distribuições tradicionais.

:::objetivos
- Entender o conceito de atualização atômica A/B
- Visualizar com `lsblk` as partições duplicadas
- Diferenciar atualização atômica de atualização incremental
- Compreender o papel do `rauc` como framework de update
:::

## O problema do update incremental

Em um Linux tradicional, atualizar significa executar um comando como `apt upgrade` ou `dnf update`. Cada pacote baixado é desempacotado no lugar, sobreescrevendo arquivos anteriores. Se a energia cai no meio, ou se um pacote corrompe o `/etc`, o sistema pode parar de dar boot.

Em um console de jogos, esse risco é inaceitável. Um Steam Deck que não liga depois de uma atualização vira uma caixa de devolução — e a Valve não tem um técnico de plantão na casa do usuário. A solução: nunca modificar o sistema *in-place*. Atualizar é trocar o sistema como quem troca uma bateria.

O SteamOS implementa isso com o modelo A/B, herdado do Android (ChromeOS e Android têm esquemas similares). Você não "atualiza" o sistema ativo; você grava um sistema novo na partição de reserva e, no reboot, aponta o boot para ela.

```terminal
$ lsblk -o NAME,SIZE,FSTYPE,LABEL | grep rootfs
├─nvme0n1p5   5G ext4    rootfs-A
├─nvme0n1p6   5G ext4    rootfs-B
```

Cada `rootfs` é um sistema completo: kernel, `/usr`, `/etc`, tudo. Num momento, `A` está ativa e `B` é a reserva. A atualização grava em `B`, verifica que a gravação deu certo, e troca o ponteiro do boot. No próximo reboot, `B` passa a ser o sistema ativo e `A` vira a reserva.

## O que acontece durante uma atualização

O processo de update no SteamOS segue etapas bem definidas. Você pode dispará-lo manualmente com `steamos-update checkout`, que verifica se há uma nova build disponível nos servidores da Valve.

```terminal
$ steamos-update checkout
Checking for updates...
Build 20241015.1 is available (current: 20240926.1)
Downloading update (1254/1254 MB)...
Verifying checksum...
Writing update to inactive slot...
Update written to rootfs-B. Reboot to switch.
```

O fluxo é: baixar a build, verificar a integridade (checksum), gravar na partição inativa, e pedir o reboot. Em nenhum momento o sistema ativo foi modificado. Se o download falhar, você continua na build atual como se nada tivesse acontecido. Se a gravação falhar, a partição ativa continua intacta.

:::info
O comando `steamos-update checkout` corresponde ao que o Modo Jogo faz quando você aceita uma atualização pelo menu de Configurações. A interface do Steam aciona exatamente o mesmo mecanismo; ela não inventa um caminho alternativo.
:::

Na prática, a experiência no Modo Jogo é: aparece um aviso, você clica em "Atualizar", o sistema baixa a build em segundo plano enquanto você joga, e depois pede para reiniciar. O reboot é rápido — não há "instalação" demorada depois de reiniciar, porque a nova partição já está pronta. É só trocar o ponteiro e carregar o kernel.

## O que é o rauc

Por trás das cenas, o framework que gerencia as partições A/B e a troca de boot é o **RAUC** (*Robust Auto-Update Controller*). Ele é um projeto de código aberto, usado também em sistemas embarcados industriais, que se integra ao `systemd` via `systemd-boot` (o gerenciador de boot do SteamOS, em vez do GRUB tradicional do Arch).

O RAUC mantém um arquivo de estado que diz qual slot (A ou B) é o ativo, qual é o reserva e se o último boot deu certo.

```terminal
$ rauc status
=== System Info ===
Compatible:     steamos
Variant:        SteamOS 3.6
Booted from:    A (rootfs.0)

=== Slot States ===
  rootfs.0 (A): class=rootfs, device=/dev/nvme0n1p5, type=ext4, state=booted
      bootname: A
      boot status: good

  rootfs.1 (B): class=rootfs, device=/dev/nvme0n1p6, type=ext4, state=inactive
      bootname: B
      boot status: good
```

Aqui se vê que `A` é o slot ativo (estado `booted`) e `B` está inativo aguardando o próximo update. O campo `boot status: good` é importante: se um boot falhar por qualquer motivo, o RAUC pode marcar o status como `bad` e, num reboot, voltar automaticamente para o slot que funcionava.

## Rollback embutido

A cereja do bolo das atualizações atômicas é o rollback: se a nova build quebrar alguma coisa — Wi-Fi, controle, desempenho — você pode voltar para a build anterior sem reinstalar nada, sem baixar imagem de recuperação.

O procedimento é simples: ligue o Deck segurando o botão `[[...]]` (os três pontinhos) e o botão de diminuir volume ao mesmo tempo. Isso entra no menu de boot, onde você pode escolher manualmente a partição anterior.

```terminal
## Tela de boot do Steam Deck
## Opções disponíveis:
##   1. SteamOS (atual)
##   2. SteamOS (anterior)
## O item 2 corresponde à partição que estava ativa antes do último update.
```

Isso só funciona porque a build antiga nunca foi apagada nem modificada. Ela ficou lá, íntegra, esperando ser acionada. Em um sistema com atualização incremental (como o Arch ou Ubuntu padrão), desfazer um update quebrado exige downgrade manual de pacotes, o que pode ser inviável se o sistema nem dá boot.

:::dica
Se você está testando algo experimental e quer garantir que pode voltar, confira com `rauc status` qual é o seu slot ativo ANTES de rodar o update. Anote. Se algo der errado, você sabe exatamente qual partição escolher no menu de boot.
:::

## Atômico vs "parece atômico"

Vale distinguir "atômico" de "transacional". O Arch (via `pacman`) e o Debian (via `apt`) são transacionais em algum grau — se um pacote falha, o `dpkg` sabe evitar um estado meio-instalado. Mas eles ainda escrevem arquivo por arquivo no sistema ativo. Se o processo é interrompido (energia cai, bateria acaba), o resultado é o famoso "sistema quebrado".

No SteamOS, a atomicidade é de verdade: a unidade de mudança é a partição inteira. Ou ela é gravada por completo e o boot aponta para ela — ou nada muda. Não existe "estado intermediário".

```terminal
$ rauc status
## Durante um update, o slot inativo fica com state=installing
## Após a gravação bem-sucedida, state=inactive com boot status=good
## Se a gravação falhar, o slot inativo nem muda de estado
```

Essa é a diferença entre "tentamos atualizar e pode ter dado certo" e "a atualização deu certo ou nem começou".

## Resumo

- O SteamOS usa atualização atômica A/B: grava o sistema novo na partição inativa e troca o boot no reboot.
- O esquema A/B elimina o risco de um update incremental corromper o sistema em execução.
- `steamos-update checkout` dispara manualmente a verificação e o download da nova build.
- O framework `rauc` gerencia os slots A/B, o status de cada boot e a possibilidade de rollback.
- `rauc status` mostra qual slot está ativo, qual é a reserva e o estado de cada um.
- O rollback é trivial: segure `[[...]]` + volume baixo no boot e escolha a partição anterior.

## Exercícios

1. Execute `lsblk -o NAME,SIZE,FSTYPE,LABEL | grep rootfs` e anote os tamanhos. Por que duas partições de 5 GB para o sistema?
2. Rode `rauc status` e identifique: qual slot está ativo? Qual está inativo? O boot status de ambos é `good`?
3. Dispare `steamos-update checkout` (se houver build nova disponível) e anote a saída. Observe se o sistema pede reboot. (Se não houver build nova, o comando vai informar que a build atual já é a mais recente — anote essa saída também.)
4. Compare este modelo com o que você conhece de outras distribuições. Qual é a diferença prática entre "atualizar no lugar" e "trocar a partição inteira" no que diz respeito a uma queda de energia durante o update?
5. **Desafio.** Com `rauc status`, anote o slot ativo. Depois reinicie e entre no menu de boot segurando `[[...]]` + volume baixo. Escolha manualmente o slot oposto ao ativo e inicialize. Confirme com `rauc status` que o sistema está rodando no slot que você escolheu. Depois reinicie normalmente e veja se ele volta ao slot original.