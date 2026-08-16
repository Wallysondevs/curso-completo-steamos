Até aqui, o Animation Changer apareceu como uma vitrine bonita. Agora é a hora de abrir a porta dos fundos e ver a casa por dentro: onde cada tema, vídeo e som realmente fica no disco, como o plugin os organiza e que arquivos de configuração amarram tudo. Esse mapa é o que transforma você de "usuário do plugin" em "operador do próprio deck", capaz de consertar sozinho o que a interface não mostra.

:::objetivos
- Mapear a árvore de diretórios `~/homebrew/` e o papel de cada pasta
- Localizar a pasta de temas/animações e a de sons
- Ler o manifesto `plugin.json` e a configuração de temas
- Diferenciar dados baixados de configuração persistente
:::

## O mapa de `~/homebrew/`

Tudo que o ecossistema Decky toca vive sob `~/homebrew/`. Antes de mexer em qualquer arquivo, vale desenhar o mapa completo:

```terminal
$ tree -L 2 ~/homebrew/ 2>/dev/null || find ~/homebrew/ -maxdepth 2 -type d
/home/deck/homebrew/
├── data/
├── logs/
├── plugins/
│   └── AnimationChanger/
├── services/
└── themes/
```

Cada pasta tem uma função distinta:

| Pasta | Função |
|---|---|
| `plugins/` | Código e assets de cada plugin instalado |
| `data/` | Configuração persistente do pacote Decky e dos plugins |
| `logs/` | Arquivos de log para diagnóstico |
| `services/` | Serviços auxiliares que alguns plugins instalam |
| `themes/` | Temas CSS do próprio Decky (não confundir com animações) |

