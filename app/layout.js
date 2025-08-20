'use client';
import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export default function Label({ params }){
  const id = params.id.replace(/[^A-Z0-9-]/gi,'').toUpperCase();
  const dt = new Date().toLocaleString();
  const svgRef = useRef(null);
  const [qr, setQr] = useState('');
  useEffect(()=>{
    try{ JsBarcode(svgRef.current, id, { format:'code128', width:2, height:60, displayValue:true }); }catch{}
    QRCode.toDataURL(`${location.origin}/orders?q=${id}`).then(setQr);
  },[id]);

  return (
    <div className="p-6" style={{width:'420px'}}>
      <div className="border-2 border-black p-3">
        <div className="text-2xl font-bold">SHIP LABEL</div>
        <div className="text-sm text-gray-600">Demo — печать Ctrl+P</div>

        <div className="mt-3 text-lg font-semibold">Order: {id}</div>
        <div className="text-sm">Generated: {dt}</div>

        <div className="mt-4">{/* barcode */}<svg ref={svgRef}></svg></div>

        <div className="mt-3 border border-dashed p-2 text-center">
          <div className="text-xs text-gray-500">QR: быстрый переход к поиску заказа</div>
          {qr && <img src={qr} alt="QR" className="mx-auto w-32 h-32" />}
        </div>

        <div className="mt-3 text-sm">From: ALA-DC1 (Almaty)</div>
        <div className="text-sm">To: Receiver (demo)</div>
      </div>
    </div>
  );
}

