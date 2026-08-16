As versões do Proton não se atualizam sozinhas magicamente — existem três mecanismos distintos, e entender cada um evita surpresas como "a Stable mudou de comportamento sozinha" ou "meu GE nunca atualiza". Nesta seção você aprende como cada família é mantida e como controlar isso.

:::objetivos
- Distinguir os três mecanismos de atualização (automática, manual e pontual)
- Verificar qual versão do Proton está ativa e quando foi atualizada
- Atualizar o Proton GE manualmente para uma build nova
- Entender quando a atualização do Proton pode afetar jogos em execução
:::

## Três mecanismos diferentes

Cada família do Proton tem um ciclo de atualização próprio:

- **Stable e Experimental**: atualizadas automaticamente pelo cliente Steam, junto com os updates de jogos. Você não controla o cronograma — só pode escolher quais versões ficam instaladas.
- **Hotfix**: baixado automaticamente quando publicado, mas é temporário e some quando a correção é absorvida pela Stable.
- **GE**: nunca atualiza sozinho. É 100% manual — você baixa a build nova e extrai por cima.

Essa assimetria explica uma confusão comum: o GE não "fica desatualizado" por preguiça do sistema; ele simplesmente não tem mecanismo automático.

Consequência prática: se você confia no GE para um jogo, a responsabilidade de mantê-lo atualizado é sua. Um GE de três meses atrás pode estar vários commits atrás do Wine *upstream*, e quando o jogo recebe um patch novo do próprio desenvolvedor, a incompatibilidade pode ressurgir justamente por causa do GE antigo. Vale a pena criar o hábito de checar o repositório do GE a cada poucos meses, ou logo após um jogo seu receber uma atualização grande.

## Verificando o que está instalado e atualizado

O horário de modificação dos diretórios e do arquivo `version` conta a história de quando cada versão foi baixada:

```terminal
$ ls -ld --time-style=long-iso ~/.steam/steam/steamapps/common/Proton*/
drwxr-xr-x 4 deck deck 18 2025-03-14 09:12 Proton 8.0/
drwxr-xr-x 4 deck deck 18 2025-03-17 22:40 Proton 9.0/
drwxr-xr-x 4 deck deck 18 2025-03-18 07:05 Proton Experimental/
drwxr-xr-x 4 deck deck 18 2025-03-14 09:12 Proton Hotfix/
```

Aqui dá para ler o padrão: a Stable 9.0 foi atualizada na noite de 17 de março, a Experimental na manhã de 18, enquanto a 8.0 e a Hotfix estão paradas no dia 14. O Proton Experimental como se espera recebe atualizações bem mais frequentes que a Stable.

```terminal
$ cat ~/.steam/steam/steamapps/common/Proton\ 9.0/version
9.0-4
```

O arquivo `version`, como já vimos, guarda a build exata. Combine os dois comandos — o `ls -ld` para saber *quando* atualizou e o `cat version` para saber *o quê* foi atualizado.

## Atualizando o GE manualmente

Como o GE não se auto-atualiza, o procedimento é repetir a instalação com o tarball de uma build nova. Não é necessário apagar a antiga — mantenha as duas lado a lado até validar a nova:

```terminal
$ cd ~/.steam/steam/compatibilitytools.d
$ curl -LO "https://github.com/GloriousEggroll/proton-ge-custom/releases/download/\
> GE-Proton9-25/GE-Proton9-25.tar.gz"
$ tar -xzf GE-Proton9-25.tar.gz && rm GE-Proton9-25.tar.gz
$ ls
GE-Proton9-23
GE-Proton9-25
```

Agora duas versões coexistem. Você continua usando a `-23` nos jogos que já funcionam e migra apenas os problemáticos para a `-25`. Depois de confirmar que a nova build não regrediu nada, pode remover a antiga.

:::perigo
Antes de apagar uma versão do Proton, lembre-se de que cada jogo tem seu **prefixo Wine** associado a uma versão específica. Se você remover a `-23` e um jogo ainda estava configurado para ela, o Steam vai reconfigurá-lo para a versão padrão e o prefixo pode ser recriado — possivelmente perdendo saves de configuração localizados dentro do prefixo. Mude a compatibilidade dos jogos **antes** de apagar a pasta.
:::

## Atualização do Proton durante o jogo

Um detalhe que pega muita gente: o Steam **não** atualiza o Proton de um jogo que está rodando. Se você está no meio de uma sessão e o Steam baixa uma build nova, ela só será usada na próxima inicialização do jogo.

```terminal
$ journalctl -u steam --since "1 hour ago" | grep -i -E "scheduled|queued"
Mar 18 16:02:11 steamdeck steam[984]: proton: Update for Proton 9.0 queued (app not running).
```

A mensagem `app not running` confirma a política: o update fica na fila até o jogo fechar, evitando que uma troca de bibliotecas trave uma partida em progresso.

:::dica
A forma mais confiável de "pausar" a evolução do Proton nos seus jogos é não marcar o beta do Steam nem instalar builds avulsas. Se você precisa estabilidade absoluta para um título competitivo, selecione a versão Stable **mais antiga** disponível (como a 8.0) e não troque até terminar a temporada — o comportamento dela não muda mais.
:::

## Resumo

- Existem três mecanismos de atualização: automática (Stable/Experimental), pontual (Hotfix) e manual (GE).
- O GE nunca se atualiza sozinho; você baixa e extrai builds novas por cima.
- `ls -ld --time-style=long-iso` revela *quando* cada versão foi atualizada; `cat version` revela *o quê*.
- É possível manter múltiplas builds do GE lado a lado antes de apagar a antiga.
- O Steam não atualiza o Proton de um jogo em execução — o update fica na fila.

## Exercícios

1. Liste as datas de modificação de todas as versões com `ls -ld --time-style=long-iso ...Proton*/` e identifique a atualização mais recente.
2. Baixe e instale uma build nova do GE lado a lado com a antiga, sem apagar a atual.
3. Verifique qual build exata você tem com `cat version` em cada pasta, separando Stable, Experimental e GE.
4. Observe o comportamento de fila: com um jogo aberto, force um update e confirme no `journalctl` a mensagem `app not running`.
5. **Desafio.** Crie um "programa de manutenção" pessoal: um script de shell que lista versão + data de todas as pastas `Proton*` e sinaliza as versões GE desatualizadas, ajudando você a decidir o que atualizar.