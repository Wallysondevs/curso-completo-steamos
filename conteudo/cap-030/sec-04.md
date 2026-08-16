Atualizar é mais barato que reinstalar, e o Flatpak foi projetado para isso: cada atualização baixa só o delta entre a versão instalada e a nova. O `flatpak update` varre o que você tem, confere o que mudou no remoto e, quando o sinal verde vem, aplica as mudanças. Esta seção cobre a sintaxe completa, as opções de segurança e o que fazer quando uma atualização quebra um app.

:::objetivos
- Dominar `flatpak update` com e sem argumentos para atualizar apps e runtimes
- Entender a diferença entre atualizar um ID, um remoto ou tudo
- Forçar a atualização de metadados com `update --appstream`
- Saber como congelar um app em uma versão específica

:::
## Atualizando tudo de uma vez

O comando mais simples é também o mais usado: sem argumentos, ele varre a instalação ativa inteira, compara cada ref com o remoto de origem e pergunta se pode prosseguir.

```terminal
$ flatpak update
Looking for updates…

 1. [✗] org.freedesktop.Platform.GL.default 24.08    u     flathub   < 4.3 MB
 2. [✗] org.gnome.Platform                    46       u     flathub   < 38.1 MB
 3. [✗] org.gimp.GIMP                         stable   u     flathub   < 12.7 MB

Proceed with these changes to the system installation? [Y/n]: y
```

Cada linha com `u` na coluna `Op` é um ref que será baixado. O `[✗]` significa que ainda não foi feito. A lista inclui não só seus apps, mas também os runtimes e extensões — o Flatpak não deixa runtime para trás porque uma brecha de segurança no `org.freedesktop.Platform` afetaria todo app que depende dele.

:::info
O `flatpak update` no SteamOS também alcança os flatpaks pré-instalados de fábrica que vêm com o modo Desktop (como o navegador e o Discover). Você não precisa abrir o Discover para atualizá-los; o terminal cuida de tudo num só comando.
:::

## Atualizando um app ou um runtime específico

Para ser cirúrgico, passe o ID:

```terminal
$ flatpak update org.mozilla.firefox
Looking for updates…

 1. [✗] org.mozilla.firefox   stable   u   flathub   < 22.1 MB

Proceed with these changes to the system installation? [Y/n]: y
```

Isso atualiza apenas o Firefox e ignora qualquer outra atualização pendente. Útil quando você quer aplicar uma correção de segurança urgente num único programa sem arriscar regressões nos outros — cenário comum em dia de CVE.

O mesmo se aplica a runtimes. Se você sabe que a atualização do `org.gnome.Platform` está quebrando o GNOME Software e quer mantê-lo congelado, atualize os apps um a um.

:::dica
Para saber se há atualizações disponíveis sem aplicar nenhuma, use `flatpak remote-ls --updates flathub`. Ele lista o que mudou no servidor sem tocar no disco, uma espécie de simulação de `update`.
:::

## Atualizando os metadados (appstream)

O Flatpak mantém um cache local dos índices de cada remoto. Se o `search` ou o `install` parecem desatualizados, o índice local pode estar velho — principalmente se você adicionou um remoto novo e ainda não populou seu catálogo. O comando para forçar o download do índice é:

```terminal
$ flatpak update --appstream
Updating appstream data for remote flathub…
$
```

Sem saída ruidosa; se o comando termina em silêncio e com código de saída `0`, o índice está fresco. Caso contrário, uma mensagem de erro aponta conectividade ou permissão.

## O que fazer quando uma atualização quebra algo

Por design, o Flatpak não desinstala a versão antiga imediatamente — ele a guarda como um *pending uninstall*. Depois de um `update`, o sistema mantém a versão anterior por alguns dias, o que permite voltar atrás com o downgrade (coberto na [seção de downgrade](#/cap-030/sec-09)) ou simplesmente esperar uma correção chegar.

Se você suspeita que uma atualização causou o problema, confirme com:

```terminal
$ flatpak history | head -5
```

O histórico (detalhado na [seção de histórico](#/cap-030/sec-08)) mostra exatamente qual commit entrou e quando. Com o commit antigo em mãos, o caminho de volta é uma reversão, não um desespero.

:::atencao
Se o `update` falhar no meio de um download, o Flatpak não deixa o app quebrado pela metade. A operação é transacional: ou todos os refs são baixados, verificados e instalados, ou nada muda. Se a rede cair, execute `flatpak update` de novo — ele retoma do ponto em que parou.
:::

## Congelando versões com `mask`

Às vezes a política é: "não atualize este app, nunca, até segunda ordem". O Flatpak suporta isso com a ação `mask` (do `flatpak mask`), que impede que um ID seja alvo de `update`.

```terminal
$ flatpak mask org.gimp.GIMP
Masked org.gimp.GIMP (system)
$ flatpak update
Looking for updates…
Skipping org.gimp.GIMP (masked)

 1. [✗] org.mozilla.firefox     stable    u    flathub    < 22.1 MB

Proceed with these changes to the system installation? [Y/n]: y
```

O GIMP foi pulado. Para reverter, `flatpak mask --remove org.gimp.GIMP`. Use com moderação: apps mascarados por meses acumulam vulnerabilidades de segurança.

## Resumo

- `flatpak update` sem argumentos atualiza apps, runtimes e extensões da instalação ativa.
- `flatpak update <ID>` atualiza apenas aquele ref específico.
- `flatpak update --appstream` baixa os índices mais recentes do remoto, essencial para `search` e `install` funcionarem.
- O Flatpak preserva a versão anterior por alguns dias após o update, permitindo reversão.
- `flatpak mask <ID>` congela um app, impedindo que ele seja atualizado até você remover a máscara.

## Exercícios

1. Rode `flatpak update` e anote quantos refs diferentes aparecem (apps + runtimes + extensões). Depois rode `flatpak update` de novo e confirme que agora nada mais está pendente.
2. Atualize apenas um app específico (ex.: `flatpak update org.gimp.GIMP`) e verifique a nova versão com `flatpak info <ID>`.
3. Rode `flatpak remote-ls --updates flathub` e compare a lista com o que o `flatpak update` exibe.
4. Mascare um app com `flatpak mask <ID>`, execute `flatpak update` e confirme que ele foi pulado. Depois desfaça com `flatpak mask --remove <ID>`.
5. **Desafio.** Simule uma falha de rede: desconecte o Wi-Fi, execute `flatpak update` e interprete a mensagem de erro. Depois reconecte e rode de novo, observando que ele retoma — sem refazer o que já tinha sido baixado.