Quando você troca de Steam Deck, reinstala o sistema ou joga no desktop e depois no portátil, espera que o progresso esteja lá. O Steam Cloud é o mecanismo que entrega essa promessa — mas ele não é mágico. Arquivos decidem o que sobe, quando sobe, e o que acontece quando dois saves colidem. Saber onde esses arquivos moram e como o cliente Steam decide entre o save local e o remoto evita a frustração de perder horas de jogo por um clique errado no diálogo de conflito.

:::objetivos
- Entender a arquitetura do Steam Cloud: userdata, remotecache e appmanifest
- Localizar os saves de qualquer jogo Steam pelo AppID
- Interpretar o arquivo `remotecache.vdf` e o que ele registra
- Diferenciar saves sincronizados automaticamente de saves manuais
- Diagnosticar por que um jogo não está sincronizando
:::

## Onde o Steam Cloud guarda tudo

O Steam Cloud não é um diretório único com todos os saves — ele espalha os dados em duas camadas. A primeira fica dentro da instalação do Steam, em `~/.local/share/Steam/userdata/`. Ali, cada conta Steam que já fez login na máquina ganha uma pasta com seu SteamID64 (um número de 17 dígitos). Dentro dela, uma subpasta por jogo, identificada pelo AppID:

```terminal
$ ls ~/.local/share/Steam/userdata/
207304170/
$ ls ~/.local/share/Steam/userdata/207304170/ | head -6
730/
440/
570/
440900/
$ ls ~/.local/share/Steam/userdata/207304170/730/
local/
remotecache.vdf
```

A estrutura é sempre a mesma: uma pasta `local/` com os arquivos de configuração e saves locais daquele jogo, e um arquivo `remotecache.vdf` que descreve o que foi enviado ou recebido da nuvem. O Steam não sincroniza a pasta `local/` inteira automaticamente — ele lê uma lista de arquivos e padrões definida pelo desenvolvedor no Steamworks, e só esses sobem.

A segunda camada são os saves que o jogo escreve fora da árvore do Steam — tipicamente em `~/.local/share/`, `~/.config/`, `~/Documents/` ou dentro do prefixo Wine/Proton em `compatdata/`. O Steam Cloud só sabe desses arquivos se o desenvolvedor declarou o caminho relativo a uma das pastas padrão do sistema. Se o jogo salva em um local atípico sem declarar, o Cloud não cobre.

```terminal
$ find ~/.local/share/Steam/userdata/207304170/730/local/ -type f | head -6
/home/deck/.local/share/Steam/userdata/207304170/730/local/cfg/config.cfg
/home/deck/.local/share/Steam/userdata/207304170/730/local/cfg/video.txt
/home/deck/.local/share/Steam/userdata/207304170/730/local/cfg/bindings.kb
```

Repare: esses arquivos em `730/local/cfg/` são do Counter-Strike 2 (AppID 730). Cada jogo organiza sua subpasta como quer. O que o Steam Cloud garante é que, se o desenvolvedor configurou corretamente, esses arquivos serão enviados ao sair do jogo e baixados ao iniciá-lo.

## Lendo o `remotecache.vdf`

O coração do Steam Cloud em cada jogo é o `remotecache.vdf`. Ele usa o formato Valve Data Format — parecido com JSON mas com chaves sem aspas. Dentro dele, cada arquivo sincronizado ganha uma entrada com tamanho, timestamp e hash:

```terminal
$ cat ~/.local/share/Steam/userdata/207304170/730/remotecache.vdf
"remotecache"
{
        "730"
        {
                "cfg/config.cfg"
                {
                        "root"          "0"
                        "size"          "4821"
                        "localtime"     "1745254223"
                        "time"          "1745254223"
                        "remotetime"    "1745254223"
                        "sha"           "3f2b91ac77de4c159f0e4a2d1c8b5e71a9f3d2c1"
                        "syncstate"     "1"
                }
                "cfg/video.txt"
                {
                        "root"          "0"
                        "size"          "217"
                        "localtime"     "1745254201"
                        "time"          "1745254201"
                        "remotetime"    "1745254201"
                        "sha"           "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
                        "syncstate"     "1"
                }
        }
}
```

Os campos contam uma história. `localtime` e `time` são o timestamp local da última modificação (em epoch). `remotetime` é o timestamp que o servidor do Steam registrou para aquele arquivo. Quando `remotetime` é menor que `localtime`, o cliente sabe que o arquivo local é mais novo e o oferece para subir. Quando é o contrário, o servidor tem a versão mais recente. O campo `syncstate` com valor `1` significa "sincronizado". Outros valores possíveis:

| syncstate | Significado |
|---|---|
| `0` | Nunca foi sincronizado (arquivo novo, ainda não subiu) |
| `1` | Sincronizado — local e remoto estão iguais |
| `2` | Modificado localmente, esperando próxima sincronização |
| `3` | Conflito detectado, aguardando resolução do usuário |

:::info
O Steam só lê e escreve o `remotecache.vdf` ao iniciar e ao encerrar o jogo. Se você editar um save com o jogo aberto e ele travar, o Steam não enviará a versão editada — o arquivo nunca entrou na fila. É por isso que forçar o fechamento do Steam após um crash às vezes recupera um save que o cliente não viu.
:::

## Como o Steam decide o que sincronizar

