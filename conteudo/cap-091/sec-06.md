Reimage é a palavra que a Valve escolheu para descrever uma restauração completa de fábrica, e a escolha é precisa: não se trata de instalar por cima nem de reparar, mas de regravar a imagem do sistema sobre um disco que será apagado e reparticionado do zero. É a operação mais demorada, a mais drástica e, paradoxalmente, a mais simples de decidir — porque não há nada a preservar. Se você chegou aqui já tendo feito backup, as próximas linhas vão guiar a execução. Se não fez, volte e faça: depois do toque em "Proceed" não há volta.

:::objetivos
- Executar uma reimagem completa com confiança e sem surpresas
- Entender o que o script `steamos-reimage` faz em cada etapa
- Saber quanto tempo esperar e o que fazer se algo travar
- Interpretar o resultado final: partições, versão e estado do sistema
:::

## Antes de tocar em "Reimage Steam Deck"

A reimagem apaga **tudo**. Não é "quase tudo", não é "o sistema, mas os jogos ficam". É tudo: jogos baixados, saves locais, capturas de tela, ROMs, configurações do KDE, temas do Decky Loader, plugins, pacotes instalados com `pacman` (se você desabilitou o read-only), senhas de Wi-Fi, contas configuradas no Modo Desktop e qualquer outro sistema operacional instalado em dual-boot — o Windows some junto.

O checklist pré-reimagem é curto e definitivo:

1. **Backup verificado.** Não basta copiar; abra alguns arquivos no destino e confirme que abrem.
2. **Cloud saves sincronizados.** No Modo Jogo, cada jogo mostra o status do save na nuvem. Force a sincronização manual.
3. **Lista de pacotes Flatpak.** Rode `flatpak list --app > ~/flatpak-apps.txt` e salve o arquivo no backup.
4. **Pendrive de recovery conectado e reconhecido.** Se o pendrive falhar no meio, você fica com um Deck sem sistema.

```terminal
$ flatpak list --app --columns=application > ~/flatpak-apps.txt
$ cat ~/flatpak-apps.txt
org.mozilla.firefox
com.discordapp.Discord
org.libreoffice.LibreOffice
com.obsproject.Studio
```

Essa lista, embora curta, é o roteiro para reinstalar seus aplicativos depois. Sem ela, você vai lembrar do Firefox, mas o OBS Studio e o Discord só farão falta na hora em que precisar deles.

## O que o script faz, etapa por etapa

O `steamos-reimage` não é um binário misterioso — é um script bash que vive em `/usr/bin/steamos-reimage`. Seu funcionamento pode ser inspecionado pelo terminal de repair, e entender o que ele faz ajuda a interpretar pausas demoradas e mensagens na tela:

```terminal
$ file /usr/bin/steamos-reimage
/usr/bin/steamos-reimage: Bourne-Again shell script, ASCII text executable
$ wc -l /usr/bin/steamos-reimage
187 /usr/bin/steamos-reimage
```

Aproximadamente 180 linhas que executam, em ordem:

1. **Confirmação:** caixa de diálogo KDE com "Proceed" / "Cancel". Um toque em Proceed e o script não pergunta mais nada.
2. **Desmontagem:** `umount` recursivo de todas as partições do `/dev/nvme0n1`. Se alguma estiver ocupada, o script força com `umount -l` (lazy).
3. **Zeragem da tabela de partições:** `sgdisk -Z /dev/nvme0n1` destrói tanto a GPT primária quanto a de backup no final do disco.
4. **Recriação da GPT:** o script grava partições com tamanhos e tipos exatos usando `sgdisk`. O layout é o A/B: duas partições raiz de 5 GiB cada, duas EFI de 32 MiB cada, uma `/home` ocupando o resto do disco, e partições auxiliares (BIOS boot de 64 MiB e `/var` com tamanho calculado).
5. **Formatação:** `mkfs.ext4` e `mkfs.vfat` em cada partição, com labels previsíveis (`rootfs-A`, `rootfs-B`, `efi-A`, `efi-B`, `home`, `var`).
6. **Extração de conteúdo:** a imagem do SteamOS (presente no próprio pendrive de recovery, em `/mnt/steamos-image`) é copiada para as partições de raiz.
7. **Instalação do bootloader:** `systemd-boot` ou script Valve equivalente grava as entradas EFI.
8. **Sinal de conclusão:** nova caixa de diálogo "Reimaging complete. Press Proceed to reboot."
9. **Reinicialização:** o Deck reinicia no assistente de configuração inicial.

```terminal
## Simulação (não execute) — fluxo lógico do script:
$ sudo sgdisk -Z /dev/nvme0n1
$ sudo sgdisk -n 1:2048:133119 -t 1:8300 -c 1:"efi-A" /dev/nvme0n1
$ sudo sgdisk -n 2:133120:264191 -t 2:8300 -c 2:"efi-B" /dev/nvme0n1
...
$ sudo mkfs.ext4 -L rootfs-A /dev/nvme0n1p4
$ sudo mkfs.ext4 -L rootfs-B /dev/nvme0n1p5
...
```

O layout recriado é idêntico ao que a Valve grava de fábrica. Dual-boot, partições personalizadas e esquemas alternativos são apagados.

