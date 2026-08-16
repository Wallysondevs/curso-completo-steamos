Clicar com o botão direito sobre um arquivo ou um espaço vazio no Dolphin abre um menu cheio de ações — e a maioria delas não é fixa. O Dolphin permite adicionar comandos customizados que aparecem nesse menu, usando os **service menus** do KIO. São arquivos `.desktop` que você coloca numa pasta específica, e o Dolphin os lê e os exibe dinamicamente. É a forma mais direta de estender o gerenciador para o seu fluxo de trabalho.

:::objetivos
- Explorar as ações padrão do menu de contexto do Dolphin
- Criar um service menu simples que executa um comando sobre o arquivo selecionado
- Entender o formato `.desktop` e as variáveis de substituição (`%f`, `%F`, `%u`)
- Instalar e testar service menus da comunidade
- Distinguir ações que operam sobre arquivos, diretórios ou ambos
:::

## O menu de contexto padrão

O menu de contexto do Dolphin reage ao que está selecionado. Sobre um arquivo, ele oferece abrir com o aplicativo associado, abrir com outro programa, cortar, copiar, renomear (`[[F2]]`), mover para lixeira (`[[Del]]`), apagar permanentemente (`[[Shift+Del]]`), compactar, propriedades e ações. Sobre um espaço vazio, ele oferece criar nova pasta, criar novo arquivo, colar, personalizar a visualização.

```terminal
$ dolphin ~/lab
## Clique com botão direito num arquivo .txt
## Menu mostra: "Abrir com Kate", "Compactar", "Propriedades", etc.
## Clique com botão direito num espaço vazio
## Menu mostra: "Criar nova pasta", "Colar conteúdo da área de transferência"
```

As ações do menu vêm de duas fontes: as nativas do Dolphin (hardcoded) e os service menus instalados como arquivos `.desktop`. Os nativos cobrem as operações triviais; os service menus são o sistema de plugins do menu de contexto.

## Service menus: o formato

Um service menu é um arquivo de texto com extensão `.desktop`, colocado em `~/.local/share/kio/servicemenus/`. Ele segue o formato de desktop entry do FreeDesktop.org, com algumas chaves extras específicas do KIO.

```
[Desktop Entry]
Type=Service
ServiceTypes=KonqPopupMenu/Plugin
MimeType=text/plain;text/markdown;
Actions=contarLinhas
X-KDE-Priority=TopLevel

[Desktop Action contarLinhas]
Name=Contar linhas
Icon=accessories-text-editor
Exec=wc -l %F
```

O exemplo acima cria uma ação chamada "Contar linhas" que aparece no menu de contexto de qualquer arquivo de texto (MIME `text/plain` ou `text/markdown`). Quando clicada, ela executa `wc -l` sobre os arquivos selecionados e o resultado aparece numa notificação do KDE.

```terminal
$ mkdir -p ~/.local/share/kio/servicemenus/
$ nano ~/.local/share/kio/servicemenus/contar-linhas.desktop
## Cole o conteúdo do bloco acima, salve e saia
## Abra o Dolphin, clique com botão direito num .txt
## "Contar linhas" aparece no menu
```

As variáveis de substituição são a chave para service menus úteis:

| Variável | Significado |
|---|---|
| `%f` | Caminho de um único arquivo |
| `%F` | Lista de caminhos (para seleção múltipla) |
| `%u` | URL de um único arquivo |
| `%U` | Lista de URLs |
| `%d` | Caminho do diretório onde o menu foi acionado |

Use `%F` quando a ação deve processar todos os arquivos selecionados de uma vez (como `wc -l`), e `%f` quando a ação deve ser aplicada a cada arquivo individualmente (o KDE chama o comando uma vez por arquivo).

:::dica
A chave `X-KDE-Priority=TopLevel` faz a ação aparecer no primeiro nível do menu, sem ficar aninhada dentro de um submenu "Ações". Sem ela, a ação some dentro de um submenu que exige mais um clique para ser alcançada — ok para ações raras, irritante para as frequentes.
:::

## Exemplos de service menus úteis

Três exemplos práticos que resolvem dores reais do dia a dia no Steam Deck:

**"Editar como root"** — abre um arquivo de sistema no editor de texto com privilégios:

```
[Desktop Entry]
Type=Service
ServiceTypes=KonqPopupMenu/Plugin
MimeType=text/plain;
Actions=editarRoot
X-KDE-Priority=TopLevel

[Desktop Action editarRoot]
Name=Editar como root
Icon=dialog-password
Exec=kate %f
```

