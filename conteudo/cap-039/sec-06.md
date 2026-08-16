O ProtonDB não é um serviço contratado — ele só existe porque jogadores como você enviam reports. Cada relato que você publica alimenta o placar, ajusta a medalha e, principalmente, deixa a receita para o próximo. Contribuir bem é uma habilidade: um report mal escrito polui o banco, e um report bem feito pode ser exatamente o que faltava para alguém decidir comprar (ou não) um jogo.

:::objetivos
- Criar uma conta e vincular à Steam para enviar reports
- Saber quais campos preencher e como escrever um bom comentário
- Entender a diferença entre report de desktop e report de Steam Deck
- Evitar erros comuns que tornam o report inútil
- Usar o report como ferramenta para acompanhar seus próprios testes

:::

## Vinculando conta e submetendo o primeiro report

Para enviar um report você precisa de uma conta no ProtonDB — o login usa OpenID via Steam, ou seja, você não cria senha separada. Depois de logado, o link `Contribute` aparece no canto superior e leva a um formulário simples: primeiro você digita o nome ou o AppID do jogo, depois preenche os campos.

O formulário pede: versão do Proton usada, se o jogo funcionou, que nota você dá dentro da escala, e um campo de texto livre para descrever a experiência. Os campos de sistema operacional e GPU são detectados automaticamente, mas você pode corrigir se estiverem errados — e é aqui que muita gente envia report de deck que aparece como "Arch Linux" genérico.

:::atencao
O ProtonDB detecta o SO olhando o `PRETTY_NAME` do arquivo `/etc/os-release`. No SteamOS 3.6, isso normalmente mostra "SteamOS". Se você modificou o sistema ou está rodando algo fora do Game Mode, confira se o campo de SO no formulário realmente diz "SteamOS" — senão seu report vai contar como desktop.
:::

## O que escrever no comentário

O campo de texto é o que dá alma ao report. Escreva como se estivesse falando com alguém que está considerando comprar o jogo *agora*, no mesmo hardware que você. O roteiro de três parágrafos cobre quase tudo:

O primeiro parágrafo responde "funcionou de cara?". Diga qual versão do Proton usou, se abriu normalmente, se o vídeo de abertura tocou som e imagem, e se o menu carregou. É o contexto para quem quer saber o que esperar.

O segundo parágrafo descreve a experiência real de jogo: framerate (mesmo que estimado), se houve crash, se alguma função específica quebrou (save na nuvem, multiplayer, tela cheia, controle). Se usou Proton Experimental ou GE, mencione a versão exata, porque daqui a alguns meses ninguém vai saber qual era a "mais recente".

O terceiro parágrafo descreve o que você *fez* para melhorar, se algo: flags de lançamento, protontricks, troca de versão de Proton. Se não fez nada e funcionou, escreva isso também — um "funcionou sem ajustes" é um dado valioso.

:::exemplo
**Report bem escrito (deck, resumido):**

SteamOS 3.6, Proton Experimental (bleeding-edge). Jogo abre e carrega normalmente, cutscene inicial tocou som e vídeo. Rodei a primeira hora a 60 fps estáveis com configuração padrão em médio. Controle funcionou nativamente, save na nuvem sincronizou sem erro. Nenhuma flag necessária.

Esse report diz exatamente o que a pessoa que está na página do jogo quer saber — hardware, versão do Proton, resultado e condições.
:::

Relatos como "funcionou", "não roda", "bom" ou "ok" não acrescentam nada além de um voto. Você pode, e deve, ser mais generoso do que isso.

