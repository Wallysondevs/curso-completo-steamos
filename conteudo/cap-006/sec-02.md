A biblioteca é o coração do Modo Jogo: é dela que você lança tudo, e é ela que o Steam consulta toda vez que liga. O que parece um simples grid de capas é, por baixo, uma leitura de arquivos locais — os `appmanifest_*.acf` e o `libraryfolders.vdf` — combinada ao metadado (capas, tags, playtime) que o cliente baixa da sua conta. Dominar coleções e filtros transforma uma lista de 200 jogos em algo navegável em segundos.

:::objetivos
- Entender como o Steam localiza os jogos instalados via `libraryfolders.vdf`
- Criar e gerenciar coleções estáticas e dinâmicas
- Aplicar filtros por estado, gênero e dispositivo
- Manipular a ordem de exibição da grade e os modos de visualização
- Inspecionar o playtime registrado nos logs locais
:::

## Onde os jogos moram, de verdade

A biblioteca não guarda os jogos num lugar só. O Steam suporta **múltiplas pastas de biblioteca** — no Deck, a principal fica no SSD interno, e uma comum é o cartão SD montado em `/run/media/mmcblk0p1`. Quem diz ao Steam onde procurar é o arquivo `libraryfolders.vdf`:

```terminal
$ cat ~/.steam/steam/steamapps/libraryfolders.vdf
"libraryfolders"
{
	"0"
	{
		"path"		"/home/deck/.steam/steam"
		"label"		""
		"contentid"		"560916217513107375"
		"totalsize"		"0"
		"apps"
		{
			"70"		"8570429008"
			"4000"		"13021472"
		}
	}
	"1"
	{
		"path"		"/run/media/mmcblk0p1"
		"label"		"Cartão SD"
		"contentid"		"-1822442238878265652"
		"totalsize"		"0"
		"apps"
		{
			"413150"		"123312233"
		}
	}
}
```

Cada bloco numerado é uma biblioteca. A de índice `0` é a interna, cujo `path` aponta para a própria instalação; a de índice `1` é o cartão SD, com o `label` "Cartão SD" (que é o que aparece na interface). Dentro de `apps`, a chave é o `appid` e o valor é o tamanho em bytes ocupado naquela biblioteca. Aqui você vê, por exemplo, o `413150` (Stardew Valley) instalado apenas no cartão SD.

Isso explica um comportamento que confunde muita gente: mover um jogo de biblioteca na interface não faz nada de mágico — o Steam apenas reescreve este arquivo, apagando o `appid` de um bloco e acrescentando no outro, e move os arquivos de `common/` de uma pasta para outra. A interface é uma camada bonita sobre uma tabela de texto.

## Coleções estáticas e dinâmicas

**Coleção estática** é aquela que você monta na mão, arrastando jogos para dentro. **Coleção dinâmica** é um filtro salvo: você define uma regra ("gênero RPG", "playtime menor que 10 horas", "não instalados") e o Steam preenche sozinho, atualizando conforme a biblioteca muda. No Modo Jogo, o caminho é o mesmo do desktop Steam, mas via gamepad: abra a biblioteca, vá até **Coleções**, e escolha **Criar coleção**.

Na interface, o botão `[[Y]]` sobre um jogo abre o menu onde você adiciona ou remove da coleção. Coleções dinâmicas aceitam regras combinadas com "e"/"ou":

| Regra | Exemplo | Resultado |
|---|---|---|
| Gênero | `RPG`, `Indie` | Filtra por tags da loja |
| Estado | `Instalado`, `Não instalado` | Separa o que está no SSD/SD do que está na nuvem |
| Jogado recentemente | `Últimos 30 dias` | Gera uma "fila" personalizada |
| Tamanho | `mais de 20 GB` | Ajuda a liberar espaço no SSD de 256 GB |

As coleções não estão em um "banco de dados mágico": também são arquivos. O Steam guarda a definição delas dentro do perfil de usuário, no diretório `userdata/<steamid>/config`, no arquivo `localconfig.vdf` (junto com os favoritos, os filtros salvos e várias preferências). Para ver o `steamid` de cada conta presente na máquina:

```terminal
$ ls ~/.steam/steam/userdata
76561198000000000      anonymous
```

O número grande é o *SteamID64* da sua conta. `anonymous` é o espaço usado antes de qualquer login (e por contas que nunca logaram). Entrar na pasta da sua conta mostra a estrutura de `config`:

```terminal
$ ls ~/.steam/steam/userdata/76561198000000000/config
grid           localconfig.vdf   shortcuts.vdf
```

O `localconfig.vdf` é um arquivo de texto único, mas extenso — não é para editar na mão à toa. Ele concentra desde as coleções até a senha de "Modo Família" (ofuscada). Para quem tem paciência, um `grep` revela a estrutura de uma coleção:

```terminal
$ grep -A6 '"collections"' ~/.steam/steam/userdata/76561198000000000/config/localconfig.vdf | head -20
```

A saída varia muito entre contas, mas o ponto é que a "coleção" que você cria no gamepad vira um bloco de texto aqui — reiterando o tema deste capítulo: por trás de cada clique há um arquivo.

## Filtros no Modo Jogo

