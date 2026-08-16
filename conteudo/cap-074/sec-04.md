O painel do CSS Loader mostra uma lista de temas: alguns mudam a biblioteca, outros trocam a página do jogo, outros escondem elementos de navegação ou redesenham o "hero" do topo. A diferença entre um Deck visualmente limpo e um Deck bagunçado está em saber o que cada tema mexe e em evitar acumular modificações redundantes. Esta seção percorre os principais tipos de tema de interface e o que esperar de cada um.

:::objetivos
- Navegar o catálogo de temas do repositório oficial do CSS Loader
- Distinguir temas de biblioteca, página do jogo e ajustes pontuais
- Configurar o "hero" e as capas de jogo em destaque
- Ativar e desativar temas sem conflito usando perfis
- Identificar o impacto de múltiplos temas sobre o mesmo componente
:::

## O catálogo e seus tipos

O CSS Loader carrega temas de um repositório mantido pela comunidade. No painel, eles aparecem agrupados por alvo:

| Aba do painel | O que altera | Exemplos conhecidos |
|---|---|---|
| Home | Página inicial com o feed e destaques | Switch Like Home, Clean Home |
| Library | Cabeçalho, filtros, grade de jogos | Clean Gameview, Obsidian |
| Game View | Página individual do jogo (fundo, hero) | Art Hero, No Hero |
| Quick Access | Menu rápido do botão `[[...]]` | Round, QAM Patch |
| Components | Elementos isolados (scrollbar, popups) | Centered Text, No Badges |
| Keyboard | Visual do teclado virtual | Cozy, Terminal Keyboard |
| Sounds | Pacotes de áudio da interface | PS5 UI, Minimal |

O agrupamento não é mágica: cada tema tem seu campo `tabs` no `theme.json` que o CSS Loader lê para montar essa hierarquia. Um tema de *Game View* não vai aparecer na aba de *Library*.

O erro mais comum de quem começa é instalar dois temas que mexem no mesmo componente (dois que alteram o hero da página do jogo, por exemplo). O resultado é imprevisível: um `!important` pode derrotar o outro dependendo da ordem de carregamento, e elementos podem sumir se os seletores se anularem mutuamente.

## Temas de biblioteca: Clean Gameview e Obsidian

Dois temas dominam o catálogo e ilustram filosofias opostas. O **Clean Gameview** remove distrações: fundo escuro sólido, cantos arredondados, tipografia mais limpa. O **Obsidian** vai mais fundo e reescreve a paleta inteira da interface para um esquema escuro com tons de cinza, azul e destaque em ciano.

No terminal, é possível ver a diferença de complexidade:

```terminal
$ wc -l ~/homebrew/themes/Clean\ Gameview/*.css
  45  gameview.css
  12  patches.css
  57  total
$ wc -l ~/homebrew/themes/Obsidian/*.css 2>/dev/null | tail -1
 380  total
```

O Clean Gameview tem 57 linhas; o Obsidian, 380. A contagem de linhas é uma aproximação grosseira, mas reflete a ambição: o primeiro é um ajuste cirúrgico; o segundo, uma reescrita extensa. Quanto mais CSS um tema injetar, mais pontos de quebra ele terá depois de uma atualização do Steam.

Para aplicar qualquer um, basta abrir o Decky, selecionar o tema na lista e alternar o *toggle* para ativado. O CSS Loader salva a escolha e injeta o CSS na próxima navegação.

## O "hero" e o fundo dos jogos

O **hero** é a imagem de fundo grande que domina o topo da página de um jogo na interface do Steam. O CSS Loader possui temas dedicados exclusivamente a ele. O mais usado é o **Art Hero**, que troca o fundo padrão da Valve por uma imagem em alta resolução do jogo selecionado que ocupa todo o fundo da página.

O Art Hero funciona em duas etapas: primeiro, ele baixa as imagens de um serviço externo (SteamGridDB ou similar); depois, aplica CSS que redimensiona e posiciona a imagem como plano de fundo. A parte de CSS é simples:

```css
.gamepaddialog_ModalPosition_3jVY1 {
  background-size: cover !important;
  background-position: center !important;
}
```

Mas o download da imagem é feito pelo backend do plugin (JavaScript), não pelo CSS. É aí que mora a complexidade: se o serviço externo estiver fora do ar, o hero simplesmente não carrega — sem erro visível, apenas um fundo preto onde deveria estar uma arte.

```terminal
$ grep -r "steamgriddb\|sgdb\|fetch" ~/homebrew/plugins/SDH-CssLoader/ 2>/dev/null | head -5
src/backend/browser.ts:    const response = await fetch(url, { signal });
src/stores/artStore.ts:    const artUrl = `https://cdn.steamgriddb.com/thumb/${id}.png`;
```

## Perfis e o botão de pânico

Acumular temas pode virar uma dor de cabeça quando algo quebra: qual deles é o culpado? O CSS Loader resolve isso com **perfis**. Um perfil é um conjunto de temas ativados que você pode trocar de uma vez. Na prática, você cria perfis como "Jogo", "Leve" e "Padrão", cada um com uma combinação diferente.

Para diagnóstico, o perfil mais útil é o que **desativa tudo** (equivalente ao *toggle* mestre de desligar o CSS Loader). Se um componente sumiu, você desliga todos os temas e os religa um a um até o culpado aparecer.

:::dica
Mantenha um perfil chamado "Limpo" que não ativa tema nenhum. É o botão de pânico que você usa quando uma atualização do SteamOS muda os seletores e você precisa voltar ao normal em três segundos.
:::

A configuração de perfis é salva no JSON de settings:

```terminal
$ cat ~/homebrew/settings/SDH-CssLoader/settings.json | python3 -m json.tool
{
    "active_profile": "Jogo",
    "profiles": [
        {"name": "Limpo", "themes": []},
        {"name": "Jogo", "themes": ["Clean Gameview", "Art Hero", "Round"]},
        {"name": "Leve", "themes": ["Clean Gameview"]}
    ]
}
```

## Resumo

- O catálogo do CSS Loader agrupa temas por alvo: Home, Library, Game View, Quick Access, Components, Keyboard, Sounds.
- Temas como Clean Gameview (57 linhas de CSS) são cirúrgicos; Obsidian (380 linhas) reescreve a interface por completo.
- Dois temas que mexem no mesmo componente competem via `!important` e a ordem de injeção; o resultado é imprevisível.
- O Art Hero baixa imagens de um serviço externo; se o serviço cair, o hero aparece preto sem mensagem de erro.
- Perfis salvam combinações de temas; manter um perfil "Limpo" sem temas é o botão de pânico contra quebras.

## Exercícios

1. Abra o painel do CSS Loader e anote quantos temas estão disponíveis em cada aba. Identifique a qual página cada aba corresponde.
2. Compare o número de linhas de CSS de dois temas instalados usando `wc -l`. Qual dos dois tem mais probabilidade de quebrar na próxima atualização do Steam? Justifique.
3. Crie um perfil "Limpo" com zero temas ativos e um perfil "Custom" com dois temas da sua escolha. Troque entre eles e observe a diferença.
4. Com o Art Hero ativo, execute `grep -r "steamgrid" ~/homebrew/` e localize o trecho de código que faz o download das imagens. Descreva o que acontece se o `fetch` falhar.
5. **Desafio.** Explique por que dois temas que usam `!important` sobre o mesmo elemento podem dar resultados diferentes dependendo da ordem em que são carregados, e relacione isso com a arquitetura em páginas do webview do Steam.