Temas são voláteis por natureza: cada atualização do SteamOS pode invalidar seletores, e cada atualização do CSS Loader pode invalidar manifestos. A diferença entre quem personaliza com alegria e quem vive quebrando a interface é uma rotina de backup e rollback. Esta seção fecha o capítulo com o que toda instalação customizada deveria ter: cópias de segurança, um caminho de volta conhecido e um plano para atualizações.

:::objetivos
- Fazer backup completo de temas, sons e configuração do CSS Loader
- Restaurar uma instalação de temas após quebra ou formatação
- Entender a interação entre atualização do SteamOS, do Decky e dos plugins
- Entrar no modo de segurança e voltar ao padrão de fábrica da interface
- Documentar a configuração para reproduzir o ambiente depois
:::

## O que vale a pena backupear

Nem tudo sob `~/homebrew/` merece o mesmo tratamento. Os temas e sons são dados seus; os plugins são código que pode ser reinstalado. A tabela resume o que copiar e por quê:

| Caminho | Conteúdo | Prioridade |
|---|---|---|
| `~/homebrew/themes/` | Seus temas (e os baixados) | Alta — são dados |
| `~/homebrew/sounds/` | Pacotes de áudio | Alta — são dados |
| `~/homebrew/settings/` | Perfis, variáveis e estado ativo | Alta — configuração |
| `~/homebrew/plugins/` | Binários dos plugins | Baixa — reinstaláveis |

O backup da **configuração** (`settings/`) é o mais fácil de esquecer e o mais doloroso de perder: são os perfis que você montou com cuidado, as variáveis de teclado ajustadas e qual tema estava ativo. Sem ele, você reinstala tudo e ainda precisa reconstruir a configuração à mão.

Um backup completo cabe num `tar` comprimido, o canivete suíço de arquivamento:

```terminal
$ tar -czf ~/deck-temas-$(date +%Y%m%d).tar.gz \
    -C ~/homebrew themes sounds settings
$ ls -lh ~/deck-temas-*.tar.gz
-rw-r--r-- 1 deck deck 2.3M Aug 16 15:40 deck-temas-20250816.tar.gz
```

O `-C ~/homebrew` faz o `tar` mudar para aquele diretório antes de criar o arquivo, então os caminhos internos começam em `themes/`, `sounds/` e `settings/` — o que facilita a restauração em outro lugar. O `$(date +%Y%m%d)` carimba a data no nome, criando um histórico simples de snapshots.

## Restaurando depois da quebra

Há dois cenários de restauração, muito diferentes em gravidade. O primeiro e mais comum: **um tema quebrou a interface**. Aí você não precisa de backup — basta desativar tudo. O segundo: **você reinstalou o SteamOS ou trocou de cartão**, e quer de volta o ambiente que tinha. O `tar` resolve o segundo:

```terminal
$ tar -xzf ~/deck-temas-20250816.tar.gz -C ~/homebrew
$ ls ~/homebrew/themes/
Art Hero  Clean Gameview  MeuPrimeiroTema  Obsidian  Round
```

A extração recria as pastas `themes/`, `sounds/` e `settings/` exatamente como estavam. Mas há um detalhe: a restauração de dados **não reinstala os plugins**. Se você restaurou num SteamOS limpo, o CSS Loader (e o Decky) ainda precisam ser instalados antes de os temas funcionarem — a restauração cobre o *conteúdo*, não o *motor*.

:::atencao
Não restaure `settings/` por cima de uma instalação recém-reinstalada **antes** de instalar o CSS Loader. O plugin cria seu próprio diretório de settings na primeira execução; sobrescrever antes pode ser ignorado ou gerar estado inconsistente. A ordem correta é: instalar Decky e CSS Loader, abrir uma vez, depois extrair o backup.
:::

## Atualizações: a cadeia de dependências

As quebras raramente são culpa do seu tema; são o efeito cascata de três atualizações que não são sincronizadas:

