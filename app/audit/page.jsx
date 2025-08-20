'use client';
import { useEffect, useMemo, useState } from 'react';

export default function AuditPage(){
  const [log,setLog]=useState([]);
  const [q,setQ]=useState('');
  useEffect(()=>{ setLog(JSON.parse(localStorage.getItem('audit')||'[]')); },[]);
  const filtered = useMemo(()=>{
    const s=q.trim().toLowerCase();
    return log
      .filter(e => !s || JSON.stringify(e).toLowerCase().includes(s))
      .sort((a,b)=> +new Date(b.ts) - +new Date(a.ts));
  },[log,q]);
  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">Audit</h1>
        <a href="/" className="btn">← На главную</a>
      </div>
      <input className="btn w-full mb-3" value={q} onChange={e=>setQ(e.target.value)} placeholder="Поиск по действиям"/>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50 text-left text-gray-600">
          <tr><th className="p-3">Время</th><th className="p-3">Событие</th><th className="p-3">Детали</th></tr>
          </thead>
          <tbody>
          {filtered.map((e,i)=>(
            <tr key={i} className="border-t">
              <td className="p-3 text-gray-500">{new Date(e.ts).toLocaleString()}</td>
              <td className="p-3 font-medium">{e.action}</td>
              <td className="p-3 text-gray-600">{e.message}</td>
            </tr>
          ))}
          {!filtered.length && <tr><td className="p-3 text-gray-500" colSpan={3}>Пусто</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-3">Хранение: localStorage браузера.</p>
    </div>
  );
}
