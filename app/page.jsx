'use client';
import React,{useEffect,useMemo,useState} from 'react';
const SEED_ORDERS=[
 {id:'ORD-001234',client:'Kusto Logistics',warehouse:'ALA-DC1',items:18,status:'Packed',createdAt:'2025-08-05T09:20:00Z',eta:'2025-08-21T15:00:00Z',milestones:[{key:'Received',ts:'2025-08-05T09:21:00Z'},{key:'Picked',ts:'2025-08-06T14:00:00Z'},{key:'Packed',ts:'2025-08-06T18:30:00Z'},{key:'Shipped',ts:null},{key:'Delivered',ts:null}],files:[],comments:[]},
 {id:'ORD-001235',client:'Altai Foods',warehouse:'ALA-DC1',items:6,status:'Shipped',createdAt:'2025-08-10T10:10:00Z',eta:'2025-08-20T12:00:00Z',milestones:[{key:'Received',ts:'2025-08-10T10:15:00Z'},{key:'Picked',ts:'2025-08-11T08:40:00Z'},{key:'Packed',ts:'2025-08-11T11:05:00Z'},{key:'Shipped',ts:'2025-08-12T16:45:00Z'},{key:'Delivered',ts:null}],files:[],comments:[]},
 {id:'ORD-001236',client:'Nomad Wear',warehouse:'ALA-DC2',items:42,status:'Delivered',createdAt:'2025-08-12T13:00:00Z',eta:'2025-08-19T18:00:00Z',milestones:[{key:'Received',ts:'2025-08-12T13:10:00Z'},{key:'Picked',ts:'2025-08-13T07:40:00Z'},{key:'Packed',ts:'2025-08-13T12:20:00Z'},{key:'Shipped',ts:'2025-08-14T09:15:00Z'},{key:'Delivered',ts:'2025-08-17T17:35:00Z'}],files:[],comments:[]},
];
export default function Home(){
 const [orders,setOrders]=useState([]); const [runs,setRuns]=useState([]);
 useEffect(()=>{setOrders(JSON.parse(localStorage.getItem('orders')||'null')||SEED_ORDERS);setRuns(JSON.parse(localStorage.getItem('runs')||'[]'));},[]);
 const kpi=useMemo(()=>{const shippedToday=orders.filter(o=>o.milestones?.find(m=>m.key==='Shipped'&&m.ts&&new Date(m.ts).toDateString()===new Date().toDateString())).length; const delivered=orders.filter(o=>o.status==='Delivered'); const slaOk=delivered.filter(o=>new Date(o.milestones?.find(m=>m.key==='Delivered')?.ts||0)<=new Date(o.eta)).length; return{orders:orders.length,inProgress:orders.filter(o=>['Received','Picked','Packed','Shipped'].includes(o.status)).length,shippedToday,sla:delivered.length?Math.round(100*slaOk/delivered.length):0,runs:runs.length,stopsDone:runs.reduce((s,r)=>s+(r.stops||[]).filter(x=>x.status==='Done').length,0)};},[orders,runs]);
 return(<div className="min-h-screen p-6">
  <div className="mb-6"><h1 className="text-2xl font-bold">OMS + TMS Demo</h1><p className="text-sm text-gray-500">Оркестрация заказов и доставка — в одном UI</p></div>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
    <div className="card"><div className="p-4"><div className="text-base font-semibold">Всего заказов</div><div className="text-2xl font-semibold">{kpi.orders}</div></div></div>
    <div className="card"><div className="p-4"><div className="text-base font-semibold">В процессе</div><div className="text-2xl font-semibold">{kpi.inProgress}</div></div></div>
    <div className="card"><div className="p-4"><div className="text-base font-semibold">Отгружено сегодня</div><div className="text-2xl font-semibold">{kpi.shippedToday}</div></div></div>
    <div className="card"><div className="p-4"><div className="text-base font-semibold">SLA</div><div className="mt-2 h-2 rounded-full bg-gray-200"><div className="h-2 rounded-full bg-black" style={{width:kpi.sla+'%'}}/></div><div className="text-sm text-gray-600 mt-1">{kpi.sla}%</div></div></div>
    <div className="card"><div className="p-4"><div className="text-base font-semibold">Рейсов</div><div className="text-2xl font-semibold">{kpi.runs}</div></div></div>
    <div className="card"><div className="p-4"><div className="text-base font-semibold">Доставлено точек</div><div className="text-2xl font-semibold">{kpi.stopsDone}</div></div></div>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="card"><div className="p-4 space-y-2"><h2 className="text-lg font-semibold">OMS — Заказы</h2><p className="text-sm text-gray-600">Список, фильтры, детали</p><a className="btnp inline-block" href="/orders">Открыть</a></div></div>
    <div className="card"><div className="p-4 space-y-2"><h2 className="text-lg font-semibold">TMS — Транспорт</h2><p className="text-sm text-gray-600">Маршруты, рейсы, POD</p><a className="btnp inline-block" href="/transport">Открыть</a></div></div>
  </div>
  <div className="mt-8 text-xs text-gray-500">Локальные демо-данные. Интеграции включаются на прод-этапе.</div>
 </div>);}
