## O que significa "nativo Linux", de verdade?

Um jogo é *nativo* quando existe um binário ELF — o formato executável do Linux — compilado para rodar no sistema, sem nenhuma camada de tradução entre ele e o kernel. Não há Wine, Proton ou DXVK interceptando chamadas DirectX. O jogo fala a linguagem do SteamOS diretamente: chama a glibc, abre janelas via SDL, desenha com OpenGL ou Vulkan. Um jogo via Proton também vira, no fim, um processo Linux — mas o binário original é um `.exe` sendo interpretado por uma ponte enorme. Nativo é quando **não existe ponte**.

:::objetivos
- Distinguir com precisão o que é um jogo nativo Linux de um jogo executado via Proton
- Identificar jogos nativos pela interface da Steam e pelo SteamDB
- Compreender o papel dos runtimes Steam (Scout, Soldier, Sniper) na longevidade dos ports
- Entender a diferença de comportamento entre ports OpenGL e Vulkan
- Desmontar o mito de que "nativo é sempre mais rápido", com dados reais
:::

## Identificando jogos nativos na Steam

A forma mais rápida é o filtro da loja. Um jogo com versão Linux exibe o ícone **SteamOS/Linux** ao lado das versões Windows e macOS. Na biblioteca, a página do jogo mostra os sistemas suportados abaixo do botão Instalar. Como ports nativos geralmente usam a mesma licença Windows, o cliente apenas baixa a variante correta.

O lugar definitivo para confirmar é o **SteamDB**. Abra a aba *Depots*: um depot `linux64` ou `linux` indica build nativo. Se só houver depots Windows e o jogo rodar, é o Proton trabalhando silenciosamente.

```terminal
## Em qualquer jogo instalado, o comando SteamDB via linha de comando não existe,
## mas podemos inspecionar o diretório local para ver qual binário foi baixado.
$ ls ~/.steam/steam/steamapps/common/ | head -20
A Short Hike
Celeste
Counter-Strike 2
Dead Cells
Factorio
Hollow Knight
Hades
Stardew Valley
Tomb Raider (2013)
The Witcher 3

## Um build nativo Linux traz, dentro da pasta, binários sem extensão .exe
$ find ~/.steam/steam/steamapps/common/"Hollow Knight" -maxdepth 1 -type f -executable
/home/ana/.steam/steam/steamapps/common/Hollow Knight/hollow_knight
```

Compare com um jogo que só tem versão Windows (rodaria via Proton): dentro da pasta você encontra apenas `.exe` e `.dll`. A presença de um executável sem extensão, com permissão de execução e flag ELF, é o marcador físico do build nativo.

## O Steam Runtime: por que ports de 2014 ainda rodam

O gargalo invisível do gaming Linux: um binário compilado em 2014 foi linkado contra as bibliotecas da Ubuntu 12.04. Dez anos depois, o SteamOS 3.6 é baseado no Debian Noble, com glibc, libstdc++ e libSDL muito diferentes. Se o jogo dependesse das bibliotecas do sistema, **não carregaria** — quebra de ABI é a regra.

A Valve resolveu isso com os **Steam Runtimes**, containers que embrulham cada jogo num ambiente de bibliotecas congeladas:

| Runtime | Base | Destino | Exemplo típico |
|---|---|---|---|
| **Scout** | Ubuntu 12.04 | Jogos antigos, compilados até ~2016 | *Half-Life 2*, *Left 4 Dead 2* |
| **Soldier** | Debian 10 (SteamOS 3) | Jogos e engines modernos | *Counter-Strike 2*, *Dota 2* |
| **Sniper** | Debian 11 (mais novo) | Ferramentas e títulos recentes | Vários títulos de 2023+ |

Quando um jogo nativo é lançado, o executável é um `shim` que detecta o runtime apropriado e executa o binário real **dentro do container**. O jogo enxerga as versões estáveis do runtime, como se estivesse de volta em 2014.

