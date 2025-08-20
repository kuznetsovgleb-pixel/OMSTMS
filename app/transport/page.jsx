'use client';
import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

const DEPOT = { name:'ALA-DC1', lat:43.238949, lng:76.889709 };
const STOPS0 = [
  { id:'ST-1001', orderId:'ORD-001235', name:'Altai Foods', lat:43.256, lng:76.92, address:'Almaty, Auezov', cod:0, status:'Pending' },
  { id:'ST-1002', orderId:'ORD-001236', name:'Nomad Wear', lat:43.22, lng:76.87, address:'Almaty, Bostandyk', cod:0, status:'Pending' },
  { id:'ST-1003', orderId:'ORD-001240', name:'Eurasia Pharma', lat:43.24, lng:76.95, address:'Almaty, Almaly', cod:15000, status:'Pending' },
];
const hav=(la1,lo1,la2,lo2)=>{const R=6371,toRad=a=>a*Math.PI/180;const dLa=toRad(la2-la1),dLo=toRad(lo2-lo1);const a=Math.sin(dLa/2)**2+Math.cos(toRad(la1))*Math.cos(toRad(la2))*Math.sin(dLo/2)**2;return 2*R*Math.asin(Math.sqrt(a))};
function optimize(stops){const rem=[...stops];const route=[];let cur={lat:DEPOT.lat,lng:DEPOT.lng};while(rem.length){rem.sort((a,b)=>hav(cur.lat,cur.lng,a.lat,a.lng)-hav(cur.lat,cur.lng,b.lat,b.lng));const n=rem.shift();route.push(n);cur=n;}return route}

