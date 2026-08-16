Depois de dominar o shell, o passo lógico de quem quer construir software é montar um ambiente de desenvolvimento de verdade no Steam Deck. A boa notícia: o Deck é uma máquina de desenvolvimento surpreendentemente capaz — CPU Zen 2, 16 GB de RAM, SSD NVMe e uma GPU AMD com suporte maduro a Vulkan. Com as ferramentas certas, você escreve, compila, testa e depura código em Python, Rust, Go ou C sem sair do que já conhece.

:::objetivos
- Montar um toolchain de desenvolvimento limpo via distrobox
- Configurar um editor/IDE com LSP, formatação e depuração
- Compilar e rodar código em Python, Rust e C no Deck
- Gerenciar versões de linguagem com version managers
- Integrar o ambiente de dev com o Git e os containers que você já usa
:::

## O ambiente isolado com distrobox

O SteamOS tem uma raiz somente leitura e não empacota compiladores e bibliotecas de desenvolvimento da forma que um desenvolvedor precisa. A solução, que você já usou no capítulo de containers, é o `distrobox`: um ambiente Arch (ou Ubuntu, ou Fedora) que compartilha o kernel e o home com o sistema, mas isola todo o resto.

```terminal
$ distrobox-create --name dev --image archlinux:latest
$ distrobox-enter dev
$ sudo pacman -Syu
$ sudo pacman -S base-devel git python python-pip rustup go nodejs npm
```

O `base-devel` do Arch é um metapacote que traz `gcc`, `make`, `autoconf`, `pkg-config` e ferramentas essenciais de compilação — o kit de partida de qualquer projeto C/C++. O `rustup` instala a toolchain Rust de forma versionada, e o `go`/`nodejs` cobrem os respectivos ecossistemas.

A vantagem decisiva do distrobox sobre instalar direto no SteamOS: se você quebrar o ambiente, destrói e recria o container em minutos, sem tocar no sistema. Seu `/home/ana` fica intacto, e os editores rodando fora do container continuam enxergando os arquivos.

```terminal
$ gcc --version
gcc (GCC) 14.2.1 20240910
$ rustc --version
rustc 1.83.0 (90b35a623 2024-11-26)
$ python --version
Python 3.12.7
```

## O editor que faz diferença

O editor não é vaidade — é onde boa parte da produtividade mora. Para desenvolvimento no Deck, o VS Code (ou o fork aberto VS Codium) + o Dev Containers é a combinação mais direta, porque integra com o distrobox: você edita os arquivos do ponto de vista do sistema, mas roda os comandos dentro do container.

Fluxo típico:

1. Instale o VS Code via Flatpak (que você já sabe gerenciar) ou de dentro do distrobox
2. Entre no distrobox com `distrobox enter dev -- code`
3. Instale as extensões de linguagem (Python, rust-analyzer, Go, C/C++)

As extensões de linguagem trazem o **LSP** (Language Server Protocol), o motor por trás do autocompletar, "ir para definição", renomear símbolo e diagnosticar erros em tempo real. É a diferença entre editar texto e programar com rede de segurança.

```terminal
$ code --list-extensions
rust-lang.rust-analyzer
ms-python.python
golang.go
llvm-vs-code-extensions.vscode-clangd
```

:::dica
Aprenda os atalhos de navegação do seu editor cedo: ir para definição (`[[F12]]`), encontrar todas as referências (`[[Shift+F12]]`), renomear símbolo (`[[F2]]`). São três teclas que substituem minutos de busca manual e funcionam graças ao LSP — valem mais que qualquer extensão cosmética.
:::

## Três linguagens, três ciclos

Cada linguagem tem um ciclo de desenvolvimento diferente. Dominar o ciclo (escrever → rodar → testar → depurar) em uma delas já é metade do caminho para as outras.

**Python** — interpretado, ciclo rápido, ideal para scripts e automação (que você já faz no shell):

```terminal
$ python -m venv ~/dev/meu-projeto/.venv
$ source ~/dev/meu-projeto/.venv/bin/activate
$ pip install -r requirements.txt
$ python main.py
Olá, mundo!
```

O `venv` cria um ambiente virtual que isola as dependências do projeto — o análogo Python do container, na escala de bibliotecas. Nunca instale pacotes Python no sistema; sempre dentro de um `venv`.

**Rust** — compilado, ciclo com `cargo` (build, test, run num comando só):

```terminal
$ cargo new hello
     Created binary (application) `hello` package
$ cd hello
$ cargo run
   Compiling hello v0.1.0
    Finished `dev` profile [unoptimized + debuginfo] in 0.42s
     Running `target/debug/hello`
Hello, world!
```

