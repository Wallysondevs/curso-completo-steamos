Nem toda transferência precisa de rede, firewall ou pareamento. Para arquivos muito grandes — discos de jogos, ISO, bibliotecas de centenas de gigabytes — ou para um backup que deve ficar *fisicamente* com você, o pendrive e o HD externo seguem imbatíveis: pluga, copia, ejecta. O detalhe está nos formatos de sistema de arquivos e na forma como o SteamOS monta mídia removível.

:::objetivos
- Entender quais formatos (exFAT, NTFS, ext4) o SteamOS lê e grava
- Montar e desmontar mídia removível com segurança
- Copiar grandes volumes sem truncar ou corromper
- Escolher o formato certo para cada cenário (Windows × Linux)
- Lidar com a limitação do modo de jogo ao acessar mídia
:::

## O que o SteamOS lê

O SteamOS (Linux) tem suporte robusto, mas nem tudo é igual:

| Formato | Leitura | Escrita | Melhor quando |
|---|---|---|---|
| **exFAT** | Sim | Sim | Pendrives/HDs grandes compartilhados com Windows e macOS (recomendado) |
| **NTFS** | Sim | Sim (via ntfs-3g) | Discos já formatados em NTFS pelo Windows |
| **ext4** | Sim | Sim | Uso exclusivamente Linux (permite permissões) |
| **FAT32** | Sim | Sim | Compatível com tudo, mas limitado a arquivos de 4 GB |

A regra prática: **exFAT** para mídia que viaja entre Deck e Windows/macOS, **ext4** para média que fica no mundo Linux (mais rápido, preserva permissões e links).

## Montando a mídia

No modo Desktop, o Plasma monta a mídia automaticamente ao plugar e a mostra no painel e no Dolphin. Pela linha de comando, você pode ver e controlar:

```terminal
# ver discos e partições
$ lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT
NAME        SIZE FSTYPE LABEL MOUNTPOINT
sda        57.3G
└─sda1     57.3G exfat  DECK  /run/media/deck/DECK

# montar manualmente (se necessário)
$ sudo mount /dev/sda1 /mnt/pendrive

# desmontar com segurança (sempre antes de remover!)
$ sudo umount /mnt/pendrive
```

**Nunca remova a mídia sem desmontar** (ou sem usar o "ejetar com segurança" do Dolphin): o sistema pode ainda estar escrevendo buffers, e a remoção prematura corrompe o sistema de arquivos.

## Copiando grandes volumes com segurança

Para cópias grandes, prefira ferramentas que verifiquem e retomem, em vez de arrastar pelo Dolphin:

```terminal
# rsync com progresso e verificação (retomável)
$ rsync -avP ./meus-jogos/ /run/media/deck/DECK/

# verificar integridade após copiar (checksum)
$ sha256sum /run/media/deck/DECK/arquivo.iso
```

O arrastar-e-soltar do Dolphin funciona, mas se a cópia de 200 GB for interrompida, você recomeça do zero. `rsync` retoma de onde parou.

## Formatando um pendrive

Se precisar formatar, cuidado para apontar o dispositivo certo (o disco *inteiro*, não uma partição, e nunca o disco interno do Deck):

```terminal
# identificar o dispositivo (sda, sda1 etc.) ANTES de formatar
$ lsblk

# formatar como exFAT (rótulo DECK)
$ sudo mkfs.exfat -n DECK /dev/sda1
```

No modo gráfico, o **KDE Partition Manager** ou o **GParted** (Flatpak) fazem o mesmo com conforto. Reforce: errar o `/dev/` aqui apaga dados — confirme duas vezes.

## Modo de jogo e mídia removível

O modo de jogo do SteamOS não expõe um gerenciador de arquivos; para copiar de/para pendrive, você usa o modo Desktop. O Steam, porém, consegue **instalar jogos diretamente em mídia externa** (adicione a pasta na biblioteca), o que é útil para expandir armazenamento sem transferência manual.

## Pontos-chave

- Pendrive/HD externo = o método robusto para grandes volumes e backup físico.
- **exFAT** é o formato universal recomendado; **ext4** para uso só-Linux.
- Sempre desmonte (`umount`/ejetar) antes de remover a mídia.
- `rsync -avP` é mais seguro e retomável que arrastar-e-soltar.
- Formatar apaga dados: confirme o `/dev/sdX` correto antes de prosseguir.

## Exercícios

1. Conecte um pendrive e identifique-o com `lsblk` (dispositivo, partição, formato, rótulo).
2. Copie um arquivo grande com `rsync -avP` e compare com uma cópia por arrastar-e-soltar.
3. Calcule o `sha256sum` de um arquivo antes e depois da cópia e confirme que batem.
4. Ejetue a mídia com segurança pelo Dolphin e reconecte-a.
5. **Desafio.** Formate um pendrive de teste como exFAT, copie um arquivo de 5 GB (que não caberia em FAT32) e confirme a leitura.
