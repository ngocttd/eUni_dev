import json, re, sys
d = json.load(open(sys.argv[1], encoding='utf8'))
ALIAS = {'Grant': '/api/v1/admin/grants', 'Media': '/api/v1/admin/media', 'Banner': '/api/v1/admin/banners', 'Event': '/api/v1/admin/events',
         'AuditLog': '/api/v1/admin/audit-logs', 'GET /api/v1/public/menus/header (3 mục đầu)': '/api/v1/public/menus/{code}', 'GET /api/v1/admin/announcements/{id}': '/api/v1/admin/announcements'}
for e in d['eps']: e['ex'] = []
for title, j in d['ex'].items():
    path = ALIAS.get(title) or re.sub(r'^GET\s+', '', title).replace(' (quản trị)', '')
    # ưu tiên khớp chính xác, sau đó khớp tiền tố trong cột path
    hit = next((e for e in d['eps'] if e['p'] == path), None) or next((e for e in d['eps'] if e['p'].split(' ')[0] == path or e['p'].startswith(path + ' ') or path in e['p'].split(' · ')), None)
    if hit is None and path == '/api/v1/admin/contents/{id}': hit = next(e for e in d['eps'] if e['p'] == '/api/v1/admin/contents/{id}')
    if hit is None: print('no endpoint for', title); continue
    hit['ex'].append({'t': title, 'j': j})
d['ex'] = {k: '' for k in d['ex']}
data = json.dumps(d, ensure_ascii=False).replace('</', '<\\/')
html = open(__import__('os').path.join(__import__('os').path.dirname(__file__), 'template.html'), encoding='utf8').read().replace('__DATA__', data)
open(sys.argv[2], 'w', encoding='utf8').write(html)
print(sum(1 for e in d['eps'] if e['ex']), 'endpoints có mẫu;', len(html)//1024, 'KB')
