'use client';
import React, { useEffect, useMemo, useState } from 'react';

const STATUS = ['Received','Picked','Packed','Shipped','Delivered'];
const SEED = [
  { id:'ORD-001234', client:'Kusto Logistics', warehouse:'ALA-DC1', items:18, status:'Packed',
    createdAt:'2025-08-05T09:20:00Z', eta:'2025-08-21T15:00:00Z',
    milestones:[{key:'Received',ts:'2025-08-05T09:21:00Z'},{key:'Picked',ts:'2025-08-06T14:00:00Z'},{key:'Packed',ts:'2025-08-06T18:30:00Z'},{key:'Shipped',ts:null},{key:'Delivered',ts:null}],
    files:[], comments:[] },
  { id:'ORD-001235', client:'Altai Foods', warehouse:'ALA-DC1', items:6, status:'Shipped',
    createdAt:'2025-08-10T10:10:00Z', eta:'2025-08-20T12:00:00Z',
    milestones:[{key:'Received',ts:'2025-08-10T10:15:00Z'},{key:'Picked',ts:'2025-08-11T08:40:00Z'},{key:'Packed',ts:'2025-08-11T11:05:00Z'},{key:'Shipped',ts:'2025-08-12T16:45:00Z'},{key:'Delivered',ts:null}],
    files:[], comments:[] },
  { id:'ORD-001236', client:'Nomad Wear', warehouse:'ALA-DC2', items:42, status:'Delivered',
    createdAt:'2025-08-12T13:00:00Z', eta:'2025-08-19T18:00:00Z',
    milestones:[{key:'Received',ts:'2025-08-12T13:10:00Z'},{key:'Picked',ts:'2025-08-13T07:40:00Z'},{key:'Packed',ts:'2025-08-13T12:20:00Z'},{key:'Shipped',ts:'2025-08-14T09:15:00Z'},{key:'Delivered',ts:'2025-08-17T17:35:00Z'}],
    files:[], comments:[] },
];

const fmt = d => new Date(d).toLocaleString();
const Progress = ({ milestones }) => {
  const done = (milestones||[]).filter(m=>!!m.ts).length;
  const pct = Math.round(done/Math.max(1,(milestones||[]).length)*100);
  return <div className="h-2 w-full rounded-full bg-gray-200"><div className="h-2 rounded-full bg-black" style={{width: pct+'%'}}/></div>;
};
const audit = (action, message) => {
  const a = JSON.parse(localStorage.getItem('audit')||'[]');
  a.push({ ts:new Date().toISOString(), action, message });
  localStorage.setItem('audit', JSON.stringify(a));
};

