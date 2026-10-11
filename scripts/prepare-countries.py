"""Reproduce the checked 196-country JetPunk roster and pinned local flag assets.

Run: python scripts/prepare-countries.py
Only downloads from the pinned upstream revision; never changes SVG geometry.
"""
from pathlib import Path
import concurrent.futures, hashlib, json, re, urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
REV = 'c09927e63705529bbf59ca6684cd9b23225dddad'
BASE = f'https://raw.githubusercontent.com/hampusborgos/country-flags/{REV}'
AF_SOURCE = 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_the_Taliban.svg?download=1'
AF_LICENSE = 'https://commons.wikimedia.org/w/index.php?title=File:Flag_of_the_Taliban.svg&oldid=1189682321'
# Transcribed answer labels (not images) from the reference statistics page,
# reviewed 2026-10-09. Order and percentage are preserved to audit membership.
ROSTER = '''us|Estados Unidos|99
gb|Reino Unido|95
ca|Canadá|94
au|Austrália|93
fr|França|92
it|Itália|92
ru|Rússia|89
br|Brasil|87
kr|Coréia do Sul|87
jp|Japão|87
nl|Países Baixos|85
nz|Nova Zelândia|84
cn|China|83
ie|Irlanda|83
ch|Suíça|81
es|Espanha|80
gr|Grécia|80
il|Israel|80
de|Alemanha|79
se|Suécia|79
ar|Argentina|78
be|Bélgica|78
mx|México|78
tr|Turquia|78
za|África do Sul|77
fi|Finlândia|76
in|Índia|76
no|Noruega|76
jm|Jamaica|75
uy|Uruguai|75
sa|Arábia Saudita|73
dk|Dinamarca|73
pl|Polônia|71
ci|Costa do Marfim|70
eg|Egito|70
hr|Croácia|68
cm|Camarões|67
cy|Chipre|67
pt|Portugal|67
ve|Venezuela|67
cl|Chile|66
np|Nepal|66
al|Albânia|65
tn|Tunísia|65
va|Vaticano|65
ge|Geórgia|64
is|Islândia|64
hu|Hungria|63
bd|Bangladesh|62
bg|Bulgária|62
kp|Coréia do Norte|62
lb|Líbano|62
vn|Vietname|62
ir|Irão|61
pa|Panamá|61
cu|Cuba|60
ao|Angola|58
dz|Argélia|58
at|Áustria|58
pe|Peru|58
bt|Butão|57
mk|Macedónia do Norte|57
ma|Marrocos|57
co|Colômbia|56
mt|Malta|56
rs|Sérvia|56
do|República Dominicana|55
qa|Catar|54
iq|Iraque|54
xk|Kosovo|54
pk|Paquistão|54
cz|República Checa|54
ec|Equador|53
id|Indonésia|52
py|Paraguai|52
bb|Barbados|51
sk|Eslováquia|51
my|Malásia|51
sm|San Marino|51
ua|Ucrânia|51
ba|Bósnia e Herzegovina|50
si|Eslovénia|49
ph|Filipinas|49
hn|Honduras|48
sn|Senegal|48
mg|Madagáscar|47
mc|Mônaco|47
ng|Nigéria|47
ke|Quênia|47
sg|Singapura|47
pw|Palau|46
ro|Romênia|46
sy|Síria|46
kz|Cazaquistão|45
cd|República Democrática do Congo|45
pg|Papua Nova Guiné|44
ae|Emirados Árabes Unidos|43
lu|Luxemburgo|43
th|Tailândia|43
cr|Costa Rica|42
ne|Níger|42
ee|Estônia|41
gh|Gana|41
az|Azerbaijão|40
mz|Moçambique|40
tw|Taiwan|39
bf|Burkina Faso|38
ga|Gabão|38
lk|Sri Lanka|38
ht|Haiti|37
by|Bielorrússia|36
jo|Jordânia|36
to|Tonga|36
tt|Trinidad e Tobago|36
uz|Uzbequistão|36
cv|Cabo Verde|35
kh|Camboja|35
sv|El Salvador|35
et|Etiópia|35
om|Omã|35
sc|Seychelles|35
so|Somália|35
mv|Maldivas|34
ni|Nicarágua|34
mm|Birmânia|33
la|Laos|33
ug|Uganda|33
bs|Bahamas|32
ye|Iémen|32
tm|Turquemenistão|32
bh|Bahrein|31
bn|Brunei|31
fm|Estados Federados da Micronésia|31
kw|Kuweit|31
ly|Líbia|31
mr|Mauritânia|31
af|Afeganistão|30
ad|Andorra|30
ag|Antígua e Barbuda|30
me|Montenegro|30
sz|Suazilândia|30
lv|Letónia|29
lr|Libéria|29
mn|Mongólia|29
ss|Sudão do Sul|29
am|Armênia|28
td|Chade|28
gy|Guiana|28
li|Liechtenstein|28
sr|Suriname|28
bz|Belize|27
bw|Botswana|27
fj|Fiji|27
gt|Guatemala|27
mh|Ilhas Marshall|27
mw|Malawi|27
tz|Tanzânia|27
bo|Bolívia|26
km|Comores|26
ki|Kiribati|26
lt|Lituânia|26
md|Moldávia|26
tl|Timor Leste|26
ml|Mali|25
cg|República do Congo|25
sd|Sudão|25
tj|Tajiquistão|25
zw|Zimbábue|25
gd|Granada|24
kg|Quirguistão|24
bi|Burundi|23
er|Eritreia|23
lc|Santa Lúcia|23
tg|Togo|23
zm|Zâmbia|23
dm|Dominica|22
ls|Lesoto|22
nr|Nauru|22
rw|Ruanda|22
ws|Samoa|22
gq|Guiné Equatorial|21
na|Namíbia|21
sl|Serra Leoa|21
dj|Djibouti|20
gn|Guiné|20
cf|República Centro-Africana|20
st|São Tomé e Príncipe|20
vu|Vanuatu|20
kn|São Cristóvão e Nevis|19
mu|Maurícia|18
vc|São Vicente e Granadinas|18
bj|Benim|17
gw|Guiné-Bissau|17
tv|Tuvalu|17
gm|Gâmbia|15
sb|Ilhas Salomão|15'''

