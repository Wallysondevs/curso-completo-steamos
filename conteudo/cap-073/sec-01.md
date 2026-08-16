O Steam Deck é um console, mas a Valve o trata como um computador: deixa documentado, ainda que parcialmente, onde o Game Mode guarda suas entranhas, e não impede que a comunidade mexa ali. O problema é que mexer ali exige editar arquivos do sistema, reiniciar o Steam no modo errado ou recompilar coisas — e tudo isso é desfeito a cada atualização do SteamOS. O Decky Loader nasceu para eliminar esse atrito: um carregador de plugins que injeta extensões no Menu Rápido (botão `...`), em tempo de execução, sem recompilar nada e de um jeito que sobrevive à maioria das atualizações.

:::objetivos
- Entender o que é o Decky Loader e qual problema ele resolve no SteamOS
- Distinguir Decky Loader (o carregador) de um plugin (a extensão)
- Localizar onde o Decky aparece na interface do Game Mode
- Compreender a relação entre Decky, homebrew e o modo desktop
- Identificar riscos e mitos comuns sobre plugins de Steam Deck
:::

## O buraco que o Decky preenche

O SteamOS roda duas interfaces diferentes no mesmo sistema: o **Game Mode**, uma sessão fechada e otimizada para o controle, e o **Desktop Mode**, o KDE Plasma que você vê quando escolhe "Mudar para Desktop". O Game Mode não expõe quase nada para o usuário além do que a Valve quis expor. Não há atalho para ajustar o brilho da tela, limitar o TDP, mudar o tema, ou ver métricas de FPS — recursos que a comunidade sabia que o hardware era capaz de entregar.

Antes do Decky, cada um desses ajustes era uma gambiarra: scripts colados em `systemd`, páginas da wiki ensinando a editar `initramfs`, plugins instalados manualmente dentro do diretório do Steam. Tudo quebrava quando a Valve lançava uma atualização, porque o SteamOS usa um sistema de arquivos **imutável** — a partição raiz é read-only por padrão e qualquer mudança fora dos diretórios permitidos é descartada no próximo boot.

O Decky Loader contorna isso instalando-se no diretório do usuário, `~/.local/share/Steam` e afins, e injetando seus plugins **por cima** da interface, sem tocar na imagem do sistema. O resultado é que os plugins funcionam da sessão de jogo sem pedir para você sair dela.

## O que é plugin e o que é o carregador

É comum tratar "Decky" e "plugin" como sinônimos. Não são. A distinção importa na hora de diagnosticar qualquer problema:

| Componente | O que é | Onde vive |
|---|---|---|
| **Decky Loader** | O carregador: injeta a aba de plugins no Menu Rápido e roda os backends | `~/homebrew/` |
| **Plugin** | A extensão em si: um pacote com frontend (TypeScript) e backend (Python) | `~/homebrew/plugins/<nome>/` |
| **Backend** | Servidor HTTP local que os plugins usam para executar código | processo `plugin_loader` na porta 1337 |
| **Frontend** | A interface do plugin que aparece no Menu Rápido | `dist/index.js` de cada plugin |

Sem o Decky Loader, nenhum plugin aparece. Com o Decky mas sem plugins instalados, você vê a aba do carregador mas nenhuma funcionalidade nova. É a mesma relação entre um navegador e suas extensões: o navegador fornece a plataforma, cada extensão entrega um comportamento específico.

Para confirmar a diferença no disco: o Decky Loader vive nos binários do serviço, enquanto cada plugin ocupa uma subpasta própria com seu código:

```terminal
$ ls ~/homebrew/services/
plugin_loader  backend  loader.js
$ ls ~/homebrew/plugins/
SDH-AnimationChanger/  Decky-Recorder/  CSS-Loader/
$ cat ~/homebrew/plugins/CSS-Loader/plugin.json | head -3
{"name": "CSS Loader", "author": "suchmememanyskill", "flags": [], "api_version": 1}
```

## Onde ele aparece na interface

Depois de instalar e voltar ao Game Mode, o Decky acrescenta um ícone — um foguete ou plug, dependendo da versão — na lateral do **Menu Rápido** (o painel que abre com o botão `...` do deck). Clicar nele abre a lista de plugins instalados, cada um com sua própria subpágina.

```terminal
$ ls ~/homebrew/
plugins/  settings/  logs/  data/  services/
```

