import re, json, sys
root = sys.argv[1]
md = open(f'{root}/euni-api-mock/contract/API_CONTRACT.md', encoding='utf8').read()
sec = lambda a, b: md[md.index(a): md.index(b)] if b else md[md.index(a):]
def cells(line): return [c.strip() for c in line.strip().strip('|').split(' | ')]
strip = lambda s: s.replace('`', '')

# cms endpoints
eps = []
for line in sec('## 3. cms-api', '### Ví dụ response').splitlines():
    if line.startswith('| ') and not line.startswith('| Method') and not line.startswith('|---'):
        c = cells(line)
        if len(c) >= 4:
            m, p, perm, d = c[0], strip(c[1]), c[2], ' | '.join(c[3:])
            g = 'public' if '/v1/public/' in p else 'me' if '/v1/me/' in p else 'admin'
            eps.append({'m': m, 'p': p, 'perm': perm, 'd': d, 'g': g})
# examples
ex = {}
for m in re.finditer(r'#### (.+?)\n+```json\n(.*?)\n```', sec('### Ví dụ response', '## 4.'), re.S):
    ex[m.group(1).strip()] = m.group(2)
# auth section
auth = sec('## 2. auth-api', '## 3. cms-api')
login_json = re.search(r'```json\n(.*?)\n```', auth, re.S).group(1)
# datasets
ds = {}
cur_svc = None; cur_mod = None
for line in sec('## 4. Dataset', '## 5.').splitlines():
    if line.startswith('### '): cur_svc = line[4:].strip(); ds[cur_svc] = []
    m = re.match(r'\*\*`([^`]+)`\*\* — `GET ([^`]+)`', line)
    if m: cur_mod = {'module': m.group(1), 'path': m.group(2), 'keys': []}; ds[cur_svc].append(cur_mod)
    elif line.startswith('| `') and cur_mod is not None:
        c = cells(line); cur_mod['keys'].append({'k': strip(c[0]), 't': c[1], 'p': strip(c[2]), 'f': c[3] if len(c) > 3 else ''})
# schema tables
sql = open(f'{root}/euni-api-mock/database/v2/schema.sql', encoding='utf8').read()
tables = []
for m in re.finditer(r'CREATE TABLE IF NOT EXISTS (cms\.\w+) \((.*?)\n\)(?: PARTITION BY [^;]*)?;', sql, re.S):
    cols = []
    for l in m.group(2).splitlines():
        l = l.strip().rstrip(',')
        if not l or l.startswith('--') or re.match(r'^(PRIMARY|UNIQUE|CONSTRAINT|CHECK|FOREIGN|EXCLUDE)\b', l, re.I): continue
        mm = re.match(r'(\w+)\s+(.*)', l)
        if mm:
            body, _, cmt = mm.group(2).partition('--')
            cols.append({'n': mm.group(1), 't': re.sub(r'\s+', ' ', body).strip().rstrip(','), 'c': cmt.strip()})
    tables.append({'name': m.group(1), 'cols': cols})
json.dump({'eps': eps, 'ex': ex, 'login': login_json, 'ds': ds, 'tables': tables}, open(sys.argv[2], 'w', encoding='utf8'), ensure_ascii=False)
print(len(eps), 'endpoints', len(ex), 'examples', sum(len(v) for v in ds.values()), 'modules', len(tables), 'tables')
