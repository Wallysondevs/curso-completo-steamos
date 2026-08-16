O Steam Workshop não serve só para mods de jogo — ele também hospeda layouts de controle criados pela comunidade. Para qualquer jogo com suporte a SteamInput, você pode baixar, avaliar e publicar layouts, herdando horas de ajuste fino que outra pessoa já fez. E o melhor: dá para inspecionar esses layouts como referência para os seus próprios.

:::objetivos
- Navegar pela galeria de layouts da comunidade para um jogo específico
- Filtrar por tipo de controle (Deck, PS4, Xbox, genérico)
- Publicar um layout próprio no Workshop
- Inspecionar layouts baixados no disco para aprender com eles
- Avaliar e reportar layouts quebrados ou maliciosos
:::

## A galeria de layouts por jogo

Cada jogo na biblioteca Steam tem sua própria seção de layouts da comunidade. O caminho é: abrir o overlay Steam (`Steam`), ir em *Configurações do Controle* e selecionar o jogo. A tela de seleção de layout lista:

1. **Layout oficial** (feito pelo estúdio do jogo, se existir)
2. **Templates da Valve** (gamepad básico, teclado e mouse, etc.)
3. **Seus layouts pessoais** (salvos localmente)
4. **Layouts da comunidade** (do Workshop)

```text
Tela de seleção de layout para "Elden Ring":
  → Recomendado: "Official Layout for Elden Ring"
  → Templates:   Gamepad, Keyboard (WASD) and Mouse, ...
  → Pessoais:    Meu layout Souls (local)
  → Comunidade:  142 layouts disponíveis
      ├─ "Souls Pro v3" por Marcola (4.8★, 12.3k usuários)
      ├─ "No Lock-on Flick" por AnaMiyazaki (4.5★, 8.1k usuários)
      └─ ...
```

A classificação por estrelas e número de usuários é um bom indicador inicial, mas sempre teste: o layout mais popular pode não combinar com sua ergonomia. Polegares têm tamanhos diferentes.

## Filtrando por tipo de controle

O SteamInput adapta layouts entre controles diferentes (um layout de PS4 funciona no Deck e vice-versa), mas há nuances: o touchpad único do DualShock 4 não é igual aos dois touchpads do Deck. Ao filtrar por "Steam Deck", você vê só layouts que foram feitos pensando nos dois trackpads e quatro botões traseiros:

```text
Filtros disponíveis na galeria:
  ☑ Steam Deck
  ☐ PlayStation 4/5
  ☐ Xbox One/Series
  ☐ Steam Controller
  ☐ Genérico
```

:::dica
Mesmo que você use só o Deck, não ignore layouts de Steam Controller. Eles também têm dois touchpads e dois botões traseiros. O mapeamento muitas vezes é 95% compatível, faltando só os botões de pegada extras do Deck.
:::

## Inspecionando layouts baixados no disco

Quando você aplica um layout da comunidade, ele é baixado e armazenado localmente. O diretório exato depende da sua instalação, mas está sempre dentro da árvore `~/.local/share/Steam`:

```terminal
$ find ~/.local/share/Steam/userdata -name '*.vdf' -path '*controller*' 2>/dev/null | head -5
/home/deck/.local/share/Steam/userdata/12345678/config/controller_configs/440/workshop/987654321.vdf
/home/deck/.local/share/Steam/userdata/12345678/config/controller_configs/440/local/mypersonal.vdf
```

Aqui, `12345678` é seu Steam ID (número de 64 bits), `440` é o AppID do jogo (no caso, Team Fortress 2), e `987654321` é o ID do layout no Workshop. A pasta `local/` guarda seus layouts pessoais; `workshop/` guarda os baixados.

```terminal
$ cat ~/.local/share/Steam/userdata/12345678/config/controller_configs/440/workshop/987654321.vdf | head -30
"controller_mappings"
{
    "version"    "3"
    "revision"   "17"
    "title"      "Souls Pro v3"
    "description"    "Optimized for action RPGs with dodge on grip"
    "group_source_bindings"
    {
        "bindings"
        {
            "bind_lower"    "button_A"
            "bind_upper"    "button_dodge"
        }
    }
}
```