1. A Valve atualiza o **cliente Steam** e renomeia classes CSS.
2. A comunidade atualiza o **Decky Loader** para acompanhar o novo cliente.
3. Os autores atualizam **temas e plugins** para os novos seletores.

Entre o passo 1 e o passo 3 há uma janela em que temas e plugins estão, necessariamente, atrasados em relação ao Steam. É nessa janela que a interface quebra. A sua responsabilidade é só uma: **não atualizar o SteamOS e reclamar dos temas antes de atualizar Decky e plugins**.

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
Updating Decky Loader...
Decky Loader is up to date.
```

Depois de atualizar o Decky, abra o painel e atualize cada plugin. Só então teste os temas. Na maioria dos casos, essa ordem resolve o problema sem tocar em backup nenhum.

## O modo de segurança (volta ao padrão)

Quando a interface trava a ponto de você não conseguir navegar no Decky para desativar um tema, o CSS Loader/Decky oferece um **modo de segurança** que sobe os plugins desativados — deixando a interface de fábrica de volta. O acesso mais comum é segurar uma combinação de botões durante o boot (documentada pelo próprio Decky) ou, quando ainda há navegação, desligar o *toggle* mestre do CSS Loader.

O efeito é o mesmo que você já viu: como temas nunca alteram os arquivos da Valve, desativar o carregador é **restauração instantânea**, sem perda de dados. A interface volta ao padrão funcional e você decide, com calma, qual tema desativar em definitivo.

:::dica
Guarde o procedimento de modo de segurança num lugar que você consiga acessar **sem** a interface do Steam (um lembrete no celular, por exemplo). Quando a tela está preta, a última coisa que você quer é lembrar de cabeça a combinação de botões.
:::

## Documentar para reproduzir

O último hábito profissional é o mais subestimado: anotar o que está instalado, para onde e por quê. Um simples levantamento versionado vira a receita de reconstrução:

```terminal
$ ls ~/homebrew/themes/ > ~/meus-temas.txt
$ ls ~/homebrew/sounds/ > ~/meus-sons.txt
$ cat ~/meus-temas.txt
Art Hero
Clean Gameview
MeuPrimeiroTema
Obsidian
Round
```

Com esses dois arquivos de texto (e o `tar` de backup), você consegue reconstruir o ambiente inteiro em outra máquina ou após uma formatação, mesmo sem lembrar o nome de cada tema. É a diferença entre "eu tinha um tema azul lá" e "sei exatamente o que instalar".

## Resumo

- Backupear `themes/`, `sounds/` e `settings/` cobre todo o estado; plugins são reinstaláveis.
- `tar -czf` cria snapshot comprimido e carimbado com data; `tar -xzf` restaura.
- Uma interface quebrada se resolve desativando o carregador (modo de segurança), sem restaurar backup.
- Quebras de tema são efeito cascata de atualizações em sequência: Steam → Decky → plugins/temas.
- A ordem de restauração importa: instalar o CSS Loader primeiro, depois extrair o backup de settings.

## Exercícios

1. Crie um backup com `tar -czf` de `themes/`, `sounds/` e `settings/` com data no nome, e confira o tamanho com `ls -lh`.
2. Liste o conteúdo do `.tar.gz` com `tar -tzf` e verifique que os caminhos internos começam em `themes/`, `sounds/` e `settings/`.
3. Em um diretório de teste, extraia o backup com `tar -xzf` e confirme que os arquivos voltaram íntegros comparando com `diff -r`.
4. Registre seus temas e sons com os comandos de redirecionamento para `~/meus-temas.txt` e `~/meus-sons.txt`.
5. **Desafio.** Escreva, em ordem, o passo a passo que você executaria para reconstruir seu ambiente de temas num SteamOS recém-formatado, deixando explícita a ordem entre instalar o CSS Loader e restaurar o backup de `settings/`. Justifique a ordem com o que aprendeu sobre a criação do diretório de settings pelo plugin.
