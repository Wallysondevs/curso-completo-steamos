Depois que a biblioteca está gerada, o trabalho não termina: ROMs entram e saem, emuladores mudam de versão, e o `shortcuts.vdf` acumula entradas órfãs. Um atalho que aponta para uma ROM apagada, ou para um emulador desinstalado, é um item morto que só serve para poluir. Esta seção encerra o capítulo cobrindo a manutenção contínua, a limpeza de atalhos e o diagnóstico dos problemas mais comuns.

:::objetivos
- Manter a biblioteca emulada consistente ao adicionar e remover ROMs
- Remover atalhos órfãos sem quebrar o `shortcuts.vdf`
- Fazer backup e restauração da configuração do SRM e do Steam
- Diagnosticar os erros mais comuns de geração e exibição
- Entender o fluxo completo de regeneração após mudanças
:::

## O ciclo de vida de um atalho

Um atalho gerado pelo SRM tem três momentos na sua vida útil, e cada um pede uma ação de manutenção diferente:

| Momento | Situação | Ação |
|---|---|---|
| Nasceu | ROM adicionada, atalho gerado | Nada — está funcionando |
| Viveu | ROM existe, emulador instalado | Nada — apenas use |
| Morreu | ROM apagada ou emulador trocado | Remover o atalho órfão |

O SRM não "sincroniza" de forma bidirecional: ele só **adiciona**. Se você apagar uma ROM do disco, o atalho correspondente continua lá, apontando para um arquivo que não existe mais. Clicar nele faz o emulador abrir e fechar em silêncio — o sintoma clássico de ROM removida sem limpeza do atalho.

```terminal
$ ls ~/Emulation/roms/snes/ | wc -l
2
$ grep -c 'AppName' ~/.steam/steam/userdata/367540/config/shortcuts.vdf
3
```

Dois arquivos de ROM na pasta, mas três atalhos gravados: há um atalho órfão. A regra simples é revisar a contagem sempre que mexer nas ROMs.

## Removendo atalhos órfãos

Existem dois caminhos para remover um atalho indesejado: pela interface do Steam ou regenerando a lista inteira com o SRM.

**Pela interface do Steam** é imediato para casos isolados: clique com o botão direito no atalho → Gerenciar → Remover atalho não-Steam. O Steam remove a entrada do `shortcuts.vdf` (e deixa a arte órfã na pasta `grid/`, inofensiva mas acumulável).

**Regenerando com o SRM** é o caminho limpo para mudanças em lote: você remove o atalho indesejado da geração (excluindo a ROM do parser ou desligando a plataforma) e gera de novo. O ponto-chave é que o SRM **substitui** a lista de atalhos daqueles parsers na geração — na prática, gerar de novo reconstrói os atalhos das plataformas ativas a partir do zero.

:::atencao
O SRM, ao gerar, pode reescrever o `shortcuts.vdf` do zero para os parsers que ele controla. Isso significa que atalhos que você criou *na mão* (fora do SRM) podem ser sobrescritos ou embaralhados. Por isso, antes de qualquer regeneração grande, tenha o backup do `shortcuts.vdf` — a mesma regra de sempre.
:::

## Backup e restauração

Um Steam Deck com a biblioteca emulada funcionando é o resultado de horas de ajuste. Vale protegê-lo com backups de dois alvos:

```terminal
$ mkdir -p ~/backups
$ cp ~/.steam/steam/userdata/367540/config/shortcuts.vdf ~/backups/shortcuts.vdf
$ cp -r ~/.steam/steam/userdata/367540/config/grid ~/backups/grid
```

O primeiro backup protege a lista de atalhos; o segundo, todas as imagens. Restaurar é o inverso, com o Steam fechado:

```terminal
$ cp ~/backups/shortcuts.vdf ~/.steam/steam/userdata/367540/config/shortcuts.vdf
$ cp -r ~/backups/grid ~/.steam/steam/userdata/367540/config/
```

A própria configuração do SRM (seus parsers, filtros e ajustes) também merece backup. Ela vive numa pasta do aplicativo Flatpak ou num arquivo de configuração que o SRM exporta pela interface ("Exportar configuração"). Vale fazer essa exportação de tempos em tempos.

