Duas palavras resumem a maioria dos sustos de privacidade com Flatpak: acesso a arquivos. A permissão de filesystem define quais caminhos do seu disco o aplicativo consegue enxergar dentro do sandbox — o resto do sistema simplesmente não existe para ele. Entender essa permissão em detalhe é o primeiro passo concreto para endurecer os apps que você já instalou, porque é aqui que vive a maior superfície de exposição de dados.

No SteamOS, onde usuários instalam Flatpaks para tudo — navegador, cliente de torrent, editor, emulador — controlar o filesystem é controlar diretamente o que seus apps podem ler do seu `~`.

:::objetivos
- Interpretar os valores possíveis da permissão `filesystem` de um Flatpak
- Diferenciar os tokens `home`, `host`, `xdg-*` e caminhos absolutos
- Auditar o acesso a arquivos de um app com `flatpak override` e `flatpak info`
- Remover acessos desnecessários em escopo user ou system
:::

## O vocabulário do filesystem

A permissão de filesystem aceita uma série de "tokens" que representam caminhos ou conjuntos de caminhos. Os mais comuns:

| Token | O que dá acesso |
|---|---|
| `home` | Sua pasta pessoal inteira (`/home/deck`) |
| `host` | Todo o sistema de arquivos do host, incluindo `/etc`, `/usr`, outras homes |
| `xdg-download` | A pasta de downloads do usuário |
| `xdg-documents` | A pasta de documentos |
| `xdg-pictures` | A pasta de imagens |
| `xdg-config` | A pasta `.config` |
| `/caminho/absoluto` | Um caminho específico, literal |
| `~/algumacoisa` | Um caminho relativo à sua home |

Repare na diferença brutal entre `home` e `host`. `home` já é muito amplo, mas `host` é essencialmente "deixei de ser sandbox": dá acesso a praticamente todo o disco, incluído o sistema. Um app com `host` pode ler arquivos de configuração do sistema, outras homes se houver, e qualquer coisa montada.

A forma mais direta de auditar é o `flatpak override --show`, mas os metadados brutos do pacote contam uma história mais completa:

```terminal
$ flatpak info -m org.gimp.GIMP | grep -A6 filesystem
filesystems=~/.config/GIMP;~/.local/share/GIMP;
   xdg-config/GIMP;xdg-pictures;xdg-documents;
   xdg-desktop;xdg-public-share;xdg-download;xdg-music;
```

O `flatpak info -m` mostra exatamente o que o mantenedor declarou quando empacotou o GIMP. Neste exemplo, o app pede a pasta de configuração do GIMP, as pastas `xdg-*` de mídia, mas **não** pede `home` inteiro. É um pacote bem comportado. Compare com a saída de um app genérico, que muitas vezes vem com `filesystems=home;` ou até `host;`.

## Lendo o que o pacote herdou

A diferença entre "o que o pacote pede" e "o que está ativo agora" é central no Flatpak. Quando ninguém altera nada, o app herda as permissões do pacote. A palavra "herdado" (no Flatseal, mostrada como um toggle em estado intermediário) significa exatamente isso: não há override seu; vale o que o pacote declarou.

Isso cria uma consequência importante: se você quer **menos** acesso do que o pacote pede, você escreve um override de remoção. Se quer **mais**, escreve um override de adição. O `--show` renderiza o resultado final (o que vale de fato), mas não diz o que veio de onde.

Para ver os dois lados:

```terminal
$ flatpak info -m org.gimp.GIMP | head -30
```

A saída inclui o bloco `[Context]` com `shared=`, `sockets=`, `devices=`, `filesystems=` — o lado "o que o pacote pediu". Já o `flatpak override --show` mostra o acumulado, incluindo seus overrides. No Flatseal, cada interruptor tem três estados visuais: ligado (você forçou sim), desligado (você forçou não) e herdado (vale o pacote).

