Nem todo problema do Decky se resolve desativando um plugin. Há uma classe de falhas mais profunda: o serviço `plugin_loader` desaparece depois de uma atualização do SteamOS, o carregador instala mas não injeta a interface, a versão do Decky é incompatível com o Steam Client recém-atualizado, ou a instalação ficou num estado meio-instalado que nem funciona nem desinstala limpo. Esta seção trata desses casos de borda, do mais simples ao mais invasivo — sempre com o objetivo de restaurar o sistema sem formatar o deck.

:::objetivos
- Diagnosticar e reparar o serviço `plugin_loader` ausente ou quebrado
- Reinstalar o Decky por cima de uma instalação corrompida
- Resolver incompatibilidade entre a versão do Decky e a do Steam Client
- Desinstalar e reinstalar de forma limpa quando o estado ficou inconsistente
- Conhecer o protocolo de recuperação quando nada mais funciona
:::

## O serviço sumiu depois de uma atualização do SteamOS

O sintoma clássico pós-atualização: o Decky funcionava, o SteamOS atualizou, e agora a aba não aparece mais. A primeira suspeita é que o serviço não está mais registrado — algumas atualizações do SteamOS mexem no diretório de unidades do systemd de usuário.

```terminal
$ systemctl --user status plugin_loader --no-pager
Unit plugin_loader.service could not be found.
```

Se a unidade não existe mais, não há o que reiniciar. Verifique se o arquivo da unidade ainda está no disco:

```terminal
$ ls ~/.config/systemd/user/plugin_loader.service
ls: cannot access '/home/deck/.config/systemd/user/plugin_loader.service': No such file or directory
```

O arquivo sumiu. O Decky (os binários em `~/homebrew/services/`) pode ainda estar lá, mas sem a unidade o systemd não sabe como subi-lo. Nesse caso, o remédio é **reinstalar o Decky**, porque o instalador recria a unidade e suas dependências:

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
```

Reinstalar por cima não apaga os plugins instalados em `~/homebrew/plugins/` nem as configurações em `settings/`. É uma operação de baixo risco — o instalador só repõe o que está faltando (binários, unidade, links).

:::nota
Reinstalar o Decky é diferente de desinstalar e instalar do zero. Na reinstalação "por cima", o instalador detecta os artefatos existentes e só repara o que falta, preservando plugins e configurações. No ciclo completo (uninstall → install), os plugins também sobrevivem se você não apagar `~/homebrew/`, mas a etapa extra raramente é necessária.
:::

## Instala mas não injeta a interface

O segundo cenário comum: o instalador roda até o fim sem erro, o `plugin_loader` fica `active (running)`, mas a aba do Decky não aparece no Menu Rápido. Isso é quase sempre incompatibilidade de **versão** — o Decky carrega, mas o ponto de injeção no Steam Client mudou e ele não acha onde se encaixar.

Confirme o cenário olhando a versão do Steam Client e a versão do Decky:

```terminal
$ cat ~/.local/share/Steam/steamapps/steam.sqlite 2>/dev/null | strings | grep -i "build" | head -5
```

Mais simples, registre a versão do Decky que o carregador reporta:

```terminal
$ cat ~/homebrew/data/decky_loader.json 2>/dev/null
{"version": "3.1.5", "commit": "1f2a3b4"}
```

E compare com a última versão estável no repositório. O caso típico: a Valve lançou um Steam Client beta, você está no canal beta, e o Decky ainda não suporta aquela compilação. As opções:

1. **Atualizar o Decky** para a última versão (ou pré-release, se você está no beta do Steam).
2. **Sair do canal beta do Steam** (Configurações → Sistema → Participação em beta) e esperar o Steam Client estável.

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
```

Como o instalador sempre baixa a última release, rodar de novo é também o mecanismo de atualização manual do Decky quando o canal de auto-update falha.

:::info
O Decky tem auto-atualização, mas ela só segue o canal que você escolheu na instalação (release ou pré-release). Se você instalou a estável e o Steam Client está no beta, o auto-update do Decky não vai acompanhar o ritmo do beta — você precisa instalar a pré-release do Decky manualmente ou sair do beta. Esse desalinhamento de canais é uma das fontes mais comuns de "o Decky parou do nada".
:::

## O estado meio-instalado: desinstalar limpo