```terminal
## O ldd roda no container do jogo e revela as bibliotecas do runtime, não do sistema
$ ~/.steam/root/ubuntu12_32/usr/bin/ldd ~/.steam/steam/steamapps/common/"Hollow Knight"/hollow_knight
	linux-gate.so.1 (0xf7f4c000)
	libSDL2-2.0.so.0 => /home/ana/.steam/root/ubuntu12_32/steam-runtime/usr/lib/
	i386-linux-gnu/libSDL2-2.0.so.0
	libGL.so.1 => /home/ana/.steam/root/ubuntu12_32/steam-runtime/usr/lib/
	i386-linux-gnu/libGL.so.1
	libX11.so.6 => /home/ana/.steam/root/ubuntu12_32/steam-runtime/usr/lib/
	i386-linux-gnu/libX11.so.6
	libc.so.6 => /lib/i386-linux-gnu/libc.so.6 (0xf7d2a000)
```

Note como quase tudo aponta para dentro de `~/.steam/root/.../steam-runtime/`: é o container Scout em ação. A `libc.so.6` aponta para o sistema, mas SDL2, GL e X11 vêm do runtime congelado. É por isso que um port de 2014 ainda abre no Deck em 2025.

:::nota
Os três runtimes coexistem no disco e são baixados sob demanda. Um jogo moderno no Soldier usa uma glibc muito mais recente que a do Scout, enquanto um clássico continua congelado no ambiente de 2012. Custo: cada runtime ocupa de centenas de MB a mais de 1 GB.
:::

## OpenGL e Vulkan: duas gerações de ports

Nem todo build nativo nasce igual. A escolha da API gráfica no momento do port determina o desempenho que você verá hoje.

### Ports OpenGL (a velha guarda)

Durante a década de 2010, a Feral Interactive e a Aspyr portaram dezenas de jogos AAA para Linux usando **OpenGL** — muitas vezes via tradutor interno de DirectX para OpenGL. O resultado funcionava, mas pagava caro: OpenGL é uma API de estado global, com validação constante e pouca exploração de múltiplos núcleos. Os drivers RADV da AMD otimizam Vulkan muito melhor que OpenGL hoje. Ports OpenGL antigos — *Tomb Raider 2013*, *Shadow of Mordor*, *XCOM 2* — tendem a rodar **pior** no Linux do que o `.exe` via Proton com DXVK, que traduz DirectX 11 para Vulkan.

### Ports Vulkan (a geração moderna)

A partir de ~2018, os ports sérios passaram a usar **Vulkan** diretamente, ou a engine já era multi-platform. Vulkan é uma API de baixo nível, sem validação implícita, similar ao DirectX 12 em espírito. A tradução Windows→Linux torna-se desnecessária: o código gráfico é quase o mesmo. É o caso de *Counter-Strike 2* (Source 2, Vulkan nativo, desempenho excelente no Deck) e de engines como Godot ou RenderWare moderno.

:::atencao
**O mito do "nativo é sempre mais rápido" morreu.** Era verdade no início do Proton, quando DXVK era imaturo. Hoje, um port nativo OpenGL de 2015 quase sempre perde para o mesmo `.exe` rodando via Proton com DXVK. Já um port Vulkan nativo bem-feito costuma empatar ou superar o Proton, porque elimina a camada de tradução. A regra não é "nativo vs Proton", e sim **"qual API essa build específica usa"**.
:::

Podemos confirmar a API que um jogo nativo vai usar pelo `file` e pelo `strings`:

```terminal
## O binário é um ELF genuíno, não um .exe
$ file ~/.steam/steam/steamapps/common/"Hollow Knight"/hollow_knight
/home/ana/.steam/steam/steamapps/common/Hollow Knight/hollow_knight:
  ELF 64-bit LSB pie executable, x86-64, version 1 (GNU/Linux),
  dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, stripped

## Em contraste, um jogo só-Windows trazia um PE32
$ file ~/.steam/steam/steamapps/common/"The Witcher 3"/bin/x64/witcher3.exe
bin/x64/witcher3.exe: PE32+ executable (GUI) x86-64, for MS Windows

## strings revela quais bibliotecas gráficas o binário referencia
$ strings ~/.steam/steam/steamapps/common/"Hollow Knight"/hollow_knight | grep -iE "vulkan|opengl|libGL"
libGL.so.1
libGLESv2.so.2
```

O `file` entregando `ELF 64-bit` é a prova física do build nativo; `PE32+ ... for MS Windows` indica jogo via Proton. O grep por `vulkan`/`opengl` revela qual caminho gráfico o binário segue.

