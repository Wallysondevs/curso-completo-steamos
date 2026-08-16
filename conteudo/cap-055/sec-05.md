O `~/.steam` é o coração pulsante de um Steam Deck: é ali que vivem tanto o cliente Steam quanto todos os jogos, o Proton e os dados de compatibilidade. Quando as pessoas dizem "o disco do Steam Deck encheu", em nove de dez casos a causa está num subdiretório de `~/.steam`. Saber o que mora aqui evita que você apague a coisa errada.

:::objetivos
- Mapear a estrutura interna de `~/.steam`
- Distinguir cliente Steam, biblioteca de jogos e dados do Proton
- Interpretar os arquivos `appmanifest` e `libraryfolders.vdf`
- Entender onde ficam saves e prefixos de compatibilidade
:::

## A estrutura de diretórios do .steam

Diferente do que o nome sugere, `~/.steam` contém mais que configurações: contém o próprio cliente e, por padrão, a biblioteca de jogos. Veja o que aparece logo de cara:

```terminal
$ ls ~/.steam
bin32/        registry.vdf      steam/          steam.pid
bin/          skel32/           steam.sh        ubuntu12_64/
config/       sdk32/            steamdeps.txt
```

Alguns desses itens são sobras do instalador (restos de `bin32`, `skel32`, `ubuntu12_64`) e são inofensivos. O que interessa mesmo está dentro de `~/.steam/steam`, que é a instalação *de verdade* do cliente Steam.

## Dentro de ~/.steam/steam

É aqui que a coisa fica interessante:

```terminal
$ ls ~/.steam/steam
Steam.AppBundle/          steamapps/
appcache/                 steamui/
bin/                      userdata/
config/                   logs/
```

| Subdiretório | Função |
|---|---|
| `steamapps/` | Bibliotecas de jogos, Proton e dados de compatibilidade |
| `userdata/` | Configurações por conta e por jogo (ID de usuário Steam) |
| `config/` | Configurações globais do cliente (login, região, controles) |
| `Steam.AppBundle/` | O runtime/embalagem do cliente na versão atual |
| `logs/` | Logs do cliente Steam em texto |

O `userdata/` merece destaque: dentro dele há uma pasta por *account ID* (o número de 17 dígitos da sua conta Steam). É nessa pasta que ficam preferências Cloud Sync e configurações específicas de cada jogo por usuário — razão pela qual trocar de conta muda o comportamento dos jogos.

## steamapps: bibliotecas, Proton e compatdata

O subdiretório mais volumoso é `steamapps`. Ele reúne três coisas que muita gente confunde:

```terminal
$ ls ~/.steam/steam/steamapps
appmanifest_1245620.acf   compatdata/   libraryfolders.vdf
common/                   shadercache/  downloading/
```

- **`common/`** — os arquivos do jogo em si, um diretório por título.
- **`compatdata/`** — prefixos Wine/Proton, um por jogo (ex.: `compatdata/1245620/`), contendo saves e o "C:" virtual.
- **`shadercache/`** — shaders Vulkan compilados, que aceleram o carregamento mas ocupam GB.
- **`libraryfolders.vdf`** — lista as pastas de biblioteca (disco interno + SD card).
- **`appmanifest_*.acf`** — manifestos que descrevem cada jogo instalado.

O número no nome do arquivo é o **AppID** do jogo (identificador único na Steam). O mesmo número reaparece como nome do subdiretório em `common/` e `compatdata/`, o que permite correlacionar jogo, arquivo e save.

:::nota
O arquivo `libraryfolders.vdf` é texto puro (formato Valve Data File) e pode ser aberto com `cat`. Nele você vê o caminho de cada biblioteca, inclusive a do cartão SD, e o total de espaço usado por cada uma.
:::

## Entendendo o Proton e os prefixos compatdata

Jogos Windows rodam no Steam Deck através do **Proton** (a versão da Valve do Wine + DXVK). Em vez de instalar cada jogo num único ambiente compartilhado (como faria um Wine tradicional), o Proton cria um **prefixo isolado** por jogo, dentro de `compatdata/<appid>/`. Dentro de cada prefixo existe um "drive C" virtual:

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/1245620/pfx/drive_c
Program Files/   ProgramData/   users/   windows/
```

O save de um jogo Proton normalmente fica em `users/steamuser/Documents` ou `users/steamuser/AppData` dentro desse drive virtual. Jogos nativos, por outro lado, gravam saves em `~/.local/share` (próximo capítulo desta seção). Essa bifurcação é uma das maiores fontes de confusão na hora de fazer backup de saves.

:::dica
Quer saber o AppID de um jogo para localizar seu prefixo? O jeito mais confiável é abrir o `appmanifest_*.acf` e ler o campo `appid` e o `name`:

```terminal
$ grep -E '"(appid|name)"' ~/.steam/steam/steamapps/appmanifest_1245620.acf
	"appid"		"1245620"
	"name"		"ELDEN RING"
```
:::

## O que é seguro apagar (e o que não é)

Ordem crescente de perigo ao limpar `~/.steam`:

| Ação | Segurança |
|---|---|
| Apagar `shadercache/` de um jogo | Seguro (recompila sob demanda) |
| Apagar `downloads/` e `downloading/` | Seguro (retoma downloads depois) |
| Apagar `logs/` | Seguro |
| Apagar `compatdata/` de um jogo | **Perde save** se não tiver Cloud Sync |
| Apagar `common/` na mão | Quebra o jogo (use a desinstalação do Steam) |

O erro grave é apagar `compatdata` achando que só remove "arquivos temporários". Ali dentro estão os prefixos com saves. Antes de qualquer limpeza, verifique se o jogo tem Cloud Sync ativo.

:::perigo
Apagar `~/.steam/steam/steamapps/compatdata/*` apaga saves de todos os jogos Proton sem Cloud Sync. Se você for liberar espaço, limpe `shadercache` e desinstale jogos pela interface do Steam, nunca mexendo em `compatdata` diretamente.
:::

## Resumo

- `~/.steam` contém o cliente Steam, bibliotecas, Proton e dados de compatibilidade.
- `~/.steam/steam/steamapps/common` guarda os jogos; `compatdata` guarda os prefixos Proton.
- O número nos nomes de arquivo é o AppID, vinculando jogo, manifest e save.
- Saves de jogos Proton ficam no "drive C" virtual dentro de cada prefixo.
- Limpe `shadercache` e `logs`, nunca `compatdata` ou `common`.

## Exercícios

1. Rode `ls ~/.steam/steam/steamapps/` e identifique quais subdiretórios são bibliotecas, manifestos e dados de compatibilidade.
2. Escolha um `appmanifest_*.acf` e leia os campos `appid` e `name` com `grep`. Qual jogo é?
3. Localize o prefixo Proton de um jogo com `ls ~/.steam/steam/steamapps/compatdata/` e correlacione o número com o manifest.
4. Estime o peso do shadercache com `du -sh ~/.steam/steam/steamapps/shadercache`. Vale a pena limpar?
5. **Desafio.** Abra um `pfx/drive_c/users/steamuser/` e liste os subdiretórios. Compare com `~/.local/share` e explique onde um save nativo vs. um save Proton provavelmente estaria.