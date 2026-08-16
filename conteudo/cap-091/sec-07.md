Reinstalar o SteamOS sem perder os jogos é a promessa do ícone azul, e na maioria dos casos ela se cumpre. A operação é substancialmente mais rápida e menos traumática que a reimagem porque não recria partições: ela detecta o layout A/B existente, identifica qual raiz está ociosa, grava a nova imagem ali e atualiza o bootloader para apontar para ela. Seus arquivos em `/home` ficam exatamente onde estavam. Mas "tentar preservar" não é "garantir preservar" — e esta seção explica os limites dessa garantia.

:::objetivos
- Executar uma reinstalação do SteamOS preservando `/home`
- Entender como o layout A/B permite a reinstalação não destrutiva
- Identificar quando a reinstalação é suficiente e quando a reimagem é inevitável
- Diagnosticar e contornar falhas comuns da reinstalação
:::

## Quando escolher Reinstall em vez de Reimage

O ícone azul é a resposta para uma classe específica de problemas: o sistema corrompeu, mas o disco está íntegro. Se as partições existem, a GPT está saudável e `/home` tem sistema de arquivos consistente, a reinstalação resolve sem destruir.

Cenários típicos para Reinstall:

- Atualização de sistema falhou e o Deck não inicia, mas o `fsck` mostra `/home` limpo.
- Drivers ou módulos do kernel foram corrompidos por experimentos com pacotes de sistema.
- Regressão: um update quebrou Wi-Fi, som ou desempenho e você quer "voltar" à imagem limpa do recovery.
- Deck funcionando, mas comportamento instável que sobrevive a restarts e `steamos-update check`.

Cenários que pedem Reimage, não Reinstall:

- Tabela de partições foi danificada por instalador de Windows ou particionamento manual.
- `/home` está corrompida e `fsck` não consegue reparar.
- Você instalou outro sistema operacional e quer removê-lo completamente.
- O Deck será vendido, emprestado ou enviado para RMA.

```terminal
$ sudo fsck -n /dev/nvme0n1p8
fsck from util-linux 2.39.3
e2fsck 1.47.0 (5-Feb-2023)
/home: clean, 184726/58982400 files, 8945621/235903744 blocks
```

Um `fsck` limpo em `/home` antes de escolher Reinstall é o melhor indicador de que a operação vai funcionar. Se o `fsck` reportar erros que não se resolvem com `fsck -y`, pense em backup e reimagem.

## O que o script faz com o layout A/B

O coração da reinstalação é o particionamento A/B. O Deck tem duas partições raiz de 5 GiB cada: `rootfs-A` e `rootfs-B`. Apenas uma está ativa de cada vez. O script `steamos-reinstall`:

1. **Identifica a raiz ativa:** lê a entrada atual do bootloader (`systemd-boot`) para saber qual partição está em uso (`A` ou `B`).
2. **Grava a nova imagem na raiz inativa:** copia o SteamOS limpo para a partição que não está sendo usada — se `A` está ativa, grava em `B`, e vice-versa.
3. **Atualiza EFI:** copia os novos binários do bootloader para a partição EFI correspondente.
4. **Troca a raiz ativa:** atualiza a configuração do bootloader para apontar para a raiz que acabou de ser gravada.
5. **Reinicia:** o Deck sobe com o sistema novo, e a partição que antes era a ativa vira a inativa (pronta para a próxima atualização).

```terminal
## Simulação da lógica de detecção de slot:
$ sudo bootctl status
System:
     Firmware: UEFI 2.70
  Secure Boot: disabled
   TPM2 Usage: no

Current Boot Loader:
      Product: systemd-boot 255.4-1-arch
     Features: ✓ Boot counting
               ✓ Boot loader random seed manipulation
          ESP: /dev/nvme0n1p6
         File: /EFI/SteamOS/steamos-A.efi
```

A linha `File: /EFI/SteamOS/steamos-A.efi` revela que o slot A está ativo. O script de reinstalação grava no slot B e atualiza essa entrada.

:::nota
A reinstalação é essencialmente o mesmo mecanismo de uma atualização de sistema normal do SteamOS — a diferença é a origem dos dados. Numa atualização normal, a Valve envia deltas pela internet; na reinstalação, a imagem completa vem do pendrive. O destino (a raiz inativa) é o mesmo.
:::

## O passo a passo da reinstalação

1. Na área de trabalho de recovery, toque em **Reinstall SteamOS**.
2. Leia a caixa de diálogo: "This will reinstall SteamOS on your Steam Deck. We will attempt to preserve your games and personal content."
3. Toque em **Proceed**.
4. Aguarde. Diferentemente da reimagem, a reinstalação normalmente mostra alguma atividade — o LED do SSD pisca e, às vezes, uma barra de progresso real aparece.
5. Quando a caixa de diálogo "Process complete" surgir, toque em **Proceed** para reiniciar.
6. O Deck reinicia no sistema reinstalado.

