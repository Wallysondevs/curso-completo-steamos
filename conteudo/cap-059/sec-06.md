Chega um ponto em que interfaces gráficas atrapalham. O rclone é a ferramenta de linha de comando que faz tudo o que as seções anteriores cobriram — e mais — falando diretamente com mais de 40 serviços de nuvem. Ele não precisa de Flatpak, não depende de sessão gráfica e pode ser chamado de scripts, cron jobs ou serviços systemd. Esta seção apresenta o rclone do zero, começando pela instalação e pelo primeiro `remote`.

:::objetivos
- Instalar o rclone no SteamOS (pacote Arch, sem Flatpak)
- Configurar remotos com `rclone config` para Google Drive, S3 e outros
- Listar, copiar e mover objetos entre remotos
- Entender a sintaxe `remote:path` e os comandos essenciais
- Proteger credenciais com o arquivo de configuração do rclone
:::

## Por que rclone no Steam Deck

O rclone resolve duas coisas que nem Syncthing nem Nextcloud resolvem bem: **nuvens que não têm cliente Linux** (Google Drive, OneDrive, S3) e **operações pontuais e scriptáveis**. Ele não é um daemon que monitora pastas — é um comando que você chama, ele faz o trabalho e termina. Essa simplicidade é exatamente o que funciona num Steam Deck em modo jogo: um script disparado por timer não precisa de GUI, não suga RAM e não mantém conexão aberta.

O rclone está disponível como pacote nativo no Arch (não Flatpak), o que significa que ele roda sem as restrições de sandbox que afetam os Flatpaks. Isso importa para acessar caminhos de sistema e montar sistemas de arquivos.

## Instalando e primeiro `rclone config`

```terminal
$ sudo steamos-readonly disable
$ sudo pacman -Sy rclone
resolving dependencies...
looking for conflicting packages...
Packages (1) rclone-1.68.2-1

Total Download Size:   18.42 MiB
Total Installed Size:  79.11 MiB
:: Proceed with installation? [Y/n] Y
$ sudo steamos-readonly enable
```

A instalação exige desabilitar temporariamente a proteção de somente-leitura, como qualquer pacote no SteamOS. Depois de instalado, o rclone vive em `/usr/bin/rclone` e funciona mesmo no modo jogo.

O primeiro passo é configurar um *remote* — o destino com o qual o rclone vai falar. O comando interativo `rclone config` faz isso passo a passo.

```terminal
$ rclone config
No remotes found, make a new one?
n) New remote
s) Set configuration password
q) Quit config
n/s/q> n

Enter name for new remote.
name> gdrive

Option Storage.
Type of storage to configure.
Choose a number from below, or type in your own value.
   ...
  18 / Google Drive
     \ (drive)
   ...
Storage> 18

Option client_id.
OAuth Client Id.
Leave blank normally.
Enter a value. Press Enter to leave empty.
client_id> 

Option client_secret.
OAuth Client Secret.
Leave blank normally.
Enter a value. Press Enter to leave empty.
client_secret> 

Option scope.
Scope that rclone should use when requesting access from drive.
Choose a number from below, or type in your own value.
 1 / Full access all files, excluding Application Data Folder.
   \ (drive)
scope> 1

Edit advanced config?
y) Yes
n) No (default)
y/n> n

Configuration complete.
Options:
- type: drive
- client_id: 
- client_secret: 
- scope: drive
Keep this "gdrive" remote?
y) Yes this is OK (default)
n) No, I'll redo
e) Exit
y/e/d> y
```

O rclone abre um navegador para que você autorize o acesso à sua conta Google. No Steam Deck em modo desktop, isso funciona normalmente. Em modo jogo ou via SSH, você precisa do modo *headless*: o rclone exibe uma URL para abrir em outro dispositivo, você autoriza e cola o token de volta.

```terminal
## Modo headless (sem navegador gráfico): escolha "n" quando o rclone
## perguntar sobre auto config e siga as instruções no terminal.
$ rclone config reconnect gdrive:
Token: (Cole o token obtido no navegador de outro dispositivo)
```

O arquivo de configuração fica em `~/.config/rclone/rclone.conf`, em texto puro. As credenciais (tokens OAuth) **não** são criptografadas por padrão.

:::perigo
O arquivo `~/.config/rclone/rclone.conf` contém tokens de acesso que, roubados, dão acesso total às suas nuvens. Nunca compartilhe esse arquivo. Se quiser proteção extra, use `rclone config password` para criptografar a configuração com uma senha — o arquivo fica ilegível sem ela.
:::

## Comandos essenciais: listar, copiar, mover, sincronizar

