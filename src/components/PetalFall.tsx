'use client';
import {useEffect,type CSSProperties} from 'react';

const petals=[
 {left:17,delay:0,drift:65,rotate:190,color:'#fff4db'},
 {left:31,delay:.65,drift:-50,rotate:-155,color:'#f4cad5'},
 {left:45,delay:.2,drift:80,rotate:240,color:'#ecf4ff'},
 {left:58,delay:1.1,drift:-70,rotate:-210,color:'#fff7e7'},
 {left:69,delay:.4,drift:50,rotate:170,color:'#eadff5'},
 {left:82,delay:.9,drift:-75,rotate:-250,color:'#f7ced8'},
 {left:38,delay:1.4,drift:55,rotate:220,color:'#fff8e8'},
];
export default function PetalFall({onDone}:{onDone:()=>void}){
 useEffect(()=>{const timeout=window.setTimeout(onDone,7600);return()=>window.clearTimeout(timeout);},[onDone]);
 return <div className="petal-fall" aria-hidden="true">{petals.map((p,i)=><span className="falling-petal" key={i} style={{left:`${p.left}%`,animationDelay:`${p.delay}s`,'--drift':`${p.drift}px`,'--turn':`${p.rotate}deg`,'--petal-color':p.color,'--petal-scale':i%3===0?.38:i%3===1?.65:1,'--landing':i%3===0?'64svh':i%3===1?'74svh':'88svh','--petal-opacity':i%3===0?.55:.9} as CSSProperties}><i/></span>)}</div>;
}
