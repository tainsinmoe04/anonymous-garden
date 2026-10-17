'use client';
import {useState} from 'react';
import type {serviceCopy} from '@/lib/service-copy';
import {gardenApi} from '@/lib/api';
type Labels=typeof serviceCopy.en;
export default function ReportForm({type,id,t}:{type:'story'|'encouragement';id:string;t:Labels}){
 const [open,setOpen]=useState(false),[sent,setSent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false),[reason,setReason]=useState('harm');
 if(sent)return <p className="notice" role="status">{t.reported}</p>;
 return <div className="report-control">{!open?<button type="button" className="text-button report-button" onClick={()=>setOpen(true)}>{t.report}</button>:<form className="report-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError(false);try{await gardenApi('reports',{method:'POST',body:{type,id,reason}});setSent(true);}catch{setError(true);}finally{setBusy(false);}}}><label className="field-label" htmlFor={`report-${id}`}>{t.reportReason}</label><select id={`report-${id}`} value={reason} onChange={e=>setReason(e.target.value)}><option value="harm">{t.reportHarm}</option><option value="harassment">{t.reportAbuse}</option><option value="personal_information">{t.reportPrivacy}</option><option value="spam">{t.reportSpam}</option><option value="other">{t.reportOther}</option></select><div className="inline-actions"><button className="small-button" disabled={busy}>{t.reportSubmit}</button><button type="button" className="text-button" onClick={()=>setOpen(false)}>{t.cancelReport}</button></div>{error?<p role="alert" className="notice">{t.error}</p>:null}</form>}</div>;
}
