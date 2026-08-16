A medalha diz *quanto* um jogo tende a funcionar; os reports dizem *por quê* e *como*. Ler os relatos individuais é a habilidade mais subestimada do ProtonDB — é ali, e não na nota, que você descobre que o problema daquele `Silver` se resolve trocando uma flag, ou que aquele `Gold` tem uma pegadinha que aparece só na metade do jogo. Report bem lido evita frustração e devolução.

:::objetivos
- Identificar a estrutura de um report do ProtonDB
- Separar relatos confiáveis de relatos pouco informativos
- Reconhecer padrões recorrentes que indicam causa e solução
- Cruzar reports recentes com a versão do Proton usada
- Julgar quando um report ainda vale para o seu cenário

:::

## A anatomia de um report

Cada report combina dados estruturados com um campo de texto livre. A parte estruturada — OS, GPU, versão do Proton, data, medalha — você já sabe ler da seção anterior. A parte que exige critério é o comentário: é nele que a pessoa descreve o que aconteceu, o que tentou e o que resolveu. Um report útil costuma conter, mesmo que não de forma organizada:

- O que funcionou de imediato (áudio, vídeo, cutscenes, saves).
- O que deu problema e em que momento (boot, menu, meio do jogo).
- A versão exata do Proton e as flags de lançamento aplicadas.
- Se usou `winetricks`, `protontricks` ou algum pré-requisito instalado.
- Uma nota final coerente com a medalha que escolheu.

Relatos de uma linha — "funcionou" ou "não roda" — são quase inúteis, ainda que contem para o placar. O valor está nos relatos que explicam o *caminho*.

Para ver a estrutura real de um report antes de filtrar, você pode acessar a API de reports individuais. O endpoint retorna uma lista com os campos que aparecem na interface:

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/1145360.json" | python3 -m json.tool | head -40
[
    {
        "id": "abc123",
        "os": "SteamOS",
        "gpu": "AMD Custom GPU 0405",
        "protonVersion": "Proton 9.0-4",
        "rating": "platinum",
        "body": "Runs flawlessly out of the box. 60 fps, no tweaks needed.",
        "created": "2025-02-10",
        "specs": {
            "cpu": "AMD Ryzen APU",
            "ram": "16GB"
        }
    },
    ...
]
```

Cada objeto tem `os`, `gpu`, `protonVersion`, `rating` e `body` — o comentário que a pessoa escreveu. É esse `body` que você precisa ler com critério.

## Separe o sinal do ruído

Nem todo report tem o mesmo peso. Quando for ler, faça três perguntas em sequência. **É recente?** Um report de dois anos atrás pode descrever um Proton que já não existe; priorize os dos últimos meses. **É do hardware certo?** Report de deck vale mais para você do que report de desktop (e vice-versa), como vimos no filtro. **Explica a causa?** "Trava no menu" sem mais nada não te dá por onde começar; "trava no menu por falta do Media Foundation, resolvido com Proton-GE" te dá a receita inteira.

:::dica
Procure por **consenso**, não por um relato isolado. Se cinco reports recentes de deck descrevem exatamente o mesmo sintoma e a mesma solução, a chance de dar certo para você é alta. Se um único report jura que o jogo roda liso e todos os outros dizem `Borked`, desconfie — pode ser hardware incomum ou versão específica de Proton.
:::

## O que os padrões te contam

Depois de ler muitos reports você começa a reconhecer assinaturas. "Vídeos pretos" quase sempre aponta para codecs proprietários ausentes — o Proton oficial não embute alguns codecs por licenciamento, e a solução recorrente é o Proton-GE. "Launcher não fecha / jogo abre em janelinha" sugere launcher de terceiros (como o da Rockstar ou da EA) que precisa de uma flag para pular. "Não inicia, tela preta" em jogos online modernos costuma ser anticheat kernel-level que não roda no Proton de jeito nenhum.

Cruzar o sintoma com a versão de Proton listada é meio caminho andado para saber se a solução ainda vale. Um jogo que exigia `Proton 7.0` pode hoje rodar liso no `Proton Experimental`, e os reports mais novos dirão isso. Ler de baixo para cima (do mais novo para o mais velho) é geralmente o melhor roteiro.

Para ver como um mesmo jogo evoluiu nos reports, compare duas chamadas filtrando por data na API (a ordenação padrão já traz os mais recentes primeiro). Um `grep` rápido no campo `protonVersion` mostra a tendência:

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/1145360.json" | python3 -c "
import sys, json
reports = json.load(sys.stdin)
for r in reports[:10]:
    print(f\"{r['created'][:10]} | {r['rating']:10s} | {r['protonVersion']}\")
"
2025-03-18 | platinum   | Proton 9.0-4
2025-03-15 | platinum   | Proton Experimental
2025-03-12 | platinum   | GE-Proton9-20
2025-03-08 | gold       | Proton 8.0-5
2025-03-01 | platinum   | Proton 9.0-4
2025-02-25 | platinum   | Proton Experimental
2025-02-18 | gold       | Proton 8.0-5
2025-02-10 | platinum   | Proton Experimental
2025-02-05 | silver     | Proton 7.0-6
2025-01-28 | gold       | Proton 8.0-5
```

