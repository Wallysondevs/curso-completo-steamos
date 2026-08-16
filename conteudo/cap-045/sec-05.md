O ProtonTricks é um wrapper que torna o Winetricks acessível dentro dos prefixos gerenciados pelo Steam. Mas há situações em que você precisa ir direto à fonte: prefixos manuais, jogos fora da Steam, ou componentes que o ProtonTricks não expõe. O Winetricks é o motor — e conhecê-lo a fundo evita dependência cega da interface.

:::objetivos
- Instalar e usar o `winetricks` diretamente em prefixos manuais ou da Steam
- Listar componentes disponíveis e interpretar a saída de `winetricks --list`
- Criar e gerenciar prefixos Wine independentes do Steam
- Instalar componentes complexos como .NET Framework e Media Foundation manualmente
- Automatizar a configuração de prefixos com scripts
:::

## Winetricks puro vs ProtonTricks

O ProtonTricks não é um projeto separado — ele é um *frontend* que chama o Winetricks dentro do contexto do Proton. Toda vez que você roda `protontricks 292030 vcrun2022`, o que acontece por baixo é:

1. O ProtonTricks localiza o diretório de compatibilidade do AppID 292030.
2. Exporta `WINEPREFIX` apontando para a pasta `pfx/` daquele jogo.
3. Configura o `WINE` para usar o binário do Proton em vez do Wine do sistema.
4. Executa `winetricks vcrun2022`.

Você pode fazer tudo isso manualmente. Saber fazer é útil quando o ProtonTricks falha ao detectar um jogo ou quando você está lidando com um prefixo fora do Steam.

## Listando componentes disponíveis

O repositório do Winetricks contém centenas de componentes. A flag `--list` mostra tudo:

```terminal
$ winetricks --list | head -20
## dlls
art2kmin
atl11
atl80
avifil32
[...]
## fonts
allfonts
andale
arial
[...]
## settings
alldlls=default
bad=default
```

A saída é dividida em categorias: `dlls` (bibliotecas e runtimes), `fonts` (fontes do Windows), `settings` (configurações do Wine). Para filtrar apenas DLLs:

```terminal
$ winetricks --list | grep "^vcrun"
vcrun2003
vcrun2005
vcrun2008
vcrun2010
vcrun2012
vcrun2013
vcrun2015
vcrun2017
vcrun2019
vcrun2022
```

Cada nome é um *verb* — o argumento que você passa para o Winetricks instalar. Verbos como `vcrun2022` instalam um runtime; verbos como `alldlls=default` aplicam configurações.

## Trabalhando com prefixos manuais

Para criar um prefixo do zero, independente do Steam:

```terminal
$ export WINEPREFIX="$HOME/wine-prefixes/lab"
$ export WINE="/usr/bin/wine"
$ wineboot -u
wine: created the configuration directory '/home/deck/wine-prefixes/lab'
```

Isso cria a estrutura `drive_c/`, `dosdevices/` e os arquivos `.reg` iniciais. Agora você pode instalar componentes:

```terminal
$ winetricks --force vcrun2022 dotnet48
Executing load_dotnet48...
## Baixando .NET Framework 4.8 offline installer...
## Instalando... (isso pode levar vários minutos)
## Concluído.
```

A flag `--force` ignora avisos de versão do Wine. Ela é frequentemente necessária porque o Winetricks verifica se a versão do Wine é compatível com o componente, e o Proton nem sempre se identifica como esperado.

Para usar esse prefixo manual com um jogo não-Steam:

```terminal
$ WINEPREFIX="$HOME/wine-prefixes/lab" wine "C:\jogos\meu-jogo\game.exe"
```

:::dica
Prefixos manuais são ideais para ferramentas de modding autônomas (xEdit, Bodyslide, DynDOLOD). Crie um prefixo só para elas, instale todas as dependências uma vez e reutilize para múltiplos jogos.
:::

## Componentes cabeludos: .NET e Media Foundation

Dois componentes merecem atenção especial pela complexidade de instalação.

**.NET Framework.** Versões 4.x exigem que o Windows seja reportado como Windows 7 ou superior. Antes de instalar o .NET, configure:

```terminal
$ winetricks win7
## Define a versão reportada como Windows 7
$ winetricks dotnet48
## Instala .NET Framework 4.8 (inclui chain de 4.0 -> 4.5 -> 4.6 -> 4.7 -> 4.8)
```

A instalação do .NET é longa (5 a 15 minutos) e produz muito log. É normal ver warnings; erros fatais geralmente mencionam "Installation failed" com um código HRESULT.

**Media Foundation.** Como mencionado na seção anterior, `mf-install` é um script externo. Para usá-lo diretamente com Winetricks:

```terminal
$ cd ~/Downloads
$ git clone https://github.com/z0z0z/mf-install.git
$ WINEPREFIX="$HOME/wine-prefixes/lab" ./mf-install/mf-install.sh
Installing Media Foundation DLLs...
Copying mfplat.dll... OK
Copying mfreadwrite.dll... OK
[... 12 DLLs copiadas ...]
Media Foundation installation complete.
```

O script copia DLLs extraídas de uma instalação legítima do Windows para o prefixo. Como ele mexe em arquivos do sistema Wine, sempre faça backup antes.

## Automatizando com scripts

Depois de aprender a sequência de componentes que um jogo ou mod exige, transforme isso em script:

```bash
#!/bin/bash
# ~/bin/setup-prefix-skyrim.sh — Configura prefixo Skyrim SE
APPID=489830
PREFIX="$HOME/.steam/steam/steamapps/compatdata/$APPID/pfx"

echo "==> Fazendo backup do prefixo..."
cp -r "$PREFIX" "${PREFIX}.bak-$(date +%Y%m%d-%H%M%S)"

echo "==> Instalando runtimes base..."
protontricks "$APPID" -q vcrun2022 d3dx9 d3dcompiler_43 xact

echo "==> Instalando .NET 4.8 para ferramentas de modding..."
protontricks "$APPID" -q win7 dotnet48

echo "==> Configurando DLL overrides..."
protontricks "$APPID" -q dinput8=native

echo "==> Prefixo configurado. Backup salvo em ${PREFIX}.bak-*"
```

A flag `-q` (quiet) reduz a verbosidade. Rode scripts assim antes de instalar conjuntos grandes de mods — se algo quebrar, você tem um ponto de restauração.

```terminal
$ chmod +x ~/bin/setup-prefix-skyrim.sh
$ ~/bin/setup-prefix-skyrim.sh
==> Fazendo backup do prefixo...
==> Instalando runtimes base...
==> Instalando .NET 4.8 para ferramentas de modding...
==> Configurando DLL overrides...
==> Prefixo configurado. Backup salvo em .bak-20250315-142233
```

## Resumo

- O ProtonTricks é um wrapper do Winetricks para prefixos Steam; você pode usar o Winetricks diretamente em prefixos manuais.
- `winetricks --list` mostra todos os componentes; filtre com `grep` para categorias específicas.
- Prefixos manuais com `WINEPREFIX` são ideais para ferramentas de modding e jogos não-Steam.
- .NET Framework e Media Foundation são os componentes mais trabalhosos; faça backup antes.
- Scripts de setup eliminam a repetição e garantem reprodutibilidade entre prefixos.

## Exercícios

1. Crie um prefixo Wine manual em `~/wine-prefixes/teste` e instale `vcrun2022` e `dotnet48`. Quanto tempo levou a instalação do .NET?
2. Use `winetricks --list | wc -l` para contar quantos componentes estão disponíveis. Depois filtre apenas os da categoria `apps` com `winetricks --list | grep "^[a-z]" | grep -v "^[a-z]*$"`.
3. Escreva um script bash que configure um prefixo para ferramentas de modding (xEdit, Bodyslide). Inclua backup automático.
4. Compare a instalação do Media Foundation pelo ProtonTricks (`mf-install`) com a instalação manual do script GitHub. Alguma diferença no resultado?
5. **Desafio.** Crie um prefixo manual, instale o .NET 4.8 e o Media Foundation, e execute o xEdit (SSEEdit) dentro dele apontando para a pasta de dados de um jogo Steam. Resolva eventuais erros de path.