REGIONS = {
    ('África', 'África do Norte'): 'dz eg ly ma sd tn',
    ('África', 'África Ocidental'): 'bj bf cv ci gm gh gn gw lr ml mr ne ng sn sl tg',
    ('África', 'África Central'): 'ao cm cf td cg cd gq ga st',
    ('África', 'África Oriental'): 'bi km dj er et ke mg mw mu mz rw sc so ss tz ug zm zw',
    ('África', 'África Austral'): 'bw sz ls na za',
    ('América do Norte', 'América Setentrional'): 'ca us mx',
    ('América do Norte', 'América Central'): 'bz cr sv gt hn ni pa',
    ('América do Norte', 'Caribe'): 'ag bs bb cu dm do gd ht jm kn lc vc tt',
    ('América do Sul', 'América do Sul'): 'ar bo br cl co ec gy py pe sr uy ve',
    ('Ásia', 'Ásia Ocidental'): 'am az bh cy ge iq il jo kw lb om qa sa sy tr ae ye',
    ('Ásia', 'Ásia Central'): 'kz kg tj tm uz',
    ('Ásia', 'Ásia Meridional'): 'af bd bt in ir mv np pk lk',
    ('Ásia', 'Ásia Oriental'): 'cn jp mn kp kr tw',
    ('Ásia', 'Sudeste Asiático'): 'bn kh id la my mm ph sg th tl vn',
    ('Europa', 'Europa Setentrional'): 'dk ee fi is ie lv lt no se gb',
    ('Europa', 'Europa Ocidental'): 'at be fr de li lu mc nl ch',
    ('Europa', 'Europa Oriental'): 'by bg cz hu pl md ro ru sk ua',
    ('Europa', 'Europa Meridional'): 'al ad ba hr gr it xk mt me mk pt sm rs si es va',
    ('Oceania', 'Australásia'): 'au nz',
    ('Oceania', 'Melanésia'): 'fj pg sb vu',
    ('Oceania', 'Micronésia'): 'ki mh fm nr pw',
    ('Oceania', 'Polinésia'): 'ws to tv',
}
NAMES = {'kr':'Coreia do Sul', 'kp':'Coreia do Norte', 'vn':'Vietnã', 'ir':'Irã',
         'mk':'Macedônia do Norte', 'cz':'Tchéquia', 'si':'Eslovênia', 'mg':'Madagascar',
         'sg':'Singapura', 'mm':'Mianmar', 'ye':'Iêmen', 'tm':'Turcomenistão',
         'fm':'Micronésia', 'kw':'Kuwait', 'sz':'Essuatíni', 'lv':'Letônia',
         'bw':'Botsuana', 'mw':'Maláui', 'tl':'Timor-Leste', 'mu':'Maurício',
         'sc':'Seicheles', 'dj':'Djibuti'}
