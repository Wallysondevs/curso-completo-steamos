Instalar tema dos outros é o começo; fazer o seu é quando você passa a enxergar a interface do Steam como matéria-prima. Criar um tema no CSS Loader exige só três ingredientes que você já domina: um manifesto JSON, uma folha CSS e um olho para quais elementos merecem mudança. Esta seção monta, do zero, um tema mínimo funcional e o publica localmente para o CSS Loader reconhecê-lo.

:::objetivos
- Planejar um tema próprio do manifesto à publicação
- Escrever um `theme.json` válido no formato `spec` v3
- Escrever uma folha CSS com seletores reais da interface
- Testar o tema localmente sem publicá-lo no repositório
- Versionar e iterar com segurança usando um diretório de desenvolvimento
:::

## Planejando antes de escrever

Um tema bom nasce de uma intenção clara e pequena. "Deixar tudo preto com neon" é vago e quebra fácil; "mudar o fundo da página do jogo para um tom escuro sólido e arredondar as capas" é concreto e sobrevive. A regra de ouro para autores iniciantes é começar mirando **um componente** de **uma página**, não a interface inteira.

O esqueleto mínimo de pastas é este:

```terminal
$ mkdir -p ~/homebrew/themes/MeuPrimeiroTema
$ ls ~/homebrew/themes/MeuPrimeiroTema/
```

O CSS Loader enxerga qualquer pasta em `~/homebrew/themes/` que contenha um `theme.json` válido. Isso significa que você pode desenvolver o tema **direto no diretório de temas**, iterar e testar sem precisar compilar ou publicar nada. Depois de pronto, move para onde quiser.

## O manifesto `theme.json`

O manifesto segue o mesmo formato `spec: v3` que você viu nos temas instalados. Para um tema de página de jogo, ficaria assim:

```json
{
  "name": "MeuPrimeiroTema",
  "author": "ana",
  "version": "v1.0",
  "target": "SP",
  "manifest_version": 8,
  "spec": "v3",
  "description": "Fundo escuro sólido e capas arredondadas na página do jogo.",
  "tabs": ["CSS Loader", "Game View"]
}
```

Grave como `theme.json` na pasta do tema. Vale destacar três campos que decidem o comportamento:

- `target: "SP"` restringe a injeção às páginas internas do Steam.
- `tabs` controla onde o tema aparece no painel — `[ "CSS Loader", "Game View" ]` o coloca na aba Game View.
- `manifest_version` e `spec` devem casar com o que o seu CSS Loader entende; se você pegar um tema que funciona como modelo, copie esses valores dele.

Depois de gravar, valide o JSON antes de qualquer outra coisa:

```terminal
$ python3 -m json.tool ~/homebrew/themes/MeuPrimeiroTema/theme.json
{
    "name": "MeuPrimeiroTema",
    "author": "ana",
    "version": "v1.0",
    "target": "SP",
    "manifest_version": 8,
    "spec": "v3",
    "description": "Fundo escuro s\u00f3lido e capas arredondadas na p\u00e1gina do jogo.",
    "tabs": ["CSS Loader", "Game View"]
}
```

## Escrevendo o CSS

Agora a folha de estilos. Para este exemplo, vamos mudar o fundo do cabeçalho da página do jogo e arredondar as capas. Criamos `gameview.css`:

```css
/* MeuPrimeiroTema/gameview.css */
.gamepadtabbedpage_PageHeader_1U7vH {
  background: #0e141b !important;
}

.BasicUI .appportrait_CapsuleArt_2XHtT {
  border-radius: 12px !important;
  transition: transform .15s ease;
}

.BasicUI .appportrait_CapsuleArt_2XHtT:hover {
  transform: scale(1.04);
}
```

O ponto sensível são os **seletores**: os nomes com sufixo de hash (`_1U7vH`, `_2XHtT`) precisam corresponder aos que a sua versão do Steam realmente usa. Se você os escrever errado, o tema carrega mas não muda nada — e não há erro visível. A forma confiável de obter os seletores corretos é inspecionar a interface em execução, não chutá-los.