Note que o `Exec` não tem `sudo` diretamente: o KDE usa o `kdesu` ou `pkexec` para elevar privilégios, dependendo da configuração. Para isso funcionar para arquivos de sistema, use `Exec=pkexec kate %f`.

**"Converter para PDF"** — usa o LibreOffice em linha de comando:

```
[Desktop Entry]
Type=Service
ServiceTypes=KonqPopupMenu/Plugin
MimeType=application/vnd.oasis.opendocument.text;
Actions=converterPdf
X-KDE-Priority=TopLevel

[Desktop Action converterPdf]
Name=Converter para PDF
Icon=application-pdf
Exec=libreoffice --headless --convert-to pdf --outdir %d %F
```

Aqui `%d` é o diretório onde o menu foi acionado, e `%F` é a lista de arquivos selecionados. O LibreOffice processa cada `.odt` e gera um PDF no mesmo diretório.

**"Criar checksum SHA256"** — gera um arquivo `.sha256` ao lado do original:

```
[Desktop Entry]
Type=Service
ServiceTypes=KonqPopupMenu/Plugin
MimeType=all/all;
Actions=sha256sum
X-KDE-Priority=TopLevel

[Desktop Action sha256sum]
Name=Criar SHA256
Icon=utilities-file-archiver
Exec=konsole --hold -e sh -c 'sha256sum %F | tee %d/checksum.sha256'
```

O `konsole --hold -e` abre um terminal, executa o comando e mantém a janela aberta para você ver a saída — útil para ações cujo resultado precisa ser lido ou copiado.

## Instalando service menus da comunidade

Além de escrever os seus, você pode instalar pacotes que já vêm com service menus:

```terminal
$ pacman -Ss servicemenu
extra/kde-servicemenu-encrypt 1.0-1
    KDE service menu for encrypting/decrypting files
extra/kde-servicemenu-root-actions 1.1.0-1
    Root actions for Dolphin
```

O pacote `kde-servicemenu-root-actions` adiciona ações de root no menu de contexto (abrir como administrador, editar como root, etc.). Depois de instalar, reinicie o Dolphin ou execute `kbuildsycoca5` para recarregar o cache de service menus.

```terminal
$ sudo pacman -S kde-servicemenu-root-actions
$ kbuildsycoca5
## Reinicie o Dolphin: clique com botão direito sobre qualquer arquivo de sistema
## "Abrir como administrador" e "Editar como root" aparecem no menu
```

O `kbuildsycoca5` reconstrói o cache de serviços do KDE. É necessário sempre que você altera ou instala arquivos `.desktop` manualmente (os pacotes fazem isso no pós-instalação, mas edições manuais exigem o comando).

## Resumo

- O menu de contexto do Dolphin combina ações nativas com service menus definidos como arquivos `.desktop` em `~/.local/share/kio/servicemenus/`.
- Service menus usam o formato de desktop entry com `ServiceTypes=KonqPopupMenu/Plugin`, `Actions=` e `[Desktop Action ...]`.
- As variáveis `%f`, `%F`, `%u`, `%U` e `%d` permitem passar caminhos e URLs dos arquivos selecionados ao comando.
- `X-KDE-Priority=TopLevel` coloca a ação no nível principal do menu, sem submenu intermediário.
- `kbuildsycoca5` reconstrói o cache de serviços para que novos menus apareçam sem reiniciar o sistema.

## Exercícios

1. Crie um service menu em `~/.local/share/kio/servicemenus/meu-primeiro.desktop` que exiba o tamanho de um arquivo com `du -h %f`. Teste com um arquivo grande.
2. Modifique o service menu do exercício 1 para usar `%F` em vez de `%f`. Selecione vários arquivos e compare o comportamento.
3. Instale `kde-servicemenu-root-actions` e use a ação "Editar como root" sobre `/etc/hostname`. Confirme que o Kate abriu o arquivo com privilégios elevados.
4. Apague todos os service menus criados e reinstale com os exemplos da seção. Execute `kbuildsycoca5` e confirme que os menus reaparecem.
5. **Desafio.** Escreva um service menu que execute um script Bash recebendo `%F`, coloque o script em `~/bin/minha-acao.sh`, torne-o executável (`chmod +x`) e faça o service menu apontar para ele. Dentro do script, use `$@` para iterar sobre os arquivos recebidos.