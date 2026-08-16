Quando você clica no ícone do Decky no Menu Rápido, meia dúzia de peças se movem em cascata: o Steam carrega o frontend do plugin, o backend executa código Python num processo separado, e os dois trocam mensagens por um barramento local. Entender essa arquitetura — a árvore `~/homebrew/`, o serviço `plugin_loader`, a comunicação via porta 1337 e a estrutura interna de um plugin — é o que separa "funcionou" de "sei por que funcionou". E é o pré-requisito para qualquer diagnóstico das seções 7 e 8.

:::objetivos
- Mapear a árvore de diretórios em `~/homebrew/` e o papel de cada subpasta
- Entender o modelo de dois processos: frontend React/TypeScript e backend Python
- Inspecionar o serviço systemd `plugin_loader.service` e sua relação com a porta 1337
- Ler a estrutura de um plugin instalado: `plugin.json`, `main.py`, `package.json`
- Compreender o ciclo de vida de um plugin: carregamento, `_main`, migração, `_unload`
:::

## A árvore `~/homebrew/`

Tudo o que o Decky toca vive em `~/homebrew/`. Não há configuração espalhada em `/etc/`, nem código em `/usr/share/`. O desenho é deliberado: como o SteamOS é imutável (`/usr/` é read-only), concentrar tudo no home do usuário permite instalar, atualizar e desinstalar sem nunca pedir permissão de `sudo` depois da instalação inicial.

```terminal
$ ls -la ~/homebrew/
drwx------  9 deck deck 4096 Apr 19 18:02 .
drwx------ 42 deck deck 4096 Apr 19 22:10 ..
drwx------  2 deck deck 4096 Apr 19 18:02 data/
drwx------  2 deck deck 4096 Apr 19 18:02 logs/
drwx------ 12 deck deck 4096 Apr 19 22:10 plugins/
drwx------  2 deck deck 4096 Apr 19 18:02 services/
drwx------  2 deck deck 4096 Apr 19 22:10 settings/
```

Cada pasta tem um contrato claro:

| Diretório | Propósito | Exemplo |
|---|---|---|
| `plugins/` | Código do plugin (frontend + backend) | `plugins/SDH-AnimationChanger/` |
| `settings/` | Configuração persistente em JSON | `settings/SDH-AnimationChanger/settings.json` |
| `data/` | Dados de runtime não persistentes | `data/SDH-AnimationChanger/cache/` |
| `logs/` | Arquivos de log por plugin | `logs/SDH-AnimationChanger/plugin.log` |
| `services/` | Serviços systemd extras de plugins (raro) | `services/algum-plugin.service` |

A separação entre `plugins/` (código, imutável depois de instalado) e `settings/` (dados, mutáveis) é o que permite atualizar um plugin sem perder a configuração: o `settings/` não é tocado na atualização.

## O modelo de dois processos

Cada plugin do Decky é um programa dividido em duas metades que conversam:

**Frontend.** Uma aplicação React/TypeScript compilada para `dist/index.js`. É ela que desenha a interface que aparece dentro do Menu Rápido. Roda **dentro do processo do Steam**, no mesmo contexto JavaScript do Game Mode. É por isso que o frontend de um plugin pode acessar a API do Steam Client interna — mas também é por isso que um bug de frontend pode congelar a aba do Decky, e em casos extremos, travar o Game Mode.

**Backend.** Um script `main.py` executado pelo `plugin_loader` como um processo Python separado. É aqui que moram chamadas de sistema, acesso a arquivos, leitura de hardware e tudo que exige privilégio de sistema operacional. O backend roda como o usuário `deck` (ou `root`, se o plugin declarar a flag `_root` no `plugin.json`).

A comunicação entre os dois acontece por um barramento de eventos: o frontend chama funções expostas pelo backend, o backend responde, e ambos podem emitir eventos assíncronos. O transporte é HTTP local na porta `1337`.

```terminal
$ ss -tlnp | grep 1337
LISTEN 0      4096       127.0.0.1:1337       0.0.0.0:*    users:(("python",pid=2912,fd=7))
```

O servidor escuta só em `127.0.0.1` — tráfego externo não o alcança. É uma camada de segurança importante: mesmo que você esteja numa rede Wi-Fi pública, nenhum dispositivo consegue chamar a API do Decky.

## O serviço `plugin_loader`

Quem sobe esse servidor é um serviço de usuário do systemd:

```terminal
$ cat ~/.config/systemd/user/plugin_loader.service
[Unit]
Description=Plugin Loader
After=graphical-session.target
Wants=graphical-session.target

[Service]
ExecStart=/home/deck/homebrew/services/plugin_loader --backend-path /home/deck/homebrew/services/backend
Environment=HOME=/home/deck
Environment=DECKY_HOME=/home/deck/homebrew
Restart=on-failure
RestartSec=5
KillMode=process
```

O `After=graphical-session.target` é o segredo: o `plugin_loader` só sobe depois que a interface gráfica está pronta, o que evita que ele tente injetar o frontend no Steam antes de o Game Mode existir. O `Restart=on-failure` garante que um crash do backend seja tratado com um reinício automático em 5 segundos — mas só até a quinta tentativa; depois disso, o systemd desiste e o serviço fica como `failed`.

Dentro da pasta `services/` os arquivos `plugin_loader` e `backend` são binários compilados (Go e Python, respectivamente). O `plugin_loader` carrega os plugins, gerencia o ciclo de vida dos backends e injeta os frontends no Steam. O `backend` é o runtime Python que executa o `main.py` de cada plugin.

