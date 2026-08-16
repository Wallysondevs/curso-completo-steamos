Chegamos à etapa que fecha o ciclo: desinstalar. Ao longo do capítulo você baixou builds, atualizou para versões novas e viu que a versão antiga continua no disco esperando a transição terminar. Agora é hora de remover o que não se usa mais e devolver gigabytes ao SSD do Deck, que costuma ser o recurso mais escasso da máquina.

Há dois caminhos para desinstalar: pela interface do ProtonUp-Qt, que é o recomendado por ser reversível e seguro, e manualmente pelo terminal, que é rápido mas exige cuidado por envolver comandos destrutivos. Vamos aos dois, com a ênfase devida no perigo do segundo.

:::objetivos
- Desinstalar builds de Proton pela interface do ProtonUp-Qt
- Remover builds manualmente do diretório `compatibilitytools.d`
- Entender por que `rm -rf` é perigoso e como usá-lo com precisão
- Liberar espaço de forma segura sem quebrar a configuração dos jogos
:::

## Desinstalando pelo ProtonUp-Qt

A forma segura e recomendada é pela própria ferramenta. Na janela principal do ProtonUp-Qt, a lista de versões instaladas tem, ao lado de cada uma, um botão de remoção (normalmente um ícone de lixeira). Basta clicar nele, confirmar, e a build é removida.

```terminal
$ flatpak run net.davidotek.pupgui2
```

Depois da confirmação, o ProtonUp-Qt apaga a pasta inteira da build. O que a interface **não** faz é reconfigurar seus jogos: se algum jogo ainda estava apontando para `GE-Proton9-25` e você a removeu, a seleção daquele jogo passa a apontar para uma build inexistente.

:::atencao
Antes de remover, verifique se nenhum jogo ou o padrão global ainda referencia aquela build. Remover uma build que está em uso faz o jogo voltar ao Proton padrão na prática, mas o campo de seleção fica inconsistente até você reescolher. Mude as referências antes de apagar.
:::

## Verificando o que pode ser removido com segurança

Uma build só é segura para remover quando nada aponta para ela. O jeito prático de conferir é checar o padrão global e os jogos forçados. No disco, dá para ter uma pista central olhando quais pastas de prefixo existem — mas a fonte de verdade da seleção é a interface do Steam, não o disco.

A verificação simples de que uma build ainda existe (ou já foi embora) é listar o diretório:

```terminal
$ ls -1 ~/.steam/steam/compatibilitytools.d/
GE-Proton9-25
GE-Proton9-27
```

Se `GE-Proton9-25` não aparece mais, a remoção pela interface funcionou.

## Desinstalando manualmente com `rm -rf`

Para quem prefere o terminal, a remoção é um único comando que apaga a pasta da build. O `rm -rf` é destrutivo e **não pede confirmação**, então a regra é apontá-lo com precisão cirúrgica para a build exata, nunca para o diretório-pai inteiro.

O padrão seguro é remover **uma build nomeada** de cada vez:

```terminal
$ rm -rf ~/.steam/steam/compatibilitytools.d/GE-Proton9-25
$ ls -1 ~/.steam/steam/compatibilitytools.d/
GE-Proton9-27
```

Na segunda linha, a listagem confirma que só restou a build que você quis manter. Este é o formato correto: alvo explícito e único, seguido de verificação.

:::perigo
Nunca rode `rm -rf ~/.steam/steam/compatibilitytools.d` sem um alvo específico, e muito cuidado com curingas amplos. O comando abaixo, por exemplo, apaga **todas** as builds GE de uma vez — e se o padrão for digitado errado, pode atingir mais do que você pretendia:

```terminal
## Remoção em massa de TODAS as builds GE — use só se tiver certeza
$ rm -rf ~/.steam/steam/compatibilitytools.d/*GE-Proton*
```

Se errar o caminho (um espaço a mais, um `~` esquecido no lugar errado, um `/` do diretório-pai), o `rm -rf` pode apagar dados irreversíveis. No Deck, com sistema de arquivos sem lixeira para esses casos, não há como desfazer.
:::

## Usando curingas com responsabilidade

Ferramentas comunitárias seguem um padrão de nome próprio (`GE-Proton*`, `Luxtorpeda`, `Boxtron`, `Roberta`). O curinga serve para apagar um grupo sem listar versão por versão, mas o alvo precisa continuar ancorado no diretório correto.

Antes de qualquer remoção em massa, **sempre** liste primeiro com `ls` o que o curinga casaria:

```terminal
$ ls -d ~/.steam/steam/compatibilitytools.d/*GE-Proton*
/home/deck/.steam/steam/compatibilitytools.d/GE-Proton9-25
/home/deck/.steam/steam/compatibilitytools.d/GE-Proton9-27
```

Ver com os próprios olhos o que será apagado, e só então trocar `ls -d` por `rm -rf`, é a disciplina que separa uma limpeza rápida de um desastre. A diferença entre os dois comandos é uma única palavra — e é justamente ali que mora o risco.

## Liberando espaço: o balanço final

Depois da limpeza, vale medir o resultado para confirmar que o espaço voltou. O `du` antes e depois conta a história:

```terminal
$ du -sh ~/.steam/steam/compatibilitytools.d/*
1.2G	GE-Proton9-27
```

Um diretório que antes tinha várias builds de 1 GB agora tem só a que você mantém. O `df` mostra o efeito no disco inteiro, se você quiser o contexto mais amplo:

```terminal
$ df -h ~ | tail -1
/dev/nvme0n1p4  30G  22G  6.8G  78% /home
```

A coluna `Avail` (disponível) é a que cresce quando você desinstala. Num Deck de 64 GB ou 256 GB, remover três builds GE antigas devolve 3 GB ou mais — diferença real para quem está sempre no limite.

## Resumo

- O ProtonUp-Qt remove builds pela interface (ícone de lixeira), de forma segura e confiável.
- Antes de remover, mude as referências do padrão global e dos jogos que apontavam para aquela build.
- `rm -rf` é destrutivo e irreversível no Deck; use sempre um alvo explícito e verifique com `ls` depois.
- Listar com `ls -d` o que um curinga casaria, antes de trocá-lo por `rm -rf`, evita desastres.
- Remova uma build por vez e confirme o resultado com `ls` ou `du -sh`.
- Desinstalar builds antigas devolve de 1 GB (ou mais) por build ao SSD do Deck.

## Exercícios

1. Liste suas builds com `ls -1 ~/.steam/steam/compatibilitytools.d/` e identifique quais estão em uso (padrão global + jogos forçados) e quais são candidatas a remoção.
2. Remova uma build obsoleta pelo ProtonUp-Qt e confirme, com `ls`, que ela saiu do diretório.
3. Use `ls -d ~/.steam/steam/compatibilitytools.d/*GE-Proton*` para pré-visualizar o que um curinga de remoção casaria. Não execute a remoção ainda — apenas observe.
4. Meça o espaço antes e depois de uma remoção com `du -sh ~/.steam/steam/compatibilitytools.d/*` e registre quantos MB/GB você recuperou.
5. **Desafio.** Compare o risco dos dois estilos de remoção — `rm -rf .../GE-Proton9-25` contra `rm -rf .../*GE-Proton*` — explicando em que condição cada um é aceitável. Depois, remova manualmente uma build pelo terminal seguindo a disciplina ensinada (alvo explícito + verificação) e valide com `ls` e `df -h ~`.
