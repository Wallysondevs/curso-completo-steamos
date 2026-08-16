Você já baixou uma build GE e sabe por que ela existe. Agora chega o momento de decidir **onde** ela vai operar. O Steam oferece dois níveis de escolha: uma versão padrão, que vale para todos os jogos que não tenham configuração própria, e uma escolha individual por jogo. Esta seção trata do primeiro nível — definir o Proton-GE como padrão global.

Escolher o GE como padrão é útil quando a maioria dos seus jogos se beneficia dele, ou quando você prefere um único conjunto de codecs para tudo. É também a forma mais rápida de testar se o GE resolve um problema, já que o ajuste vale imediatamente para a biblioteca inteira.

:::objetivos
- Localizar as configurações globais de compatibilidade no Steam
- Definir uma build GE (ou qualquer outra) como versão padrão
- Entender como o padrão interage com escolhas individuais por jogo
- Reverter para o Proton oficial quando necessário
:::

## Onde fica o padrão global

As configurações globais do Steam ficam em **Steam → Configurações → Compatibilidade**. Há duas coisas ali que se confundem facilmente e precisam ser separadas:

- A opção **"Ativar Steam Play para todos os outros títulos"** — liga ou desliga o Proton para jogos que não têm uma versão nativa do Linux e não têm configuração própria.
- O campo **"Executar outros títulos com"** — escolhe **qual** versão de compatibilidade será usada nesse caso.

É esse segundo campo que define o "padrão global". Ele só aparece como lista suspensa depois que as builds alternativas estão instaladas (é por isso que, na seção anterior, o mais recente não aparecia antes do primeiro download).

```terminal
$ ls ~/.steam/steam/compatibilitytools.d/
GE-Proton9-25
```

Com a build na pasta acima, ela já passa a figurar na lista suspensa de **"Executar outros títulos com"**. No modo Desktop, abra as Configurações e selecione `GE-Proton9-25` nesse campo.

## O que muda quando você seleciona

Ao escolher o GE como padrão, o Steam passa a usar essa build para todo título de Windows que **não tenha** uma configuração individual. Na prática, três grupos de jogos se comportam assim:

- **Jogos com versão nativa Linux** — não são afetados; rodam o binário nativo, sem Proton.
- **Jogos de Windows sem escolha própria** — passam a usar o GE.
- **Jogos com escolha individual** — mantêm a escolha deles, ignorando o padrão.

Essa hierarquia é o ponto central: a escolha individual **sempre vence** o padrão global. O padrão é um piso, não um teto.

:::dica
O campo "Executar outros títulos com" também aceita o **Proton Experimental** e os Protons numerados oficiais, não apenas builds GE. A lista é simplesmente tudo o que o Steam encontrou em `compatibilitytools.d` somado ao que a Valve fornece.
:::

## Testando o efeito imediatamente

Depois de mudar o padrão, o melhor teste é pegar um jogo que antes usava o oficial e verificar qual versão ele passa a reportar. Feche e reabra o Steam para a mudança valer de imediato, então rode um jogo e confirme o log:

```terminal
$ grep -i 'proton' ~/.local/share/Steam/logs/console-linux.txt | tail -20
GameAction [AppID 1234567, ActionID 1] : LaunchApp changed task to ProcessingInstallScript with ""
/bin/sh -c /home/deck/.steam/steam/compatibilitytools.d/GE-Proton9-25/proton run ...
```

A linha do `proton run` mostra o caminho completo da build usada. Se ele aponta para `GE-Proton9-25`, o padrão global surtiu efeito. Se apontar para outra versão, é porque aquele jogo provavelmente tem uma escolha individual que sobrescreve o padrão — assunto da próxima seção.

## Quando usar GE como padrão (e quando não)

Definir o GE como padrão é cômodo, mas não é a escolha ideal para todo mundo. Como o GE embarca patches mais recentes que o Proton estável, ele pode, em raros casos, introduzir regressões num jogo que funcionava perfeitamente no oficial. A regra de ouro:

- **Padrão GE** faz sentido se a maioria do que você joga se beneficia de codecs extras ou é muito recente.
- **Padrão oficial + GE por jogo** é o arranjo mais conservador e previsível, recomendado como padrão de referência do curso.

Se algo quebrar após mudar o padrão, reverter é trivial: volte ao menu de Compatibilidade e selecione de novo `Proton Experimental` (ou a versão numerada que você usava). Não há migração de dados nem risco para os saves — é só uma troca de interpretador.

:::atencao
Mudar o Proton **não** apaga saves nem reinstala o jogo, mas pode forçar o Steam a baixar um pequeno "prefixo" novo na primeira execução. Se isso acontecer, aguarde a primeira inicialização terminar antes de concluir que algo quebrou.
:::

## Resumo

- O padrão global fica em **Configurações → Compatibilidade**, no campo "Executar outros títulos com".
- A escolha individual por jogo sempre sobrescreve o padrão global.
- Jogos com versão nativa Linux não usam Proton nenhum, independentemente do padrão.
- O log em `console-linux.txt` mostra o caminho da build de Proton usada em cada execução.
- Padrão GE é cômodo, mas o arranjo "oficial + GE por jogo" é mais previsível.
- Reverter é trocar a seleção de volta; não há perda de dados nem reinstalação.

## Exercícios

1. Abra **Configurações → Compatibilidade** e identifique os dois controles: o interruptor "Ativar Steam Play" e o campo "Executar outros títulos com". Explique a diferença entre eles.
2. Confirme que a build GE baixada na seção anterior aparece na lista suspensa "Executar outros títulos com". Se não aparecer, reinicie o Steam e verifique de novo.
3. Rode um jogo de Windows que não tenha configuração individual e confirme, pelo log `console-linux.txt`, qual build de Proton foi usada.
4. Mude o padrão entre GE e Proton Experimental e observe se algum jogo baixa prefixo novo na primeira execução após a troca.
5. **Desafio.** Liste todos os seus jogos de Windows e classifique mentalmente cada um em "usa o padrão", "tem escolha própria" ou "é nativo Linux". Depois valide com o log de execução se a sua classificação de pelo menos dois deles está correta.