:::nota
Um override de remoção não muda o pacote. Ele escreve uma camada separada de configuração que o Flatpak aplica **por cima** dos metadados. Desinstalar o app apaga essa camada; reinstalar traz o pacote de volta ao estado original, sem seus overrides.
:::

## Removendo acesso com override de negação

O comando para remover uma permissão usa o prefixo `--no` junto ao nome da opção. Para tirar o acesso à home de um app que vinha com `filesystems=home`, você faz:

```terminal
$ flatpak override --user --nofilesystem=home org.gimp.GIMP
$ flatpak override --show org.gimp.GIMP | grep filesystems
filesystems=!home;~/.config/GIMP;xdg-pictures;xdg-documents;
```

Repare no `!home` na saída. O ponto de exclamação é a marca do override de negação: ele nega o `home` herdado do pacote, enquanto os demais tokens (que vieram do pacote) continuam valendo. A negação vence a herdado, mas um token explicitamente re-adicionado depois pode reverter isso — a ordem de precedência importa.

O `--user` aplica a mudança só para o seu usuário, sem precisar de `sudo`. Sem `--user`, o Flatpak tenta escrever na instalação de sistema, o que no SteamOS quase sempre pede elevação. A regra prática: use `--user` para mexer nos seus apps e deixar o sistema intocado.

:::atencao
Se você remover um filesystem que o app realmente precisa, o sintoma é sutil: o app abre, mas não consegue carregar uma pasta, salvar um arquivo ou ver seus documentos. Quando algo "sumiu" depois de uma mudança, o override de filesystem é o primeiro suspeito. Reverta com `flatpak override --user --reset <id>` para voltar ao estado herdado.
:::

## O fluxo completo de auditoria no Flatseal

O Flatseal reúne tudo isso numa tela. Na seção **Filesystem**, cada token vira uma linha com toggle. O fluxo recomendado é:

1. Selecione o app e leia o que está herdado.
2. Desligue tudo o que o app não precisa (comece por `Homedir` e `Host`, se houver).
3. Deixe ligado apenas o mínimo: `xdg-download` para um cliente de torrent, por exemplo, ou um caminho específico.
4. Teste o app: abra, salve um arquivo, importe um documento.
5. Se algo quebrou, reative uma permissão por vez até achar o mínimo funcional.

O Flatseal grava cada mudança como um `flatpak override --user` equivalente. Você pode conferir isso sem abrir a GUI: faça a mudança no Flatseal, abra o terminal e rode `flatpak override --show <id>` para ver a linha `filesystems=` atualizada.

## Resumo

- `filesystem` controla quais caminhos o sandbox do Flatpak expõe ao aplicativo.
- `home` dá acesso à pasta pessoal inteira; `host` dá acesso a praticamente todo o disco, o mais abrangente.
- Tokens `xdg-*` concedem pastas específicas (downloads, documentos, imagens) em vez da home toda.
- `flatpak info -m <id>` mostra o que o pacote declarou; `flatpak override --show` mostra o resultado final.
- `flatpak override --user --nofilesystem=home <id>` nega um acesso herdado; a marca `!home` aparece na saída.
- O Flatseal representa cada token como um toggle com três estados: ligado, desligado e herdado.

## Exercícios

1. Rode `flatpak override --show <id>` para três apps e liste, para cada um, os tokens `filesystems=` presentes.
2. Para um app com `filesystems=home`, execute `flatpak override --user --nofilesystem=home <id>` e confira a marca `!home` na saída.
3. Use `flatpak override --user --reset <id>` para desfazer a negação e confirme que o `!home` sumiu da listagem.
4. Compare `flatpak info -m <id>` com `flatpak override --show <id>` de um mesmo app e identifique quais linhas de filesystem vieram do pacote e quais vieram de override.
5. **Desafio.** No Flatseal, deixe apenas `xdg-download` ativo para um app e desligue todo o resto do filesystem. Depois, feche a GUI e confirme no terminal com `flatpak override --show` que a linha `filesystems=` reflete exatamente a sua escolha.