ALIASES = {'us':['EUA','USA','Estados Unidos da América'], 'gb':['UK','Grã-Bretanha'],
    'nl':['Holanda'], 'kr':['Coreia Meridional'], 'kp':['Coreia Setentrional'],
    'ci':['Côte d’Ivoire'], 'cz':['República Tcheca','Chequia','Czechia'],
    'cd':['Congo-Kinshasa','RDC','Congo Democrático'], 'cg':['Congo-Brazzaville','Congo'],
    'cn':['República Popular da China'], 'tw':['Taiuã','Formosa'], 'va':['Santa Sé','Cidade do Vaticano'],
    'ae':['EAU'], 'mm':['Myanmar','Burma'], 'sz':['Eswatini'], 'mu':['Ilhas Maurício'],
    'fm':['Estados Federados da Micronésia'], 'st':['Sao Tome e Principe'],
    'tr':['Türkiye'], 'by':['Belarus'], 'bt':['Bhutan'], 'qa':['Qatar'],
    'bs':['Baamas'], 'sc':['Seychelles'], 'vn':['Vietnam'], 'ls':['Lesotho'],
    'kn':['São Cristóvão e Névis','Saint Kitts and Nevis'], 'tt':['Trindade e Tobago'],
    'mz':['Mozambique'], 'kh':['Cambodia'], 'bd':['Bangladeche'], 'ki':['Quiribáti'],
    'kg':['Quirguízia'], 'tz':['Tanzania'], 'rw':['Rwanda'], 'mn':['Mongolia'],
    'ly':['Libya'], 'np':['Nepal'], 'ua':['Ukraine'], 'sa':['Saudi Arabia']}
# Pedagogical visual-confusion sets. Not a geopolitical or statistical assertion.
SIMILAR_GROUPS = [
    'ro td ad md', 'id mc pl sg', 'ie ci it mx', 'ru sk si rs hr', 'nl lu py',
    'au nz fj tv', 'us lr my', 'no is dk se fi', 'co ec ve', 'ar uy hn sv ni',
    'cr th', 'eg iq sy ye', 'jo sd ae kw', 'sa pk dz mr', 'bh qa', 'jp bd pw',
    'cn vn tw', 'be de', 'gn ml sn cm', 'gh bo lt', 'hu bg ir tj',
    'cz ph', 'cu cz', 'ch ge', 'tr tn', 'nz ws', 'ke ss zw mz',
    'ga rw', 'si sk', 'si ru', 'bf bj gw', 'st km', 'bw ee', 'ua ga',
    'gb au', 'sm va', 'mt mc', 'bs lc', 'dm gd', 'gq py', 'cf sc',
    'na za', 'bi er', 'af sa', 'al me', 'ao de', 'am az', 'ba xk',
    'bb ua', 'br gy', 'bn bt', 'ca pe', 'cv us', 'cd cg', 'ch va',
    'dj km', 'do ht', 'et gh', 'fm mh', 'fr nl', 'gr il', 'gt hn',
    'in ne', 'it fr', 'jm tz', 'kh la', 'ki sb', 'kn vu', 'kp kr',
    'lb ca', 'li ht', 'lk bt', 'ls sl', 'lv at', 'mg by', 'mk kg',
    'mm bo', 'mn kz', 'mt pl', 'mu sc', 'mv ma', 'mw zm', 'ng pe',
    'np ws', 'nr pw', 'om sy', 'pg tl', 'pt bd', 'so fm', 'sr tj',
    'sz ls', 'tg gh', 'tm uz', 'to ch', 'tt tl', 'ug ke', 'uz kz', 'ag kn', 'bz ht', 'cl cz', 'cy xk', 'es pt', 'gm hu', 'ly ae', 'pa do', 'vc lc',
]

