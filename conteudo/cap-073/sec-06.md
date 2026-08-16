Com uma dúzia de plugins instalados, o desafio deixa de ser "adicionar" e passa a ser "governar": quais estão ativos e consumindo memória, quais precisam de atualização, quais estão quebrados e devem ser removidos. O Decky oferece os controles pela interface, mas tudo o que eles fazem se reflete em arquivos e estados no disco — e conhecer o reflexo em disco permite gerenciar plugins até quando a interface está quebrada, que é exatamente quando você mais precisa.

:::objetivos
- Ativar, desativar e recarregar plugins pela interface e pelo disco
- Atualizar plugins da loja e, manualmente, plugins por URL
- Desinstalar plugins preservando ou descartando configurações
- Ler o estado de um plugin a partir dos artefatos em `~/homebrew/`
- Gerenciar a lista de plugins quando o Menu Rápido não abre
:::

## Ativar e desativar: duas camadas de estado

A interface mostra um toggle por plugin. "Desativar" não desinstala — apenas impede que o plugin carregue na próxima inicialização. O ciclo de vida que vimos na seção 3 (descoberta → `_main` → execução → `_unload`) começa ou não começa de acordo com esse estado.

O estado não fica num lugar óbvio. O Decky mantém um mapa de plugins e seus estados ativo/inativo em um arquivo de configuração dentro do próprio `~/homebrew/`:

```terminal
$ cat ~/homebrew/settings/decky.json
{
  "default_store": "https://plugin.steamdeckhomebrew.sh",
  "disabled": [
    "SDH-AnimationChanger"
  ]
}
```

Um plugin listado no array `disabled` não é carregado, mas permanece instalado — código, configuração e tudo. Isso é útil para fazer um diagnóstico de "liga/desliga": desative metade dos plugins para isolar qual deles está travando o Game Mode (técnica da seção 7).

Um plugin ativo, ao ser desativado, passa pelo callback `_unload()` antes de ter seu processo encerrado. É a chance que o plugin tem de fechar arquivos, salvar estado e liberar recursos. Por isso, desativar é sempre preferível a matar o processo na marra com `kill`.

```terminal
$ systemctl --user restart plugin_loader
```

Depois de mexer nos estados pela interface, o Decky já recarrega sozinho na maioria das versões. Se a mudança não fizer efeito, o `restart` acima força o carregador a reler a configuração e aplicar os novos estados.

## Atualizar plugins

Plugins vindos da loja têm atualização pelo Plugin Browser: quando existe versão nova, o card mostra um botão **Atualizar**, e o Decky baixa o código novo, recompila o frontend e recarrega. O `settings/` do plugin não é tocado — por isso você não perde a configuração numa atualização.

Para plugins instalados por URL direta, não há esse botão. A atualização é manual e se resume a re-sincronizar o repositório:

```terminal
$ cd ~/homebrew/plugins/meu-plugin-teste
$ git pull
$ pnpm install && pnpm run build
$ systemctl --user restart plugin_loader
```

Se o plugin foi clonado por cima de uma pasta que o Decky já compilou uma vez, o `git pull` reaplica as mudanças, o `pnpm run build` regenera o `dist/index.js` e o `restart` recarrega o resultado. É o mesmo fluxo de três passos da instalação por URL, repetido.

:::dica
Antes de atualizar, checque qual versão está instalada e qual é a nova. A maioria dos plugins guarda a versão no `package.json` (frontend) e no `plugin.json` (metadata). Compare antes/depois para confirmar que a atualização de fato aconteceu, e não apenas "pareceu".
:::

## Desinstalar: o que fica e o que vai

Desinstalar pela interface remove o código em `~/homebrew/plugins/<nome>/` e chama `_uninstall()` do backend para limpeza adicional. Mas há uma decisão que muita gente descobre tarde: **as configurações podem sobreviver à desinstalação**.

```terminal
$ rm -rf ~/homebrew/plugins/PluginVelho/
$ ls ~/homebrew/settings/PluginVelho/
settings.json
```

