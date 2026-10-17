'use client';
import {useEffect,useRef} from 'react';
export default function Sheet({title,closeLabel,onClose,children,compact=false}:{title:string;closeLabel:string;onClose:()=>void;children:React.ReactNode;compact?:boolean}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current!;dialog.showModal();return()=>dialog.close();},[]);
 return <dialog ref={ref} className={`sheet ${compact?'compact':''}`} aria-labelledby="sheet-title" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}>
  <div className="sheet-top"><span className="sheet-rule"/><button className="icon-button" aria-label={closeLabel} onClick={onClose}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg></button></div>
  <div className="sheet-content"><h2 id="sheet-title">{title}</h2>{children}</div>
 </dialog>;
}
