# Especificação de conteúdo — Curso Completo de SteamOS

Este documento é o contrato que **todo agente autor** deve seguir. Leia inteiro antes de
escrever qualquer arquivo. O site que consome esses arquivos usa um renderizador de Markdown
**próprio e limitado** — usar sintaxe fora desta especificação resulta em texto quebrado na tela.

---

## 1. Onde escrever

Raiz do projeto: `/home/wallyson/steamos-curso`

Cada capítulo tem uma pasta própria com numeração de **três dígitos**:

```
conteudo/cap-001/indice.json
conteudo/cap-001/sec-01.md
conteudo/cap-001/sec-02.md
...
conteudo/cap-001/sec-09.md
```

- O número do capítulo vai de `001` a `108`.
- **Todo capítulo tem exatamente 9 seções**, de `sec-01.md` a `sec-09.md`.
- A lista oficial de capítulos e seus títulos está em `estrutura/partes.json`. Leia esse arquivo.

---

## 2. O arquivo `indice.json`

Um por capítulo. É a fonte da verdade para a navegação do site — os títulos das seções vêm
daqui, **não** do Markdown. Formato exato:

```json
{
  "capitulo": 1,
  "titulo": "O que é Linux e o que é SteamOS",
  "resumo": "Uma frase de 15 a 30 palavras descrevendo o capítulo inteiro.",
  "secoes": [
    {
      "n": 1,
      "titulo": "Título da seção 1",
      "arquivo": "sec-01.md",
      "status": "completo",
      "min": 12,
      "tags": ["kernel", "distribuição", "gnu"]
    }
  ]
}
```

Regras:

- `capitulo` — inteiro, sem zeros à esquerda.
- `titulo` — copie **exatamente** o título do capítulo definido em `estrutura/partes.json`.
- `resumo` — uma frase única, sem ponto final duplicado.
- `secoes` — array com **exatamente 9 objetos**, `n` de 1 a 9, em ordem.
- `titulo` da seção — 3 a 8 palavras, específico e informativo. **Não** repita o título do
  capítulo, **não** numere ("1.1 ..."), **não** use "Parte 1", "Introdução a", "Continuação".
  Cada uma das 9 seções cobre um recorte diferente do capítulo, do mais básico ao mais avançado.
- `status` — `"completo"` ou `"esboco"`. Use `"completo"` apenas quando o `.md` correspondente
  tiver o conteúdo integral descrito na seção 4 abaixo.
- `min` — tempo estimado de leitura em minutos (inteiro entre 6 e 25 para seções completas,
  entre 5 e 15 para esboços).
- `tags` — 2 a 5 palavras-chave em minúsculas, usadas pela busca do site. Inclua os nomes dos
  comandos principais da seção (ex.: `"chmod"`, `"umask"`).

O JSON precisa ser **válido e parseável** (aspas duplas, sem vírgula sobrando, sem comentários).

---

## 3. Sintaxe Markdown suportada

Use **somente** o que está listado abaixo.

### 3.1 Títulos

```
## Título de nível 2
### Título de nível 3
#### Título de nível 4
```

**Nunca use `#` (nível 1)** — o título da seção já é impresso pelo site a partir do `indice.json`.

### 3.2 Texto

- Parágrafos separados por **uma linha em branco**.
- `**negrito**`, `*itálico*`, `` `código embutido` ``, `~~riscado~~`
- Link externo: `[texto](https://exemplo.com)`
- Link interno para outra seção do curso: `[texto](#/cap-031/sec-02)`
  (sempre com capítulo em 3 dígitos e seção em 2 dígitos)
- Tecla do teclado: `[[Ctrl+Alt+T]]` → vira uma tecla estilizada. Use para atalhos.
- Linha horizontal: `---` sozinha numa linha.

### 3.3 Listas

```
- item
- item
  - subitem (dois espaços de indentação)

1. primeiro
2. segundo
```

### 3.4 Blocos de código

Sempre com linguagem declarada:

````
```bash
sudo apt update
```
````

