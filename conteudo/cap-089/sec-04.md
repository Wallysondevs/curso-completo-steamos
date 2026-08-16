Com o Decky Loader no lugar, o próximo passo é o plugin que de fato muda a cara do aparelho: o CSS Loader. Ele é a ponte entre as skins e a interface do Steam, permitindo instalar temas prontos, alternar entre eles e, para quem quiser, escrever o próprio CSS. Esta seção ensina a instalar, usar, organizar e — ponto crucial — recuperar-se quando uma skin deixa o menu ilegível.

:::objetivos
- Instalar o CSS Loader dentro do Decky Loader
- Instalar, ativar e desativar skins
- Entender o conceito de "perfil" de skins e como combiná-las
- Localizar as skins no disco para inspeção e backup
- Recuperar o sistema quando uma skin quebra a interface
:::

## Instalando o CSS Loader

O CSS Loader é instalado como qualquer plugin, pela loja do Decky. Dentro do menu `...` → aba de plugins → loja, busque "CSS Loader" e instale. Como o CSS Loader injeta estilos na inicialização, ele costuma pedir um reinício do cliente Steam para ficar ativo.

```text
Menu "..." -> Plugins -> Loja -> CSS Loader -> Instalar -> reiniciar Steam
```

Depois do reinício, o CSS Loader ganha uma entrada própria no menu de plugins, com as abas de navegação de skins, de temas instalados e de perfis. É ali que toda a gestão acontece, sem precisar de terminal.

A instalação também cria os diretórios de trabalho no disco. Conhecê-los permite inspecionar e exportar o que foi baixado:

```terminal
$ ls ~/homebrew/plugins/
CSSLoader
$ ls ~/homebrew/plugins/CSSLoader
package.json  dist  src
$ ls ~/.local/share/Steam/skins 2>/dev/null || echo "pasta ainda não criada"
```

O CSS Loader guarda as skins baixadas numa pasta dedicada sob o perfil do usuário (tradicionalmente ligada ao diretório de temas do Steam), e cada skin é uma subpasta com um arquivo de metadados descrevendo nome, autor e arquivos de destino.

## Baixando e ativando uma skin

A navegação de skins do CSS Loader funciona como uma vitrine: você vê miniaturas, categorias (cores, tipografia, minimalistas, temáticas) e um botão para instalar. Uma skin instalada pode ser **ativada** — aplicada imediatamente — ou apenas mantida baixada para uso futuro.

O ponto de confusão mais comum é a diferença entre *instalar* e *ativar*. Instalar baixa o tema; ativar aplica. Você pode ter vinte skins instaladas e só uma ativa de cada tipo, ou combinar skins de escopos diferentes (uma para cores, outra para a biblioteca, outra para a tipografia).

```terminal
$ ls ~/.local/share/Steam/skins
skin-colors-blue  skin-minimal  skin-rounded
```

Cada subpasta representa uma skin baixada. Dentro dela, um arquivo de metadados (em geral `theme.json` ou similar) descreve o que a skin modifica.

:::dica
Combine skins de **escopos que não se sobrepõem** em vez de empilhar duas que mexem na mesma coisa. Duas skins que alteram as cores vão brigar, e o resultado é imprevisível. Uma de cores + uma de tipografia + uma de cantos arredondados, porém, convivem bem.
:::

## Perfis de skins

O CSS Loader introduz a ideia de **perfil**: um conjunto nomeado de skins ativas que você salva e reaplica com um toque. É útil para alternar entre "estética do dia a dia" e "tema de época", ou para voltar rápido a um estado que você sabe que funciona.

```text
Perfis -> "Meu padrão" -> [skin-cores-blue, skin-minimal] -> Salvar
```

Um perfil guarda a lista de skins e suas opções (muitas skins têm ajustes próprios, como escurecer o fundo ou arredondar cantos). Restaurar o perfil religa exatamente essas combinações. Um bom hábito é salvar um perfil chamado "limpo" sem nenhuma skin ativa, para servir de botão de pânico.

## O que fazer quando a skin quebra tudo

Cenário: você ativa uma skin e o menu fica ilegível — textos brancos sobre fundo branco, botões sumindo, interface embaralhada. Isso acontece quando a skin foi feita para uma versão antiga do Steam. A recuperação tem caminho garantido porque toda a personalização vive no disco, e desativar a skin é só remover o CSS injetado.

