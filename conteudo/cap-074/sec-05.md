O teclado virtual do Steam Deck é o componente que mais se digita por dia e, talvez, o que menos pareça "temável". Ainda assim, o CSS Loader pode trocá-lo por inteiro: teclas redondas, fundo translúcido, símbolos maiores ou um visual retrô de terminal. Como o teclado é uma página SP separada do resto da interface, aprender a tratá-lo como alvo próprio evita a confusão de instalar um tema de biblioteca esperando que o teclado mude.

:::objetivos
- Entender por que o teclado é um alvo de tema separado (página SP própria)
- Instalar e ativar uma skin de teclado virtual
- Ajustar tamanho, posição e transparência das teclas
- Inspecionar a página do teclado para depurar skins que não aplicam
- Combinar skin de teclado com o restante do tema sem conflito
:::

## O teclado como página separada

Toda vez que você invoca o teclado (numa busca, num campo de login, no chat), o Steam abre uma página SP dedicada sobre a interface. Isso significa que as folhas de CSS de um tema de biblioteca **não alcançam** o teclado: cada página do webview carrega apenas os temas cujo `target` a inclui. Um tema de teclado precisa declarar esse alvo explicitamente no manifesto.

```json
{
  "name": "Cozy Keyboard",
  "target": "Keyboard",
  "manifest_version": 8,
  "spec": "v3",
  "tabs": ["CSS Loader", "Keyboard"]
}
```

Repare no campo `target: "Keyboard"`. É isso que instrui o CSS Loader a injetar essa folha apenas quando a página do teclado estiver aberta — e nada mais. Por isso a aba *Keyboard* do painel vive separada de *Library* ou *Game View*.

Para ver o efeito do alvo na prática, abra o teclado e compare o que está carregado:

```terminal
$ grep -r "Keyboard\|keyboard" ~/homebrew/themes/Cozy\ Keyboard/theme.json
  "target": "Keyboard",
  "tabs": ["CSS Loader", "Keyboard"],
```

## Instalando uma skin de teclado

O fluxo é idêntico ao de qualquer tema: abrir o Decky, ir à aba *Keyboard* do CSS Loader, escolher a skin e ativá-la. Skins populares incluem a **Cozy Keyboard** (teclas arredondadas e espaçadas), a **Terminal** (visual verde fosforescente de terminal retrô) e a **Transparent** (fundo que deixa ver o conteúdo atrás).

O que muda entre elas é um pequeno conjunto de propriedades bem definidas. Uma skin de teclado típica mexe em três coisas: o **fundo** do teclado, o **formato das teclas** e o **tamanho da fonte** das legendas:

```css
/* skins de teclado mexem em elementos da página Keyboard */
.keyboard_NativeKeyboard_1a2b3 {
  background: rgba(20, 22, 28, 0.85);
  backdrop-filter: blur(12px);
}

.keyboard_Key_4c5d6 {
  border-radius: 8px;
  margin: 3px;
}

.keyboard_KeyLabel_7e8f9 {
  font-size: 14px;
  font-weight: 600;
}
```

A propriedade `backdrop-filter: blur()` é o que cobra mais da GPU: o desfoque do fundo é calculado por pixel a cada frame. Num Deck que já roda um jogo pesado em segundo plano, uma skin com blur agressivo pode dar pequenos engasgos na digitação.

:::atencao
Teclados com fundo transparente parecem bonitos de dia, mas atrapalham de noite: o conteúdo atrás vaza pelas teclas e reduz o contraste das legendas. Se a sua skin tem um seletor de opacidade, suba o nível de opacidade quando for digitar numa senha sobre uma tela clara.
:::

## Ajustes finos por variável

Muitas skins de teclado expõem **variáveis** que você ajusta no painel sem editar CSS: espaçamento entre teclas, raio do canto, opacidade do fundo e escala da fonte. O CSS Loader traduz esses sliders em variáveis CSS que o tema lê:

```css
/* o plugin injeta --cozy-radius e --cozy-opacity antes do CSS do tema */
.keyboard_Key_4c5d6 {
  border-radius: var(--cozy-radius, 8px);
}
.keyboard_NativeKeyboard_1a2b3 {
  background: rgba(20, 22, 28, var(--cozy-opacity, 0.85));
}
```

O segundo argumento da função `var()` é o **fallback**: se a variável não foi definida (por exemplo, porque você não mexeu no slider), usa-se o valor padrão. É um padrão comum no CSS dos temas, e entendê-lo ajuda a depurar skins que "voltam ao padrão" quando o painel de configuração é reiniciado.

As variáveis com valor customizado são persistidas pelo CSS Loader no mesmo `settings.json` que guarda os perfis:

```terminal
$ cat ~/homebrew/settings/SDH-CssLoader/settings.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('themes',''))"
{"Cozy Keyboard": {"radius": 10, "opacity": 0.9}}
```

## Depurando uma skin que não aplica

O sintoma clássico: você ativa a skin, mas o teclado continua igual. O caminho de diagnóstico é o mesmo já apresentado na [seção sobre como um tema funciona](#/cap-074/sec-03), mas com um detalhe específico — o alvo. Confirme três coisas em sequência:

1. O tema existe e seu `target` é `Keyboard`.
2. O JSON do manifesto é válido.
3. Você está olhando o teclado **virtual da interface**, não o teclado físico de um acessório Bluetooth (que o CSS não alcança, obviamente).

```terminal
$ python3 -m json.tool ~/homebrew/themes/Cozy\ Keyboard/theme.json > /dev/null && echo "JSON OK"
JSON OK
$ grep '"target"' ~/homebrew/themes/Cozy\ Keyboard/theme.json
  "target": "Keyboard",
```

Quase sempre a causa é a primeira: o tema foi baixado, mas o alvo não cobre a página aberta, ou a ativação não foi salva porque outro tema de teclado já estava marcado (o CSS Loader só aplica uma skin de teclado por vez na maioria das builds).

## Resumo

- O teclado virtual é uma página SP separada; temas de biblioteca não o alcançam, e vice-versa.
- Uma skin de teclado declara `target: "Keyboard"` no `theme.json`, o que restringe a injeção à página do teclado.
- Skins mexem em fundo, formato das teclas e fonte; `backdrop-filter: blur()` é o que mais custa em GPU.
- Variáveis de tema (com fallback em `var()`) expõem ajustes finos sem editar CSS.
- Skin que não aplica costuma ser alvo errado, JSON inválido ou outra skin de teclado já ativa.

## Exercícios

1. Abra o teclado virtual na busca da biblioteca e observe o visual padrão. Depois ative uma skin de teclado e descreva as três mudanças que ela introduz.
2. Verifique o `target` da sua skin com `grep '"target"'`. O valor é `Keyboard`? Explique por que isso importa.
3. Valide o manifesto de todas as skins de teclado instaladas com `python3 -m json.tool` e liste eventuais erros.
4. Localize, no CSS de uma skin, as propriedades `backdrop-filter` e `border-radius`. Descreva o custo de performance de cada uma.
5. **Desafio.** Escreva (no mínimo conceitualmente) uma regra CSS que use `var(--raio, 10px)` como fallback e explique quando o fallback entra em ação e quando a variável prevalece. Relacione com o caminho de persistência de variáveis no `settings.json`.
