O Steam Deck não é um PC convencional no modo de jogo: por padrão, ele inicia direto na interface do Steam (o "Game Mode"), e a loja vive dentro dessa experiência com controle. Ainda assim, existe uma porta lateral para instalar e administrar jogos fora dela: o `steamcmd`. Entender a loja dentro do Deck e o `steamcmd` fora dela cobre as duas formas de adquirir conteúdo na plataforma.

:::objetivos
- Navegar e comprar na loja dentro da interface do Deck
- Entender o papel do `steamcmd` como cliente em modo texto
- Autenticar no `steamcmd` de forma segura, sem expor credenciais
- Diferenciar loja, biblioteca e catálogo de servidores dedicados
- Interpretar taxas de download e limites de instalação por disco
:::

## Comprando dentro do Game Mode

A loja no Deck é o cliente Steam comum, reformulado para gamepad e tela de 800p. Você navega com os trackpads e analógicos, o gatilho direito age como clique e o teclado virtual aparece quando precisa de texto. A compra usa os mesmos passos do desktop: página do jogo, botão de compra, escolha de método de pagamento já cadastrado na conta.

A diferença prática é o contexto: no Deck, a loja já filtra e destaca a compatibilidade com o aparelho, então o selo Verified/Playable fica evidente na própria página, como vimos na seção anterior. Comprar e instalar vira uma única intenção contínua.

```terminal
$ steam steam://open/store
```

O protocolo `steam://open/store` abre a loja diretamente. É útil não só por curiosidade, mas por scripts e atalhos: você pode criar um atalho de terminal que pula direto para a loja sem navegar pelos menus da interface.

## O que é o steamcmd

`steamcmd` é o cliente do Steam em linha de comando, usado para instalar e atualizar **servidores de jogos dedicados** e para tarefas de automação. Ele não substitui a loja — você não "compra" jogos por ele —, mas ele baixa o que sua conta já possui quando o conteúdo é do tipo servidor ou quando você gerencia uma instalação headless (sem interface gráfica).

Ele é uma ferramenta separada do cliente do Deck. No SteamOS, você normalmente o instala via gerenciador de pacotes ou baixa direto da Valve:

```terminal
$ which steamcmd
/home/deck/.steam/steamcmd/steamcmd.sh
```

No Deck, o `steamcmd` costuma viver dentro do próprio diretório `~/.steam/steamcmd/`, invocado pelo script `steamcmd.sh`. A saída do `which` confirma se ele está no seu `PATH` ou se precisa ser chamado pelo caminho completo.

## Autenticando sem jogar a senha na linha de comando

O ponto mais importante de segurança do `steamcmd` já apareceu na primeira seção e merece ser repetido aqui com mais contexto. O `steamcmd` aceita credenciais como argumento:

```terminal
$ steamcmd +login ana +quit
Connecting anonymously to Steam Public...OK
Waiting for client config...OK
Waiting for user info...OK
Please enter your password:
```

Quando você omite a senha (ou o nome), o `steamcmd` solicita no prompt interativo. Essa é a forma correta. A forma errada — e extremamente comum em tutoriais antigos — é colocar tudo na mesma linha:

```terminal
$ steamcmd +login ana minhasenha
```

:::perigo
Colocar `+login ana minhasenha` numa única linha grava sua senha em texto plano no histórico do shell (`~/.bash_history`), a torna visível em `ps aux` enquanto o processo vive e a expõe em qualquer log que capture a linha de comando. Sempre prefira omitir a senha e responder ao prompt, e considere autenticação com Steam Guard, que o `steamcmd` pede quando a conta exige. Essa é a mesma regra da seção sobre autenticação — repetida porque é a mais violada.
:::

## Baixando conteúdo com steamcmd

Para baixar um servidor dedicado (o caso de uso clássico), o fluxo é autenticar, definir o diretório de instalação e disparar o download:

```terminal
$ steamcmd +login ana +force_install_dir /home/deck/lab/srv +app_update 258550 +quit
Connecting anonymously to Steam Public...OK
Please enter your password:
...

Success! App '258550' fully installed.
```

O `appid` `258550` é o servidor dedicado de *Rust*, usado só como exemplo de um servidor dedicado real. O `+force_install_dir` define onde o conteúdo vai cair (aqui em `~/lab/srv`, mantendo a convenção do curso), e `+app_update` baixa/atualiza o app indicado. A linha final `Success! App ... fully installed` confirma a instalação.

:::dica
`+quit` ao fim da linha encerra o `steamcmd` automaticamente depois de concluir o comando anterior. Sem ele, o prompt fica aberto aguardando o próximo comando, o que é útil para sessões interativas mas trava scripts. Em automação, sempre termine com `+quit`.
:::

## Loja, biblioteca e servidores: três camadas

Vale consolidar a diferença entre os três conceitos que costumam se misturar:

| Camada | Ferramenta | Você... |
|---|---|---|
| Loja | Interface do Deck ou desktop | compra e ativa jogos |
| Biblioteca | Cliente Steam | instala e joga o que possui |
| Servidores dedicados | `steamcmd` | baixa/atualiza servidores de jogo |

O `steamcmd` opera no nível de "biblioteca/servidores", não de "loja". Ele baixa o que sua conta já tem direito, mas não fecha compra. Por isso a loja continua sendo o único lugar de aquisição, e o `steamcmd` é o braço de automação e servidores.

## Verificando espaço antes de instalar

Antes de qualquer download grande, confira o espaço. O Deck tem SSD de 64 GB (modelo base) a 1 TB (OLED), e jogos AAA passam fácil de 100 GB:

```terminal
$ df -h ~/.local/share/Steam
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p8  468G  342G  102G  78% /home
```

O `df -h` mostra o espaço do sistema de arquivos que abriga a biblioteca: 468 GB no total, 342 GB usados (78%), sobrando 102 GB. Se o jogo que você quer ocupa 90 GB, ele cabe — mas fica a lição óbvia: biblioteca grande exige disciplina de espaço, tema central da próxima seção.

## Resumo

- A loja no Deck roda dentro do Game Mode, com gamepad e teclado virtual; `steam://open/store` a abre direto.
- `steamcmd` é o cliente em modo texto, focado em servidores dedicados e automação, não em compras.
- `steamcmd` deve autenticar por prompt; nunca coloque a senha em claro na linha de comando.
- `+force_install_dir` define o destino; `+app_update <appid>` baixa/atualiza; `+quit` encerra o script.
- Loja (comprar), biblioteca (jogar) e servidores (`steamcmd`) são três camadas distintas.
- `df -h` no diretório da biblioteca confere espaço antes de instalar jogos grandes.

## Exercícios

1. Rode `which steamcmd` e descubra se ele está no seu `PATH` ou só em `~/.steam/steamcmd/steamcmd.sh`. Compare os dois.
2. Execute `steam steam://open/store` e confirme que a loja abre no Game Mode.
3. Rode `steamcmd +login ana +quit` e observe o prompt de senha. Explique por que essa forma é segura e `+login ana minhasenha` não é.
4. Confira o espaço com `df -h ~/.local/share/Steam`. Some o que sobrou e diga se um jogo de 80 GB caberia hoje.
5. **Desafio.** Baixe um servidor dedicado pequeno (ex.: `+app_update 258550`) para `~/lab/srv` usando `steamcmd`, autenticando pelo prompt, e depois liste o conteúdo baixado com `ls -lh ~/lab/srv`. Relacione o tamanho ocupado com a saída do `df -h` do exercício anterior.