Linguagens aceitas: `bash`, `terminal`, `text`, `yaml`, `json`, `ini`, `conf`, `python`,
`c`, `sql`, `dockerfile`, `xml`, `diff`.

### 3.5 O bloco `terminal` (o mais importante do curso)

É o diferencial deste material. Dentro de um bloco ```` ```terminal ````:

- Linhas que começam com `$ ` são **comandos de usuário comum**.
- Linhas que começam com `# ` são **comandos executados como root**.
- Todas as outras linhas são **saída do programa** e são renderizadas em cinza.
- Comentários dentro do bloco: linhas começando com `## ` viram comentário verde.

Exemplo:

````
```terminal
$ lsb_release -a
No LSB modules are available.
Distributor ID: SteamOS
Description:    SteamOS 24.04.2 LTS
Release:        24.04
Codename:       noble
```
````

**Regras de ouro dos blocos terminal:**

1. A saída **precisa ser realista**: colunas alinhadas, formato idêntico ao do comando real,
   tamanhos plausíveis, nomes de usuário `deck`, host `steamdeck`, versão
   SteamOS 3.6 (noble) como padrão do curso.
2. Não invente flags que não existem. Se não tem certeza de uma saída exata, prefira um
   comando cuja saída você conhece bem.
3. Saídas longas podem ser **abreviadas** com uma linha `...` ou
   `[... 42 linhas omitidas ...]`.
4. Um bloco `terminal` mostra uma sessão, não um manual: até ~25 linhas.
5. Nunca coloque `$` em blocos `bash` — `bash` é para scripts/trechos, `terminal` é para sessões.

### 3.6 Caixas de destaque (callouts)

Abrem com `:::tipo` numa linha sozinha e fecham com `:::` numa linha sozinha:

```
:::dica
Texto da dica, com **markdown** normal dentro.
:::
```

Tipos disponíveis:

| Tipo | Uso |
|---|---|
| `:::objetivos` | Lista do que a pessoa vai aprender. Obrigatório no topo de toda seção completa. |
| `:::dica` | Atalho, truque, boa prática. |
| `:::nota` | Informação complementar, contexto histórico. |
| `:::atencao` | Erro comum, pegadinha, coisa que costuma dar errado. |
| `:::perigo` | Comando destrutivo, risco de perda de dados. |
| `:::info` | Referência, versão, diferença entre releases. |
| `:::exemplo` | Cenário do mundo real. |
| `:::construcao` | Marcador de seção ainda não escrita (só em esboços). |

### 3.7 Tabelas

```
| Comando | O que faz |
|---|---|
| `ls` | lista arquivos |
| `cd` | muda de diretório |
```

Alinhamento com `:---`, `:---:`, `---:` é suportado.

### 3.8 Citação

```
> Texto citado.
```

### 3.9 O que **NÃO** usar

HTML cru, imagens, footnotes, listas de tarefas `- [ ]`, títulos com `===`, links de
referência `[a][b]`, emojis em excesso (no máximo um por seção, e só se agregar).

---

## 4. Estrutura obrigatória de uma seção COMPLETA

Cada `sec-NN.md` de status `completo` deve ter entre **900 e 1600 palavras** e seguir esta ordem:

1. **Abertura** — 2 a 4 frases dizendo por que esse assunto importa e onde ele se encaixa.
   Sem título, direto ao ponto. Nada de "Nesta seção veremos...".

2. **Bloco `:::objetivos`** — 3 a 5 bullets começando com verbo no infinitivo
   ("Entender...", "Configurar...", "Diagnosticar...").

3. **3 a 6 blocos `##`** de desenvolvimento. Aqui mora o curso. Cada um deve:
   - explicar o **porquê** antes do **como**;
   - trazer pelo menos um bloco de código;
   - descrever a saída em prosa depois do bloco quando ela não for óbvia.

