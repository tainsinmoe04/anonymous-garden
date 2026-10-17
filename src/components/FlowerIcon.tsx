import type { FlowerType } from '@/lib/garden';
export default function FlowerIcon({type='daisy',size=30}:{type?:FlowerType;size?:number}){
 const color={lily:'#eee9d7',daisy:'#fffdf1',forget:'#7daee5',lavender:'#a38ac5',camellia:'#e5a7b8'}[type];
 const n=type==='daisy'?11:type==='lily'?6:5;
 return <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 23C19 29 22 33 19 38M20 32C11 31 10 27 10 25C16 25 19 28 20 32ZM21 29C26 29 30 24 29 22C24 23 22 26 21 29Z" stroke="#547b57" strokeWidth="1.3" fill="#78976a"/>{Array.from({length:n},(_,i)=><ellipse key={i} cx="20" cy="10" rx={type==='lily'?4:4.4} ry="8" fill={color} stroke="#405f541c" strokeWidth=".6" transform={`rotate(${i*360/n} 20 17)`}/>)}<circle cx="20" cy="17" r={type==='daisy'?4:2.8} fill="#e7b753"/></svg>;
}