A forma mais direta é pelo próprio CSS Loader: abrir o menu de plugins e desativar a skin ofensora. Mas se a interface está tão quebrada que você não consegue navegar, dá para agir por dentro do arquivo de configuração do plugin, no modo desktop.

```terminal
$ ls ~/homebrew/settings/ 2>/dev/null
CSSLoader
$ cat ~/homebrew/settings/CSSLoader/settings.json 2>/dev/null | head -20
{
  "active_themes": [
    "skin-cores-blue",
    "skin-minimal"
  ]
}
```

Editar esse arquivo removendo a skin problemática da lista `active_themes` (ou esvaziando a lista) e reiniciar o Steam restaura a interface padrão. É o caminho de resgate quando a tela não deixa navegar.

:::atencao
Antes de recorrer à edição manual, tente o atalho de desativação por dentro do menu — muitas versões do CSS Loader têm um botão "desativar tudo" acessível mesmo com o visual levemente quebrado. A edição do `settings.json` é o plano B para quando nada na tela responde.
:::

## Escrevendo (e inspecionando) seu próprio CSS

Para quem quer ir além dos temas prontos, o CSS Loader aceita skins personalizadas: basta criar uma subpasta com os arquivos de tema e um metadado apontando para o CSS. Aqui o conhecimento da [estrutura da interface do modo jogo](#/cap-089/sec-02) paga dividendos, pois você vai inspecionar as classes reais da interface.

A forma de descobrir uma classe é inspecionar a página do Steam, algo possível porque o cliente roda num Chromium. Um atalho comum é ativar o modo de inspeção do próprio Steam (via `steam -dev` ou flags de depuração) e usar as ferramentas de desenvolvedor para apontar para um elemento e ver seu seletor.

```terminal
$ grep -rl "libraryroot" /usr/lib/steam/steamui/css/ 2>/dev/null | head -3
/usr/lib/steam/steamui/css/libraryroot.css
```

Uma skin mínima pode ser um único arquivo CSS que sobrescreve uma cor. O importante é que o arquivo esteja declarado no metadado da skin para o CSS Loader carregá-lo.

```css
/* skin-minimal: deixa o fundo da biblioteca mais escuro */
.library_Container_xxx {
  background: #0a0a0a;
}
```

:::info
Os seletores reais do Steam usam IDs com sufixo aleatório (como `.library_Container_1h2j3`) que mudam entre builds — por isso skins manuais quebram tão rápido. As skins mantidas pela comunidade são atualizadas pelos autores a cada build novo do Steam; é o argumento definitivo para preferir temas prontos e atualizados a escrever CSS fixo na mão.
:::

## Resumo

- O CSS Loader é o plugin do Decky que instala, ativa e gerencia skins no modo jogo.
- Instalar baixa a skin; ativar aplica — é possível ter várias instaladas e combinar as de escopos diferentes.
- Um perfil salva um conjunto de skins ativas e permite reaplicá-las (ou "limpar tudo") com um toque.
- Skins ficam no disco do usuário; editar `settings.json` desativa uma skin mesmo com a tela quebrada.
- Skins quebram quando o Steam muda os seletores; temas atualizados pela comunidade são mais seguros.
- Escrever CSS próprio exige inspecionar as classes reais da interface, que mudam a cada build.

## Exercícios

1. Instale o CSS Loader pela loja do Decky e confirme com `ls ~/homebrew/plugins/` que a pasta `CSSLoader` existe.
2. Baixe duas skins de escopos diferentes (uma de cores, uma de tipografia) e ative as duas. Depois desative uma e observe o que muda.
3. Crie um perfil "limpo" sem skins ativas e outro com uma combinação sua. Alterne entre eles e verifique a reaplicação.
4. Localize a lista `active_themes` no arquivo de configuração do CSS Loader e compare-a com o que está ativo na interface.
5. **Desafio.** Simule uma quebra: ative uma skin sabidamente velha, confirme a interface corrompida, e recupere o sistema usando **apenas** a edição do `settings.json` (ou o botão "desativar tudo") — sem reinstalar o plugin.
