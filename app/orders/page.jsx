'use client';
import React,{useEffect,useMemo,useState} from 'react';
const SEED=[
 {id:'ORD-001234',client:'Kusto Logistics',warehouse:'ALA-DC1',items:18,status:'Packed',createdAt:'2025-08-05T09:20:00Z',eta:'2025-08-21T15:00:00Z',milestones:[{key:'Received',ts:'2025-08-05T09:21:00Z'},{key:'Picked',ts:'2025-08-06T14:00:00Z'},{key:'Packed',ts:'2025-08-06T18:30:00Z'},{key:'Shipped',ts:null},{key:'Delivered',ts:null}]} ,
 {id:'ORD-001235',client:'Altai Foods',warehouse:'ALA-DC1',items:6,status:'Shipped',createdAt:'2025-08-10T10:10:00Z',eta:'2025-08-20T12:00:00Z',milestones:[{key:'Received',ts:'2025-08-10T10:15:00Z'},{key:'Picked',ts:'2025-08-11T08:40:00Z'},{key:'Packed',ts:'2025-08-11T11:05:00Z'},{key:'Shipped',ts:'2025-08-12T16:45:00Z'},{key:'Delivered',ts:null}]},
 {id:'ORD-001236',client:'Nomad Wear',warehouse:'ALA-DC2',items:42,status:'Delivered',createdAt:'2025-08-12T13:00:00Z',eta:'2025-08-19T18:00:00Z',milestones:[{key:'Received',ts:'2025-08-12T13:10:00Z'},{key:'Picked',ts:'2025-08-13T07:40:00Z'},{key:'Packed',ts:'2025-08-13T12:20:00Z'},{key:'Shipped',ts:'2025-08-14T09:15:00Z'},{key:'Delivered',ts:'2025-08-17T17:35:00Z'}]}
];
const fmt=d=>new Date(d).toLocaleString();
const STATUS=['Received','Picked','Packed','Shipped','Delivered'];
function Progress({milestones}){const done=(milestones||[]).filter(m=>!!m.ts).length;const pct=Math.round(done/Math.max(1,(milestones||[]).length)*100);return <div className='h-2 w-full rounded-full bg-gray-200'><div className='h-2 rounded-full bg-black' style={{width:pct+'%'}}/></div>}
function Modal({open,onClose,children}){if(!open)return null;return <div className='fixed inset-0 z-50 grid place-items-center bg-black/50 p-4' onClick={onClose}><div className='max-w-4xl w-full rounded-2xl bg-white p-4' onClick={e=>e.stopPropagation()}>{children}</div></div>}
export default function Orders(){const [orders,setOrders]=useState([]);const [q,setQ]=useState('');const [st,setSt]=useState([]);const [wh,setWh]=useState('all');const [sort,setSort]=useState('created_desc');const [page,setPage]=useState(1);const [ps,setPs]=useState(10);const [open,setOpen]=useState(false);const [sel,setSel]=useState(null);
useEffect(()=>{setOrders(JSON.parse(localStorage.getItem('orders')||'null')||SEED)},[]);useEffect(()=>{localStorage.setItem('orders',JSON.stringify(orders))},[orders]);
const warehouses=useMemo(()=>Array.from(new Set(orders.map(o=>o.warehouse))),[orders]);
const list=useMemo(()=>{let r=orders.filter(o=>(o.id+o.client+o.status+o.warehouse).toLowerCase().includes(q.toLowerCase())&&(st.length?st.includes(o.status):1)&&(wh==='all'||o.warehouse===wh));r.sort((a,b)=>sort==='eta_asc'?new Date(a.eta)-new Date(b.eta):new Date(b.createdAt)-new Date(a.createdAt));return r},[orders,q,st,wh,sort]);
const totalPages=Math.max(1,Math.ceil(list.length/ps));const pageSafe=Math.min(page,totalPages);const paged=useMemo(()=>list.slice((pageSafe-1)*ps,(pageSafe-1)*ps+ps),[list,ps,pageSafe]);
return(<div className='min-h-screen p-6'>
 <div className='flex items-center justify-between mb-4'><h1 className='text-2xl font-bold'>Заказы (OMS)</h1><a className='btn' href='/'>На главную</a></div>
 <div className='card mb-4'><div className='p-4 space-y-3'>
   <div className='flex flex-col lg:flex-row gap-3 items-stretch lg:items-center'>
     <input className='btn' style={{borderColor:'#d1d5db'}} value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder='Поиск…'/>
     <select className='btn' value={wh} onChange={e=>setWh(e.target.value)}><option value='all'>Все склады</option>{warehouses.map(w=><option key={w} value={w}>{w}</option>)}</select>
     <select className='btn' value={sort} onChange={e=>setSort(e.target.value)}><option value='created_desc'>Создан ↓</option><option value='eta_asc'>ETA ↑</option></select>
   </div>
   <div className='flex flex-wrap gap-2 items-center'>{STATUS.map(s=><button key={s} className={`btn ${st.includes(s)?'bg-black text-white border-black':''}`} onClick={()=>setSt(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])}>{s}</button>)}</div>
 </div></div>
 <div className='card'><div className='p-4'>
  <div className='overflow-hidden rounded-xl border'><table className='w-full text-sm border-collapse'><thead className='bg-gray-50 text-left text-gray-600'><tr><th className='p-3'>Номер</th><th className='p-3'>Клиент</th><th className='p-3'>Склад</th><th className='p-3'>Создан</th><th className='p-3'>ETA</th><th className='p-3'>Позиции</th><th className='p-3'>Статус</th><th className='p-3'>Прогресс</th></tr></thead><tbody>
  {paged.map(o=>(<tr key={o.id} className='hover:bg-gray-50'><td className='p-3 font-medium cursor-pointer' onClick={()=>{setSel(o);setOpen(true)}}>{o.id}</td><td className='p-3'>{o.client}</td><td className='p-3'><span className='chip'>{o.warehouse}</span></td><td className='p-3 text-gray-500'>{fmt(o.createdAt)}</td><td className='p-3 text-gray-500'>{fmt(o.eta)}</td><td className='p-3'>{o.items}</td><td className='p-3'><span className='chip'>{o.status}</span></td><td className='p-3 w-56'><Progress milestones={o.milestones}/></td></tr>))}
  </tbody></table></div>
  <div className='flex items-center justify-between mt-3'><div className='text-xs text-gray-500'>Показано {paged.length} из {list.length}</div><div className='flex items-center gap-3'><select className='btn' value={String(ps)} onChange={e=>{setPs(Number(e.target.value));setPage(1)}}><option value='5'>5</option><option value='10'>10</option><option value='20'>20</option></select><div className='flex items-center gap-1'><button className='btn' disabled={pageSafe<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>←</button><div className='text-sm w-16 text-center'>{pageSafe}/{totalPages}</div><button className='btn' disabled={pageSafe>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>→</button></div></div></div>
 </div></div>
 <Modal open={open} onClose={()=>setOpen(false)}>{sel&&(<div className='space-y-4'><div className='text-lg font-semibold'>Детали {sel.id}</div><div className='grid grid-cols-1 md:grid-cols-2 gap-6'><div className='space-y-2'><div>Клиент: <b>{sel.client}</b></div><div>Склад: <span className='chip'>{sel.warehouse}</span></div><div>Создан: {fmt(sel.createdAt)}</div><div>ETA: {fmt(sel.eta)}</div><div>Позиции: {sel.items}</div><div>Статус: <span className='chip'>{sel.status}</span></div></div><div><div className='font-medium mb-2'>Прогресс</div><Progress milestones={sel.milestones||[]}/></div></div></div>)}</Modal>
</div>)}
