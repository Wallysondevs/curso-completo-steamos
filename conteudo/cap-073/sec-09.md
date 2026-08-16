Instalar e gerenciar plugins é o caminho do consumidor. Escrever o seu próprio é o caminho do criador — e é também a melhor maneira de fechar o ciclo de tudo o que este capítulo ensinou, porque obriga você a materializar cada conceito: a árvore `~/homebrew/`, o `plugin.json`, o contrato do `main.py`, o frontend React, o ciclo de vida com `_main` e `_unload`. Ao final desta seção você terá um plugin mínimo, funcional, instalável no seu próprio deck, e entenderá o suficiente do modelo para não se perder na documentação oficial.

:::objetivos
- Montar a estrutura mínima de um plugin Decky a partir do template
- Escrever um `plugin.json` e um `main.py` com backend Python funcional
- Entender a separação entre backend (Python) e frontend (React/TypeScript)
- Compilar e instalar o plugin no seu próprio deck
- Depurar o plugin observando logs e recarregando o serviço
:::

## O template é o ponto de partida (e não o atalho)

A comunidade fornece um template oficial, o `decky-plugin-template`, que já vem com tudo configurado: a estrutura de diretórios, o tooling do frontend (pnpm + vite), os aliases de build e um esqueleto de backend. A tentação é clonar e sair codando; o objetivo aqui é entender o que cada peça faz, para que você consiga depurar quando algo sair do lugar.

```terminal
$ git clone https://github.com/SteamDeckHomebrew/decky-plugin-template.git meu-primeiro-plugin
$ cd meu-primeiro-plugin
$ ls
plugin.json  main.py  package.json  package-lock.json  src/  tsconfig.json  .vscode/
```

O template usa `pnpm` como gerenciador de pacotes do frontend — não `npm` nem `yarn`. Se não estiver instalado:

```terminal
$ curl -fsSL https://get.pnpm.io/install.sh | sh -
$ pnpm install
```

Os quatro arquivos que importam de fato para um plugin mínimo são `plugin.json`, `main.py`, `package.json` e o conteúdo de `src/`.

## O contrato de identidade: `plugin.json`

O primeiro arquivo que o Decky lê ao descobrir seu plugin é o `plugin.json`. Ele informa quem é o plugin, quem o fez, que permissões pede e que versão da API espera:

```json
{
  "name": "Meu Primeiro Plugin",
  "author": "ana",
  "flags": [],
  "api_version": 1,
  "publish": {
    "tags": ["exemplo", "aprendizado"],
    "description": "Um plugin mínimo para aprender o modelo do Decky.",
    "image": "https://opengraph.githubassets.com/1/SeuUser/meu-primeiro-plugin"
  }
}
```

Dois campos pedem atenção redobrada. `api_version` precisa corresponder à versão da API que o seu código usa — hoje é `1`; se o Decky evoluir a API, um plugin desatualizado recusa carregar ou quebra em runtime. E `flags`, que vimos na seção 5, governa o privilégio: deixe `[]` (vazio) a menos que seu plugin realmente precise de `_root`, e mesmo assim, pense duas vezes.

:::atencao
O `name` no `plugin.json` é a identidade pública do plugin e deve ser único o suficiente para não colidir com outro na loja. O nome da pasta onde você coloca o plugin (`~/homebrew/plugins/<pasta>/`) é uma escolha separada e não precisa bater com o `name`, mas manter os dois coerentes evita confusão na hora de debugar.
:::

## O backend em Python: `main.py`

O `main.py` é onde mora a lógica que roda fora do processo do Steam. O contrato é mínimo: uma classe `Plugin`, com métodos públicos (que o frontend chama) e callbacks de ciclo de vida (que o loader chama):

```python
import decky
import asyncio

class Plugin:
    async def _main(self):
        decky.logger.info("Meu Primeiro Plugin carregado")
        self.contador = 0

    async def _unload(self):
        decky.logger.info("Meu Primeiro Plugin descarregado")

    async def somar(self, a: int, b: int) -> int:
        return a + b

    async def incrementar(self) -> int:
        self.contador += 1
        return self.contador
```

O que está acontecendo aqui:

| Elemento | Papel |
|---|---|
| `import decky` | Módulo built-in do runtime: logging, diretórios, barramento de eventos |
| `_main()` | Roda na carga do plugin; bom lugar para inicializar estado |
| `_unload()` | Roda na desativação; fecha recursos |
| `somar`, `incrementar` | Métodos públicos, expostos ao frontend via `@decky/api` |

O objeto `decky` é o coração da API de backend. Ele expõe helpers como `decky.logger` (log estruturado), `decky.DECKY_HOME`, `decky.DECKY_PLUGIN_SETTINGS_DIR` (onde guardar configuração) e `decky.emit` (enviar eventos para o frontend). É a ponte entre o seu código e o runtime.

## O frontend em React/TypeScript

A metade visível vive em `src/` e compila para `dist/index.js`. O frontend acessa o backend através de um proxy gerado: você escreve chamadas do tipo `@decky/api` e o build conecta ao backend que roda no `plugin_loader`.

Um frontend mínimo, em `src/index.tsx`, registra a rota do plugin e mostra um botão:

```typescript
import { definePlugin, ServerAPI, staticClasses } from "decky-frontend-lib";

export default definePlugin((serverAPI: ServerAPI) => {
  const somar = async () => {
    const resultado = await serverAPI.callPluginMethod<"somar", number[], number>(
      "somar", { 2, 3 }
    );
    console.log(resultado);
  };

  return {
    title: "Meu Primeiro Plugin",
    content: <button onClick={somar}>Somar 2 + 3</button>,
  };
});
```