export default function Transport(){
  const [runs,setRuns]=useState([]); const [stops,setStops]=useState(STOPS0); const [route,setRoute]=useState(STOPS0);
  const [vehicle,setVehicle]=useState('Van-1'); const [driver,setDriver]=useState('Driver A');
  const [qr,setQr]=useState('');

  useEffect(()=>{ setRuns(JSON.parse(localStorage.getItem('runs')||'[]')); },[]);
  useEffect(()=>{ localStorage.setItem('runs', JSON.stringify(runs)); },[runs]);

  const totalKm=useMemo(()=>{let km=0,cur={lat:DEPOT.lat,lng:DEPOT.lng};for(const s of route){km+=hav(cur.lat,cur.lng,s.lat,s.lng);cur=s}km+=hav(cur.lat,cur.lng,DEPOT.lat,DEPOT.lng);return Math.round(km)},[route]);

  function doOptimize(){ setRoute(optimize(stops)); }
  function importCSV(file){
    const reader=new FileReader();
    reader.onload=()=>{ const t=String(reader.result||''); const lines=t.split(/\\r?\\n/).filter(Boolean); if(!lines.length) return alert('Пустой файл');
      const H=lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,'')); const id=n=>H.findIndex(h=>h.toLowerCase()===n.toLowerCase());
      const out=[]; for(let i=1;i<lines.length;i++){ const cols=lines[i].match(/("([^"]|"")*"|[^,]+)/g)||[]; const v=j=>(cols[j]||'').replace(/^"|"$/g,'').replace(/""/g,'"');
        try{ const lat=parseFloat(v(id('lat'))), lng=parseFloat(v(id('lng'))); if(Number.isNaN(lat)||Number.isNaN(lng)) throw new Error('lat/lng?');
          out.push({ id:'ST-'+Math.random().toString(36).slice(2,8).toUpperCase(), orderId:v(id('orderId'))||'', name:v(id('name'))||'Point', address:v(id('address'))||'', cod:Number(v(id('cod'))||0), lat, lng, status:'Pending' });
        }catch(e){ /* пропускаем строку */ }
      }
      if(!out.length) return alert('Не найдено валидных строк');
      setStops(out); setRoute(out); alert('Импорт точек: '+out.length);
    };
    reader.readAsText(file);
  }

  function createRun(){
    const id='RUN-'+Math.random().toString(36).slice(2,8).toUpperCase();
    const run={ id, createdAt:new Date().toISOString(), depot:DEPOT, vehicle, driver, stops:route.map(s=>({...s,status:'Pending'})), status:'Planned' };
    setRuns(p=>[run,...p]);
    const url=`${location.origin}/courier/${id}`;
    QRCode.toDataURL(url).then(setQr);
    alert('Создан рейс '+id);
  }
  function startRun(id){ setRuns(p=>p.map(r=>r.id===id?{...r,status:'InProgress',startedAt:new Date().toISOString()}:r)); fetch('/api/webhook',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'RunStarted',runId:id})}); }
  function completeRun(id){ setRuns(p=>p.map(r=>r.id===id?{...r,status:'Completed',completedAt:new Date().toISOString()}:r)); fetch('/api/webhook',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'RunCompleted',runId:id})}); }

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Транспорт (TMS)</h1>
        <a href="/" className="btn">На главную</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="card"><div className="p-4"><div className="text-base font-semibold">Точек</div><div className="text-2xl font-semibold">{route.length}</div></div></div>
        <div className="card"><div className="p-4"><div className="text-base font-semibold">Оценка длины</div><div className="text-2xl font-semibold">{totalKm} км</div></div></div>
        <div className="card"><div className="p-4"><div className="text-base font-semibold">Машина</div>
          <select className="btn" value={vehicle} onChange={e=>setVehicle(e.target.value)}><option>Van-1</option><option>Van-2</option></select>
        </div></div>
        <div className="card"><div className="p-4"><div className="text-base font-semibold">Водитель</div>
          <select className="btn" value={driver} onChange={e=>setDriver(e.target.value)}><option>Driver A</option><option>Driver B</option></select>
        </div></div>
      </div>

      <div className="card mb-4">
        <div className="p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <button className="btn" onClick={doOptimize}>Оптимизировать</button>
            <button className="btnp" onClick={createRun}>Создать рейс</button>
            <label className="btn cursor-pointer">Импорт точек (CSV)
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={e=>e.target.files?.[0] && importCSV(e.target.files[0])}/>
            </label>
            {qr && <a className="btn" href={qr} download={`courier_qr.png`}>Скачать QR</a>}
          </div>

          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr><th className="p-3">#</th><th className="p-3">Точка</th><th className="p-3">Адрес</th><th className="p-3">Коорд.</th><th className="p-3">Заявка</th><th className="p-3">COD</th><th className="p-3">Ярлык</th></tr>
              </thead>
              <tbody>
              {route.map((s,i)=>(
                <tr key={s.id} className="border-t">
                  <td className="p-3">{i+1}</td>
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3">{s.address}</td>
                  <td className="p-3 text-gray-500">{s.lat.toFixed(3)}, {s.lng.toFixed(3)}</td>
                  <td className="p-3">{s.orderId}</td>
                  <td className="p-3">{s.cod? s.cod+' ₸':'—'}</td>
                  <td className="p-3"><a className="btn" href={`/label/${s.orderId}`} target="_blank">Печать</a></td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4">
          <div className="text-base font-semibold mb-2">Рейсы</div>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-left text-gray-600">
              <tr><th className="p-3">Рейс</th><th className="p-3">Создан</th><th className="p-3">Водитель</th><th className="p-3">Машина</th><th className="p-3">Статус</th><th className="p-3">Точек</th><th className="p-3">Действия</th></tr>
              </thead>
              <tbody>
              {runs.map(r=>(
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-medium">{r.id}</td>
                  <td className="p-3 text-gray-500">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-3">{r.driver}</td>
                  <td className="p-3">{r.vehicle}</td>
                  <td className="p-3"><span className="chip">{r.status}</span></td>
                  <td className="p-3">{(r.stops||[]).length}</td>
                  <td className="p-3 flex gap-2">
                    <a className="btn" href={`/courier/${r.id}`} target="_blank">Курьеру</a>
                    {r.status!=='InProgress' && <button className="btn" onClick={()=>startRun(r.id)}>Старт</button>}
                    {r.status==='InProgress' && <button className="btn" onClick={()=>completeRun(r.id)}>Завершить</button>}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