:::nota
O `sgdisk -Z` (zap) é uma das operações mais agressivas que se pode fazer num disco: ele sobrescreve os cabeçalhos GPT com zeros e também apaga qualquer resquício de MBR. É por isso que a reimagem resolve problemas de dual-boot que uma reinstalação não resolve — ela remove inclusive esquemas de partição híbridos (GPT+MBR) que alguns instaladores de Windows criam.
:::

## Tempo estimado e o que esperar na tela

A barra de progresso da caixa de diálogo não é granular — ela pula de "iniciando" para "concluído" sem estágios intermediários visíveis. Isso gera ansiedade. O que acontece nos bastidores:

| Etapa | Tempo aproximado | Tela mostra |
|---|---|---|
| Diálogo de confirmação | Imediato | "This will completely erase..." |
| sgdisk zap + recriação | 5-10 segundos | Barra parada |
| Formatação de partições | 30-60 segundos | Barra parada |
| Cópia da imagem (~5 GiB) | 5-20 minutos | Barra parada |
| Instalação do bootloader | 10-30 segundos | Barra parada |
| Diálogo de conclusão | Imediato | "Reimaging complete" |
| Reinicialização | 1-3 minutos | Logo Steam Deck, depois setup |

O tempo total, do toque em Proceed ao assistente de primeira inicialização pedindo idioma, fica entre 15 e 35 minutos. A maior variável é a velocidade do SSD: um NVMe PCIe 3.0 de fábrica é mais lento que um NVMe PCIe 4.0 trocado pelo usuário.

:::atencao
Se a barra de progresso ficar parada por mais de 10 minutos sem nenhuma atividade de disco visível (o LED do Deck não pisca, o pendrive não acende), pode ser travamento. Nesse caso, espere mais 5 minutos, depois force o desligamento com power por 10 segundos e tente de novo. Se repetir, o pendrive pode estar com defeito físico — recrie-o em outro dispositivo.
:::

## Depois da reimagem: o assistente de primeira inicialização

Quando o Deck reiniciar, você verá a tela de seleção de idioma — exatamente como no dia em que tirou o aparelho da caixa. Isso é o OOBE (*out-of-box experience*), o assistente de primeira inicialização, e ele confirma que a reimagem foi bem-sucedida.

```terminal
## Após concluir o OOBE e entrar no Modo Desktop:
$ cat /etc/os-release | grep VERSION
VERSION="3.6.20"
$ lsblk /dev/nvme0n1
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
nvme0n1     259:0    0 953.9G  0 disk 
├─nvme0n1p1 259:1    0    64M  0 part 
├─nvme0n1p2 259:2    0    32M  0 part 
├─nvme0n1p3 259:3    0    32M  0 part 
├─nvme0n1p4 259:4    0     5G  0 part 
├─nvme0n1p5 259:5    0     5G  0 part 
├─nvme0n1p6 259:6    0   256M  0 part 
├─nvme0n1p7 259:7    0   256M  0 part 
├─nvme0n1p8 259:8    0 938.5G  0 part /home
```

As partições voltaram ao layout de fábrica. A versão do SteamOS será a mais recente disponível no momento em que a imagem de recovery foi empacotada — o que significa que, logo após o OOBE, o sistema pode oferecer atualizações adicionais. Aceite-as.

:::dica
Após a reimagem no Modo Desktop, o Discover vai oferecer dezenas de atualizações de pacotes Flatpak da instalação base. Isso é normal: a imagem de recovery é uma snapshot estática, e os repositórios Flatpak avançaram desde que ela foi criada. Atualize tudo antes de reinstalar aplicativos.
:::

## Resumo

- Reimage apaga tudo: jogos, configurações, dual-boot, partições personalizadas. É o reset de fábrica completo.
- O script usa `sgdisk -Z` para zerar a GPT e recria as partições A/B, depois extrai a imagem do SteamOS.
- Tempo total: 15 a 35 minutos. A barra de progresso não mostra estágios intermediários — observe o LED de atividade.
- O resultado final é um Deck com o layout de partições idêntico ao de fábrica.
- Após o OOBE, o sistema oferece atualizações adicionais; instale-as e atualize os Flatpaks.

## Exercícios

1. Rode `flatpak list --app --columns=application` no seu Deck atual e salve a lista num arquivo. Isso é seu seguro contra uma reimagem.
2. Inicialize o recovery e, **sem executar a reimagem**, abra o Terminal with repair tools. Leia o script `/usr/bin/steamos-reimage` e identifique a linha que executa `sgdisk -Z`. O que mais está ao redor dela?
3. Suponha que a reimagem falhe na etapa de cópia da imagem, deixando partições recém-criadas mas vazias. Descreva o estado do disco e o que você faria para completar a operação.
4. Após a reimagem, execute `lsblk -o NAME,SIZE,LABEL /dev/nvme0n1` no Modo Desktop e anote as labels de cada partição. Compare com a saída esperada: quais partições têm labels e quais não?
5. **Desafio.** Simule um cenário em que você quer preservar apenas a partição `/home` e refazer todo o resto — incluindo a tabela GPT. Proponha uma estratégia usando o Terminal with repair tools: como você faria backup da `/home`, executaria a reimagem e restauraria o backup?