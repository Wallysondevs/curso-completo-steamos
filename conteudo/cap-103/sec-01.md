O Flatpak é o sistema de empacotamento de aplicações que o SteamOS adotou como principal via de instalação de software gráfico. Diferente do APT, que instala pacotes .deb no sistema, o Flatpak roda cada aplicação numa sandbox com suas dependências isoladas — isso elimina conflitos de bibliotecas e impede que um app malicioso leia seus arquivos sem permissão. Esta seção é um guia de referência rápida: cada tabela cobre uma família de operações, da busca à manutenção.

:::objetivos
- Buscar, instalar e remover aplicações Flatpak com fluência
- Gerenciar repositórios remotos e listar fontes disponíveis
- Diagnosticar permissões de sandbox e ajustá-las quando necessário
- Executar comandos de manutenção para liberar espaço em disco
- Inspecionar metadados e dependências de uma aplicação instalada
:::

## Buscar e instalar

Antes de instalar, você precisa saber o que está disponível. O Flatpak trabalha com **remotes** — repositórios remotos. O SteamOS vem com o Flathub pré-configurado.

```terminal
$ flatpak remotes
Nome     Opções
flathub  system
```

A tabela a seguir cobre as operações de busca e instalação:

| Comando | O que faz |
|---|---|
| `flatpak search firefox` | Busca aplicações cujo nome ou descrição contenha "firefox" |
| `flatpak search --columns=name,description,application firefox` | Busca mostrando colunas específicas |
| `flatpak install flathub org.mozilla.firefox` | Instala o Firefox do Flathub |
| `flatpak install --user flathub org.mozilla.firefox` | Instala só para o usuário atual, sem `sudo` |
| `flatpak install --noninteractive flathub org.mozilla.firefox` | Instala sem perguntar nada (útil em scripts) |
| `flatpak install --reinstall flathub org.mozilla.firefox` | Reinstala mesmo se já estiver presente |
| `flatpak update` | Atualiza todas as aplicações e runtimes |
| `flatpak update org.mozilla.firefox` | Atualiza só uma aplicação específica |

:::dica
`flatpak search` devolve o **Application ID** completo (ex.: `org.mozilla.firefox`). É esse ID que você usa em todos os outros comandos. Não digite "Firefox" no `flatpak install` — ele não vai aceitar.
:::

## Listar, inspecionar e remover

Depois de instalado, você consulta metadados e gerencia o que está no sistema.

```terminal
$ flatpak list --app
Nome                    ID Aplicação                          Versão       Ramo
Firefox                 org.mozilla.firefox                   125.0.3      stable
VLC                     org.videolan.VLC                      3.0.21       stable
GIMP                    org.gimp.GIMP                         2.10.38      stable
```

| Comando | O que faz |
|---|---|
| `flatpak list` | Lista tudo: apps e runtimes |
| `flatpak list --app` | Lista só as aplicações instaladas |
| `flatpak list --runtime` | Lista só os runtimes |
| `flatpak list --columns=name,size,origin` | Lista com colunas personalizadas |
| `flatpak info org.mozilla.firefox` | Mostra metadados completos: versão, licença, permissões |
| `flatpak info --show-permissions org.mozilla.firefox` | Mostra só as permissões da sandbox |
| `flatpak info --show-runtime org.mozilla.firefox` | Mostra qual runtime a aplicação usa |
| `flatpak uninstall org.mozilla.firefox` | Remove a aplicação |
| `flatpak uninstall --unused` | Remove runtimes que nenhuma aplicação usa mais |
| `flatpak uninstall --delete-data org.mozilla.firefox` | Remove o app e apaga dados do diretório `~/.var/app/` |

```terminal
$ flatpak info org.gimp.GIMP
GIMP - Crie imagens e fotografias

          ID: org.gimp.GIMP
         Ref: app/org.gimp.GIMP/x86_64/stable
        Arq.: x86_64
       Ramo: stable
      Origem: flathub
   Instalado: 202,4 MB
...
```

:::atencao
`flatpak uninstall` sem argumentos remove o app mas **não apaga os dados** do usuário em `~/.var/app/<id>/`. Se você reinstalar depois, as configurações voltam. Use `--delete-data` quando quiser partir do zero.
:::

## Executar e gerenciar a sandbox

Aplicações Flatpak rodam isoladas. Você pode executar, forçar encerramento e ajustar permissões.

| Comando | O que faz |
|---|---|
| `flatpak run org.mozilla.firefox` | Executa a aplicação pelo terminal |
| `flatpak run --command=bash org.mozilla.firefox` | Abre um shell dentro da sandbox |
| `flatpak kill org.mozilla.firefox` | Força o encerramento da aplicação |
| `flatpak override --user --socket=x11 org.mozilla.firefox` | Concede acesso ao soquete X11 |
| `flatpak override --user --nosocket=wayland org.mozilla.firefox` | Remove acesso ao Wayland |
| `flatpak override --user --filesystem=home org.mozilla.firefox` | Concede acesso à `$HOME` |
| `flatpak override --user --share=network org.mozilla.firefox` | Concede acesso à rede |
| `flatpak override --user --nofilesystem=~/Documentos org.mozilla.firefox` | Bloqueia acesso a uma pasta |
| `flatpak override --reset org.mozilla.firefox` | Reseta todas as permissões customizadas |
| `flatpak override --show org.mozilla.firefox` | Mostra os overrides atuais |

