Antes de instalar qualquer coisa você precisa descobrir o que existe, e é aí que o terminal ganha do Discover. A interface gráfica serve para navegar pelas categorias, mas quando você sabe o que procura — ou quer conferir versões, IDs e remotos numa tacada só — o `flatpak search` responde mais rápido e devolve informação que a loja esconde. Nesta seção você domina a busca por linha de comando.

:::objetivos
- Entender o que é o Application ID e por que ele importa mais que o nome bonito
- Buscar aplicativos com `flatpak search` e interpretar as colunas
- Filtrar resultados por remoto com `--user`, `--system` e `--columns`
- Localizar o ID exato de um app antes de instalar
:::

## O Application ID vem antes do nome

Todo Flatpak tem dois nomes. O nome amigável ("GIMP", "Firefox", "OBS Studio") é o que aparece na loja. O **Application ID** é o identificador técnico, no estilo de um domínio invertido: `org.gimp.GIMP`, `org.mozilla.firefox`, `com.obsproject.Studio`. É com ele que você instala, remove, consulta e faz downgrade. O nome bonito pode mudar de uma versão para outra ou colidir entre dois aplicativos; o ID nunca muda.

Por isso a primeira regra do Flatpak na linha de comando é: **descubra o ID, não chute o nome**. O comando que faz isso é o `search`, e ele procura tanto no nome quanto na descrição.

```terminal
$ flatpak search gimp
Name        Description                          Application ID       Version    Branch      Remotes
GIMP        Create images and edit photographs   org.gimp.GIMP        2.10.38    stable      flathub
Glimpse     Image editor based on GIMP           org.glimpse_editor.Glimpse 0.2.0 stable flathub
Resynthesizer GIMP plugin for image healing      com.github.bootchk.resynthesizer 2.0.3 stable flathub
```

A coluna `Application ID` é a chave. As outras colunas dão contexto: `Version` é a versão empacotada no remoto, `Branch` é o canal do pacote (quase sempre `stable`), e `Remotes` diz de qual remoto o resultado vem.

## As colunas são configuráveis

O `search` mostra um conjunto padrão de colunas, mas você pode pedir exatamente as que interessam. A opção `--columns` recebe uma lista separada por vírgula. Isso ajuda quando você quer comparar versões ou descobrir em qual remoto cada resultado vive, sem o ruído das descrições longas.

```terminal
$ flatpak search --columns=application,name,branch,remotes firefox
Application ID             Name               Branch   Remotes
org.mozilla.firefox        Firefox            stable   flathub
org.mozilla.firefox.BaseApp Firefox BaseApp   21.08    flathub
org.mozilla.FirefoxESR     Firefox ESR        stable   flathub
```

Repare no `org.mozilla.firefox.BaseApp`: nem tudo que aparece na busca é um aplicativo para você abrir. O Flatpak reutiliza *runtimes* e *base apps* como blocos de construção, e eles também aparecem na busca porque são IDs. Instalar direto o `BaseApp` não faz sentido — só o `org.mozilla.firefox` é o navegador.

:::dica
Para listar apenas resultados de aplicativo, combine o `search` com `grep` filtrando as linhas de runtime e extensão. Padrões como `\.Locale`, `\.Debug`, `\.BaseApp` e `Platform` indicam componentes internos, não apps de usuário.
:::

## Onde a busca está olhando

O `flatpak search` consulta os remotos configurados — por padrão, no SteamOS, o Flathub. Você pode restringir a busca a um remoto específico ou listar os remotos ativos com `flatpak remotes`.

```terminal
$ flatpak remotes
Name    Options
flathub system
```

Sem o Flathub configurado, o `search` devolve uma lista vazia ou um erro, mesmo que o aplicativo exista na internet. A configuração de remotos é assunto da [seção sobre remotes e Flathub beta](#/cap-030/sec-06), mas a busca já te mostra uma pista: a coluna `Remotes` no resultado indica de onde aquele pacote viria se você instalasse agora.

:::nota
A busca funciona também pelo ID parcial. `flatpak search obs` devolve o OBS Studio e qualquer outro pacote cujo ID ou descrição contenha "obs". Como o `search` faz *match* de substring, termos curtos demais (como `flatpak search a`) despejam centenas de resultados — prefira palavras com três ou mais letras.
:::

## Confirmando antes de clicar em instalar

Depois de encontrar o ID, o próximo passo natural é espiar o pacote antes de comprometer disco e banda. O `flatpak info` serve para isso e será aprofundado na [seção sobre listar e inspecionar](#/cap-030/sec-03), mas já vale antecipar a forma mais útil de achar um ID de destino:

```terminal
$ flatpak search --columns=application,video game emulator
```

O atalho mental do capítulo inteiro segue um ciclo: **search** para descobrir o ID, **install** para baixar, **list/info** para inspecionar, **update** para manter, **remove** para desinstalar. A busca é o primeiro elo da corrente, e acertar o ID aqui evita instalar o pacote errado mais adiante.

## Resumo

- Todo Flatpak tem um Application ID (domínio invertido) que é o nome real usado nos comandos, diferente do nome amigável.
- `flatpak search <termo>` procura no nome e na descrição e mostra ID, versão, branch e remoto.
- `flatpak search --columns=...` permite escolher exatamente quais colunas exibir.
- A busca consulta os remotos configurados; sem Flathub ativo, ela devolve nada.
- Resultados como `.BaseApp`, `.Locale` e `Platform` são componentes internos, não aplicativos para abrir.

## Exercícios

1. Rode `flatpak search firefox` e identifique, na coluna `Application ID`, qual é o navegador e quais resultados são componentes internos.
2. Use `flatpak search --columns=application,name,version,branch libreoffice` e explique o que a coluna `branch` representa.
3. Rode `flatpak remotes` e relacione os remotos listados com a coluna `Remotes` de um resultado de busca à sua escolha.
4. Busque por um termo curto, como `flatpak search ae`, e conte quantos resultados aparecem; depois busque por `audacity` e compare a diferença.
5. **Desafio.** Usando apenas `flatpak search` e `grep`, encontre todos os aplicativos de edição de vídeo disponíveis no Flathub (dica: procure por termos como "video edit" e "editor") e monte uma tabela com ID e versão de cada um — sem abrir o navegador.