:::dica
Automatize o backup com uma linha agendada, já que o conteúdo é pequeno. Um simples `tar` dos dois alvos já cobre 99% do risco:

```terminal
$ tar czf ~/backups/steam-emu-$(date +%F).tgz \
  ~/.steam/steam/userdata/367540/config/shortcuts.vdf \
  ~/.steam/steam/userdata/367540/config/grid
```
:::

## Diagnóstico dos erros comuns

A maioria dos problemas do SRM se encaixa em uma tabela curta. Ter ela à mão acelera qualquer correção:

| Sintoma | Causa provável | Correção |
|---|---|---|
| Gerei, mas nada apareceu | Steam estava aberto | Feche o Steam, gere de novo |
| Preview vazio | Caminho da fonte errado ou glob não casa | Confira a pasta das ROMs |
| Jogo abre e fecha | ROM apagada ou emulador trocado | Valide o comando no terminal |
| Sem arte em tudo | Sem chave de API (rate limit) ou fonte errada | Configure a chave, ajuste a fonte |
| Capa errada | Título de busca ambíguo | Corrija o título de busca |
| Dois jogos com a mesma capa | Rótulos idênticos (colisão de ID) | Diferencie os títulos |

O fluxo de diagnóstico recomendado é sempre partir do comando: pegue o `LaunchOptions` do atalho problemático no `shortcuts.vdf`, cole no terminal e veja o erro.

```terminal
$ cat ~/.steam/steam/userdata/367540/config/shortcuts.vdf | grep -A2 'LaunchOptions' | head -5
"LaunchOptions" "-L \"/home/deck/.../cores/snes9x_libretro.so\" \"/home/deck/Emulation/roms/snes/F-Zero.smc\""
```

Se o terminal disser "No such file or directory", a ROM sumiu — apague o atalho. Se disser que o core não carregou, o RetroArch mudou de versão — regenere os atalhos com o caminho novo.

## O fluxo completo de regeneração

Para fechar, o ciclo completo que você repetirá sempre que a biblioteca mudar:

1. **Mexa nas ROMs** (adicione ou remova da pasta).
2. **Feche o Steam**.
3. **Abra o SRM**, ajuste parsers se necessário.
4. **Rode o parse** e valide o preview (título, comando, arte).
5. **Faça backup** do `shortcuts.vdf` rápido.
6. **Gere** e confirme com `diff` ou `grep -c`.
7. **Abra o Steam** e confira a biblioteca.

Dominar esse ciclo — e não apenas decorar os botões — é o que separa quem usa o SRM de quem sofre com ele. Você já tem todas as peças; agora é integrá-las.

:::info
O SRM é software vivo: novas versões mudam ocasionalmente a localização de opções e o formato do `shortcuts.vdf`. Sempre confira a [documentação oficial](https://github.com/SteamGridDB/steam-rom-manager) e o wiki do EmuDeck quando algo parecer diferente do que este capítulo descreve.
:::

## Resumo

- O SRM só adiciona atalhos; remover ROMs deixa atalhos órfãos que precisam de limpeza manual.
- Atalhos órfãos podem ser removidos pelo Steam (caso a caso) ou por regeneração (em lote).
- Backups do `shortcuts.vdf` e da pasta `grid/` (e da config do SRM) são o seu desfazer.
- O diagnóstico começa sempre pelo comando do atalho, colado no terminal.
- Geração sem efeito é quase sempre Steam aberto na hora do save.
- O fluxo completo — ROMs → fecha Steam → parse → preview → backup → gerar → confere — é a rotina de manutenção.

## Exercícios

1. Remova uma ROM de teste da pasta e identifique o atalho órfão comparando as contagens. Remova-o pelo Steam.
2. Crie um backup `tar` do `shortcuts.vdf` e da pasta `grid/` e confira o tamanho do arquivo gerado.
3. Simule um erro: aponte temporariamente um parser para uma pasta vazia e observe o preview vazio. Restaure o caminho.
4. Cole no terminal o `LaunchOptions` de um atalho e registre o que acontece: abriu o jogo ou deu erro?
5. **Desafio.** Reproduza, de forma controlada, o erro "gerei mas não apareceu": deixe o Steam aberto, gere um atalho novo e observe o resultado. Depois feche o Steam, regenere e confirme que o atalho aparece. Documente o porquê em uma frase.