```terminal
$ flatpak override --show org.mozilla.firefox
[Context]
filesystems=/home/ana/lab;
```

O contexto mostra que o Firefox recebeu acesso extra ao diretório `~/lab` — algo que não está no pacote original. Overrides são cumulativos e persistem entre atualizações.

:::perigo
Conceder `--filesystem=home` ou `--filesystem=host` a uma aplicação remove a principal vantagem do Flatpak: o isolamento. Só faça isso com aplicações em que você confia plenamente e quando a funcionalidade realmente exigir.
:::

## Remotes e fontes de aplicações

Nem tudo está no Flathub. Você pode adicionar repositórios de terceiros ou da própria distribuição.

| Comando | O que faz |
|---|---|
| `flatpak remotes` | Lista remotos configurados |
| `flatpak remotes --show-details` | Lista com URL, prioridade e opções |
| `flatpak remote-add --user meu-remote https://exemplo.com/repo` | Adiciona um novo remoto |
| `flatpak remote-delete meu-remote` | Remove um remoto |
| `flatpak remote-ls flathub` | Lista tudo disponível num remoto |
| `flatpak remote-ls --app flathub` | Lista só aplicações de um remoto |
| `flatpak remote-ls --updates flathub` | Mostra o que tem atualização disponível |
| `flatpak remote-info flathub org.mozilla.firefox` | Inspeciona metadados de um app no remoto |
| `flatpak remote-modify --no-gpg-verify meu-remote` | Desativa verificação GPG (arriscado) |
| `flatpak remote-modify --prio=1 flathub` | Altera prioridade do remoto |

```terminal
$ flatpak remotes --show-details
Nome     Título    URL                                     Opções
flathub  Flathub   https://dl.flathub.org/repo/            system,filtered,prio=1
```

:::nota
O SteamOS 3.6 usa o Flathub como remoto `system` — ou seja, as aplicações ficam disponíveis para todos os usuários. Se você adicionar um remoto com `--user`, ele aparece só para você e não exige `sudo`.
:::

## Manutenção e limpeza

Com o tempo, runtimes antigos e objetos não utilizados acumulam gigabytes. O Flatpak tem ferramentas próprias de faxina.

| Comando | O que faz |
|---|---|
| `flatpak repair` | Verifica e repara a instalação (requer `sudo` para system) |
| `flatpak repair --dry-run` | Simula o reparo sem alterar nada |
| `flatpak uninstall --unused` | Remove runtimes órfãos |
| `flatpak uninstall --delete-data --unused` | Remove runtimes órfãos e seus dados |
| `flatpak history` | Mostra histórico de operações (install, update, remove) |
| `flatpak mask org.mozilla.firefox` | Bloqueia atualizações de uma aplicação |
| `flatpak mask --remove org.mozilla.firefox` | Remove o bloqueio |
| `flatpak document-export ~/lab/relatorio.pdf` | Torna um arquivo acessível dentro da sandbox |
| `flatpak document-unexport ~/lab/relatorio.pdf` | Revoga o acesso |
| `flatpak document-info ~/lab/relatorio.pdf` | Mostra quais apps têm acesso ao arquivo |

```terminal
$ flatpak uninstall --unused
Desinstalando: org.freedesktop.Platform/x86_64/23.08
Desinstalando: org.freedesktop.Platform.GL.default/x86_64/23.08
```

A saída mostra runtimes da branch 23.08 que nenhuma aplicação instalada está usando mais. Em máquinas com SSD pequeno, essa limpeza pode recuperar mais de 1 GB.

## Resumo

- `flatpak search` e `flatpak install` usam o Application ID completo, não o nome amigável
- `flatpak list --app` mostra só aplicações; `flatpak info` revela permissões e runtime
- `flatpak override` ajusta a sandbox por aplicação; use `--show` para auditar antes de mexer
- `flatpak remote-add` traz repositórios de terceiros; remotos `system` afetam todos os usuários
- `flatpak uninstall --unused` é a faxina mais simples e segura para liberar espaço
- `flatpak history` reconstrói o rastro de instalações, útil para diagnosticar regressões

## Exercícios

1. Liste todas as aplicações Flatpak instaladas e anote o Application ID de cada uma. Depois, inspecione as permissões da maior aplicação da lista.
2. Adicione um remoto de testes (use `flatpak remote-add --user teste https://exemplo.com/repo`), liste os remotos com detalhes e depois remova-o.
3. Verifique se há atualizações pendentes com `flatpak remote-ls --updates flathub`. Atualize uma aplicação específica e confira no histórico que a operação foi registrada.
4. Conceda acesso à pasta `~/lab` para uma aplicação via `flatpak override`, verifique com `--show` e depois reverta com `--reset`.
5. **Desafio.** Rode `flatpak list --columns=name,size --runtime | sort -k2 -n -r` para descobrir qual runtime ocupa mais espaço. Investigue com `flatpak info` quais aplicações dependem dele e decida se é seguro removê-lo com `--unused`.