Para ligar a folha ao manifesto, o CSS Loader na spec v3 infere o carregamento a partir da **presença do arquivo** ou de uma lista explícita. A forma mais previsível é declarar explicitamente:

```json
{
  "name": "MeuPrimeiroTema",
  "target": "SP",
  "tabs": ["CSS Loader", "Game View"],
  "patches": {
    "Game View": {
      "styles": ["gameview.css"]
    }
  }
}
```

:::nota
O curinga `patches` varia levemente entre versões do CSS Loader. Antes de escrever um tema do zero, abra o `theme.json` de um tema moderno que já funciona (como o Clean Gameview) e **imite a estrutura dele**: manifesto versionado certo, lista de estilos e nomenclatura de arquivos.
:::

## Testando e iterando

Com o manifesto e o CSS no lugar, o CSS Loader precisa "ver" o tema. Reinicie o Decky ou toque no botão de recarregar plugins do painel; o tema deve aparecer na aba que você definiu em `tabs`. Ative-o e verifique se as mudanças aparecem na página do jogo.

O ciclo de iteração é rápido: edite o `.css`, salve e recarregue a página (saia e entre de novo na página do jogo). Para acompanhar o que foi de fato injetado, valide sempre o manifesto e confira o tema em disco:

```terminal
$ find ~/homebrew/themes/MeuPrimeiroTema -type f
MeuPrimeiroTema/theme.json
MeuPrimeiroTema/gameview.css
$ python3 -m json.tool ~/homebrew/themes/MeuPrimeiroTema/theme.json > /dev/null && echo "manifesto OK"
manifesto OK
```

:::dica
Versionar manualmente no campo `version` (`v1.0`, `v1.1`) e guardar uma cópia do tema funcionando evita a situação clássica de "quebrei e não lembro o que mudei". Antes de cada mudança grande, copie a pasta: `cp -r MeuPrimeiroTema MeuPrimeiroTema.bak` — tema é só texto, e backup de texto é barato.
:::

## Publicando e indo além

Você não precisa publicar para usar seu tema: ele já está ativo localmente. Publicar no repositório da comunidade é uma etapa opcional que exige seguir o formato do projeto (fork do repositório de temas, pull request com o `theme.json` e as folhas). Esse processo não é abordado aqui, mas a base — manifesto correto e CSS testado — é exatamente o que os revisores exigem.

Para ir além do exemplo, o caminho natural é dominar os **seletores** (via inspeção), depois as **variáveis de tema** (para expor ajustes no painel, como você viu na [seção do teclado](#/cap-074/sec-05)) e, por fim, os ganchos de **JavaScript** que alguns temas usam para baixar imagens dinâmicas — o mesmo mecanismo do Art Hero explorado na [seção de biblioteca](#/cap-074/sec-04).

## Resumo

- Um tema próprio é só uma pasta em `~/homebrew/themes/` com `theme.json` válido e folhas `.css`.
- O manifesto usa `spec: v3`, `target: "SP"` e um `tabs` que define onde o tema aparece no painel.
- Seletores com hash precisam corresponder aos da sua versão do Steam; chutar nomes resulta em tema mudo sem erro.
- O teste é local e iterativo: edite o CSS, valide o JSON e recarregue a página do alvo.
- Copiar a pasta antes de mudanças grandes (`cp -r tema tema.bak`) é o backup barato que evita regressão.

## Exercícios

1. Crie a pasta `~/homebrew/themes/MeuPrimeiroTema/` e escreva um `theme.json` com `target: "SP"` e `tabs` apontando para a aba Game View.
2. Valide seu manifesto com `python3 -m json.tool` e corrija erros de sintaxe que aparecerem.
3. Escreva um `gameview.css` com pelo menos duas regras que usem `!important` e teste se o tema aparece e se aplica na página do jogo.
4. Faça uma cópia de segurança com `cp -r`, altere uma regra do CSS e verifique se consegue voltar ao estado anterior usando a cópia.
5. **Desafio.** Usando o `theme.json` de um tema moderno como referência, descubra como adicionar uma variável de tema (como `--raio`) e escreva uma regra CSS que a consuma com fallback. Explique o que o fallback faz quando a variável não está definida.