O `serverAPI.callPluginMethod` é a ponte: ele invoca o método `somar` do `main.py` no backend e devolve o resultado. O nome do método na chamada precisa casar exatamente com o método na classe `Plugin`, senão o backend responde com erro de método inexistente.

O build do frontend é disparado pelo `package.json`:

```terminal
$ pnpm run build
> decky-plugin-template@ build meu-primeiro-plugin
> vite build
```

O `dist/index.js` gerado é o que o Decky carrega. Sem essa etapa, o plugin instala mas mostra uma tela vazia — um dos erros mais comuns de quem está começando.

## Compilando e instalando no seu deck

Com o backend e o frontend prontos, o fluxo é: compilar, copiar para `~/homebrew/plugins/`, e deixar o loader descobrir.

```terminal
$ pnpm run build
$ mkdir -p ~/homebrew/plugins/meu-primeiro-plugin
$ cp -r plugin.json main.py package.json dist ~/homebrew/plugins/meu-primeiro-plugin/
$ systemctl --user restart plugin_loader
```

Depois do `restart`, o loader lê o novo `plugin.json`, carrega o `main.py` e injeta o `dist/index.js`. O log confirma:

```terminal
$ tail ~/homebrew/logs/meu-primeiro-plugin/plugin.log
[22:10:00] INFO: Meu Primeiro Plugin carregado
```

:::dica
Para um ciclo de desenvolvimento rápido, crie um **symlink** em vez de copiar a cada mudança: `ln -s "$(pwd)" ~/homebrew/plugins/meu-primeiro-plugin`. Assim, ao editar o código, você só recompila (`pnpm run build`) e reinicia o serviço, sem recopiar arquivos. Só lembre de que o symlink aponta para fora de `~/homebrew/`, o que pode confundir algumas ferramentas de audit da seção 5.
:::

## Depurando o seu plugin

O loop de debug é: edite, reconstrua, recarregue, leia o log. Três armadilhas recorrentes de iniciante e como identificá-las:

**Método inexistente.** O frontend chama `somar` mas o `main.py` não tem esse método. O backend devolve erro; o log do `plugin_loader` registra a chamada falha. Confira o casing exato do nome.

**Erro de sintaxe no `main.py`.** Mata o loader inteiro (seção 7). O `journalctl --user -u plugin_loader` aponta a linha.

**Frontend não compilado.** O botão não aparece ou a tela fica em branco. Verifique se `dist/index.js` existe e é recente:

```terminal
$ ls -la ~/homebrew/plugins/meu-primeiro-plugin/dist/
```

Um `ls` mostrando `index.js` com timestamp antigo significa que o build não rodou depois da última edição.

```terminal
$ journalctl --user -u plugin_loader --since "10 min ago" -p 3 --no-pager
```

O filtro de erros (`-p 3`) isola exatamente o que deu errado na última carga, sem o ruído dos logs de inicialização normal.

## Publicando na loja (para ir além)

Publicar na loja oficial exige passar pelo processo da comunidade SteamDeckHomebrew: subir o plugin para um repositório Git público com `LICENSE` e `README.md`, e pedir a inclusão no store. Não é o foco deste capítulo, mas o template já deixa o campo `publish.*` no `plugin.json` pronto para isso. Antes de publicar, garanta que:

- O `main.py` não pede `_root` sem motivo;
- O `_unload()` limpa o que você criou;
- Não há chamadas de rede para domínios não documentados (seção 5);
- O plugin funciona com a última versão estável do Decky.

:::exemplo
Cenário concreto de um plugin útil e simples: um "contador de sessão" que registra há quanto tempo o Game Mode está aberto. O `_main` guarda `time.time()`, um método público `tempo_decorrido()` devolve a diferença, e o frontend exibe o valor num card. Em meia hora você tem algo funcional que também exercita todos os conceitos desta seção — sem root, sem rede, sem risco.
:::

## Resumo

- O template oficial (`decky-plugin-template`) traz a estrutura; você precisa entender `plugin.json`, `main.py` e `src/` para depurar.
- O `plugin.json` define identidade, `flags` (privilégio) e `api_version` (compatibilidade).
- O `main.py` contém a classe `Plugin` com métodos públicos (chamados pelo frontend) e callbacks `_main`/`_unload` (chamados pelo loader).
- O frontend React/TypeScript compila para `dist/index.js` e acessa o backend via `serverAPI.callPluginMethod`.
- O loop de desenvolvimento é build (`pnpm run build`) → copiar para `~/homebrew/plugins/` → `systemctl --user restart plugin_loader` → ler o log.
- Erros de método inexistente, sintaxe no Python e frontend não compilado são as três falhas mais comuns de iniciante.

## Exercícios

1. Clone o template, rode `pnpm install` e `pnpm run build`, e inspecione os arquivos gerados (`dist/index.js`, entre outros). O que cada um representa?
2. Edite o `main.py` para adicionar um método `multiplicar(a, b)` e chame-o a partir do frontend. Confirme o resultado no log do plugin.
3. Instale o plugin no seu deck (copiando ou via symlink), reinicie o serviço e verifique que ele aparece no Menu Rápido. O `title` que você definiu aparece?
4. Introduza um erro de nome de método (chame `somarr` em vez de `somar`) e observe o que o backend reporta. Corrija e confirme a volta ao normal.
5. **Desafio.** Estenda o plugin de contador de sessão: use `decky.emit` para enviar um evento do backend ao frontend a cada 60 segundos, e exiba o tempo decorrido atualizado ao vivo. Isso integra backend, barramento de eventos e frontend reativo — o ciclo completo do modelo Decky.