4. **No mínimo 3 blocos ```` ```terminal ````** ao longo da seção, com saída de exemplo.

5. **Pelo menos 2 callouts** entre `:::dica`, `:::atencao`, `:::perigo`, `:::nota`,
   `:::info` ou `:::exemplo`. Se a seção envolve comandos destrutivos (`rm -rf`, `dd`,
   `mkfs`, `parted`), o `:::perigo` é obrigatório.

6. **`## Resumo`** — 4 a 6 bullets curtos, cada um uma afirmação verificável.

7. **`## Exercícios`** — lista numerada com 3 a 5 exercícios práticos, do fácil ao difícil.
   O último exercício deve ser um desafio que integra o conteúdo com seções anteriores.

Opcionais e bem-vindos: uma tabela de referência rápida dos comandos da seção, um bloco
`## Erros comuns`, um `## Para ir além` com links da documentação oficial.

---

## 5. Seções ESBOÇO — você NÃO escreve o `.md`

Seções ainda não redigidas **não têm arquivo `.md` escrito à mão**. O script
`ferramentas/gerar-esbocos.py` gera o Markdown automaticamente a partir de um campo extra
no `indice.json`. Você só preenche esse campo.

Para cada seção com `"status": "esboco"`, acrescente um objeto `esboco`:

```json
{
  "n": 3,
  "titulo": "Perfis de rede com nmcli",
  "arquivo": "sec-03.md",
  "status": "esboco",
  "min": 9,
  "tags": ["nmcli", "networkmanager", "wifi"],
  "esboco": {
    "intro": "Uma frase situando o assunto da seção, em português, sem ponto final duplicado",
    "cobre": [
      "Tópico concreto e específico 1",
      "Tópico concreto e específico 2",
      "Tópico concreto e específico 3",
      "Tópico concreto e específico 4",
      "Tópico concreto e específico 5"
    ],
    "prereq": ["Capítulo 72 — Netplan", "Noções de endereçamento IP"],
    "comandos": ["nmcli", "nmtui", "iw", "rfkill"]
  }
}
```

Regras do `esboco`:

- `intro` — uma frase (15 a 30 palavras).
- `cobre` — 4 a 6 tópicos **concretos**. Nada de "conceitos gerais" ou "introdução ao tema";
  escreva o que de fato será ensinado ("Diferença entre `Wants=` e `Requires=`").
- `prereq` — 1 a 3 itens curtos.
- `comandos` — 3 a 6 nomes de comandos, arquivos de configuração ou opções que aparecerão.
  Só o nome, sem crases e sem argumentos.

Seções com `"status": "completo"` **não** levam o campo `esboco`, e aí sim você escreve o
`.md` completo conforme a seção 4.

---

## 6. Tom, língua e convenções

- **Português do Brasil**, tratamento em segunda pessoa velada ("você"), tom de professor
  experiente e direto. Nada de "caro leitor", nada de linguagem de marketing.
- Termos técnicos consagrados ficam em inglês (`kernel`, `shell`, `daemon`, `commit`,
  `hard link`), mas a **primeira ocorrência** no capítulo ganha uma explicação curta.
- Versão de referência do curso: **SteamOS 3.6 (Noble Numbat)**, com menções a
  22.04 LTS e 26.04 LTS quando o comportamento diferir.
- Usuário fictício: `ana`. Host fictício: `steamdeck`. Diretório de trabalho: `~/lab`.
- Todas as saídas de terminal são **ilustrativas** — representam fielmente o formato do
  comando real, mas os dados são de exemplo.
- Nunca escreva "como vimos no capítulo anterior" sem link. Use links internos de verdade.

---

## 7. Checklist antes de terminar

- [ ] `indice.json` válido, com 9 seções e títulos coerentes
- [ ] 9 arquivos `sec-01.md` … `sec-09.md` criados
- [ ] Nenhum `#` de nível 1 em nenhum `.md`
- [ ] Todo bloco de código tem linguagem declarada
- [ ] Todo `:::tipo` tem um `:::` fechando
- [ ] Seções completas têm objetivos, ≥3 blocos `terminal`, resumo e exercícios
- [ ] Nenhuma seção repete o conteúdo de outra do mesmo capítulo
