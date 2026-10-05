'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useSearchParams } from '../../../../lib/router.jsx';
import { useState, useMemo } from "react";

import { FilterBar, Panel, DataTable, DocList, SupportCard } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { WeekGrid, enorm, shell } from "../shared.jsx";
export function AcademicCalendarPage() {
  const { academicCalendar } = useModuleData('education');
  const [params, setParams] = useSearchParams();
  const role = params.get('vaitro') === 'giang-vien' ? 'giang-vien' : 'sinh-vien';
  const tab0 = params.get('tab') === 'thi' ? 'thi' : params.get('tab') === 'ke-hoach' ? 'ke-hoach' : 'hoc';
  const [tab, setTabRaw] = useState(tab0);
  const setTab = v => {
    setTabRaw(v);
    const p = new URLSearchParams(params);
    p.set('tab', v === 'hoc' ? 'hoc' : v);
    setParams(p, {
      replace: true
    });
  };
  const [term, setTerm] = useState(academicCalendar.terms[0]);
  const [fac, setFac] = useState('Tất cả');
  const [cls, setCls] = useState('Tất cả');
  const [q, setQ] = useState('');
  const reset = () => {
    setTerm(academicCalendar.terms[0]);
    setFac('Tất cả');
    setCls('Tất cả');
    setQ('');
  };
  const match = r => r.term === term && (fac === 'Tất cả' || r.faculty === fac) && (cls === 'Tất cả' || r.class === cls) && (!q || enorm(`${r.course} ${r.code} ${r.lecturer || ''} ${r.room} ${r.class}`).includes(enorm(q)));
  const tt = useMemo(() => academicCalendar.timetable.filter(match), [term, fac, cls, q]);
  const ex = useMemo(() => academicCalendar.exams.filter(match), [term, fac, cls, q]);
  const filters = <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo học phần, mã HP, giảng viên, phòng…" selects={[{
    label: 'Học kỳ',
    value: term,
    onChange: setTerm,
    options: academicCalendar.terms
  }, {
    label: 'Khoa',
    value: fac,
    onChange: setFac,
    options: academicCalendar.faculties
  }, {
    label: 'Lớp',
    value: cls,
    onChange: setCls,
    options: academicCalendar.classes
  }]} count={tab === 'thi' ? ex.length : tt.length} total={(tab === 'thi' ? academicCalendar.exams : academicCalendar.timetable).filter(r => r.term === term).length} onReset={reset} />;
  return shell({
    title: role === 'giang-vien' ? 'Lịch giảng dạy – Lịch thi' : 'Lịch học – Lịch thi',
    lead: `Tra cứu thời khóa biểu, lịch thi và kế hoạch năm học của Trường (${academicCalendar.year}).`,
    crumbs: [{
      label: 'Học tập',
      to: '/hoc-tap'
    }, {
      label: 'Lịch học – Lịch thi'
    }],
    sidebar: <>
        <Panel title={`Kế hoạch ${academicCalendar.year}`} icon="calendar" flush>
          <DataTable columns={academicCalendar.plan.columns} rows={academicCalendar.plan.rows} />
        </Panel>
        <Panel title="Lưu ý khi thi" icon="clock">
          <ul className="edu-check">{academicCalendar.exam.map((e, i) => <li key={i}><Icon name="check" size={14} /> {e}</li>)}</ul>
        </Panel>
        <Panel title="Tài liệu" icon="file"><DocList items={academicCalendar.docs} /></Panel>
        <SupportCard title="Lịch cá nhân" lead="Đăng nhập để xem thời khóa biểu, lịch thi và lịch giảng dạy của riêng bạn." cta={{
        label: 'Đăng nhập My eUni',
        to: '/dang-nhap'
      }} />
      </>,
    children: <Panel title={tab === 'thi' ? 'Lịch thi' : tab === 'ke-hoach' ? 'Kế hoạch năm học' : role === 'giang-vien' ? 'Lịch giảng dạy' : 'Thời khóa biểu'} icon="calendar">
        <div className="edu-tabs">
          <button type="button" className={tab === 'hoc' ? 'is-active' : ''} onClick={() => setTab('hoc')}>
            {role === 'giang-vien' ? 'Lịch giảng dạy' : 'Lịch học (TKB)'}
          </button>
          <button type="button" className={tab === 'thi' ? 'is-active' : ''} onClick={() => setTab('thi')}>Lịch thi</button>
          <button type="button" className={tab === 'ke-hoach' ? 'is-active' : ''} onClick={() => setTab('ke-hoach')}>Kế hoạch năm học</button>
        </div>

        {tab === 'ke-hoach' && <DataTable columns={academicCalendar.plan.columns} rows={academicCalendar.plan.rows} />}

        {tab === 'hoc' && <>
            {filters}
            <WeekGrid rows={tt} />
            <h4 className="edu-subhead">Danh sách chi tiết</h4>
            <DataTable columns={['Thứ', 'Tiết', 'Giờ', 'Học phần', 'Mã HP', 'Giảng viên', 'Phòng', 'Tuần']} rows={tt.map(r => [r.day, r.period, r.time, r.course, r.code, r.lecturer, r.room, r.weeks])} />
            {tt.length === 0 && <p className="edu-muted">Không có lịch học phù hợp bộ lọc.</p>}
          </>}

        {tab === 'thi' && <>
            {filters}
            <DataTable columns={['Học phần', 'Mã HP', 'Lớp', 'Ngày thi', 'Ca thi', 'Phòng', 'Hình thức', 'SL']} rows={ex.map(r => [r.course, r.code, r.class, r.date, r.session, r.room, r.form, String(r.students)])} />
            {ex.length === 0 && <p className="edu-muted">Không có lịch thi phù hợp bộ lọc.</p>}
          </>}
      </Panel>
  });
}