Essas quatro pastas são o coração do Decky. `plugins/` guarda o código de cada extensão; `settings/` guarda as configurações em JSON; `logs/` recebe os arquivos de log de cada plugin; `data/` guarda dados de execução. Vamos dissecar cada uma na seção 3. Por ora, grave a hierarquia: **um diretório por plugin** e, dentro dele, a separação entre código (`plugins/`) e estado (`settings/`, `logs/`, `data/`).

:::nota
O nome `homebrew` vem do projeto-mãe da comunidade, o SteamDeckHomebrew, que agrega vários utilitários para o deck além do Decky — como o emulador de jogos de outras plataformas. O Decky é só um dos projetos sob esse guarda-chuva, o mais popular deles.
:::

## Por que isso é relevante (e por que dá medo)

A comunidade inteira de personalização do Steam Deck gira em torno do Decky. Themes que mudam a cara da interface, ferramentas que exibem FPS e uso de VRAM, gerenciadores de emuladores, gravadores de gameplay — quase tudo passa por ele. Saber instalar, gerenciar e diagnosticar o Decky desbloqueia um ecossistema enorme sem arriscar o sistema.

O medo também é legítimo. Um plugin com permissões elevadas roda código arbitrario no seu deck, com acesso à sua conta Steam logada. A regra de ouro, que este capítulo repete com intenção: **só instale plugins de fontes em quem você confia, e leia as permissões que cada um pede**. O Decky não é intrinsecamente perigoso, mas é uma porta que precisa ser vigiada.

O checklist mínimo de auditoria antes de instalar qualquer plugin cabe num comando. Ler as flags do `plugin.json` revela se o plugin pede root, e uma olhada rápida no `main.py` mostra se o código tem chamadas de rede suspeitas:

```terminal
$ curl -s https://raw.githubusercontent.com/algum-dev/plugin-x/main/plugin.json | grep flags
"flags": [],
$ curl -s https://raw.githubusercontent.com/algum-dev/plugin-x/main/main.py | grep -n "subprocess\|os.system"
```

Um plugin com `flags: []` (vazio) e sem chamadas de sistema no `main.py` tem superfície de ataque reduzida. Com `"_root"` nas flags e `os.system` no código, você quer saber exatamente por quê.

:::atencao
Atualizações do SteamOS ocasionalmente quebram o Decky, porque a Valve muda a interface que o carregador injeta. Quando isso acontece, o sintoma clássico é a aba do Decky sumir do Menu Rápido ou o `plugin_loader` falhar ao iniciar. Normalmente a comunidade lança uma versão nova do carregador em horas ou dias — atualizar o Decky costuma resolver, não é necessário reinstalar o sistema.
:::

## Resumo

- O Decky Loader é um carregador de extensões que injeta plugins no Menu Rápido do Game Mode, sem tocar no sistema imutável do SteamOS.
- Carregador e plugin são coisas distintas: o Decky é a plataforma; cada plugin é uma extensão com frontend e backend próprios.
- Tudo vive em `~/homebrew/`, com subpastas `plugins/`, `settings/`, `logs/` e `data/`.
- O backend é um servidor local na porta 1337 que os plugins usam para executar código.
- Plugins rodam código no seu deck com a conta Steam logada — instale apenas de fontes confiáveis.

## Exercícios

1. Abra o Menu Rápido no Game Mode e descreva o que aparece na aba do Decky depois de instalado. Liste os plugins que vieram de fábrica, se houver.
2. No Desktop Mode, liste o conteúdo de `~/homebrew/` com `ls -la` e identifique, para uma pasta em `plugins/`, se ela contém código (frontend/backend) ou apenas estado.
3. Explique, com suas palavras e em duas frases, a diferença entre o Decky Loader e um plugin. Use a analogia do navegador e extensão.
4. Pesquise no repositório oficial (github.com/SteamDeckHomebrew) dois projetos além do Decky Loader e escreva em uma frase o que cada um faz. O que eles têm em comum?
5. **Desafio.** Sem instalar nada ainda, explique por que o sistema de arquivos imutável do SteamOS torna plugins "à moda antiga" (editando a partição raiz) inviáveis a longo prazo — e como o `~/homebrew/` contorna isso. Cite a seção sobre o sistema de arquivos [que você viu antes](#/cap-064/sec-01) se já a leu.
