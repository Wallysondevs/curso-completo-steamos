Chegou a hora de amarrar tudo. As seções anteriores apresentaram as peças separadas — Flatpak, SDK, Podman, Distrobox, compilação na APU, servidores — mas desenvolvimento real não é uma sequência de comandos isolados, é um **fluxo**. Esta seção monta um projeto de ponta a ponta no Deck: desde criar o ambiente de trabalho até versionar, compilar, rodar em container e diagnosticar quando algo quebra. O objetivo é que, ao final, você tenha um repertório de trabalho completo e saiba qual ferramenta pegar em cada situação.

:::objetivos
- Montar um ambiente de desenvolvimento completo e reproduzível no Deck
- Integrar Git, container e compilação num fluxo único de trabalho
- Escolher conscientemente entre Flatpak, SDK, Podman e Distrobox para cada tarefa
- Diagnosticar erros comuns de build e de runtime em containers
- Definir um padrão pessoal de organização (diretório, versionamento, backup)

## O mapa mental: qual ferramenta para quê

Antes de escrever código, vale fixar a regra de decisão que organiza todo o capítulo. A pergunta é sempre "onde esse programa deve viver?", e a resposta determina a ferramenta:

| Quero... | Ferramenta | Por quê |
|---|---|---|
| Usar uma IDE/editor pronta | Flatpak (Builder, VS Codium) | Instalação limpa, sem root |
| Compilar código C/C++ rapidamente | SDK freedesktop | Toolchain pronta via `flatpak run` |
| Uma distro completa (pacman/apt) | Distrobox | Home compartilhado + GUI |
| Rodar um serviço/ferramenta isolado | Podman | Sem daemon, descartável |
| Compilar jogo para distribuir | Steam Runtime SDK | Compatibilidade de runtime |
| Servidor doméstico | Podman + systemd | Persistência e restart |

Essa tabela é, na prática, a resposta para a pergunta que abre o capítulo: "o root imutável me impede de programar?" — não, porque cada necessidade tem um caminho que contorna o root limpo.

## Fluxo completo: clone, compile, rode

Vamos percorrer um projeto hipotético de ferramenta de linha de comando em C, do zero ao executável rodando em container. O fluxo integra o que vimos:

```terminal
$ mkdir -p ~/lab/minha-ferramenta && cd ~/lab/minha-ferramenta
$ git init
Initialized empty Git repository in /home/deck/lab/minha-ferramenta/.git
$ cat > main.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>
int main(int argc, char **argv) {
    long n = argc > 1 ? atol(argv[1]) : 0;
    for (long i = 0; i < n; i++)
        printf("%ld\n", i * i);
    return 0;
}
EOF
$ git add main.c
$ git commit -m "feat: quadrados de 0 a n-1"
[master (root-commit) 64f1a3b] feat: quadrados de 0 a n-1
 1 file changed, 14 insertions(+)
```

O código vive em `~/lab` (persistente, versionado). Agora a compilação, dentro do SDK:

```terminal
$ flatpak run --command=bash org.freedesktop.Sdk//23.08
[📦 org.freedesktop.Sdk//23.08 minha-ferramenta]$ gcc -O2 -Wall -o quadrados main.c
[📦 org.freedesktop.Sdk//23.08 minha-ferramenta]$ ./quadrados 5
0
1
4
9
16
[📦 org.freedesktop.Sdk//23.08 minha-ferramenta]$ exit
```

Compilou e rodou. Agora, para distribuir a ferramenta sem depender do SDK instalado em outra máquina, empacote-a num container:

```dockerfile
FROM alpine:3.20
RUN apk add --no-cache gcc libc-dev
COPY main.c .
RUN gcc -O2 -static -o /usr/local/bin/quadrados main.c
ENTRYPOINT ["/usr/local/bin/quadrados"]
CMD ["5"]
```

```terminal
$ podman build -t quadrados .
$ podman run --rm quadrados 7
0
1
4
9
16
25
36
```

A compilação `-static` produz um binário autocontido, sem dependência de `libc` compartilhada — ideal para um container Alpine mínimo. O fluxo completo (Git → SDK → Podman) está montado.

:::dica
Mantenha um único padrão de organização: `~/lab` para código-fonte (versionado com Git), `~/lab/<projeto>-data` para volumes de containers e dados. Essa convenção simples garante que você sempre saiba o que pode apagar (containers e imagens) e o que é sagrado (o código no Git). Backups ficam triviais: é só versionar `~/lab` e empurrar para um remoto.
:::

## Diagnóstico: quando o build ou o runtime quebra

Mensagens de erro em containers e builds costumam apontar para três categorias. Reconhecê-las acelera o diagnóstico.

**1. Headers ausentes (build):**