Dependendo do plugin e do fluxo de desinstalação, o `settings/PluginVelho/` continua ali, órfão. Isso tem um lado bom — reinstalar o plugin restaura suas preferências — e um lado ruim — lixo acumulado e, em tese, dados sensíveis que você julgava apagados.

Para uma remoção realmente completa:

```terminal
$ rm -rf ~/homebrew/plugins/PluginVelho/ \
         ~/homebrew/settings/PluginVelho/ \
         ~/homebrew/data/PluginVelho/ \
         ~/homebrew/logs/PluginVelho/
```

Os quatro caminhos cobrem código, configuração, dados de runtime e logs. Apagar os quatro remove qualquer vestígio do plugin.

:::atencao
Antes do `rm -rf` de um plugin, confirme que ele não declarou `_uninstall()` com efeitos colaterais externos (alguns plugins removem serviços systemd que criaram, por exemplo). Desinstalar pela interface dispara esse cleanup; apagar a pasta na mão **não** dispara — você pode deixar para trás um serviço órfão. Prefira a desinstalação pela interface quando o Game Mode está funcional, e recorra ao `rm -rf` apenas em emergência.
:::

## Gerenciando quando a interface não abre

O cenário que esta seção quer resolver de verdade: um plugin mal-comportado trava o Menu Rápido inteiro, e você não consegue desativá-lo pela interface. Nessa hora, o disco é seu painel de controle.

A sequência para resgatar o sistema:

```terminal
$ cd ~/homebrew/plugins/
$ ls
meu-plugin-bugado/  SDH-AnimationChanger/  PluginOK/
$ mv meu-plugin-bugado/ ~/homebrew/plugins/.disabled-meu-plugin-bugado
$ systemctl --user restart plugin_loader
```

Renomear a pasta para algo que começa com `.` faz o loader ignorá-la no próximo scan (pastas ocultas não são enumeradas). O plugin "some", o Game Mode volta a responder, e você decide depois entre investigar ou descartar. Alternativamente, mover a pasta para fora de `plugins/` de vez:

```terminal
$ mv ~/homebrew/plugins/meu-plugin-bugado ~/homebrew/plugins-off/
```

O importante é tirar o código do caminho do scan. Reiniciado o serviço, o sistema volta ao normal.

:::dica
Para isolar qual plugin quebra, a bissecção é sua amiga: desative metade, teste; se o problema sumir, o culpado está na metade desativada; repita sobre essa metade. Com 8 plugins, você acha o responsável em no máximo 3 rodadas, em vez de testar um a um.
:::

## Resumo

- Desativar não desinstala: apenas lista o plugin em `disabled` no `decky.json` e impede o carregamento; o código e a configuração permanecem.
- Atualizar pela loja baixa código novo e recompila sem tocar em `settings/`; plugins por URL exigem `git pull` + build + `restart`.
- Desinstalar remove o código mas pode deixar `settings/` órfão; a remoção completa exige apagar as quatro pastas (`plugins`, `settings`, `data`, `logs`).
- Desativar é preferível a `kill` porque dispara `_unload()` e deixa o plugin fechar recursos com segurança.
- Se o Menu Rápido não abre, renomear/mover a pasta do plugin para fora de `plugins/` e reiniciar o serviço é o resgate imediato.

## Exercícios

1. Desative um plugin pela interface e confirme, abrindo `~/homebrew/settings/decky.json`, que ele aparece no array `disabled`. Reative e confirme que saiu da lista.
2. Atualize um plugin da loja até que não reste atualização pendente. Anote a versão antes e depois (veja `package.json`).
3. Instale um plugin por URL, faça uma alteração no `dist/`, e atualize manualmente com `git pull` + build + restart. A alteração sumiu? Por quê?
4. Desinstale um plugin pela interface e liste `~/homebrew/settings/` em busca de pastas órfãs. Remova-as para um teste de limpeza completa.
5. **Desafio.** Provoque uma quebra controlada: instale um plugin, renomeie sua pasta para começar com `.`, reinicie o serviço e verifique que ele desapareceu do Menu Rápido. Depois, restaure o nome e reinicie de novo. Documente cada estado do `plugin_loader` com `systemctl --user status`.