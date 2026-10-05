'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState, useMemo } from "react";
import { Panel, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { anorm, shell } from "../shared.jsx";
export function UnitListPage({
  kind
}) {
  const { units, facultyDepartments } = useModuleData('about');
  const cfg = units[kind];
  const [q, setQ] = useState('');
  const list = useMemo(() => cfg.list.filter(u => !q || anorm(`${u.name} ${u.head} ${u.desc}`).includes(anorm(q))), [cfg.list, q]);
  return shell({
    title: cfg.label,
    lead: cfg.intro,
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }, {
      label: cfg.label
    }],
    children: <Panel title={`Danh sách ${cfg.singular.toLowerCase()}`} icon="grid">
        <FilterBar search={q} onSearch={setQ} searchPlaceholder={`Tìm ${cfg.singular.toLowerCase()} theo tên, người phụ trách…`} count={list.length} total={cfg.list.length} onReset={() => setQ('')} />
        {kind === 'khoa' ? <div className="about-khoagrid">
            {list.map(u => <Link key={u.id} to={`/gioi-thieu/${kind}/${u.id}`} className="about-khoacard">
                <span className="about-khoacard__cover humg-ph" data-ratio="16-9"><span>{u.name}</span></span>
                <span className="about-khoacard__body">
                  <strong>{u.name}</strong>
                  <em><Icon name="user" size={12} /> {u.head}</em>
                  {(u.staff || u.majors) && <span className="about-khoacard__meta">
                      {u.staff ? `${u.staff} cán bộ` : ''}{u.staff && (u.majors || facultyDepartments[u.id]) ? ' · ' : ''}
                      {facultyDepartments[u.id] ? `${facultyDepartments[u.id].length} bộ môn` : u.majors ? `${u.majors.length} ngành` : ''}
                    </span>}
                </span>
              </Link>)}
          </div> : <DataTable columns={['Tên đơn vị', 'Người phụ trách', 'Điện thoại', 'Email', '']} rows={list.map(u => [<Link key="t" to={`/gioi-thieu/${kind}/${u.id}`}>{u.name}</Link>, u.head || '—', u.phone || '—', u.email || '—', <Link key="a" to={`/gioi-thieu/${kind}/${u.id}`} className="humg-link-more">Chi tiết</Link>])} />}
        {list.length === 0 && <p className="about-muted">Không tìm thấy đơn vị phù hợp.</p>}
      </Panel>
  });
}
