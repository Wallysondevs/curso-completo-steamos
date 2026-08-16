O atendimento da Valve começa em `help.steampowered.com`, e a qualidade do seu ticket decide se ele será resolvido em dias ou arrastado por semanas. Um chamado bem aberto é curto, específico e carregado de evidência — o oposto do relato vago que obriga o suporte a fazer perguntas de ida e volta. Esta seção mostra como montar um ticket que anda sozinho.

:::objetivos
- Navegar pela central de suporte Steam até o formulário de hardware
- Preencher os campos com informações precisas e completas
- Anexar evidências e descrever o sintoma de forma objetiva
- Entender o ciclo de vida do ticket e como responder corretamente
:::

## Chegando ao formulário certo

A central de suporte organiza os assuntos por produto e categoria. Para hardware do Steam Deck, o caminho é escolher o produto (Steam Deck) e depois a categoria de problema — tela, bateria, controles, áudio, etc. Escolher a categoria certa faz o ticket cair na fila correta, em vez de ser redirecionado manualmente.

```terminal
$ curl -s -o /dev/null -w "%{http_code}\n" https://help.steampowered.com/pt-br/
200
```

Abra a central em português (sufixo `/pt-br/`) se for o seu caso; o atendimento existe em vários idiomas e responder na sua língua é mais confortável e preciso. Escolha **Steam Deck** e navegue até a categoria que corresponde ao seu sintoma.

## Escrevendo um relato que vale ouro

A regra de ouro do texto do ticket: **fato, não opinião**. Em vez de "a tela está ruim", escreva "há uma linha vertical verde permanente a 1/3 da largura, visível em todas as cores e em modo Desktop e Gaming, desde o dia X". Descreva quando começou, se há gatilho e o que já tentou.

```terminal
$ date
ter 20 fev 2024 10:12:33 -03
```

Registrar a data exata em que o sintoma apareceu dá contexto ao suporte (foi após uma atualização? após uma queda?). O comando `date` deixa a referência temporal consistente com os logs que você já coletou.

:::dica
Use uma estrutura de três parágrafos: (1) o sintoma em uma frase, (2) o histórico — quando começou e o que mudou, (3) o que você já tentou e os resultados. Isso cobre 90% do que o técnico precisa saber.
:::

## Anexando evidências

O formulário aceita anexos, e eles fazem diferença. Fotos nítidas do defeito (tela com a linha, botão quebrado), as saídas de log que você coletou e, se aplicável, um vídeo curto reproduzindo o problema. Evidência visual elimina a etapa de "pode descrever melhor?" que consome dias.

```terminal
$ ls -lh ~/rma-logs-boot.txt ~/rma-dmesg.txt ~/rma-sensors.txt
-rw-r--r-- 1 deck deck 48K fev 20 10:15 rma-dmesg.txt
-rw-r--r-- 1 deck deck 1.2M fev 20 10:14 rma-logs-boot.txt
-rw-r--r-- 1 deck deck 2.1K fev 20 10:15 rma-sensors.txt
```

Confira o tamanho dos arquivos antes de anexar: a central tem limite por anexo. Se o `journalctl` completo for grande demais, anexe apenas as linhas relevantes (filtre com `grep` ou `-p err`), não o dump inteiro de megabytes.

:::atencao
Nunca anexe dados sensíveis desnecessários. Logs podem conter nome de usuário, SSID da sua rede Wi-Fi e outros detalhes pessoais. Faça um `grep` para conferir e remova o que não for preciso antes de enviar.
:::

## O ciclo de vida do ticket

Depois de enviar, o ticket entra numa fila e recebe respostas por e-mail (e no painel da central). O primeiro contato costuma ser um pedido de confirmação ou de mais detalhes — respostas rápidas e objetivas mantêm o caso andando. Evite abrir vários tickets sobre o mesmo problema: isso embaralha o histórico e atrasa tudo.

```terminal
$ journalctl -b | grep -i -E "steam|update" | tail -10
```

Manter o sistema atualizado durante a conversa é importante: se o suporte pedir "atualize e teste de novo", você já estará na versão certa. A maioria dos casos é resolvida sem envio físico, por orientação de software, então trate o ticket como um diálogo técnico, não como uma fila de pedido.

## Erros que alongam o ticket

Os três erros que mais esticam o prazo de resolução: preencher a categoria errada, descrever o sintoma com subjetividade ("está estranho", "não funciona direito") e omitir o que já tentou. Quando o suporte precisa perguntar "qual o erro exato?" ou "já tentou reiniciar?", o ticket anda um dia por pergunta.

```terminal
$ journalctl -b --since "10:00" --until "10:15" | wc -l
47
```

Recortar o log exato da janela em que o problema ocorreu (`--since`/`--until`) em vez de anexar o dump inteiro é a atitude de quem sabe o que está fazendo. O suporte recebe centenas de tickets por dia; o seu precisa ser o mais fácil de ler e decidir.

| Campo do formulário | O que colocar | Erro comum |
|---|---|---|
| Categoria | A mais específica que cobre o sintoma | Escolher "outros" e perder dias no redirecionamento |
| Descrição | Sintoma + quando começou + o que já tentou | Opinião subjetiva sem dados |
| Anexos | Logs filtrados, foto nítida, vídeo curto | Dump cru de 10 MB sem contexto |
| Serial | O valor exato de `product_serial` | Confundir com ID da conta Steam |

## Resumo

- O ticket é aberto em `help.steampowered.com`, escolhendo o produto e a categoria certa.
- Um bom relato usa fato, não opinião, com estrutura sintoma + histórico + tentativas.
- Anexos nítidos (fotos, logs, vídeo) eliminam rodadas de perguntas e respostas.
- Filtre e confira o tamanho e o conteúdo dos anexos antes de enviar.
- Responda rápido e evite duplicar tickets para manter o caso andando.

## Exercícios

1. Acesse a central de suporte e navegue até o formulário de hardware do Steam Deck, anotando o caminho de categorias.
2. Escreva um relato de três parágrafos (sintoma, histórico, tentativas) para um defeito real ou simulado.
3. Verifique o tamanho dos seus arquivos de evidência com `ls -lh` e aplique `grep` para reduzir um deles ao essencial.
4. Liste o que você removeria de um log antes de anexar, justificando com base em privacidade.
5. **Desafio.** Simule a abertura de um ticket completo (texto + anexos) para um defeito de tela hipotético, e escreva um parágrafo explicando como a escolha da categoria e das evidências reduz o tempo de resolução.
