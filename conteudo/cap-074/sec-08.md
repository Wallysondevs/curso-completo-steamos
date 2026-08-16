O painel gráfico do CSS Loader é conveniente, mas o terminal dá um controle que a interface não oferece: listar tudo que há, encontrar exatamente qual tema está ativo, copiar, renomear e até clonar um tema para editá-lo. Como temas são apenas arquivos de texto sob `~/homebrew/`, as ferramentas que você já domina — `find`, `grep`, `cp`, `ln` — são a chave para gerenciá-los sem depender do mouse.

:::objetivos
- Listar, contar e inspecionar temas e pacotes por linha de comando
- Localizar o tema ativo lendo o arquivo de configuração
- Copiar, renomear e remover temas com `cp`, `mv` e `rm`
- Entender por que temas não usam symlink e o que isso implica para backup
- Automatizar a busca por temas que mexem em um componente específico
:::

## Enxergando tudo com `find` e `grep`

O terminal revela a totalidade do que está instalado, sem filtros de interface. O ponto de partida é um levantamento dos temas e pacotes:

```terminal
$ ls ~/homebrew/themes/
Art Hero  Clean Gameview  MeuPrimeiroTema  Obsidian  Round
$ ls ~/homebrew/sounds/
Pixel UI  Retro Click
```

Para saber quantos temas há e o total de arquivos que eles somam, o `find` com contagem resolve:

```terminal
$ find ~/homebrew/themes -mindepth 1 -maxdepth 1 -type d | wc -l
5
$ find ~/homebrew/themes -name '*.css' | wc -l
23
```

Cinco temas, vinte e três folhas CSS. Se você quer saber qual tema tem mais CSS (um bom indício de complexidade e risco de quebra), o `find` combinado com `xargs` e `wc` responde:

```terminal
$ find ~/homebrew/themes -name '*.css' -print0 | xargs -0 wc -l
  45  Clean Gameview/gameview.css
  12  Clean Gameview/patches.css
 380  Obsidian/obsidian.css
  15  MeuPrimeiroTema/gameview.css
  30  Round/round.css
 482  total
```

O `-print0` e o `-0` cuidam dos nomes com espaço (como "Clean Gameview"), evitando que o `xargs` quebre o caminho em pedaços errados.

## Descobrindo qual tema está ativo

O CSS Loader guarda o estado em `settings.json`, dentro de `~/homebrew/settings/SDH-CssLoader/`. Ler esse arquivo diz exatamente qual é o perfil ativo e quais temas ele carrega:

```terminal
$ cat ~/homebrew/settings/SDH-CssLoader/settings.json
{
  "active_profile": "Jogo",
  "profiles": [
    { "name": "Limpo", "themes": [] },
    { "name": "Jogo", "themes": ["Clean Gameview", "Art Hero", "Round"] },
    { "name": "Leve", "themes": ["Clean Gameview"] }
  ]
}
```

Sem ferramentas de JSON instaladas, o `python3` do sistema formata a saída e ainda permite consultas pontuais:

```terminal
$ python3 -c "import json; d=json.load(open('$HOME/homebrew/settings/SDH-CssLoader/settings.json')); print('perfil:', d['active_profile']); print('temas:', ', '.join([p['themes'] for p in d['profiles'] if p['name']==d['active_profile']][0]))"
perfil: Jogo
temas: Clean Gameview, Art Hero, Round
```

Este é o jeito confiável de responder "qual tema está ativo agora?" sem abrir o painel — útil quando a própria interface está quebrada e você precisa diagnosticar pelo terminal.

:::atencao
Editar o `settings.json` à mão enquanto o Decky está rodando pode ser sobrescrito pelo plugin, que reescreve o arquivo ao salvar qualquer coisa pelo painel. Para mudar o tema ativo, prefira o painel; use o terminal **apenas para ler** o estado.
:::

## Copiar, renomear e clonar

Como temas são diretórios de texto, as operações de arquivo comuns funcionam por completo. Clonar um tema antes de editá-lo é uma operação de uma linha:

```terminal
$ cp -r ~/homebrew/themes/Obsidian ~/homebrew/themes/ObsidianCopia
$ ls ~/homebrew/themes/ObsidianCopia/
theme.json  obsidian.css
```

O clone carrega o mesmo `name` interno do original, então o CSS Loader pode listá-lo com nome repetido. Para torná-lo um tema distinto, edite o `name` no `theme.json` do clone — caso contrário você terá dois temas homônimos competindo no painel:

```terminal
$ grep '"name"' ~/homebrew/themes/ObsidianCopia/theme.json
  "name": "Obsidian",
```

Renomear é tão simples quanto mover. Para **remover** um tema, basta apagar a pasta — mas primeiro confirme que ele não é referenciado no perfil ativo:

```terminal
$ rm -rf ~/homebrew/themes/ObsidianCopia
$ ls ~/homebrew/themes/
Art Hero  Clean Gameview  MeuPrimeiroTema  Obsidian  Round
```

:::perigo
`rm -rf` apaga sem pedir confirmação e sem lixeira. Antes de remover, confirme o caminho completo e, se tiver dúvida, use `ls` no diretório-alvo. Um `rm -rf ~/homebrew` (raiz errada) derrubaria temas, sons e plugins de uma vez.
:::

## Por que não há symlinks aqui

Quem vem do hábito de "organizar" arquivos pode se perguntar: por que não apontar `~/homebrew/themes/` para um disco externo ou para um repositório git via symlink? Por uma razão prática de como o CSS Loader lê o diretório.

O CSS Loader lista temas **varrendo o conteúdo** de `~/homebrew/themes/`. Na maioria das builds, a varredura segue o diretório real e não aceita bem temas cujo manifesto está atrás de um symlink fora da árvore, ou ignora a resolução em alguns caminhos. Na dúvida, mantenha os temas como **diretórios físicos** sob `~/homebrew/themes/` e use `git` ou `cp` para versionar e fazer backup — não `ln -s`.

```terminal
$ ls -la ~/homebrew/themes/ | grep '\->'
(nada)
```

O fato de quase nenhum tema usar symlink não é coincidência: é o formato que a comunidade adotou por compatibilidade. Se você quer versionar, a prática robusta é inicializar um repositório **fora** de `~/homebrew` e sincronizar com `rsync`, que você verá na [seção de backup](#/cap-074/sec-09).

## Automatizando a inspeção

Quer saber, de uma vez, quais dos seus temas mexem na página do jogo (e que, portanto, vão competir entre si)? O `grep` recursivo pelo `target` dos manifestos responde:

```terminal
$ grep -r '"target"' ~/homebrew/themes/*/theme.json
/home/deck/homebrew/themes/Art Hero/theme.json:  "target": "SP",
/home/deck/homebrew/themes/Clean Gameview/theme.json:  "target": "SP",
/home/deck/homebrew/themes/Obsidian/theme.json:  "target": "SP",
```

Todos os três miram `SP`, então três temas competem nas mesmas páginas — o cenário de conflito descrito na [seção de biblioteca](#/cap-074/sec-04). O `grep` por outras chaves (como `"target": "Keyboard"`) isola rapidamente skins de teclado, e por nomes de evento (`nav_up`) localiza pacotes de som.

## Resumo

- `find` com `-name '*.css'` e `xargs wc -l` revela quantos temas e quantas linhas de CSS existem, incluindo nomes com espaço via `-print0`/`-0`.
- O tema ativo está em `~/homebrew/settings/SDH-CssLoader/settings.json`, no `active_profile`.
- `cp -r`, `mv` e `rm -rf` operam sobre temas, mas remoção exige confirmar o caminho antes.
- Temas vivem como diretórios físicos; symlinks não são recomendados pelo jeito que o CSS Loader varre o diretório.
- `grep -r '"target"'` agrupa temas por página e expõe conflitos entre temas que miram o mesmo alvo.

## Exercícios

1. Conte seus temas e pacotes com `ls`, e depois com `find ~/homebrew/themes -mindepth 1 -maxdepth 1 -type d | wc -l`. Os números batem? Por quê?
2. Liste as linhas de CSS de cada tema com `find ... -print0 | xargs -0 wc -l` e identifique o tema mais complexo.
3. Leia o `settings.json` e extraia, com `python3`, o nome do perfil ativo e seus temas.
4. Clone um tema com `cp -r`, edite o `name` no clone e verifique se ele aparece como entrada distinta no painel. Depois remova o clone com `rm -rf` (confirmando antes o caminho).
5. **Desafio.** Use `grep -r '"target"'` para agrupar seus temas por alvo e, com base no resultado, avalie quais combinações de perfis são seguras (sem dois temas competindo na mesma página). Justifique sua proposta de perfis.