Sem filtro, a biblioteca mostra tudo: instalados e não instalados, jogo grande e demo, obra-prima e beta. O filtro é o que separa o joio. No Modo Jogo, aperte `[[X]]` (ou o ícone de filtro conforme o layout) para abrir a barra de filtros; as opções principais são:

- **Estado**: pronto para jogar, instalado, baixando, não instalado.
- **Gênero**: derivado das tags da loja (RPG, Ação, Corrida, etc.).
- **Compatibilidade**: "Verificado", "Jogável", "Não suportado" — o selo do Deck.
- **Classificação**: por nome, por playtime, por tamanho, por data de instalação.

Um filtro útil é o de **Dispositivo**, que aparece quando você tem o que a Valve chama de aplicativos não-jogo (atalhos para emuladores, navegadores) adicionados como "jogos". Eles entram na biblioteca exatamente como jogos porque, no fundo, também são `appid`s — só que adicionados localmente, descritos no `shortcuts.vdf` que você viu acima.

:::dica
Combine dois filtros para economizar espaço: filtre por **instalado** + **tamanho maior que 15 GB** e ordene por tamanho descendo. Você verá imediatamente os "gigantes" que estão ocupando o SSD — candidatos a mover para o cartão SD.
:::

## Lendo o playtime dos logs

O playtime que aparece por jogo não é só um número decorativo. Ele vem de duas fontes: o servidor da Valve (sync de nuvem) e os logs locais do cliente. Os logs vivem em `~/.steam/steam/logs`, e há muita coisa interessante ali:

```terminal
$ ls -lh ~/.steam/steam/logs | head -12
total 18M
-rw-r--r-- 1 deck deck 3.2M Aug 15 09:40 bootstrap_log.txt
-rw-r--r-- 1 deck deck 2.1M Aug 15 09:40 content_log.txt
-rw-r--r-- 1 deck deck 872K Aug 15 09:40 controller.txt
-rw-r--r-- 1 deck deck 4.5M Aug 15 09:40 console-linux.txt
-rw-r--r-- 1 deck deck 1.1M Aug 15 09:40 stats_log.txt
-rw-r--r-- 1 deck deck 640K Aug 15 09:40 cloud_log.txt
```

O `stats_log.txt` registra eventos de sessão; dá para garimpar o tempo de jogo realmente registrado por lá:

```terminal
$ grep -iE 'playtime|played|session' ~/.steam/steam/logs/stats_log.txt | tail -8
[2025-08-15 09:14:22] RecordSteamControllerIntervalLengths
[2025-08-15 09:18:40] Playstats for app 4000 updated. Playtime 34 minutes. Total 3472 minutes.
[2025-08-15 09:18:40] Uploading playstats for app 4000
[2025-08-15 09:18:41] Playstats upload complete for app 4000
```

Repare no fluxo: o cliente calcula `Playtime` localmente, sobe (`Uploading`) para os servidores, e confirma (`upload complete`). É por isso que, sem internet, o playtime local continua contando, mas a nuvem só é atualizada depois. E é também por isso que às vezes o número no Deck e o número no celular (aplicativo Steam) divergem por algumas horas: um está barrado na fila de upload.

:::nota
O `console-linux.txt` é o equivalente ao console do Steam no desktop — ele despeja *tudo*: erros de renderização, versões de Proton, avisos de drivers. É o primeiro arquivo a abrir quando um jogo não abre. O `controller.txt` é específico do input (analógico, giroscópio, layout do Steam Input), e o `cloud_log.txt` refere-se exclusivamente à sincronização de saves na nuvem.
:::

## Resumo

- `libraryfolders.vdf` lista as pastas de biblioteca (SSD interno e cartão SD) e o `appid`/tamanho de cada jogo em cada uma.
- Mover um jogo entre bibliotecas reescreve esse `.vdf` e move os arquivos de `common/`.
- Coleções dinâmicas são filtros salvos; coleções estáticas são montadas na mão.
- Coleções, favoritos e atalhos ficam no `localconfig.vdf` e `shortcuts.vdf` dentro de `userdata/<steamid>/config`.
- Filtros de estado, gênero e compatibilidade ordenam a biblioteca sem tocar em disco.
- O playtime é calculado localmente e sincronizado; os logs em `~/.steam/steam/logs` revelam esse fluxo.

## Exercícios

1. Abra `~/.steam/steam/steamapps/libraryfolders.vdf` e liste todas as bibliotecas com seu caminho e a contagem de `appid`s de cada uma.
2. Crie uma coleção dinâmica no Modo Jogo com a regra "gênero RPG" e verifique, com `grep`, se ela aparece referenciada no `localconfig.vdf`.
3. Encontre os três maiores jogos instalados ordenando por tamanho (`SizeOnDisk` nos `.acf` ou o valor em `libraryfolders.vdf`), comparando com o filtro "instalado + tamanho" da interface.
4. Use `grep -iE 'playtime|played' ~/.steam/steam/logs/stats_log.txt` e identifique o último appid que registrou sessão e por quantos minutos.
5. **Desafio.** Adicione um atalho não-jogo (qualquer executável do desktop) e observe o que muda no `shortcuts.vdf`. Depois relacione: por que esse atalho aparece como "jogo" na biblioteca, mesmo não tendo `appmanifest_*.acf`?
