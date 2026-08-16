O Steam Deck tem duas portas de expansão de armazenamento: o slot NVMe interno (que exige abrir o aparelho) e o slot de cartão microSD na parte inferior, que é a via mais prática para quem quer ampliar espaço sem tocar no hardware. Mas existe uma diferença crucial entre "colocar um cartão" e "colocar um cartão bem-feito": o sistema de arquivos. SteamOS, Windows e consoles formatam microSD de maneiras distintas, e a escolha errada custa desempenho, compatibilidade e, no pior caso, jogos corrompidos.

:::objetivos
- Entender onde o microSD se encaixa no armazenamento do Deck (vs. NVMe interno)
- Diferenciar o papel do Modo Jogo e do Modo Desktop na formatação
- Conhecer os sistemas de arquivos ext4, Btrfs e exFAT e quando usar cada um
- Reconhecer o impacto do sistema de arquivos no carregamento de jogos
- Preparar o terreno para formatar, montar e mover jogos (seções seguintes)
:::

## Por que o microSD importa

O Steam Deck de 64 GB, o mais barato, preenche seu armazenamento com poucos jogos grandes — um único título AAA de 100 GB é quase impossível de caber. O microSD torna-se, na prática, a "segunda casa" da biblioteca Steam no Deck. A Valve projetou o console para isso: o Modo Jogo oferece uma opção de formatação nativa, e o Steam permite mover jogos entre disco interno e cartão em poucos cliques.

No hardware, o cartão é montado em `/run/media/` (no Modo Desktop) e acessado como um volume comum pelo SteamOS, que é Arch Linux por baixo. Isso significa que tudo que você sabe de Linux — `lsblk`, `mount`, `mkfs` — se aplica diretamente.

## Modo Jogo vs. Modo Desktop

Existem dois caminhos para preparar um microSD no Deck:

- **Modo Jogo (interface Steam)**: acessível em Configurações → Armazenamento, a opção "Formatar cartão SD" formata o cartão automaticamente. É a via mais simples e segura para a maioria dos usuários, mas usa o padrão da Valve (ext4 com case-folding) e oferece pouquíssimo controle.
- **Modo Desktop (KDE + terminal)**: dá controle total — você escolhe o sistema de arquivos, o rótulo, o tamanho do bloco e os parâmetros. É o caminho de quem precisa de Btrfs (snapshots), exFAT (compartilhamento com Windows) ou ajustes finos.

A regra de ouro: se você só quer jogar e não sabe o que escolher, use o Modo Jogo. Se precisa de um caso específico — dual-boot, backup com snapshots, transferência para PC Windows — vá ao Modo Desktop.

```terminal
## Confirmar o dispositivo do cartão antes de qualquer operação
$ lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT
NAME        SIZE FSTYPE LABEL MOUNTPOINT
mmcblk0   119.1G
└─mmcblk0p1 119.1G ext4   SD    /run/media/deck/SD
```

Neste exemplo, `mmcblk0` é o cartão microSD e `mmcblk0p1` sua única partição. O `nvme0n1` seria o SSD interno — não confunda os dois, a seção sobre formatação volta a este ponto com um alerta de segurança.

:::atencao
O nome do dispositivo (`mmcblk0` vs. `nvme0n1`) pode mudar entre reinicializações ou quando você pluga outros discos. Sempre confirme com `lsblk` qual é o cartão antes de formatar. Formatar o dispositivo errado apaga dados de forma irreversível.
:::

## Como o sistema de arquivos afeta o jogo

O sistema de arquivos não é um detalhe burocrático — ele define:

- **Case-folding**: se `Game/Data.bin` e `game/data.bin` são tratados como o mesmo arquivo. Muitos jogos Windows (rodando via Proton) assumem um sistema sem distinção entre maiúsculas e minúsculas, como o NTFS. No ext4, isso só funciona se o volume for formatado com a flag `casefold`. É por isso que a Valve usa essa flag no Modo Jogo.
- **Desempenho**: sistemas com journaling (ext4, Btrfs) são mais robustos a quedas de energia, mas fazem mais gravação. Para microSD, que tem número limitado de ciclos de escrita, isso é relevante a longo prazo.
- **Compatibilidade**: exFAT é lido por Windows, macOS e Linux sem drivers extras, mas não suporta as permissões Unix nem case-folding do jeito que o Proton espera em alguns jogos.

## O trio: ext4, Btrfs e exFAT

| Sistema | Prós | Contras | Indicação |
|---------|------|---------|-----------|
| **ext4** | Maduro, rápido, case-folding via flag, padrão da Valve | Sem snapshots nativos; não lido pelo Windows sem ferramenta extra | Uso principal no Deck |
| **Btrfs** | Snapshots, compressão, checksum de dados | Mais overhead de escrita; menos testado em microSD | Quem quer backup/rollback e compressão |
| **exFAT** | Lido por Windows/macOS/Linux nativamente | Sem permissões Unix nem case-folding completo; menos robusto | Compartilhamento entre SOs |

A decisão costuma se resumir a uma pergunta: **este cartão vai viver só no Deck, ou vai passear por outros computadores?** Se só no Deck, ext4 (ou Btrfs, se você quer snapshots). Se vai ser lido num Windows também, exFAT — aceitando as limitações.

:::dica
Na dúvida sobre desempenho, priorize um cartão A2 (Application Performance Class 2), que tem IOPS maiores para cargas de aplicação/jogo, acima da classe V30 de gravação de vídeo. O sistema de arquivos otimiza, mas não compensa um cartão lento.
:::

## Pontos-chave

- O microSD é a expansão mais prática do Deck e pode hospedar a biblioteca Steam inteira.
- Modo Jogo = formatação automática pela Valve (ext4 + casefold); Modo Desktop = controle total via terminal.
- ext4 é o padrão do Deck, Btrfs adiciona snapshots/compressão, exFAT prioriza compatibilidade com Windows/macOS.
- Case-folding (flag `casefold`) é essencial para muitos jogos Proton que assumem sistema sem distinção de maiúsculas.
- Confirme sempre o dispositivo com `lsblk` antes de formatar; `mmcblk0` vs. `nvme0n1`.

## Exercícios

1. Plugue um microSD e rode `lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT`; identifique `mmcblk0` (cartão) e `nvme0n1` (SSD interno).
2. Descreva em uma frase um cenário onde você escolheria exFAT em vez de ext4 para um cartão do Deck.
3. Explique por que a flag `casefold` importa para jogos Windows rodando via Proton.
4. Liste as duas formas de formatar um cartão no Deck e o cenário em que cada uma é preferível.
5. **Desafio.** Pesquise a diferença entre classe A1 e A2 de microSD e explique qual delas beneficia o carregamento de jogos.