def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Geo-flag-build/1.0'})
    return urllib.request.urlopen(request, timeout=60).read()

def main():
    flags = ROOT/'public/flags'
    flags.mkdir(parents=True, exist_ok=True)
    rows = [line.split('|') for line in ROSTER.splitlines()]
    ids = {r[0] for r in rows}
    assert len(rows) == len(ids) == 196
    geography = {code: pair for pair,codes in REGIONS.items() for code in codes.split()}
    assert set(geography) == ids, (set(geography)-ids, ids-set(geography))
    names_en = json.loads(get(BASE+'/countries.json'))
    def fetch(code):
        url = AF_SOURCE if code == 'af' else BASE+f'/svg/{code}.svg'
        data = get(url)
        if code == 'af':
            assert hashlib.sha256(data).hexdigest() == 'fc326ebb964d9a50e31984495d1cf94f810a8af2ecaac5615001358404a389be', 'Afghanistan upstream changed; review before updating'
        el = ET.fromstring(data)
        assert el.tag.endswith('svg') and b'<script' not in data and b'http' not in re.sub(rb'xmlns[^ ]*="[^"]*"', b'', data), code
        box = el.attrib.get('viewBox')
        if box:
            nums = re.split(r'[ ,]+', box.strip())
            aspect = float(nums[2])/float(nums[3])
        else:
            aspect = float(re.sub(r'(px|pt|mm|cm|in)$','',el.attrib['width']))/float(re.sub(r'(px|pt|mm|cm|in)$','',el.attrib['height']))
        (flags/f'{code}.svg').write_bytes(data)
        return code, aspect, {'id':code, 'file':f'{code}.svg', 'source':url,
            'sha256':hashlib.sha256(data).hexdigest(), 'bytes':len(data),
            'license':'Public domain (upstream declaration)',
            'licenseSource':AF_LICENSE if code == 'af' else BASE+'/README.md'}
    downloaded = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        for code, aspect, meta in pool.map(fetch, sorted(ids)):
            downloaded[code] = (aspect, meta)
    countries = []
    for code, reference_name, percent in rows:
        name = NAMES.get(code, reference_name)
        aliases = list(dict.fromkeys([reference_name, names_en.get(code.upper(),names_en.get(code,'')), *ALIASES.get(code,[])]))
        aliases = [a for a in aliases if a and a != name]
        similar = sorted({other for group in SIMILAR_GROUPS if code in group.split() for other in group.split() if other != code and other in ids})
        continent, region = geography[code]
        country = {'id':code, 'code':code.upper(), 'name':name, 'aliases':aliases,
                   'continent':continent, 'region':region, 'similar':similar,
                   'difficulty':1 if int(percent)>=60 else 2 if int(percent)>=35 else 3,
                   'aspect':round(downloaded[code][0],8)}
        if code == 'af':
            country['flagNote'] = 'Bandeira branca com inscrição preta, usada pelo governo de facto desde 2021. A variante republicana preta, vermelha e verde ainda aparece em acervos e contextos internacionais.'
        if code == 'sy':
            country['flagNote'] = 'Versão verde, branca e preta com três estrelas vermelhas, adotada em 2025.'
        countries.append(country)
    countries.sort(key=lambda c:c['name'])
    (ROOT/'src/data/countries.json').write_text(json.dumps(countries,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    manifest = {'retrieved':'2026-10-09','upstream':'https://github.com/hampusborgos/country-flags',
                'revision':REV,'count':196,'files':[downloaded[c][1] for c in sorted(ids)]}
    (flags/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    evidence = {'source':'https://www.jetpunk.com/user-quizzes/176134/bandeiras-do-mundo/stats',
        'checked':'2026-10-09','method':'Observed indexed statistics page using web retrieval; direct HTTP and reference image downloads return 403.',
        'count':196,'answers':[{'id':code,'referenceName':name,'correctPercent':int(percent)} for code,name,percent in rows]}
    (ROOT/'docs/jetpunk-roster.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    (ROOT/'docs/flag-source-README.md').write_bytes(get(BASE+'/README.md'))
    print(f'Validated {len(countries)} countries and {len(downloaded)} pinned SVG assets.')
    print('Continents:', {c:sum(x['continent']==c for x in countries) for c in sorted({x['continent'] for x in countries})})

if __name__ == '__main__':
    main()