## Exemplos reais no Steam Deck

**Counter-Strike 2 (Vulkan nativo, Source 2)**. Port moderno, multi-platform, desempenho comparável ao Windows. No Deck, segura ~60-90 FPS com ajustes moderados.

**Hollow Knight (port nativo)**. Jogo indie em Unity com build Linux oficial. Levíssimo, 60 FPS travados com folga de bateria — o nativo perfeito para portátil.

**Tomb Raider 2013 (port OpenGL da Feral)**. Exemplo canônico do problema: o port OpenGL da Feral entrega menos FPS que o `.exe` original via Proton+DXVK. Não é culpa da Feral — é a limitação histórica do OpenGL em drivers modernos.

**Dead Cells e Factorio (nativos de primeira classe)**. Builds Linux impecáveis. *Factorio* é notável por superar o Windows em benchmarks de megabase — custo de cache menor e scheduler melhor.

Medir isso na prática é simples com o MangoHud:

```terminal
## Sobe o MangoHud acoplado a um jogo nativo (exemplo: Hollow Knight)
$ MANGOHUD=1 ~/.steam/steam/steamapps/common/"Hollow Knight"/hollow_knight
[2025-01-14 19:02:11] MANGOHUD: Loading config from /home/ana/.config/MangoHud/MangoHud.conf
[2025-01-14 19:02:12] MANGOHUD: Vulkan layer initialized (hollow_knight uses OpenGL)
[2025-01-14 19:02:15] MANGOHUD: fps=60.0 frametime=16.6ms gpu=99% cpu=12% temp=52C power=8W
[2025-01-14 19:02:20] MANGOHUD: fps=60.0 frametime=16.6ms gpu=99% cpu=13% temp=53C power=8W
```

Repare no `power=8W`: um jogo nativo leve mantém o Deck frio e econômico, ao contrário de um AAA via Proton que puxa 20W+ da APU — assunto retomado na [seção 8](#/cap-071/sec-08).

## Resumo

- Jogo nativo Linux é um binário ELF compilado para o sistema, sem camada de tradução (Proton/Wine)
- O ícone do SteamOS/Linux na loja e os depots `linux64` no SteamDB identificam builds nativos
- Os runtimes Steam (Scout, Soldier, Sniper) congelam bibliotecas antigas em containers para que ports de 2014 continuem funcionando
- Ports OpenGL da era Feral costumam perder para o Proton+DXVK; ports Vulkan nativos empatam ou superam
- `file` (ELF vs PE32) e `ldd` (bibliotecas do runtime) são as ferramentas de inspeção essenciais
- O mito "nativo é sempre melhor" está superado: a API gráfica do build específico importa mais que o rótulo

## Exercícios

1. Na sua biblioteca Steam, liste três jogos que você imagina serem nativos Linux e verifique no SteamDB (aba *Depots*) a existência de um depot `linux64`. Anote acertos e quais rodam via Proton.

2. Escolha um jogo nativo instalado e execute `file` no executável principal (descubra-o com `find ~/.steam/steam/steamapps/common/<jogo> -maxdepth 2 -type f -executable`). Confirme se é `ELF` e, com `strings ... | grep -iE "vulkan|opengl"`, descubra qual API gráfica ele usa.

3. Execute `ldd` no mesmo binário e identifique ao menos três bibliotecas apontando para `~/.steam/root/.../steam-runtime/`. Explique por que elas não estão em `/usr/lib`.

4. Usando `MANGOHUD=1`, rode um jogo nativo leve por cinco minutos e anote `fps`, `power` e `temp`. Repita com um AAA via Proton e compare o consumo de energia. Relacione com a duração de bateria discutida na [seção 8](#/cap-071/sec-08).

5. **Desafio integrador**: Escolha um port nativo OpenGL antigo (ex.: *Tomb Raider 2013*) e meça o FPS médio no modo nativo. Depois, nas propriedades do jogo na Steam, force o Proton e meça novamente com MangoHud. Documente os dois resultados, identifique qual foi mais rápido e explique, com base no que aprendeu sobre OpenGL vs Vulkan/DXVK, por que isso aconteceu. Relacione com o trade-off nativo vs Proton da [seção 3](#/cap-071/sec-03).
