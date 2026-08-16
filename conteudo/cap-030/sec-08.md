Todo `install`, `update`, `remove` e `override` que você executou deixou um rastro. O Flatpak guarda um histórico transacional da sua instalação, e o `flatpak history` lê esse arquivo. É a ferramenta de auditoria e forense do sistema: responde "quando isso foi instalado?", "o que mudou ontem?" e "que commit eu estava usando antes desta quebra?".

:::objetivos
- Ler o histórico transacional com `flatpak history`
- Interpretar as colunas de data, operação e commit
- Filtrar o histórico por tipo de operação
- Usar o histórico como ponte para o downgrade

## O log transacional da instalação

O `history` lê um arquivo de log que o Flatpak mantém em cada instalação (`/var/lib/flatpak/repo/history` para `system`, `~/.local/share/flatpak/repo/history` para `user`). Cada linha registra uma operação atômica — não uma tecla digitada, mas uma mudança de estado concluída.

```terminal
$ flatpak history | head -8
Change                                                      Date/Time
install org.freedesktop.Platform/x86_64/24.08              2024-10-02 14:20:11 +0000
install org.freedesktop.Platform.GL.default/x86_64/24.08   2024-10-02 14:20:19 +0000
install org.gimp.GIMP/x86_64/stable                        2024-10-02 14:20:31 +0000
update org.gimp.GIMP/x86_64/stable                         2024-10-15 09:01:42 +0000
update org.gnome.Platform/x86_64/46                         2024-11-03 18:44:05 +0000
```

A primeira coluna é a operação (`install`, `update`, `uninstall`), seguida do ref completo. A coluna `Date/Time` é o carimbo UTC da operação. Note que runtimes aparecem aqui como entradas próprias — instalar o GIMP gerou três linhas, não uma, porque runtime e extensão de GL são refs independentes.

## O commit em cada linha

O `history` sem argumentos esconde o detalhe mais valioso: o hash do commit. Para ver tudo, use `-v` ou `--verbose`, que revela os commits antigos e novos associados a cada operação:

```terminal
$ flatpak history --verbose | head -4
Change                                                       Date/Time
install org.freedesktop.Platform/x86_64/24.08               2024-10-02 14:20:11 +0000
  new 9d1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b
update org.gimp.GIMP/x86_64/stable                          2024-10-15 09:01:42 +0000
  old 7f1a2b3c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
  new 8e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c
```

Cada `update` mostra um par `old`/`new`: o commit de onde saiu e o para onde foi. É exatamente esse `old` que você alimenta de volta no Flatpak na hora de desfazer uma atualização ruim — a ponte entre o histórico e o downgrade, que é a [próxima seção](#/cap-030/sec-09).

:::nota
O hash é um identificador SHA-256 da build. Ele não é um número de versão legível; ele aponta para um estado exato do pacote no repositório OSTree. Duas builds da "mesma versão" têm commits diferentes se diferirem em qualquer byte.
:::

## Filtrando por operação

Históricos longos são difíceis de escanear a olho nu. O `history` não tem uma flag nativa de filtro por tipo, mas o log é texto puro e casa perfeitamente com `grep`:

```terminal
$ flatpak history | grep '^install'
$ flatpak history | grep '^update'
$ flatpak history | grep '^uninstall'
```

O `^` ancora no começo da linha, evitando falsos positivos (como a palavra "install" aparecendo no meio de um ref). Para um app específico:

```terminal
$ flatpak history | grep 'org.mozilla.firefox'
update org.mozilla.firefox/x86_64/stable                         2024-11-01 10:12:33 +0000
install org.mozilla.firefox/x86_64/stable                        2024-09-20 15:47:08 +0000
```

A ordem é do mais recente para o mais antigo, então a primeira linha é sempre a última coisa que aconteceu com aquele app.

:::dica
Quer saber se o Steam Deck "se atualizou sozinho" enquanto você dormia? `flatpak history | head -20` mostra as operações mais recentes em ordem cronológica. Cruze as datas com o `flatpak info <ID>` para ver quem foi tocado ontem à noite.
:::

## Erros comuns ao ler o histórico

O erro número um é rodar `flatpak history` e receber uma tabela vazia ou só com o cabeçalho. Quase sempre significa que você está olhando a instalação errada, não que "o Flatpak não registrou nada":

```terminal
$ flatpak history
Change   Date/Time
```

Se os seus apps foram instalados com `--user`, o log mora em `~/.local/share/flatpak/repo/history`, e o comando sem flag mira o `system`. A solução é um caractere:

```terminal
$ flatpak history --user
```

O erro número dois é subestimar o volume. Em um Steam Deck usado há meses, o histórico pode ter centenas de entradas (cada update de runtime gera várias linhas). Ler tudo de uma vez é inútil; combine sempre com `head`, `grep` ou `wc -l` para extrair o que interessa.

:::nota
O arquivo de histórico é texto puro e append-only na prática: o Flatpak adiciona linhas, não reescreve o arquivo. Isso significa que `flatpak history` é barato de rodar quantas vezes você quiser, e que o log de um Steam Deck usado por duas pessoas separadas (usuários diferentes) fica em caminhos distintos, sem misturar.
:::

## História por instalação

O `history` também respeita `--user` e `--system`, e cada um tem seu próprio log. Muita gente esquece disso e acha que o histórico está "vazio":

```terminal
$ flatpak history --user | head -4
Change                                                       Date/Time
install org.freedesktop.Platform/x86_64/24.08                2024-10-03 11:08:22 +0000
install org.gimp.GIMP/x86_64/stable                          2024-10-03 11:08:40 +0000
```

Se você instalou tudo com `--user` e roda `flatpak history` sem flag (que mira o `system`), não verá nada. O comando com `--user` revela o log correto. Essa assimetria é uma pegadinha recorrente.

## Resumo

- `flatpak history` lê o log transacional da instalação, registrando cada `install`, `update` e `uninstall`.
- Cada linha traz o ref completo e o carimbo UTC; runtimes e extensões aparecem como entradas próprias.
- `--verbose` revela os commits `old`/`new` de cada `update` — a chave para o downgrade.
- `grep '^install'` (e variações) filtra o histórico por tipo de operação.
- O histórico é separado por instalação: use `--user` para ver o log do usuário, `--system` (ou nada) para o do sistema.

## Exercícios

1. Rode `flatpak history` sem argumentos e depois com `--user`. Compare os dois e explique por que um deles pode estar vazio.
2. Use `flatpak history | grep '^install'` e conte quantos refs distintos foram instalados desde o início.
3. Encontre o último evento de um app específico com `flatpak history | grep '<seu-app>'` e anote a operação e a data.
4. Rode `flatpak history --verbose` e localize um par `old`/`new` de um update. Guarde o valor `old` para usar no exercício de downgrade.
5. **Desafio.** Reconstrua a linha do tempo de um app só: use `flatpak history` e `grep` para extrair todos os eventos dele em ordem cronológica reversa, e depois confirme a versão atual com `flatpak info <ID>` — o que o histórico conta deve bater com o estado presente.