A distinção entre `plugins/` (código) e `data/` (estado) é o que salva você na hora de um reset: apagar `plugins/AnimationChanger/` remove o plugin, enquanto `data/` guarda suas escolhas. Separar esses dois é a chave para [fazer backup de forma correta na seção 8](#/cap-075/sec-08).

## Dentro do Animation Changer

Dentro da pasta do plugin, a organização revela o que o plugin faz sob demanda:

```terminal
$ ls -la ~/homebrew/plugins/AnimationChanger/
drwxr-xr-x deck deck  4096 Mar  1 12:00 .
drwxr-xr-x deck deck  4096 Mar  1 12:00 ..
-rw-r--r-- deck deck   512 Mar  1 12:00 package.json
-rw-r--r-- deck deck   640 Mar  1 12:00 plugin.json
drwxr-xr-x deck deck  4096 Mar  1 12:00 animations/
drwxr-xr-x deck deck  4096 Mar  1 12:00 sounds/
drwxr-xr-x deck deck  4096 Mar  1 12:00 dist/
drwxr-xr-x deck deck  4096 Mar  1 12:00 src/
```

As duas pastas que importam para o usuário são `animations/` e `sounds/`. É para lá que o plugin baixa os temas quando você clica em "Apply". O `dist/` e o `src/` são o código do plugin em si — frontend compilado e fonte — e, a menos que você vá hackear o plugin, ficam intocados.

```terminal
$ ls ~/homebrew/plugins/AnimationChanger/animations/
deck_startup.webm
sleep.webm
resume.webm
```

Repare que os arquivos baixados têm nomes fixos genéricos (`deck_startup.webm`) e não o nome bonito da galeria. O plugin renomeia o que baixa para esses caminhos canônicos — a configuração aponta para o nome fixo, não para "Meu Tema Nostálgico V3". Isso importa na hora de trocar manualmente: você não precisa editar a configuração, basta substituir o arquivo com o mesmo nome.

## O manifesto `plugin.json`

Todo plugin Decky tem um manifesto. O do Animation Changer define quem é o plugin e que permissões ele pede:

```json
{
  "name": "Animation Changer",
  "author": "TheLogicMaster",
  "flags": ["root"],
  "api_version": 1,
  "publish": {
    "discord_id": "...",
    "description": "Change the boot and suspend animations on your Steam Deck",
    "tags": ["animation", "boot", "customization"],
    "image": "https://..."
  }
}
```

O campo que mais importa para entender o funcionamento é `"flags": ["root"]`. Ele declara que o plugin precisa de elevação de privilégios — por quê? Porque escrever a animação de boot exige gravar em caminhos do sistema (como `/etc/deck/`), fora do alcance do usuário comum. É o mesmo motivo pelo qual o Decky pede uma senha sudo na primeira execução.

:::atencao
Um plugin com a flag `root` pode, em tese, fazer qualquer coisa no sistema — não apenas trocar animações. O Animation Changer é de código aberto e amplamente usado, mas o princípio vale para qualquer plugin: só instale plugins de fontes que você confia, e fique atento a essa flag no manifesto.
:::

## A configuração de temas: o elo final

O arquivo de configuração que amarra o tema escolhido ao sistema não fica na pasta do plugin — fica num caminho do SteamOS. No 3.6 (Noble), o plugin escreve um JSON de temas:

```terminal
$ cat ~/homebrew/plugins/AnimationChanger/.animations.json 2>/dev/null || \
  cat ~/.config/AnimationChanger.json 2>/dev/null
{
  "boot": "deck_startup.webm",
  "suspend": "sleep.webm",
  "resume": "resume.webm",
  "sounds": {
    "boot": "boot.mp3",
    "navigation": "navigation.wav",
    "select": "select.wav",
    "notification": "notification.ogg"
  },
  "randomize": false
}
```

Esse arquivo guarda **qual** tema está ativo na forma de nomes relativos (não caminhos completos). Os nomes apontam para os arquivos dentro de `animations/` e `sounds/`. Trocando o valor de `"boot"` de `deck_startup.webm` para outro nome e colocando o arquivo correspondente na pasta, você troca o tema manualmente — sem passar pela interface.

:::dica
A localização exata do arquivo de configuração variou ao longo das versões do Animation Changer (`~/homebrew/plugins/AnimationChanger/`, `~/.config/`). Para achar o atual no seu deck, use `find ~ -name '*.json' -path '*nimation*' 2>/dev/null` e inspecione os candidatos. Não assuma caminho fixo: confira.
:::

## Dados baixados vs. configuração

Uma distinção final, que domina o tema de backup na seção 8:

- **Dados (vídeos e sons)** — arquivos grandes, baixados da galeria, vivem em `animations/` e `sounds/`. São reproduzíveis: se sumirem, você rebaixa.
- **Configuração (escolhas)** — um JSON pequeno que registra qual tema está ativo. É único e difícil de recriar de memória se você tiver uma coleção grande.

Para um backup eficiente, você quer **ambos**, mas por motivos diferentes: os dados para não depender da rede, e a configuração para não perder a seleção. A seção 8 mostra como empacotar os dois.

```terminal
$ du -sh ~/homebrew/plugins/AnimationChanger/animations/ \
       ~/homebrew/plugins/AnimationChanger/sounds/
112M	animations/
3.4M	sounds/
```

O `du -sh` mostra o tamanho de cada pasta. Repare na desproporção: as animações (vídeos) pesam 112 MB, os sons apenas 3,4 MB. É o reflexo direto da natureza dos formatos — vídeo decodifica frames, áudio é compacto por natureza.

## Resumo

- `~/homebrew/` separa `plugins/` (código), `data/` (estado), `logs/`, `services/` e `themes/`.
- O Animation Changer guarda vídeos em `animations/` e sons em `sounds/`, com nomes canônicos fixos.
- O `plugin.json` declara a flag `root`, que explica a necessidade de senha sudo do plugin.
- A configuração de temas é um JSON que registra nomes relativos, ligando escolha a arquivo.
- Dados (grandes) e configuração (única) exigem estratégias de backup distintas.

## Exercícios

1. Desenhe (no papel ou em texto) a árvore `~/homebrew/` do seu deck com `find ~/homebrew -maxdepth 2` e anote o papel de cada pasta ao lado.
2. Abra o `plugin.json` do Animation Changer e identifique o campo `flags`. Que implicação de segurança ele tem? Cite outro plugin instalado, se houver, e compare as flags.
3. Localize o arquivo de configuração de temas usando `find ~ -name '*.json' -path '*nimation*'` e explique o que cada campo significa.
4. Execute `du -sh` nas pastas `animations/` e `sounds/` e explique por que há tamanha diferença de tamanho entre vídeo e áudio.
5. **Desafio.** Substitua manualmente a animação de boot: renomeie o `deck_startup.webm` atual e coloque outro `.webm` (mesmo formato/resolução) com o nome canônico no lugar. Reinicie e comprove que a troca manual funciona sem tocar na interface do plugin.