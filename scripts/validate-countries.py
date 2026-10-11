"""Offline integrity audit for the roster and licensed local flag assets."""
from pathlib import Path
import hashlib, json, re, unicodedata
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
load = lambda p: json.loads((root/p).read_text(encoding='utf8'))
countries = load('src/data/countries.json')
manifest = load('public/flags/manifest.json')
reference = load('docs/jetpunk-roster.json')
ids = {c['id'] for c in countries}
assert len(countries) == len(ids) == len(manifest['files']) == 196
assert ids == {r['id'] for r in reference['answers']}
assert ids == {p.stem for p in (root/'public/flags').glob('*.svg')}
assert {'va','tw','xk'} <= ids and 'ps' not in ids
entries = {r['id']:r for r in manifest['files']}
aliases = {}
for c in countries:
    code = c['id']
    assert c['code'] == code.upper() and re.fullmatch('[a-z]{2}',code)
    assert c['continent'] in ['África','América do Norte','América do Sul','Ásia','Europa','Oceania']
    assert c['region'] and c['name'] and c['difficulty'] in [1,2,3]
    assert c['similar'] and len(set(c['similar'])) == len(c['similar'])
    assert all(other in ids and other != code for other in c['similar'])
    for alias in [c['name'],*c['aliases']]:
        norm = ''.join(x for x in unicodedata.normalize('NFD',alias).casefold() if x.isalnum())
        assert norm not in aliases or aliases[norm] == code, (alias, code, aliases.get(norm))
        aliases[norm] = code
    data = (root/f'public/flags/{code}.svg').read_bytes()
    record = entries[code]
    assert hashlib.sha256(data).hexdigest() == record['sha256'], code
    assert record['license'] and record['licenseSource'].startswith('https://')
    element = ET.fromstring(data)
    for e in element.iter():
        assert e.tag.rsplit('}',1)[-1] not in ['script','foreignObject','image'], code
        for attr,value in e.attrib.items():
            assert not attr.lower().startswith('on')
            if attr.endswith('href'): assert value.startswith('#'), (code,value)
    if 'viewBox' in element.attrib:
        box = list(map(float,re.split('[ ,]+',element.attrib['viewBox'].strip())))
        ratio = box[2]/box[3]
    else:
        ratio = float(re.sub(r'(px|pt|mm|cm|in)$','',element.attrib['width']))/float(re.sub(r'(px|pt|mm|cm|in)$','',element.attrib['height']))
    assert abs(ratio-c['aspect'])<1e-7, code
assert next(c['aspect'] for c in countries if c['id']=='ch') == 1
assert next(c['aspect'] for c in countries if c['id']=='va') == 1
assert next(c['aspect'] for c in countries if c['id']=='af') == 2
assert next(c['aspect'] for c in countries if c['id']=='np') < 1
print('PASS: 196 unique countries; exact reference membership; 196 valid SVGs; SHA-256, licenses, aliases, similarities and aspect ratios verified.')
