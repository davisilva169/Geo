# Geo — convenção dos 196 países e suas bandeiras

Verificação: **9 de outubro de 2026**.

## Correspondência com a referência

Foi possível ler a [página de estatísticas do quiz solicitado](https://www.jetpunk.com/user-quizzes/176134/bandeiras-do-mundo/stats) pelo mecanismo de consulta web. Ela informa 196 respostas e apresenta 196 linhas de países. A página principal e as imagens do quiz responderam HTTP 403 nas tentativas de obtenção direta. Portanto, foi verificada a **igualdade do conjunto de países**, não a equivalência de cada imagem do JetPunk.

`jetpunk-roster.json` conserva os 196 rótulos observados, seus identificadores e os percentuais daquele retrato da página. O script `scripts/prepare-countries.py` contém a transcrição auditável e produz `src/data/countries.json`. O validador independente `scripts/validate-countries.py` confere a correspondência um a um.

A seleção equivale aos 193 membros da ONU, mais **Vaticano, Kosovo e Taiwan**. **Palestina não aparece nesta referência específica**, por isso não foi acrescentada: isso produziria 197 entradas. Esta convenção é uma escolha de conjunto para o quiz, não uma afirmação diplomática.

| Caso | Identificador | Tratamento |
|---|---|---|
| Taiwan | `tw` / `TW` | Entrada separada, conforme a referência; Ásia. |
| Kosovo | `xk` / `XK` | Entrada separada; `XK` é código de uso atribuído, não código ISO oficial. Europa. |
| Vaticano / Santa Sé | `va` / `VA` | Nome de exibição Vaticano, com aliases Santa Sé e Cidade do Vaticano. Europa. |
| Palestina | Não incluída | Ausente do conjunto de referência. Não se substituiu silenciosamente outro país. |

## Campos e decisões editoriais

- `id`: código estável de duas letras minúsculas, que corresponde ao nome do SVG.
- `code`: equivalente em maiúsculas; ISO 3166-1 alpha-2, salvo `XK`.
- `name`: nome de exibição em português brasileiro; rótulos antigos ou de outras variantes do português permanecem em `aliases` quando diferem. Exemplos: Mianmar/Birmânia, Essuatíni/Suazilândia, Irã/Irão, Vietnã/Vietname e Tchéquia/República Checa.
- `aliases`: rótulos alternativos PT e EN; devem passar pela normalização do jogo (caixa, acentos, pontuação e espaços). Não contém apelidos ambíguos como Inglaterra para Reino Unido.
- `continent` e `region`: agrupamento didático determinístico. América Central e Caribe pertencem ao filtro América do Norte. México está em América Setentrional; Rússia na Europa; Turquia, Chipre, Armênia, Azerbaijão e Geórgia na Ásia. O modelo não exige múltiplas respostas para países transcontinentais.
- `similar`: sugestões editoriais de confusão visual por faixas, paletas, estrelas, cruzes e emblemas. Não representam medidas científicas de semelhança; podem orientar distratores e treino comparativo.
- `difficulty`: regra inicial reprodutível a partir do percentual de acerto observado na referência: 1 para 60% ou mais; 2 para 35% a 59%; 3 abaixo de 35%. Não é uma estatística dos jogadores do Geo. A dificuldade pode ser complementada pelo histórico pessoal.
- `aspect`: largura/altura da própria imagem, extraída do `viewBox` ou das dimensões SVG. Não padronizar todas em 3:2. Nepal tem silhueta não retangular; Suíça e Vaticano são quadrados; Afeganistão é 2:1.
- `flagNote` (opcional): texto educativo da variante adotada, atualmente presente no Afeganistão e na Síria.

| Continente | Países |
|---|---:|
| África | 54 |
| América do Norte | 23 |
| América do Sul | 12 |
| Ásia | 48 |
| Europa | 45 |
| Oceania | 14 |
| **Total** | **196** |

## Arquivos e variantes atuais

Há um SVG local por entrada em `public/flags/`. O conjunto padrão `hampusborgos/country-flags` foi fixado na revisão `c09927e63705529bbf59ca6684cd9b23225dddad`; seu README declara origem Wikimedia Commons e domínio público. O manifesto guarda o hash SHA-256 e a URL de cada arquivo. A execução do jogo não precisa de nenhuma CDN de bandeiras.

**Afeganistão:** o arquivo do repositório padrão ainda era a tricolor republicana. Ele foi substituído explicitamente pelo [vetor branco do Wikimedia Commons](https://commons.wikimedia.org/w/index.php?title=File:Flag_of_the_Taliban.svg&oldid=1189682321), que documenta a reintrodução em 2021, a proporção 1:2 e a liberação em domínio público. O uso atual também é visível em [material do Ministério dos Negócios Estrangeiros do Afeganistão](https://mfa.gov.af/wp-content/uploads/2024/09/Speach-by-FM.pdf). O `flagNote` explica que a tricolor permanece em acervos e contextos internacionais. Não foi presumido que a imagem do JetPunk usa a mesma variante.

**Síria:** o SVG já representa três faixas verde/branca/preta e três estrelas vermelhas. A agência estatal [SANA documenta esta bandeira em abril de 2025](https://sana.sy/es/culture/350973/). A versão republicana anterior de topo vermelho e duas estrelas verdes não é usada no jogo.

Os arquivos não foram desenhados por IA. Cores, proporções e emblemas foram mantidos; iluminação e sombra devem ser aplicadas somente como acabamento visual da interface, preservando sua leitura. Veja `THIRD-PARTY-NOTICES.md` para os créditos.

## Reprodução e validação

Para atualizar/reproduzir os arquivos com as fontes fixadas: `python scripts/prepare-countries.py`. A fonte do Afeganistão usa URL Wikimedia e hash fixo; mudanças inesperadas interrompem a atualização.

Para validar sem rede: `python scripts/validate-countries.py`. A checagem compara os 196 IDs à transcrição da referência, verifica códigos e aliases sem colisões, metadados, todos os vínculos de similaridade, proporções, ausência de conteúdo externo executável e o hash de todos os SVGs em relação ao manifesto.

## Relação completa

A tabela abaixo é gerada a partir dos arquivos finais; a coluna de referência permite auditar adaptações do português.

| ID | Nome no Geo | Rótulo da referência | Continente |
|---|---|---|---|
| af | Afeganistão | Afeganistão | Ásia |
| al | Albânia | Albânia | Europa |
| de | Alemanha | Alemanha | Europa |
| ad | Andorra | Andorra | Europa |
| ao | Angola | Angola | África |
| ag | Antígua e Barbuda | Antígua e Barbuda | América do Norte |
| ar | Argentina | Argentina | América do Sul |
| dz | Argélia | Argélia | África |
| am | Armênia | Armênia | Ásia |
| sa | Arábia Saudita | Arábia Saudita | Ásia |
| au | Austrália | Austrália | Oceania |
| az | Azerbaijão | Azerbaijão | Ásia |
| bs | Bahamas | Bahamas | América do Norte |
| bh | Bahrein | Bahrein | Ásia |
| bd | Bangladesh | Bangladesh | Ásia |
| bb | Barbados | Barbados | América do Norte |
| bz | Belize | Belize | América do Norte |
| bj | Benim | Benim | África |
| by | Bielorrússia | Bielorrússia | Europa |
| bo | Bolívia | Bolívia | América do Sul |
| bw | Botsuana | Botswana | África |
| br | Brasil | Brasil | América do Sul |
| bn | Brunei | Brunei | Ásia |
| bg | Bulgária | Bulgária | Europa |
| bf | Burkina Faso | Burkina Faso | África |
| bi | Burundi | Burundi | África |
| bt | Butão | Butão | Ásia |
| be | Bélgica | Bélgica | Europa |
| ba | Bósnia e Herzegovina | Bósnia e Herzegovina | Europa |
| cv | Cabo Verde | Cabo Verde | África |
| cm | Camarões | Camarões | África |
| kh | Camboja | Camboja | Ásia |
| ca | Canadá | Canadá | América do Norte |
| qa | Catar | Catar | Ásia |
| kz | Cazaquistão | Cazaquistão | Ásia |
| td | Chade | Chade | África |
| cl | Chile | Chile | América do Sul |
| cn | China | China | Ásia |
| cy | Chipre | Chipre | Ásia |
| co | Colômbia | Colômbia | América do Sul |
| km | Comores | Comores | África |
| kp | Coreia do Norte | Coréia do Norte | Ásia |
| kr | Coreia do Sul | Coréia do Sul | Ásia |
| cr | Costa Rica | Costa Rica | América do Norte |
| ci | Costa do Marfim | Costa do Marfim | África |
| hr | Croácia | Croácia | Europa |
| cu | Cuba | Cuba | América do Norte |
| dk | Dinamarca | Dinamarca | Europa |
| dj | Djibuti | Djibouti | África |
| dm | Dominica | Dominica | América do Norte |
| eg | Egito | Egito | África |
| sv | El Salvador | El Salvador | América do Norte |
| ae | Emirados Árabes Unidos | Emirados Árabes Unidos | Ásia |
| ec | Equador | Equador | América do Sul |
| er | Eritreia | Eritreia | África |
| sk | Eslováquia | Eslováquia | Europa |
| si | Eslovênia | Eslovénia | Europa |
| es | Espanha | Espanha | Europa |
| sz | Essuatíni | Suazilândia | África |
| us | Estados Unidos | Estados Unidos | América do Norte |
| ee | Estônia | Estônia | Europa |
| et | Etiópia | Etiópia | África |
| fj | Fiji | Fiji | Oceania |
| ph | Filipinas | Filipinas | Ásia |
| fi | Finlândia | Finlândia | Europa |
| fr | França | França | Europa |
| ga | Gabão | Gabão | África |
| gh | Gana | Gana | África |
| ge | Geórgia | Geórgia | Ásia |
| gd | Granada | Granada | América do Norte |
| gr | Grécia | Grécia | Europa |
| gt | Guatemala | Guatemala | América do Norte |
| gy | Guiana | Guiana | América do Sul |
| gn | Guiné | Guiné | África |
| gq | Guiné Equatorial | Guiné Equatorial | África |
| gw | Guiné-Bissau | Guiné-Bissau | África |
| gm | Gâmbia | Gâmbia | África |
| ht | Haiti | Haiti | América do Norte |
| hn | Honduras | Honduras | América do Norte |
| hu | Hungria | Hungria | Europa |
| mh | Ilhas Marshall | Ilhas Marshall | Oceania |
| sb | Ilhas Salomão | Ilhas Salomão | Oceania |
| id | Indonésia | Indonésia | Ásia |
| iq | Iraque | Iraque | Ásia |
| ie | Irlanda | Irlanda | Europa |
| ir | Irã | Irão | Ásia |
| is | Islândia | Islândia | Europa |
| il | Israel | Israel | Ásia |
| it | Itália | Itália | Europa |
| ye | Iêmen | Iémen | Ásia |
| jm | Jamaica | Jamaica | América do Norte |
| jp | Japão | Japão | Ásia |
| jo | Jordânia | Jordânia | Ásia |
| ki | Kiribati | Kiribati | Oceania |
| xk | Kosovo | Kosovo | Europa |
| kw | Kuwait | Kuweit | Ásia |
| la | Laos | Laos | Ásia |
| ls | Lesoto | Lesoto | África |
| lv | Letônia | Letónia | Europa |
| lr | Libéria | Libéria | África |
| li | Liechtenstein | Liechtenstein | Europa |
| lt | Lituânia | Lituânia | Europa |
| lu | Luxemburgo | Luxemburgo | Europa |
| lb | Líbano | Líbano | Ásia |
| ly | Líbia | Líbia | África |
| mk | Macedônia do Norte | Macedónia do Norte | Europa |
| mg | Madagascar | Madagáscar | África |
| mv | Maldivas | Maldivas | Ásia |
| ml | Mali | Mali | África |
| mt | Malta | Malta | Europa |
| my | Malásia | Malásia | Ásia |
| mw | Maláui | Malawi | África |
| ma | Marrocos | Marrocos | África |
| mr | Mauritânia | Mauritânia | África |
| mu | Maurício | Maurícia | África |
| mm | Mianmar | Birmânia | Ásia |
| fm | Micronésia | Estados Federados da Micronésia | Oceania |
| md | Moldávia | Moldávia | Europa |
| mn | Mongólia | Mongólia | Ásia |
| me | Montenegro | Montenegro | Europa |
| mz | Moçambique | Moçambique | África |
| mx | México | México | América do Norte |
| mc | Mônaco | Mônaco | Europa |
| na | Namíbia | Namíbia | África |
| nr | Nauru | Nauru | Oceania |
| np | Nepal | Nepal | Ásia |
| ni | Nicarágua | Nicarágua | América do Norte |
| ng | Nigéria | Nigéria | África |
| no | Noruega | Noruega | Europa |
| nz | Nova Zelândia | Nova Zelândia | Oceania |
| ne | Níger | Níger | África |
| om | Omã | Omã | Ásia |
| pw | Palau | Palau | Oceania |
| pa | Panamá | Panamá | América do Norte |
| pg | Papua Nova Guiné | Papua Nova Guiné | Oceania |
| pk | Paquistão | Paquistão | Ásia |
| py | Paraguai | Paraguai | América do Sul |
| nl | Países Baixos | Países Baixos | Europa |
| pe | Peru | Peru | América do Sul |
| pl | Polônia | Polônia | Europa |
| pt | Portugal | Portugal | Europa |
| kg | Quirguistão | Quirguistão | Ásia |
| ke | Quênia | Quênia | África |
| gb | Reino Unido | Reino Unido | Europa |
| cf | República Centro-Africana | República Centro-Africana | África |
| cd | República Democrática do Congo | República Democrática do Congo | África |
| do | República Dominicana | República Dominicana | América do Norte |
| cg | República do Congo | República do Congo | África |
| ro | Romênia | Romênia | Europa |
| rw | Ruanda | Ruanda | África |
| ru | Rússia | Rússia | Europa |
| ws | Samoa | Samoa | Oceania |
| sm | San Marino | San Marino | Europa |
| lc | Santa Lúcia | Santa Lúcia | América do Norte |
| sc | Seicheles | Seychelles | África |
| sn | Senegal | Senegal | África |
| sl | Serra Leoa | Serra Leoa | África |
| sg | Singapura | Singapura | Ásia |
| so | Somália | Somália | África |
| lk | Sri Lanka | Sri Lanka | Ásia |
| sd | Sudão | Sudão | África |
| ss | Sudão do Sul | Sudão do Sul | África |
| sr | Suriname | Suriname | América do Sul |
| se | Suécia | Suécia | Europa |
| ch | Suíça | Suíça | Europa |
| kn | São Cristóvão e Nevis | São Cristóvão e Nevis | América do Norte |
| st | São Tomé e Príncipe | São Tomé e Príncipe | África |
| vc | São Vicente e Granadinas | São Vicente e Granadinas | América do Norte |
| rs | Sérvia | Sérvia | Europa |
| sy | Síria | Síria | Ásia |
| th | Tailândia | Tailândia | Ásia |
| tw | Taiwan | Taiwan | Ásia |
| tj | Tajiquistão | Tajiquistão | Ásia |
| tz | Tanzânia | Tanzânia | África |
| cz | Tchéquia | República Checa | Europa |
| tl | Timor-Leste | Timor Leste | Ásia |
| tg | Togo | Togo | África |
| to | Tonga | Tonga | Oceania |
| tt | Trinidad e Tobago | Trinidad e Tobago | América do Norte |
| tn | Tunísia | Tunísia | África |
| tm | Turcomenistão | Turquemenistão | Ásia |
| tr | Turquia | Turquia | Ásia |
| tv | Tuvalu | Tuvalu | Oceania |
| ua | Ucrânia | Ucrânia | Europa |
| ug | Uganda | Uganda | África |
| uy | Uruguai | Uruguai | América do Sul |
| uz | Uzbequistão | Uzbequistão | Ásia |
| vu | Vanuatu | Vanuatu | Oceania |
| va | Vaticano | Vaticano | Europa |
| ve | Venezuela | Venezuela | América do Sul |
| vn | Vietnã | Vietname | Ásia |
| zw | Zimbábue | Zimbábue | África |
| zm | Zâmbia | Zâmbia | África |
| za | África do Sul | África do Sul | África |
| at | Áustria | Áustria | Europa |
| in | Índia | Índia | Ásia |