O `cargo` é o gerenciador de build, dependências e testes do Rust — um único binário que faz o papel de `pip` + `make` + test runner. É o exemplo mais bem acabado de toolchain moderno que existe hoje.

**C** — compilado manualmente, o nível mais "perto do metal":

```terminal
$ cat hello.c
#include <stdio.h>
int main(void) {
    printf("Hello, world!\n");
    return 0;
}
$ gcc -Wall -Wextra -o hello hello.c
$ ./hello
Hello, world!
```

As flags `-Wall -Wextra` ativam quase todos os avisos — em C, um aviso frequentemente é um bug esperando para acontecer. Criar o hábito de compilar com elas desde o início ensina a escrever código que o compilador aprova, não código que apenas compila.

## Version managers para não quebrar o sistema

Quando um projeto exige uma versão específica de Node, Python ou Go, instalar no sistema cria conflito rápido. Os version managers resolvem mantendo múltiplas versões lado a lado, por projeto:

- **mise** (antigo rtx) — gerencia Ruby, Node, Go, Python e mais, num binário só
- **nvm** — específico para Node
- **pyenv** — específico para Python
- **rustup** — específico para Rust (já instalado junto com a toolchain)

O `mise` é o mais versátil e vem ganhando terreno como substituto único:

```terminal
$ curl https://mise.run | sh
$ mise install node@20 python@3.12 go@1.22
$ mise use node@20 python@3.12
$ node --version
v20.18.0
```

As versões ficam num arquivo `.mise.toml` na raiz do projeto, versionado no Git — então qualquer pessoa que clonar o repositório e rodar `mise install` reproduz exatamente o ambiente. É infraestrutura como código, no nível da linguagem.

:::nota
O version manager age dentro do distrobox ou do sistema? Idealmente dentro do distrobox, para manter o SteamOS intocado. Instale o `mise` dentro do container `dev` e deixe o sistema base limpo. A separação vale ouro quando um update do SteamOS reescreve o sistema e você não perde nada do ambiente de dev.
:::

## Ligando dev, Git e containers

O ambiente de desenvolvimento não vive isolado. As peças que você aprendeu se encaixam num fluxo:

- **Git** versiona o código; cada feature numa branch (capítulo 42)
- **Containers** empacotam a aplicação para rodar em qualquer lugar (capítulo 87)
- **systemd** roda a aplicação como serviço quando ela está pronta (capítulo 34)
- **CI/CD** (GitHub Actions, por exemplo) automatiza teste e deploy a cada push

Um `Dockerfile`/`Containerfile` típico que empacota a aplicação Python do exemplo:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

O ciclo completo de um desenvolvedor no Deck fica assim: escrever no editor → testar localmente no venv → empacotar no container → subir com Podman → e, se o projeto é público, o CI roda os mesmos testes em cada pull request.

## Resumo

- Use `distrobox` para montar um toolchain de dev isolado (base-devel, gcc, python, rustup, go, node) sem tocar na raiz somente leitura do SteamOS.
- Um editor com LSP (VS Code + extensões de linguagem) dá autocompletar, navegação e renomeação — domine `F12`, `Shift+F12` e `F2` cedo.
- Python usa `venv` para isolar dependências; Rust usa `cargo`; C compila com `gcc -Wall -Wextra` para ver avisos como erros em potencial.
- Version managers (`mise`, `nvm`, `pyenv`, `rustup`) mantêm múltiplas versões lado a lado e documentam o ambiente no repositório.
- O `mise` é a opção unificada: um binário para Node, Python, Go, Ruby e mais, com configuração em `.mise.toml`.
- O ciclo completo dev integra Git, containers e systemd — código versionado, empacotado e rodando como serviço.

## Exercícios

1. Crie um distrobox `dev` e instale `base-devel`, `git`, `python`, `rustup`, `go` e `nodejs`. Liste as versões de `gcc`, `rustc` e `python`.
2. Escreva o mesmo "Hello, world!" em Python, Rust e C. Em cada um, identifique o comando que compila (se houver) e o que executa — e compare o ciclo de cada linguagem.
3. Crie um `venv` num projeto Python e instale uma dependência de teste (ex.: `requests`). Confirme que ela fica isolada desativando o venv e tentando importar.
4. Instale o `mise` no distrobox e configure duas versões de Node (ex.: 18 e 20). Alterne entre elas e confirme com `node --version`.
5. **Desafio.** Escreva uma ferramenta de linha de comando simples (qualquer linguagem) que resolva algo real que você faz no Deck (ex.: renomear screenshots em lote, limpar a pasta de downloads por extensão). Versione no Git, escreva um `Containerfile` e rode sua ferramenta dentro do container com Podman. Documente o fluxo completo.