Ler layouts da comunidade é um curso gratuito de design de controle. Preste atenção em três coisas: quais ações foram movidas para os botões traseiros, como as camadas estão organizadas e se o giroscópio foi usado com ativação Touch ou Always On. Cada decisão de design tem um motivo — tente deduzir qual é.

:::atencao
Layouts baixados são arquivos de texto plano e não executam código arbitrário — não há risco de malware. O pior que pode acontecer é um layout com configurações tão ruins que o jogo fica injogável. Nesse caso, volte ao layout oficial e siga em frente.
:::

## Publicando um layout no Workshop

Quando seu layout estiver redondo e testado, você pode retribuir à comunidade publicando-o. O fluxo é:

1. No editor de layout, clique em *Exportar* → *Publicar no Workshop*
2. Dê um nome descritivo (ex.: "Deck BR — PT-BR otimizado para FPS")
3. Escreva uma descrição que explique o diferencial do layout
4. Selecione o tipo de controle alvo (Steam Deck)
5. Marque tags: "FPS", "Português", "Giroscópio"

```text
Tela de publicação:
  Título: "Deck BR — CS2 com giroscópio e radial para granadas"
  Descrição: "Layout otimizado para Counter-Strike 2 no Steam Deck.
              Giroscópio ativado ao tocar o pad direito (touch).
              Radial menu de 8 setores no pad esquerdo para granadas.
              Botões traseiros: agachar (L4), pular (R4), macro de
              compra rápida (L5)."
  Visibilidade: Público
  Tipo de controle: Steam Deck
  Tags: FPS, competitivo, giro, radial, português
```

O layout será publicado no Workshop e aparecerá na galeria para qualquer pessoa que tenha o mesmo jogo. Outros usuários podem favoritar, comentar e reportar problemas.

:::info
Você precisa ter o Steam Guard ativado e ter feito pelo menos uma compra na loja para publicar no Workshop (medida anti-spam da Valve). O requisito não tem a ver com dinheiro gasto — qualquer compra, mesmo um jogo de R$ 1,50, libera a publicação.
:::

## Resumo

- Cada jogo tem sua própria galeria de layouts no Workshop do Steam, acessível pelo overlay de controle.
- Filtrar por "Steam Deck" garante layouts que usam os dois touchpads e quatro botões traseiros.
- Layouts baixados ficam em `~/.local/share/Steam/userdata/<seu_id>/config/controller_configs/<appid>/workshop/`.
- Ler layouts da comunidade é uma forma de aprender design de controle; observe o que foi movido para botões traseiros e como as camadas estão organizadas.
- Publicar no Workshop requer Steam Guard e uma compra na loja; o fluxo é Exportar → Publicar com título, descrição e tags.
- Layouts do Workshop são seguros: são arquivos de texto, não executam código.

## Exercícios

1. Para um jogo da sua biblioteca, abra a galeria de layouts da comunidade e anote quantos layouts existem e qual a nota do mais popular.
2. Baixe o layout mais popular, aplique-o e jogue por 15 minutos. Descreva o que ele faz de diferente do padrão e se você manteria a mudança.
3. Localize o arquivo `.vdf` do layout baixado com `find` e leia as primeiras 30 linhas. Identifique se ele usa camadas ou macros.
4. Filtre a galeria por "Steam Controller" em vez de "Steam Deck" e compare a quantidade de layouts disponíveis. O que isso diz sobre a adoção de cada controle?
5. **Desafio.** Publique um dos layouts que você criou nos exercícios anteriores. Escreva uma descrição em português, tire um screenshot da tela de configuração (se possível) e compartilhe o link do Workshop com um amigo para teste. Depois, relate se o feedback recebido mudou algo no seu design.