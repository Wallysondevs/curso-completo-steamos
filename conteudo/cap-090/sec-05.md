RMA é a sigla para *Return Merchandise Authorization* — a autorização de devolução que a Valve emite quando decide que seu caso merece troca ou reparo físico. Chegar até aqui significa que o diagnóstico e o ticket funcionaram. Agora começa a parte logística: embalar, enviar e rastrear sem errar em nenhuma etapa, porque um erro aqui pode custar o aparelho.

:::objetivos
- Entender o que é RMA e quando a Valve o autoriza
- Preparar o aparelho para o envio com segurança
- Seguir as etapas de embalagem e etiqueta
- Rastrear o processo até o retorno do aparelho
:::

## O que é RMA e como ele é autorizado

O RMA não é automático: ele só acontece depois que o suporte confirma, pela sua evidência e orientações de teste, que o caso é de hardware coberto. Nesse ponto a Valve emite um número de RMA e instruções de envio — que podem incluir uma etiqueta de frete pré-paga, dependendo da região e do caso.

```terminal
$ cat ~/rma-numero.txt
RMA-000000-XXXXXXXX
```

Anote o número do RMA e mantenha-o junto com o ticket. Esse número identifica seu aparelho e seu caso em todo o trajeto — na etiqueta, no pacote e nas comunicações posteriores. Sem ele, o aparelho pode chegar e não ser vinculado ao seu caso.

## A regra de ouro: backup antes de tudo

Antes de enviar, o aparelho passará por um reset de fábrica, e tudo que está nele será apagado. Seu save de jogo em nuvem já está salvo, mas arquivos do modo Desktop, capturas de tela, ROMs e configurações locais não estão. Faça backup de tudo que importa para um destino externo.

```terminal
$ rsync -avh ~/lab /run/media/deck/BACKUP/ 
```

O `rsync` copia seu diretório de trabalho para um cartão microSD ou pendrive preservando estrutura e permissões. Faça o backup **antes** de qualquer reset, e verifique depois que os arquivos abrem no destino — backup não verificado não é backup.

:::perigo
O reset de fábrica apaga o conteúdo permanentemente. Se houver qualquer dado no aparelho que você não pode perder, faça o backup e **confira a cópia** antes de prosseguir. Não há recuperação depois do envio.
:::

## Embalando e etiquetando

A embalagem faz parte do processo: se o aparelho chegar danificado no trânsito, a responsabilidade pode recair sobre você. Use a caixa original se tiver (ela foi projetada para o aparelho), ou uma caixa rígida com proteção adequada. A etiqueta de frete deve estar legível e o número de RMA visível.

```terminal
$ ls -l ~/etiqueta-rma.pdf
-rw-r--r-- 1 deck deck 84K fev 21 09:00 etiqueta-rma.pdf
```

Imprima a etiqueta fornecida pela Valve e fixe-a na parte externa. Algumas instruções pedem para incluir uma cópia do número de RMA **dentro** do pacote, com contato e endereço de retorno — siga exatamente o que a Valve orientar, pois o formato varia por região e transportadora.

:::atencao
Guarde o comprovante de postagem e o número de rastreio da transportadora. É a única prova de que você enviou o aparelho, e a Valve pede esse número se o pacote atrasar ou se perder.
:::

## Rastreando até o retorno

Depois do envio, o acompanhamento acontece em duas frentes: o rastreio da transportadora (para saber quando chegou) e o ticket na central de suporte (para saber o status da análise). A análise pode resultar em reparo, troca por um aparelho igual ou recondicionado, ou — raramente — devolução sem reparo se o dano for classificado fora da garantia.

```terminal
$ curl -s https://help.steampowered.com/pt-br/ | grep -i "status"
```

Acompanhe o ticket regularmente. O tempo total varia de dias a algumas semanas conforme a região, o estoque de reposição e a fila de reparo. Responder prontamente a pedidos de confirmação durante a análise mantém o processo fluindo.

## Erros que custam o envio

O erro mais grave é enviar o aparelho sem o número de RMA visível — o pacote chega, mas ninguém sabe a qual caso ele pertence, e o aparelho fica parado ou é devolvido. Outro erro comum: usar embalagem frágil (envelope acolchoado) em vez de caixa rígida. O Steam Deck não sobrevive a impacto lateral dentro de envelope.

```terminal
$ tar czf ~/rma-docs.tar.gz ~/rma-*.txt ~/registro.md
```

Empacote os documentos do processo (logs, ticket resumido, número do RMA) em um `.tar.gz` e guarde na nuvem ou em pendrive separado do aparelho. Se o pacote se perder no trânsito, você tem tudo documentado para provar que enviou.

| Etapa | O que fazer | Consequência de pular |
|---|---|---|
| Backup | `rsync` e verificação | Perda irreversível de saves e arquivos |
| Reset | Restaurar para estado de fábrica | Dados pessoais expostos, ticket rejeitado |
| Embalagem | Caixa rígida, etiqueta legível | Dano no trânsito, extravio |
| Número RMA | Dentro e fora do pacote | Pacote órfão sem vinculação ao caso |
| Comprovante | Guardar número de rastreio | Sem prova de envio |

## Resumo

- RMA é a autorização de devolução emitida após o suporte confirmar defeito de hardware coberto.
- O número de RMA vincula o aparelho ao caso durante todo o trajeto.
- Faça backup e confira a cópia antes do reset e do envio.
- Embalagem adequada e etiqueta legível previnem dano e extravio no trânsito.
- Guarde comprovante de postagem e rastreie tanto a transportadora quanto o ticket.

## Exercícios

1. Explique, em uma frase, a diferença entre "abrir um ticket" e "receber um RMA".
2. Liste os itens de um aparelho Steam Deck que **não** estão na nuvem e precisam de backup manual.
3. Execute um `rsync -avh` de um diretório de teste para um destino externo e verifique a cópia.
4. Descreva a sequência correta de embalagem e etiquetagem, citando onde colocar o número do RMA.
5. **Desafio.** Elabore um checklist de envio que inclua backup verificado, reset, embalagem, etiqueta, número de RMA e comprovante de postagem, justificando por que a ausência de qualquer um desses itens pode custar o aparelho.
