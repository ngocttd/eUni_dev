'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { PageShell, Panel, NewsMini, LinkList } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";

export function WorkCalendarPage() {
  const { workCalendar } = useModuleData('utilities');
  return <PageShell eyebrow="Trang chủ" title="Lịch công tác tuần" lead="Lịch làm việc và hoạt động điều hành của Ban Giám hiệu, các đơn vị trong Trường." crumbs={[{
    label: 'Lịch công tác'
  }]} hero={<div className="util-weekbar">
          <button type="button" aria-label="Tuần trước"><Icon name="chevron-left" size={16} /></button>
          <strong>{workCalendar.week}</strong>
          <button type="button" aria-label="Tuần sau"><Icon name="chevron-right" size={16} /></button>
        </div>} sidebar={<>
          <Panel title="Thông báo điều hành" icon="bell"><NewsMini items={workCalendar.notices} /></Panel>
          <LinkList title="Liên kết" items={[{
      label: 'Lịch công tác tháng'
    }, {
      label: 'Đăng ký lịch họp / phòng họp'
    }, {
      label: 'Lịch tiếp công dân'
    }]} />
        </>}>
      <div className="util-week">
        {workCalendar.days.map(d => <div key={d.day} className={`util-day ${d.events.length === 0 ? 'is-empty' : ''}`}>
            <div className="util-day__head">
              <strong>{d.day}</strong>
              <span>{d.date}</span>
            </div>
            {d.events.length === 0 ? <p className="util-day__none">Không có lịch</p> : <ul>
                {d.events.map((e, i) => <li key={i}>
                    <span className="util-day__time">{e.time}</span>
                    <span className="util-day__info">
                      <strong>{e.title}</strong>
                      <em><Icon name="map-pin" size={12} /> {e.place} · {e.unit}</em>
                    </span>
                  </li>)}
              </ul>}
          </div>)}
      </div>
    </PageShell>;
}