```terminal
## Boas práticas: antes de tocar em Proceed, abra o Terminal:
$ sudo fsck -n /dev/nvme0n1p8
$ sudo lsblk -o NAME,SIZE,LABEL,MOUNTPOINTS /dev/nvme0n1
$ sudo df -h /dev/nvme0n1p8
```

Verificar que `/home` está montável e com espaço livre é uma rede de segurança que custa 30 segundos.

:::atencao
A reinstalação preserva `/home`, mas não preserva pacotes instalados manualmente na raiz do sistema (fora do Flatpak). Se você desabilitou o modo read-only e instalou pacotes com `pacman`, esses pacotes **serão perdidos** — porque a raiz do sistema é regravada. Apenas Flatpaks em `~/.var` e arquivos em `/home` sobrevivem.
:::

## Quando a preservação falha

A Valve usa o verbo "attempt" (tentar) por razões jurídicas e técnicas. A reinstalação pode falhar em preservar dados em situações específicas:

- **`/home` corrompida:** se o sistema de arquivos tem erros que impedem a montagem, o script pode falhar ou, pior, montar parcialmente e perder arquivos.
- **Partições `/home` modificadas:** se você moveu `/home` para outro disco, redimensionou manualmente ou alterou o tipo de sistema de arquivos (de ext4 para btrfs), o script não reconhece e pode recriar a partição.
- **Espaço insuficiente:** se `/home` está 100% cheia, o script pode não conseguir escrever arquivos temporários e abortar.
- **Bootloader customizado:** se você instalou GRUB, rEFInd ou outro bootloader, a reinstalação pode sobrescrevê-lo com `systemd-boot` da Valve.

```terminal
## Verifique espaço antes de reinstalar, no Terminal:
$ sudo df -h /dev/nvme0n1p8
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p8  938G  765G  173G  82% /home
```

173 GiB livres: sem problemas. Mas 5 GiB livres com 938 GiB de capacidade total é sinal de que o disco está quase cheio — libere espaço antes de tentar reinstalar.

:::dica
Se você personalizou o bootloader e quer mantê-lo, a reinstalação não é a ferramenta certa. Nesse caso, use o Terminal with repair tools: monte as partições manualmente, faça `rsync` dos arquivos de sistema da imagem e atualize seu bootloader manualmente.
:::

## Depois da reinstalação

Ao contrário da reimagem, a reinstalação não dispara o OOBE. O Deck sobe direto no Modo Jogo ou no Modo Desktop — exatamente onde estava antes, com a sessão e as configurações intactas. Suas redes Wi-Fi, senhas, configurações de tela e temas sobrevivem.

```terminal
$ cat /etc/os-release | grep VERSION
VERSION="3.6.20"
$ systemctl status --no-pager | head -3
● steamdeck
    State: running
    Units: 312 loaded (incl. loaded aliases)
```

A versão do sistema será a da imagem de recovery que você usou, que pode ser diferente da que estava antes — para melhor (se você estava numa versão antiga com problemas) ou potencialmente para pior (se a imagem de recovery está desatualizada em relação à última estável). Atualize o sistema via Modo Jogo > Configurações > Sistema > Verificar atualizações.

## Resumo

- Reinstall reescreve o sistema no slot A/B inativo, mantendo `/home` intacta e sem disparar o OOBE.
- É a ferramenta para sistema corrompido com partições saudáveis; se a GPT foi danificada, vá de Reimage.
- O script detecta o slot ativo via `bootctl`, grava no slot oposto e atualiza o bootloader.
- `/home` é preservada, mas pacotes instalados com `systemd` na raiz (fora do Flatpak) são perdidos.
- Faça `fsck -n` em `/home` e `df -h` antes de proceder: erros de sistema de arquivos ou disco cheio podem fazer a preservação falhar.

## Exercícios

1. No Modo Desktop, rode `bootctl status` e identifique se seu Deck está no slot A ou B. Anote o arquivo `.efi` em uso.
2. Inicialize pelo recovery, abra o Terminal e execute `sudo fsck -n /dev/nvme0n1p8`. Se houver erros, anote-os; se estiver limpo, descreva o que "clean" significa nesse contexto.
3. Explique, com suas palavras, por que reinstalar é mais rápido que reimaginar. Quantos GiB de dados são efetivamente escritos em cada operação?
4. Suponha que você instalou o pacote `htop` com `sudo pacman -S htop` (desabilitando read-only). Depois de um Reinstall, o `htop` ainda estará disponível? Justifique.
5. **Desafio.** Simule uma reinstalação manual pelo Terminal with repair tools: monte as partições EFI e raiz inativa, copie os arquivos de sistema da imagem no pendrive para a partição e crie a entrada de boot com `efibootmgr`. Qual etapa é a mais propensa a erro?