Quando a instalação foi interrompida no meio (quedas de energia, rede caiu durante o download, `Ctrl+C` no curl), o Decky pode ficar num estado inconsistente: binários pela metade, unidade registrada mas `failed`, pastas com permissão errada. O caminho limpo é desinstalar e reinstalar do zero.

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/uninstall.sh | sh
$ systemctl --user daemon-reload
$ systemctl --user reset-failed plugin_loader 2>/dev/null
$ rm -rf ~/homebrew/services/ ~/homebrew/data/decky_loader* 2>/dev/null
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
```

A sequência: desinstala formalmente (remove unidade e links), recarrega o daemon, limpa o estado de falha do systemd, remove os binários residuais e reinstala. Ao contrário da reinstalação "por cima", aqui há uma etapa de limpeza entre os dois, o que corrige estados que a reinstalação simples não pega.

:::perigo
A linha `rm -rf ~/homebrew/services/ ...` remove os binários do carregador. Sem eles o Decky não funciona até você reinstalar. Só execute essa linha como parte da sequência completa acima, nunca isoladamente. E note que ela **preserva** `~/homebrew/plugins/` e `settings/` — seus plugins não são apagados por esta limpeza.
:::

## Conflito com outros homebrew ou versões antigas

Uma fonte de dor menos óbvia: instalações antigas do Decky (anteriores à migração para `~/homebrew/`) ou outros utilitários do ecossistema SteamDeckHomebrew podem ter deixado resíduos que conflitam. O Decky antigo morava em `~/.local/share/Steam/steamui/` ou em locais hoje abandonados.

```terminal
$ ls ~/.local/share/Steam/steamui/ 2>/dev/null | head
$ ls ~/.steam/ 2>/dev/null
```

Se existirem diretórios `decky-loader/` ou `PluginLoader/` em locais antigos, eles podem ser carregados por códigos residuais e entrar em conflito com o `~/homebrew/`. O procedimento é remover os resíduos antigos **após** confirmar que a versão nova está funcional:

```terminal
$ ls ~/.local/share/Steam/steamui/decky-loader/ 2>/dev/null && \
  echo "resíduo antigo encontrado — revisar antes de remover"
```

A palavra de ordem aqui é prudência: identifique antes, remova depois, e só o que for claramente resíduo do Decky antigo — nunca apague indistintamente a pasta do Steam.

## O protocolo final de recuperação

Se nada acima resolveu — serviço ok, versão alinhada, reinstalação feita, mas o Decky continua quebrado — resta um protocolo de recuperação que isola o problema das extensões de terceiros:

1. **Esvazie os plugins** movendo tudo para fora (não apague ainda, você pode restaurar):

```terminal
$ mkdir -p ~/homebrew/plugins-disabled/
$ mv ~/homebrew/plugins/*/ ~/homebrew/plugins-disabled/
$ systemctl --user restart plugin_loader
```

2. **Teste o Decky vazio.** Sem nenhum plugin, a aba aparece? Se sim, o problema era um plugin — retorne-os um a um (ou por bissecção, seção 7) até achar o culpado.

3. **Se nem vazio funciona**, o problema está no carregador ou no Steam Client. Reinstale o Decky (acima) e, se persistir, saia do canal beta do Steam e aguarde uma atualização do Decky compatível.

4. **Último recurso**, antes de qualquer coisa drástica: registre o bug no repositório oficial (github.com/SteamDeckHomebrew/decky-loader/issues) com a versão do Steam Client e do Decky, e o trecho relevante de `journalctl --user -u plugin_loader`.

```terminal
$ systemctl --user status plugin_loader --no-pager | head
$ cat ~/homebrew/data/decky_loader.json 2>/dev/null
$ journalctl --user -u plugin_loader --since "1 hour ago" --no-pager | tail -40
```

Essas três saídas são exatamente o que o mantenedor vai pedir. Coletá-las antes de abrir o issue economiza uma troca de mensagens.

## Resumo

- Se `plugin_loader.service` sumiu após uma atualização, reinstale o Decky por cima: o instalador recria a unidade sem apagar plugins.
- Instala sem injeção de interface costuma ser incompatibilidade de versão (canal beta do Steam vs. versão do Decky) — alinhe os dois.
- Estado meio-instalado exige o ciclo completo desinstalar → limpar resíduos → reinstalar.
- Resíduos de versões antigas do Decky (em `steamui/` etc.) podem conflitar; identifique antes de remover.
- O protocolo final isola testando o Decky vazio (sem plugins) e, se necessário, reporta o bug com versão + journal.

## Exercícios

1. Simule a perda da unidade movendo `plugin_loader.service` para `/tmp`, rode `systemctl --user daemon-reload` e observe `systemctl --user status plugin_loader`. Depois restaure o arquivo e recarregue.
2. Instale o Decky por cima de si mesmo com o `install_release.sh` e confirme que seus plugins e configurações permaneceram intactos (compare `ls ~/homebrew/plugins/` antes e depois).
3. Desative todos os plugins de uma vez (mova para `plugins-disabled/`), reinicie e confirme que o Decky "vazio" funciona. Reative um a um e anote o comportamento.
4. Verifique se há resíduos de instalação antiga no seu deck (`~/.local/share/Steam/steamui/`, `~/.steam/`) e classifique cada achado como "resíduo do Decky" ou "outra coisa".
5. **Desafio.** Produza relatório de bug completo para um problema fictício: colete a versão do Decky, a versão do Steam Client, o estado do serviço e as últimas 40 linhas do journal, e escreva o texto do issue como faria no GitHub. Que informação o mantenedor ainda precisaria que você não coletou?