A sintaxe do rclone é `rclone <comando> <origem> <destino>`, onde origens e destinos podem ser caminhos locais OU remotos na notação `nome-do-remote:caminho`.

```terminal
## Listar o que há no Google Drive
$ rclone ls gdrive:
  1234567  Saves/nota.txt
  8901234  Documentos/relatorio.pdf
       42  backup.tar.gz

## Listar com tamanho legível e hierarquia
$ rclone tree gdrive: --dirs-only
/
├── Saves/
├── Documentos/
└── Fotos/

## Copiar um arquivo local para o Google Drive
$ rclone copy ~/sync/saves/save01.srm gdrive:Saves/
```

A diferença entre `rclone copy` e `rclone sync` é fundamental e costuma causar acidentes:

| Comando | Comportamento |
|---|---|
| `rclone copy origem destino` | Copia arquivos novos ou modificados da origem para o destino. **Nunca apaga** nada no destino. |
| `rclone sync origem destino` | Torna o destino **idêntico** à origem: arquivos que existem no destino e não na origem são **deletados**. É um `rsync --delete`. |
| `rclone move origem destino` | Copia e depois apaga da origem (útil para fazer upload e liberar espaço). |

```terminal
## sync é perigoso: cuidado com a ordem dos argumentos!
$ rclone sync ~/sync/saves gdrive:Saves/
## Isso vai APAGAR do Google Drive qualquer arquivo que não exista em ~/sync/saves
```

:::perigo
`rclone sync` deleta arquivos no destino. Inverter origem e destino (`rclone sync remote: local:`) pode destruir seus arquivos locais. Antes de qualquer `sync`, faça um `rclone check` ou execute com `--dry-run` para ver o que seria alterado sem alterar nada.
:::

## Explorando o remote com `rclone lsd` e `rclone size`

Depois de configurado, convém inspecionar o remote.

```terminal
$ rclone lsd gdrive:
          -1 2024-03-10 14:22:01        -1 Saves
          -1 2024-06-05 09:11:32        -1 Documentos
          -1 2024-08-01 18:45:07        -1 Fotos

$ rclone size gdrive:Saves/
Total objects: 342
Total size: 1.2 GiB (1293123456 Bytes)

$ rclone about gdrive:
Total:   15 GiB
Used:    3.8 GiB
Free:    11.2 GiB
Trashed: 0 Bytes
```

`rclone about` nem todo backend suporta — Google Drive sim, S3 não. Para backends sem suporte, você faz a conta manualmente com `rclone size`.

## Outros backends: S3, OneDrive, SFTP

O rclone brilha como canivete universal porque o mesmo conjunto de comandos funciona com qualquer backend. A configuração difere, mas o uso é idêntico.

```terminal
## Configurar um bucket S3 (compatible, como MinIO ou AWS)
$ rclone config
name> meubucket
Storage> s3
provider> Minio
env_auth> false
access_key_id> AKIAIOSFODNN7EXAMPLE
secret_access_key> wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
endpoint> https://s3.exemplo.com
acl> private

## Listar o bucket
$ rclone ls meubucket:
```

A uniformidade de sintaxe significa que, depois de aprender rclone, você sabe falar com qualquer nuvem. O capítulo sobre sincronização se torna um exercício de planejamento, não de ferramenta.

```terminal
## Todos os backends disponíveis
$ rclone version | head -1 && rclone backends | wc -l
rclone v1.68.2
46
```

## Resumo

- rclone é um canivete CLI que fala com 40+ nuvens; instale com `sudo pacman -Sy rclone`.
- `rclone config` cria um *remote* interativamente; tokens OAuth ficam em `~/.config/rclone/rclone.conf`.
- `rclone copy` nunca apaga; `rclone sync` torna destino idêntico à origem (deleta arquivos); sempre use `--dry-run` antes.
- A sintaxe `remote:caminho` é consistente para Google Drive, S3, OneDrive, SFTP e todos os backends.
- Proteja `rclone.conf` com `rclone config password` para criptografar credenciais.

## Exercícios

1. Instale o rclone e configure um remote para o Google Drive (ou outro serviço que você tenha).
2. Liste o conteúdo raiz do remote com `rclone ls` e `rclone lsd` e compare as saídas.
3. Copie um arquivo local de teste para o remote com `rclone copy`, depois execute `rclone check` para verificar a integridade.
4. Faça `rclone sync local: remote:teste/` com `--dry-run` primeiro e analise o que seria alterado. Só depois execute de verdade.
5. **Desafio.** Configure dois remotes diferentes (ex.: Google Drive e S3/MinIO) e copie dados de um para o outro com `rclone copy remote1: remote2:`. Meça a velocidade com `--progress` e explique por que a transferência entre nuvens é mais lenta que entre local e nuvem.