A lição está nos extremos: o `silver` de fevereiro com Proton 7.0 virou `platinum` em março com Proton 9.0. Report antigo não é inútil — ele documenta a trajetória.

## Reports como receita reproduzível

O melhor tipo de report é o que você consegue *reproduzir* no seu deck. Ele lista os passos exatos, e você os faz em dois ou três minutos. Um exemplo típico, transcrito num formato que vale a pena reconhecer:

```terminal
## Deck OLED, SteamOS 3.6, Proton Experimental
## Funcionou de cara: áudio, vídeo, cutscenes, save na nuvem.
## Problema: vídeo de abertura preto, sem som.
## Solução: trocar para GE-Proton9-20, nada de flags extras.
$ protontricks 1145360 winetricks mf-install
```

Nem todo report vem assim limpo, mas ao ler você consegue reconstruir esses quatro blocos: contexto de hardware, o que funcionou, o sintoma e a solução. Esse esqueleto é o que você deve extrair de qualquer relato antes de agir sobre ele.

:::atencao
Não aplique cegamente a solução de um report antigo. Se o sintoma descrito não bater com o que você vê na sua tela, a receita provavelmente não é para você. Sintoma diferente, causa diferente — por mais que seja o mesmo jogo.
:::

## Quando o report não resolve nada

Há uma categoria de relato que você precisa saber reconhecer para não gastar tarde inteira: o report que só descreve o problema sem solução, normalmente encerrado com "devolvi o jogo" ou "desisti". Ele tem valor como alerta — se *muitos* reports recentes de deck forem desse tipo para um jogo, é sinal de que o título simplesmente não tem caminho viável e a medalha `Borked` está certa. Aí, em vez de insistir, a decisão sensata é esperar uma atualização do Proton ou procurar alternativa.

## Resumo

- Um report tem dados estruturados (OS, GPU, Proton, data) e um comentário livre com sintoma e solução.
- Relatos úteis explicam causa e caminho; relatos de uma linha são quase inúteis.
- Avalie cada report por três perguntas: é recente, é do hardware certo, explica a causa.
- Sintomas recorrentes apontam causas conhecidas: vídeo preto = codec, launcher = flag, jogo online = anticheat.
- A assinatura da causa normalmente dita a solução; pergunte sempre qual a versão do Proton usada.
- Muitos reports `Borked` sem solução sinalizam título sem caminho viável no momento.

## Exercícios

1. Abra um jogo com pelo menos dez reports e classifique três deles em "útil" ou "ruído", justificando.
2. Encontre um report de deck descrito há mais de um ano e procure um report recente do mesmo jogo para comparar a evolução.
3. Identifique, num jogo com vídeo preto relatado, qual solução a comunidade apresenta e que ferramenta ela envolve.
4. Transcreva um report completo no esqueleto "contexto / funcionou / sintoma / solução" e verifique se as peças batem.
5. **Desafio.** Escolha um jogo `Silver` no deck e leia todos os reports de deck recentes. Reconstrua a receita mais consensual e escreva os passos no formato reproduzível, tentando reproduzi-la de fato no seu deck com `protontricks` ou flags de lançamento.