```terminal
$ gcc -o prog prog.c
prog.c:1:10: fatal error: pkgconfig.h: No such file or directory
    1 | #include <pkgconfig.h>
      |          ^~~~~~~~~~~~~
compilation terminated.
```

Falta o pacote de desenvolvimento (`-dev`/`-devel`) dentro do ambiente. No SDK, instale o header correspondente; no Distrobox, `pacman -S <pacote>` ou `apt install <pacote>-dev`.

**2. Biblioteca ausente (runtime):**

```terminal
$ ./prog
./prog: error while loading shared libraries: libfoo.so.2: cannot open shared object file
```

O binário foi compilado, mas a biblioteca de runtime não está no alvo. Confirme com `ldd` que dependência falta e instale-a, ou compile o binário estático.

**3. Permissão de volume (container):**

```terminal
$ podman run --rm -v ~/lab:/data alpine ls /data
ls: cannot open directory '/data': Permission denied
```

Na maioria das vezes, é um problema de rótulo SELinux ou de UID/GID desalinhado entre host e container. No SteamOS (sem SELinux restritivo), o problema é quase sempre o UID — use `--user $(id -u):$(id -g)` ou `:Z`/`:z` na montagem quando aplicável.

:::atencao
Não confunda "build quebrou" com "versão errada". Um erro `GLIBC_2.38 not found` é de **incompatibilidade de ABI**, não de código faltando. Recompilar contra a glibc do alvo (ou recompilar tudo no mesmo ambiente) resolve; ficar copiando `.so` de um lado para o outro corrompe o sistema aos poucos e é exatamente o tipo de gambiarra que o isolamento por container existe para evitar.
:::

## De um experimento a um projeto real

Um projeto que começa como um script solto evolui para uma estrutura com testes, CI e implantação. O Deck suporta todas essas etapas graças aos containers:

```terminal
$ podman run --rm -v "$PWD":/work -w /work \
    alpine:3.20 sh -c "
      apk add --no-cache gcc libc-dev >/dev/null &&
      gcc -O2 -Wall -o quadrados main.c &&
      ./quadrados 5
    "
0
1
4
9
16
```

Esse one-liner é um "CI do Deck": um ambiente limpo, recriado a cada execução, que compila e testa o código sem deixar resíduo no host. É o mesmo princípio dos pipelines de integração contínua do GitHub/GitLab — e roda inteiro na sua APU.

Para levar isso ao trabalho colaborativo, o passo final é um remote Git:

```terminal
$ git remote add origin git@github.com:ana/minha-ferramenta.git
$ git push -u origin master
Enumerating objects: 3, done.
Counting objects: 100% (3/3), done.
Compressing objects: 100% (2/2), done.
Writing objects: 100% (3/3), 1.42 KiB | 1.42 MiB/s, done.
Total 3 (delta 0), reused 0 (delta 0), pack-reused 0
To github.com:ana/minha-ferramenta.git
 * [new branch]      master -> master
```

O ciclo está completo: o Deck não é só capaz de programar — é uma máquina de desenvolvimento completa, portátil e infinitamente mais flexível do que o rótulo de "console" sugere.

## Resumo

- Cada tarefa de desenvolvimento tem uma ferramenta certa: Flatpak (IDE), SDK (compilar), Distrobox (distro), Podman (container), Steam Runtime (jogo).
- O fluxo completo é: `~/lab` versionado com Git → compilação no SDK → distribuição em container Podman.
- Erros de build/runtime se agrupam em três: header ausente, biblioteca ausente e permissão de volume.
- `GLIBC_X not found` é problema de ABI/versão, não de código — recompile no ambiente certo, não copie `.so`.
- Um container descartável (`podman run --rm ... sh -c "compile e teste"`) é um CI portátil na APU.
- Convenção de pastas (`~/lab` + volumes nomeados) + Git remoto fecham o ciclo de um projeto real.

## Exercícios

1. Reproduza o fluxo completo da seção: crie `~/lab/minha-ferramenta`, `git init`, escreva o `main.c`, compile no SDK e rode.
2. Empacote o binário num container Alpine com o `Dockerfile` estático e rode `podman run --rm quadrados 10`.
3. Provoque e diagnostique um erro de header ausente: remova o `#include` correto e observe a mensagem do `gcc`; identifique a categoria do erro.
4. Rode o "CI do Deck" (o one-liner com `sh -c`) e explique por que ele deixa o host limpo.
5. **Desafio.** Integre tudo: crie um remote Git, empurre o projeto, e escreva um script `build.sh` que (1) compile no SDK, (2) rode o one-liner de teste em container e (3) retorne `exit 1` se o `./quadrados 5` não produzir a sequência `0 1 4 9 16`. Use esse script para validar uma mudança de código e explique onde cada ferramenta do capítulo entrou.