export default function Orders(){
  const [orders,setOrders]=useState([]);
  const [q,setQ]=useState(''); const [st,setSt]=useState([]); const [wh,setWh]=useState('all');
  const [sort,setSort]=useState('created_desc'); const [page,setPage]=useState(1); const [ps,setPs]=useState(10);
  const [open,setOpen]=useState(false); const [sel,setSel]=useState(null);
  // Saved views
  const [views,setViews]=useState([]); const [activeView,setActiveView]=useState('');

  useEffect(()=>{ setOrders(JSON.parse(localStorage.getItem('orders')||'null')||SEED); },[]);
  useEffect(()=>{ localStorage.setItem('orders', JSON.stringify(orders)); },[orders]);
  useEffect(()=>{ setViews(JSON.parse(localStorage.getItem('views')||'[]')); },[]);
  useEffect(()=>{ localStorage.setItem('views', JSON.stringify(views)); },[views]);

  const warehouses = useMemo(()=>Array.from(new Set(orders.map(o=>o.warehouse))),[orders]);
  const list = useMemo(()=>{
    let r = orders.filter(o=>(o.id+o.client+o.status+o.warehouse).toLowerCase().includes(q.toLowerCase())
      && (st.length? st.includes(o.status) : true) && (wh==='all' || o.warehouse===wh));
    r.sort((a,b)=> sort==='eta_asc' ? new Date(a.eta)-new Date(b.eta) : new Date(b.createdAt)-new Date(a.createdAt));
    return r;
  },[orders,q,st,wh,sort]);
  const totalPages = Math.max(1, Math.ceil(list.length/ps));
  const pageSafe = Math.min(page, totalPages);
  const paged = useMemo(()=> list.slice((pageSafe-1)*ps, (pageSafe-1)*ps+ps), [list,ps,pageSafe]);

  // CSV import
  const importCSV = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const t = String(reader.result||'');
      const lines = t.split(/\r?\n/).filter(Boolean);
      if(!lines.length) return alert('Файл пуст');
      const headers = lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));
      const idx = n => headers.findIndex(h=>h.toLowerCase()===n.toLowerCase());
      const add = []; let ok=0, fail=0, errs=[];
      for(let i=1;i<lines.length;i++){
        const cols = lines[i].match(/("([^"]|"")*"|[^,]+)/g) || [];
        const val = j => (cols[j]||'').replace(/^"|"$/g,'').replace(/""/g,'"');
        try{
          const rec = {
            id: val(idx('id')) || `ORD-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
            client: val(idx('client')) || 'Unknown',
            warehouse: val(idx('warehouse')) || 'DC',
            items: Number(val(idx('items'))||0),
            status: val(idx('status'))||'Received',
            createdAt: val(idx('createdAt')) || new Date().toISOString(),
            eta: val(idx('eta')) || new Date(Date.now()+3*86400000).toISOString(),
            milestones:[{key:'Received',ts:new Date().toISOString()},{key:'Picked',ts:null},{key:'Packed',ts:null},{key:'Shipped',ts:null},{key:'Delivered',ts:null}],
            comments:[]
          };
          if(!STATUS.includes(rec.status)) throw new Error('Неизвестный статус');
          add.push(rec); ok++;
        }catch(e){ fail++; errs.push(`стр ${i+1}: ${e}`); }
      }
      setOrders(prev => [...add, ...prev]);
      audit('orders.import_csv', `ok=${ok}, errors=${fail}`);
      if(fail) alert(`Импорт: ok=${ok}, ошибок=${fail}\n${errs.slice(0,5).join('\n')}${errs.length>5?'\n…':''}`);
    };
    reader.readAsText(file);
  };

  // Saved views
  const saveView = () => {
    const name = prompt('Название представления:');
    if(!name) return;
    const v = { id: crypto.randomUUID(), name, q, st, wh, sort, ps };
    setViews(prev => [v, ...prev]);
    audit('orders.save_view', name);
  };
  const applyView = id => {
    setActiveView(id);
    const v = views.find(x=>x.id===id); if(!v) return;
    setQ(v.q||''); setSt(v.st||[]); setWh(v.wh||'all'); setSort(v.sort||'created_desc'); setPs(v.ps||10); setPage(1);
  };
  const shareLink = () => {
    const p = new URLSearchParams(); if(q) p.set('q',q); if(st.length) p.set('st',st.join(',')); if(wh!=='all') p.set('wh',wh); p.set('sort',sort); p.set('ps',String(ps));
    navigator.clipboard.writeText(`${location.origin}/orders?${p.toString()}`); alert('Ссылка скопирована');
  };

  // comments
  const [comment,setComment]=useState('');
  const addComment = () => {
    const body = comment.trim(); if(!body || !sel) return;
    const c = { author:'You', body, ts:new Date().toISOString() };
    setOrders(prev => prev.map(o => o.id===sel.id ? {...o, comments:[...(o.comments||[]), c]} : o));
    setSel(s => ({...s, comments:[...(s.comments||[]), c]}));
    setComment('');
    audit('orders.comment', `${sel.id}: ${body.slice(0,80)}`);
  };
  const renderText = (t) => t.replace(/@([A-Za-zА-Яа-яЁё][\\w .-]{1,30})/g, '<b>@$1</b>');

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Заказы (OMS)</h1>
        <div className="flex items-center gap-2">
          <a className="btn" href="/audit">Audit</a>
          <a className="btn" href="/">На главную</a>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <div className="card"><div className="p-4"><div className="text-base font-semibold">Всего</div><div className="text-2xl font-semibold">{list.length}</div></div></div>
        <div className="card"><div className="p-4"><div className="text-base font-semibold">В процессе</div><div className="text-2xl font-semibold">{list.filter(o=>['Received','Picked','Packed','Shipped'].includes(o.status)).length}</div></div></div>
        <div className="card"><div className="p-4"><div className="text-base font-semibold">Shipped today</div><div className="text-2xl font-semibold">{list.filter(o=>o.milestones.find(m=>m.key==='Shipped'&&m.ts&&new Date(m.ts).toDateString()===new Date().toDateString())).length}</div></div></div>
        <div className="card"><div className="p-4"><div className="text-base font-semibold">Действия</div>
          <label className="btn cursor-pointer">Импорт CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={e=>e.target.files?.[0] && importCSV(e.target.files[0])}/>
          </label>
        </div></div>
      </div>

      {/* Views */}
      <div className="flex gap-2 mb-2">
        <select className="btn min-w-[220px]" value={activeView} onChange={e=>applyView(e.target.value)}>
          <option value="">— Сохранённые представления —</option>
          {views.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <button className="btn" onClick={saveView}>Сохранить текущее</button>
        <button className="btn" onClick={shareLink}>Поделиться ссылкой</button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <input className="btn flex-1" value={q} onChange={e=>{setQ(e.target.value); setPage(1);}} placeholder="Поиск…"/>
            <select className="btn" value={wh} onChange={e=>setWh(e.target.value)}>
              <option value="all">Все склады</option>{warehouses.map(w=><option key={w} value={w}>{w}</option>)}
            </select>
            <select className="btn" value={sort} onChange={e=>setSort(e.target.value)}>
              <option value="created_desc">Создан ↓</option>
              <option value="eta_asc">ETA ↑</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {STATUS.map(s => (
              <button key={s} className={`btn ${st.includes(s)?'bg-black text-white border-black':''}`} onClick={()=>setSt(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="p-4">
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr><th className="p-3">Номер</th><th className="p-3">Клиент</th><th className="p-3">Склад</th><th className="p-3">Создан</th><th className="p-3">ETA</th><th className="p-3">Позиции</th><th className="p-3">Статус</th><th className="p-3">Прогресс</th></tr>
              </thead>
              <tbody>
                {paged.map(o=>(
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium cursor-pointer" onClick={()=>{setSel(o); setOpen(true);}}>{o.id}</td>
                    <td className="p-3">{o.client}</td>
                    <td className="p-3"><span className="chip">{o.warehouse}</span></td>
                    <td className="p-3 text-gray-500">{fmt(o.createdAt)}</td>
                    <td className="p-3 text-gray-500">{fmt(o.eta)}</td>
                    <td className="p-3">{o.items}</td>
                    <td className="p-3"><span className="chip">{o.status}</span></td>
                    <td className="p-3 w-56"><Progress milestones={o.milestones}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-500">Показано {paged.length} из {list.length}</div>
            <div className="flex items-center gap-3">
              <select className="btn" value={String(ps)} onChange={e=>{setPs(Number(e.target.value)); setPage(1);}}>
                <option value="5">5</option><option value="10">10</option><option value="20">20</option>
              </select>
              <div className="flex items-center gap-1">
                <button className="btn" disabled={pageSafe<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>←</button>
                <div className="text-sm w-16 text-center">{pageSafe}/{totalPages}</div>
                <button className="btn" disabled={pageSafe>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>→</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal with comments */}
      {open && sel && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={()=>setOpen(false)}>
          <div className="max-w-4xl w-full rounded-2xl bg-white p-4" onClick={e=>e.stopPropagation()}>
            <div className="text-lg font-semibold mb-2">Заказ {sel.id}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div>Клиент: <b>{sel.client}</b></div>
                <div>Склад: <span className="chip">{sel.warehouse}</span></div>
                <div>Создан: {fmt(sel.createdAt)}</div>
                <div>ETA: {fmt(sel.eta)}</div>
                <div>Позиции: {sel.items}</div>
                <div>Статус: <span className="chip">{sel.status}</span></div>
                <div className="mt-2"><Progress milestones={sel.milestones}/></div>
              </div>
              <div>
                <div className="font-medium mb-1">Комментарии</div>
                <div className="border rounded p-2 max-h-48 overflow-auto text-sm mb-2">
                  {(sel.comments||[]).map((c,i)=>(
                    <div key={i} className="mb-1">
                      <span className="font-medium">{c.author}</span>{' '}
                      <span className="text-gray-500">{new Date(c.ts).toLocaleString()}</span>
                      <div dangerouslySetInnerHTML={{__html: renderText(c.body)}}/>
                    </div>
                  ))}
                  {!(sel.comments||[]).length && <div className="text-gray-500">Пока пусто</div>}
                </div>
                <textarea rows={3} className="btn w-full" value={comment} onChange={e=>setComment(e.target.value)} placeholder="Комментарий — поддерживаются @упоминания"/>
                <button className="btnp mt-2" onClick={addComment}>Добавить</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