Quando você clica em Jogar, o cliente Steam faz três coisas antes de lançar o processo do jogo:

1. Consulta o servidor pelo `remotecache` mais recente daquele AppID.
2. Compara cada arquivo: se o `remotetime` do servidor é maior que o `localtime` local, baixa a versão remota e sobrescreve a local.
3. Se o `localtime` local é maior, mantém a versão local — ela sobe quando o jogo fechar.

Ao fechar o jogo, o cliente percorre a lista de arquivos monitorados, calcula o SHA1 de cada um que mudou e envia ao servidor. O servidor responde com um novo `remotetime` para cada arquivo, que é gravado no `remotecache.vdf` local.

O problema clássico aparece quando você joga offline: o jogo salva localmente, mas o Steam não consegue subir. Ao reconectar, o `localtime` local é maior que o `remotetime` do servidor (que está desatualizado), então o cliente pergunta o que fazer — e é aí que nasce o temido diálogo de conflito.

```terminal
$ stat --format='%Y %n' ~/.local/share/Steam/userdata/207304170/730/local/cfg/config.cfg
1745254223 /home/deck/.local/share/Steam/userdata/207304170/730/local/cfg/config.cfg
```

O `stat` com `%Y` devolve o timestamp em epoch, exatamente o mesmo formato que o `remotecache.vdf` usa. Se você suspeita que o Steam está ignorando um arquivo, compare o timestamp do disco com o `localtime` do VDF — se forem iguais, o Steam já registrou aquela versão. Se o arquivo em disco for mais novo, o `localtime` do VDF ainda não foi atualizado, e o arquivo está na fila para subir.

:::atencao
Nunca edite o `remotecache.vdf` manualmente com o Steam aberto. O cliente sobrescreve o arquivo ao detectar alterações e você perde suas edições. Feche o Steam (`steam -shutdown` ou `pkill steam`), edite, e só então reabra. Mesmo assim, editar o `syncstate` ou os timestamps pode fazer o servidor rejeitar o arquivo por inconsistência de hash.
:::

## Jogos que não usam Steam Cloud

Nem todo jogo da biblioteca Steam tem suporte a Cloud. A informação está na página da loja (o ícone "Steam Cloud" na lista de recursos) e também no arquivo de manifesto do jogo:

```terminal
$ grep -i "cloud" ~/.local/share/Steam/steamapps/appmanifest_730.acf
        "CloudGetsManifestFromApp""0"
        "CloudSavesFileID0""105600"
        "CloudSavesFileID1""105601"
        "CloudSavesFileID2""105602"
```

O arquivo `.acf` (Application Configuration File) é o manifesto do jogo, no mesmo formato VDF. A presença de chaves `CloudSavesFileID` indica que o jogo tem Cloud habilitado e quantos "slots" de arquivo ocupa. Se essas linhas não existem, o jogo simplesmente não tem Cloud — e o Steam não vai avisar você disso na hora de desinstalar.

Para descobrir rapidamente quais jogos da sua biblioteca têm Cloud, um pipeline com `grep` resolve:

```terminal
$ for acf in ~/.local/share/Steam/steamapps/appmanifest_*.acf; do
    if grep -q "CloudSavesFileID" "$acf"; then
        grep '"name"' "$acf" | head -1
    fi
done
        "name"          "Counter-Strike 2"
        "name"          "Stardew Valley"
        "name"          "Hades"
        "name"          "Portal 2"
        "name"          "Balatro"
```

## Resumo

- O Steam Cloud armazena saves em `~/.local/share/Steam/userdata/<SteamID>/<AppID>/local/` e registra o estado de sincronização no `remotecache.vdf`.
- O `remotecache.vdf` guarda timestamp local, timestamp remoto e SHA1 de cada arquivo; a comparação entre `localtime` e `remotetime` decide o que sobe e o que desce.
- O Steam sincroniza ao iniciar e ao fechar o jogo — nunca durante a execução.
- Jogos offline geram divergência: o cliente sincroniza ao reconectar, mas pode pedir resolução manual.
- O arquivo `appmanifest_*.acf` revela se um jogo tem Cloud habilitado; a ausência de `CloudSavesFileID` significa que não há sincronização.

## Exercícios

1. Localize seu SteamID64 e liste os AppIDs que têm pasta em `userdata/<seu_id>/`. Escolha três jogos e verifique se o `remotecache.vdf` deles contém arquivos com `syncstate` diferente de `1`.
2. Use `stat` para comparar o timestamp de um arquivo de save com o `localtime` registrado no `remotecache.vdf` correspondente. Eles batem? Se não, o que isso significa?
3. Escreva um script que percorra todos os `appmanifest_*.acf` da sua instalação e imprima, para cada jogo, o nome e se tem Cloud habilitado ou não. A saída deve ser uma tabela de duas colunas.
4. Feche o Steam, renomeie um `remotecache.vdf` de um jogo que você não usa há tempo, e abra o Steam novamente. O que acontece quando você tenta iniciar esse jogo? O Steam recria o arquivo?
5. **Desafio.** Identifique um jogo com Cloud que salva parte do progresso fora de `userdata/` (use `find` com o AppID para buscar fora da árvore do Steam). Explique como o Steam Cloud sabe incluir esse caminho — dica: procure por `cloudsavepath` nos fóruns do Steamworks.