Para ver a diferença entre um report bom e um ruim na prática, compare dois reports reais da API no campo `body`:

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/1145360.json" | python3 -c "
import sys, json
reports = json.load(sys.stdin)
for r in reports[:5]:
    body = r.get('body', '')[:120]
    print(f\"Rating: {r['rating']:10s} | {body}...\")
    print('---')
"
Rating: platinum   | Runs perfectly out of the box. 60fps locked, no tweaks needed. Tested on deck OLED with Proton 9.0-4. Cutscenes play ...
---
Rating: platinum   | works...
---
Rating: gold       | Had black screen on launch. Fixed by switching to GE-Proton9-15. After that, flawless. Played 20h, no crashes, Steam ...
---
Rating: platinum   | ok...
---
Rating: platinum   | Perfect on desktop. SteamOS 3.6, Proton Experimental. Controller recognized natively, cloud saves synced. Did not test mul...
```

Os dois reports de uma palavra ("works", "ok") são os que não ajudam ninguém, mesmo que puxem a medalha para cima. Os outros três são o padrão-ouro.

## O que não fazer

Quatro vícios estragam um report e são evitáveis:

- **Não listar a versão do Proton.** Dizer "a mais recente" é vago: daqui a seis meses ninguém saberá qual era. Escreva "Proton 9.0-4" ou "GE-Proton9-20".
- **Misturar desktop com deck.** Se você testou no deck, diga explicitamente e confira o campo de SO. Se testou nos dois, faça dois reports separados.
- **Avaliar pela expectativa, não pela experiência.** A pergunta do formulário é "o jogo funciona?", não "você gostou do jogo?". Um jogo que você acha chato mas roda perfeitamente merece `Platinum`.
- **Só reportar quando quebra.** Reports de "funcionou perfeitamente" são tão importantes quanto os de problema — eles equilibram o placar e impedem que a medalha seja puxada para baixo apenas por quem teve problema.

Para conferir rapidamente se seu sistema foi detectado corretamente antes de submeter um report, verifique os campos que o ProtonDB lê da sua máquina:

```terminal
$ cat /etc/os-release | grep PRETTY_NAME
PRETTY_NAME="SteamOS 3.6"
$ lspci | grep -i vga | cut -d: -f3
Advanced Micro Devices, Inc. [AMD/ATI] Van Gogh [AMD Custom GPU 0405]
```

Se `PRETTY_NAME` mostrar "SteamOS" e a GPU for "AMD Custom GPU 0405", o formulário do ProtonDB vai detectar seu hardware como Steam Deck. Se mostrar outra coisa (ex.: "Arch Linux") e você está no deck, corrija manualmente antes de enviar.

## Acompanhando seus próprios reports

Depois de enviar, seu relato aparece na lista pública junto com os dos outros. Você pode voltar e editá-lo a qualquer momento — útil para atualizar a informação quando uma nova versão do Proton melhora (ou piora) a situação do jogo. Manter seu report atualizado é mais valioso do que escrever um novo a cada patch, porque a timeline do relato mostra a evolução do jogo no Proton ao longo do tempo.

Para ver como seus próprios reports ficam depois de enviados (e confirmar que estão corretos), você pode puxar a lista de reports filtrando por data decrescente e localizar o seu:

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/1145360.json" | python3 -c "
import sys, json
reports = json.load(sys.stdin)
mine = [r for r in reports if 'SteamOS' in r.get('os', '')]
print(f'Reports de SteamOS: {len(mine)} de {len(reports)} total')
for r in mine[:3]:
    print(f\"  {r['created'][:10]} | {r['rating']} | {r.get('body','')[:80]}\")
"
Reports de SteamOS: 17 de 28 total
  2025-03-18 | platinum | Runs perfectly out of the box. 60fps locked...
  2025-03-12 | platinum | Perfect on deck. Proton 9.0-4, no flags...
  2025-03-05 | gold     | Works with GE-Proton9-15 for video codecs...
```

Com o login feito no site, você acessa a página "My Reports" e edita qualquer um com um clique — a interface carrega os campos preenchidos com os dados que você enviou da última vez.

:::dica
Trate seus reports como um diário de compatibilidade. Jogou um jogo por 30 horas e nunca deu problema? Atualize o report dizendo "zerei, sem nenhum crash do início ao fim" — isso tem um peso enorme para quem está lendo.
:::

## Resumo

- A conta no ProtonDB usa login via Steam OpenID; não há senha separada.
- O formulário detecta SO e GPU automaticamente, mas confira se "SteamOS" aparece antes de enviar.
- Um bom report tem três partes: o que funcionou de cara, como foi a experiência de jogo e o que você ajustou.
- Informe a versão exata do Proton; não escreva "a mais recente".
- Reports de "funcionou perfeitamente" são tão importantes quanto reports de problema.
- Edite reports antigos em vez de duplicá-los com cada atualização do Proton.

## Exercícios

1. Sem enviar de fato, preencha mentalmente o formulário de report para um jogo que você jogou recentemente com todos os campos que o site pede.
2. Leia cinco reports ruins (de uma linha) de um jogo e reescreva como eles *deveriam* ser no formato de três parágrafos.
3. Identifique num jogo popular três reports que listam versões diferentes de Proton e ordene-os por data; explique a evolução da compatibilidade visível ali.
4. Configure sua conta no ProtonDB e envie um report real de um jogo que você testou no deck. Inclua captura mental de todos os campos.
5. **Desafio.** Acompanhe seu report por duas semanas, veja se novos relatos apareceram e edite o seu se descobrir melhorias. Escreva uma mini-retrospectiva: a medalha do jogo mudou nesse período?