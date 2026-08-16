# Curso Completo de SteamOS

Documentação-curso de SteamOS em português do Brasil, publicável como site estático no
GitHub Pages. **9 partes · 72 capítulos · 648 seções**, com explicações em
profundidade, sessões de terminal comentadas e exemplos da saída de cada comando.

> As saídas de terminal são **ilustrativas**: reproduzem fielmente o formato de cada
> comando real, mas com dados de exemplo. Versão de referência: SteamOS 3.6.

---

## Publicar no GitHub Pages

O site é 100% estático — HTML, CSS e JavaScript sem build no servidor, sem Jekyll,
sem dependências externas obrigatórias. Serve direto do repositório.

### Caminho mais curto (recomendado)

```bash
cd steamos-curso
git init -b main
git add .
git commit -m "Curso Completo de SteamOS"
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git push -u origin main
```

Depois, no GitHub:

1. abra o repositório → **Settings** → **Pages**
2. em **Source**, escolha **Deploy from a branch**
3. selecione a branch **main** e a pasta **/ (root)**
4. clique em **Save**

Em um ou dois minutos o site estará em:

```
https://SEU-USUARIO.github.io/SEU-REPO/
```

O arquivo `.nojekyll` na raiz já está incluído — ele desliga o processamento Jekyll e
garante que todas as pastas sejam servidas exatamente como estão.

### Alternativa: deploy por GitHub Actions

Se preferir o fluxo moderno do Pages, em **Settings → Pages → Source** escolha
**GitHub Actions**. O workflow `.github/workflows/pages.yml` já está pronto e publica a
cada `push` na `main`.

### Domínio próprio

Crie um arquivo `CNAME` na raiz com o seu domínio (uma linha, sem `http://`) e configure
o DNS conforme a documentação do GitHub Pages.

---

## Rodar localmente

O site carrega os textos com `fetch()`, e navegadores bloqueiam isso em `file://`.
Então **não abra o `index.html` com duplo clique** — suba um servidor local:

```bash
cd steamos-curso
python3 -m http.server 8000
```

E acesse <http://localhost:8000>. Qualquer servidor estático serve
(`npx serve`, `php -S localhost:8000`, extensão Live Server do VS Code, etc.).

---

## Estrutura do projeto

```
steamos-curso/
├── index.html                    página única (app shell)
├── .nojekyll                     desliga o Jekyll no GitHub Pages
├── assets/
│   ├── css/main.css              tema SteamOS, claro/escuro, responsivo
│   ├── js/markdown.js            renderizador de Markdown próprio
│   ├── js/app.js                 roteador, sumário, busca, progresso
│   └── img/                      logotipo e favicon (SVG)
├── estrutura/
│   └── partes.json               as 9 partes e os 72 capítulos oficiais
├── conteudo/
│   ├── cap-001/
│   │   ├── indice.json           títulos, tags e status das 9 seções
│   │   ├── sec-01.md … sec-09.md conteúdo em Markdown
│   └── … até cap-108/
├── dados/
│   ├── sumario.js                GERADO — consumido pelo site
│   └── sumario.json              GERADO — mesmo conteúdo, para outras ferramentas
├── ferramentas/
│   └── build.py                  gera esboços, valida tudo e escreve o sumário
└── ESPECIFICACAO-CONTEUDO.md     contrato de formato do conteúdo
```

---

## Escrever ou completar conteúdo

Cada capítulo tem 9 subcapítulos. Os que ainda não foram redigidos aparecem marcados
como **esboço** e já mostram o roteiro do que vão cobrir — dá para usá-los como guia de
estudo e ir preenchendo aos poucos.

Para redigir um subcapítulo:

1. abra `conteudo/cap-NNN/indice.json`
2. escreva o texto em `conteudo/cap-NNN/sec-MM.md`, seguindo
   [`ESPECIFICACAO-CONTEUDO.md`](ESPECIFICACAO-CONTEUDO.md)
3. troque `"status": "esboco"` por `"status": "completo"` e remova o campo `"esboco"`
4. rode o build:

```bash
python3 ferramentas/build.py
```

O build regenera o Markdown de todos os esboços, valida o Markdown de todo mundo
(títulos de nível 1, cercas de código e caixas `:::` sem fechamento), recalcula as
estatísticas e reescreve `dados/sumario.js`.

Para só conferir, sem escrever nada:

```bash
python3 ferramentas/build.py --so-verificar
```

### Markdown suportado

Um subconjunto controlado, renderizado por `assets/js/markdown.js`:

- títulos `##`, `###`, `####` (nível 1 é proibido — o título vem do índice)
- `**negrito**`, `*itálico*`, `` `código` ``, `~~riscado~~`, `[[Ctrl+Alt+T]]` (tecla)
- links externos e internos: `[texto](#/cap-031/sec-02)`
- listas com aninhamento, tabelas, citações e linha horizontal
- blocos de código com linguagem: ` ```bash `, ` ```yaml `, ` ```python `, …
- **blocos de terminal** ` ```terminal `, onde linhas com `$ ` são comandos de usuário,
  `# ` são comandos como root, `## ` são comentários e o resto é a saída
- caixas `:::dica`, `:::nota`, `:::info`, `:::atencao`, `:::perigo`, `:::exemplo`,
  `:::objetivos`, `:::construcao`

---

## Recursos do site

- sumário lateral com 9 partes, 72 capítulos e 648 seções, com busca instantânea
- progresso de leitura salvo no navegador (`localStorage`), com percentual por parte
- tema claro e escuro, seguindo o sistema por padrão
- totalmente responsivo: sumário vira gaveta no celular, tabelas e terminais rolam sozinhos
- botão de copiar em cada bloco de código e de terminal (copia só os comandos)
- índice da página com marcação da seção atual durante a rolagem
- navegação por teclado: <kbd>/</kbd> busca, <kbd>←</kbd> <kbd>→</kbd> anterior/próximo,
  <kbd>Esc</kbd> fecha
- funciona sem JavaScript de terceiros, sem cookies e sem rastreamento
- folha de estilo de impressão para gerar PDF de qualquer subcapítulo

---

## Licença e marcas

Material educacional independente. **SteamOS** e o logotipo Circle of Friends são marcas
registradas da **Canonical Ltd.** Este projeto não é afiliado à Canonical.

O texto do curso pode ser usado livremente para fins educacionais.