## Dentro de um plugin instalado

Pegue um plugin qualquer em `~/homebrew/plugins/` e abra sua estrutura:

```terminal
$ ls ~/homebrew/plugins/SDH-AnimationChanger/
plugin.json  main.py  package.json  dist/  bin/  assets/
```

O `plugin.json` é a identidade do plugin — o contrato que o Decky lê ao carregá-lo:

```json
{
  "name": "Animation Changer",
  "author": "SDH-Dev Team",
  "flags": ["debug"],
  "api_version": 1,
  "publish": {
    "tags": ["animation", "ui"],
    "description": "Troca a animação de boot do Steam Deck.",
    "image": "https://..."
  }
}
```

| Campo | Significado |
|---|---|
| `name` | Nome exibido na interface |
| `author` | Autor do plugin |
| `flags` | `"debug"` carrega o backend com mais verbosidade; `"_root"` executa o `main.py` como root |
| `api_version` | Versão da API do Decky que o plugin espera (hoje é `1`) |
| `publish.tags` | Etiquetas usadas na busca da loja |
| `publish.description` | Descrição curta |
| `publish.image` | Imagem de capa (URL) |

A flag `_root` é a mais sensível: um plugin com ela ativa tem acesso irrestrito ao sistema. Voltaremos a isso na seção 5.

O `main.py` segue um contrato simples — uma classe `Plugin` com métodos expostos e callbacks de ciclo de vida:

```terminal
$ cat ~/homebrew/plugins/meu-plugin/main.py
import decky
import asyncio

class Plugin:
    async def _main(self):
        decky.logger.info("Plugin carregado")
        self.running = True

    async def _unload(self):
        decky.logger.info("Plugin descarregado")
        self.running = False

    async def my_method(self, param: str) -> str:
        return f"Backend recebeu: {param}"
```

O `_main` roda quando o plugin é carregado; `_unload` roda quando ele é desativado; métodos da classe sem underscore são expostos para o frontend. O objeto `decky` é um módulo built-in que oferece logging, acesso a diretórios e ao barramento de eventos.

:::dica
Durante o desenvolvimento de um plugin, criar um symlink de `~/homebrew/plugins/meu-plugin` para o diretório do repositório evita ficar copiando arquivos a cada mudança. Basta `ln -s "$(pwd)" ~/homebrew/plugins/meu-plugin`, recompilar e reiniciar o serviço. Só não esqueça de remover o symlink e copiar de verdade antes de testar a desinstalação, porque o `_uninstall()` pode se confundir com caminhos simbólicos.
:::

## O ciclo de vida completo

Quando o Game Mode inicia e o `plugin_loader` sobe, cada plugin instalado passa por esta sequência:

1. **Descoberta:** o loader lê todos os `plugin.json` em `~/homebrew/plugins/`.
2. **Carregamento:** para cada plugin ativo, importa o `main.py` e chama `_migration()` se existir.
3. **Inicialização:** depois da migração, chama `_main()`. O plugin abre conexões, registra eventos e fica pronto.
4. **Execução:** enquanto o plugin está ativo, o frontend chama métodos do backend; o backend emite eventos para o frontend via `decky.emit`.
5. **Desativação:** quando o usuário desabilita o plugin na interface, o loader chama `_unload()` e fecha o processo.
6. **Desinstalação:** se o usuário desinstala, `_uninstall()` é chamado antes da remoção dos arquivos.

```terminal
$ cat ~/homebrew/logs/meu-plugin/plugin.log
[19:02] INFO: Plugin carregado
[19:02] INFO: Backend recebeu: ola
[19:04] INFO: Plugin descarregado
```

Esse log, gerado por `decky.logger.info()`, é o primeiro lugar a olhar quando um plugin não se comporta como esperado.

## Resumo

- Toda a operação do Decky cabe em `~/homebrew/`: `plugins/` (código), `settings/` (config), `data/` (runtime), `logs/` (registro) e `services/` (binários do carregador).
- Cada plugin tem um frontend (React/TypeScript, roda no processo do Steam) e um backend (Python, roda num processo separado).
- O backend escuta na porta 1337, apenas em `127.0.0.1`, como servidor HTTP local — nenhum tráfego externo o alcança.
- O serviço `plugin_loader.service` sobe com `After=graphical-session.target`, garantindo que o Steam já esteja pronto.
- O `plugin.json` define identidade, permissões (flags) e compatibilidade via `api_version`.
- O ciclo de vida de um plugin inclui `_migration`, `_main`, operação e `_unload`/`_uninstall`.

## Exercícios

1. Liste `~/homebrew/plugins/` e escolha um plugin instalado. Abra `plugin.json` dele e identifique o valor de `flags` — o plugin roda como root?
2. Com o Game Mode aberto, rode `ss -tlnp | grep 1337` e confirme que o servidor do Decky está escutando. Anote o PID e o nome do processo.
3. Encontre o arquivo `plugin_loader.service` em `~/.config/systemd/user/` e leia as variáveis de ambiente `Environment=`. O que aconteceria se `DECKY_HOME` fosse alterado para um diretório que não existe?
4. Examine o `main.py` de um plugin instalado e identifique: quantos métodos públicos ele expõe? Ele implementa `_unload`? O que ele faz no `_main`?
5. **Desafio.** Plote a sequência de inicialização: desenhe (ou descreva em texto) o que acontece do pressionar o botão de ligar até o ícone do Decky aparecer no Menu Rápido, incluindo o papel do `graphical-session.target` e da ordem de carregamento dos plugins.