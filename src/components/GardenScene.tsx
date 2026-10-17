'use client';
import {Canvas,useFrame,useLoader,useThree} from '@react-three/fiber';
import {Component,Suspense,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import * as THREE from 'three';

// Layered 2.5D botanical cutouts preserve the concept's photographic detail.
// These are curved textured meshes, not fully sculpted flower models.
const vertexShader=`
uniform float uTime;
uniform float uPhase;
uniform float uSway;
varying vec2 vUv;
void main(){
 vUv=uv;
 vec3 p=position;
 float anchor=pow(uv.y,1.7);
 p.x+=sin(uTime*.8+uPhase+uv.y*1.2)*uSway*anchor;
 p.z+=sin(uv.x*3.14159)*.12+cos(uTime*.65+uPhase)*.045*anchor;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;
const fragmentShader=`
uniform sampler2D uTexture;
uniform float uDistance;
varying vec2 vUv;
void main(){
 vec4 c=texture2D(uTexture,vUv);
 if(c.a<.025)discard;
 c.rgb=mix(c.rgb,vec3(.78,.86,.87),uDistance*.035);
 gl_FragColor=c;
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
function FlowerLayer({index,paused,onSelect,distant=false}:{index:number;paused:boolean;onSelect:(point:{x:number;y:number})=>void;distant?:boolean}){
 const texture=useLoader(THREE.TextureLoader,'/flowers.webp');
 const {viewport}=useThree();
 const clock=useRef(0);
 const material=useMemo(()=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;return new THREE.ShaderMaterial({uniforms:{uTexture:{value:texture},uTime:{value:0},uPhase:{value:index*2.4},uSway:{value:distant?.095:.18},uDistance:{value:distant?1:0}},vertexShader,fragmentShader,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});},[texture,index,distant]);
 useEffect(()=>()=>material.dispose(),[material]);
 useFrame((_,delta)=>{if(!paused){clock.current+=Math.min(delta,.05);material.uniforms.uTime.value=clock.current;}});
 const mobile=viewport.aspect<1;
 const row=Math.floor(index/(mobile?9:16));
 const size=distant?viewport.height*(.09+(index%4)*.018+row*.045):(mobile?viewport.width*.74:viewport.height*.64);
 const count=mobile?9:16;
 const x=distant?viewport.width*(((index%count)+.3+(row%2)*.38)/count-.5):(index===0?-viewport.width*.44:index===1?viewport.width*.43:viewport.width*.06);
 const y=distant?-viewport.height*(.165+row*.105+(index%3)*.012):-viewport.height*.5+size*(index===2?.15:.27);
 return <mesh position={[x,y,distant?-.5-index*.01:index*.05]} rotation={[0,index===1?-.05:.05,index===0?-.1:.1]} scale={[index%2?-1:1,1,1]} material={material} onClick={e=>{e.stopPropagation();onSelect({x:e.point.x,y:e.point.y});}} onPointerOver={()=>{document.body.style.cursor='pointer';}} onPointerOut={()=>{document.body.style.cursor='';}}><planeGeometry args={[size,size,distant?8:18,distant?10:22]}/></mesh>;
}
function DistantFlowers({paused,onSelect}:{paused:boolean;onSelect:(point:{x:number;y:number})=>void}){
 const {viewport}=useThree();
 return <>{Array.from({length:viewport.aspect<1?18:32},(_,index)=><FlowerLayer key={index} index={index} distant paused={paused} onSelect={onSelect}/>)}</>;
}
type LightTouch={x:number;y:number;serial:number};
// A single point cloud follows the same botanical layers; no separate flower models.
function GardenLights({paused,touch,celebrating}:{paused:boolean;touch:LightTouch|null;celebrating:boolean}){
 const {viewport}=useThree();
 const points=useRef<THREE.Points>(null);
 const time=useRef(0);
 const burst=useRef(0);
 const lastTouch=useRef(-1);
 const positions=useMemo(()=>new Float32Array(120*3),[]);
 const material=useMemo(()=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uPixelRatio:{value:1}},vertexShader:'uniform float uPixelRatio;varying float vGlow;void main(){vGlow=.7+.3*sin(position.x*12.+position.y*8.);gl_PointSize=(4.+3.*vGlow)*uPixelRatio;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying float vGlow;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float a=pow(1.-d,2.);gl_FragColor=vec4(1.,.9,.65,a*vGlow);}' }),[]);
 useEffect(()=>()=>material.dispose(),[material]);
 useFrame((state,delta)=>{
  if(!points.current)return;
  if(!paused)time.current+=Math.min(delta,.05);
  if(touch&&lastTouch.current!==touch.serial){lastTouch.current=touch.serial;burst.current=1;}
  if(!paused)burst.current=Math.max(0,burst.current-Math.min(delta,.05)/5);
  const mobile=viewport.aspect<1;
  const ambient=mobile?54:84;
  for(let i=0;i<ambient;i++){
   const near=i%3===0;
   const j=i% (mobile?18:32),columns=mobile?9:16,row=Math.floor(j/columns);
   const size=near?(mobile?viewport.width*.74:viewport.height*.64):viewport.height*(.09+(j%4)*.018+row*.045);
   const nearIndex=Math.floor(i/3)%3;
   const x=near?(nearIndex===0?-viewport.width*.44:nearIndex===1?viewport.width*.43:viewport.width*.06):viewport.width*(((j%columns)+.3+(row%2)*.38)/columns-.5);
   const y=near?-viewport.height*.5+size*(nearIndex===2?.15:.27):-viewport.height*(.165+row*.105+(j%3)*.012);
   const angle=i*2.39996+time.current*(.18+(i%4)*.035);
   // Follow the wind and orbit among the flowers, rather than around fixed dots.
   positions[i*3]=x+Math.cos(angle)*size*(near?.3:.36)+Math.sin(time.current*.8+j*2.4)*.045;
   positions[i*3+1]=y+size*(.08+Math.sin(angle*.7+i)*.28);
   positions[i*3+2]=1;
  }
  const strength=celebrating?Math.max(.45,burst.current):burst.current;
  const extra=touch?Math.round(30*strength):0;
  for(let i=0;i<extra;i++){
   const angle=i*2.39996+time.current*.65;
   const radius=viewport.height*(.008+(i%6)*.004)*(1.5-strength*.6);
   const offset=(ambient+i)*3;
   positions[offset]=touch!.x+Math.cos(angle)*radius;
   positions[offset+1]=touch!.y+Math.sin(angle)*radius*.75;
   positions[offset+2]=1.1;
  }
  points.current.geometry.attributes.position.needsUpdate=true;
  points.current.geometry.setDrawRange(0,ambient+extra);
  material.uniforms.uPixelRatio.value=Math.min(state.gl.getPixelRatio(),2);
 });
 return <points ref={points} material={material} frustumCulled={false} raycast={()=>{}}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry></points>;
}
function GardenLayers({paused,touch,onTouch,celebrating,reactionSignal}:{paused:boolean;touch:LightTouch|null;onTouch:(point:{x:number;y:number})=>void;celebrating:boolean;reactionSignal:number}){
 const {viewport}=useThree();
 useEffect(()=>{if(reactionSignal>0)onTouch({x:viewport.width*.06,y:-viewport.height*.26});},[reactionSignal]);
 return <><DistantFlowers paused={paused} onSelect={onTouch}/>{[0,1,2].map(index=><FlowerLayer key={index} index={index} paused={paused} onSelect={onTouch}/>)}<GardenLights paused={paused} touch={touch} celebrating={celebrating}/></>;
}
class SceneBoundary extends Component<{children:ReactNode;onFallback:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.onFallback();}render(){return this.state.failed?null:this.props.children;}}
export default function GardenScene({paused,reactionSignal,celebrating,onFallback}:{paused:boolean;reactionSignal:number;celebrating:boolean;onFallback:()=>void}){
 const [supported,setSupported]=useState(true);
 const [touch,setTouch]=useState<LightTouch|null>(null);
 const lightTouch=(point:{x:number;y:number})=>setTouch(previous=>({...point,serial:(previous?.serial??0)+1}));
 useEffect(()=>{const canvas=document.createElement('canvas');const gl=canvas.getContext('webgl2');if(!gl){setSupported(false);onFallback();}else gl.getExtension('WEBGL_lose_context')?.loseContext();},[]);
 if(!supported)return null;
 return <SceneBoundary onFallback={onFallback}><Canvas orthographic camera={{position:[0,0,10],zoom:90,near:.1,far:30}} dpr={[1,2]} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} frameloop={paused?'demand':'always'} onCreated={({gl})=>{gl.setClearColor(0x000000,0);gl.domElement.addEventListener('webglcontextlost',(event)=>{event.preventDefault();setSupported(false);onFallback();},{once:true});}}><Suspense fallback={null}><GardenLayers paused={paused} touch={touch} onTouch={lightTouch} celebrating={celebrating} reactionSignal={reactionSignal}/></Suspense></Canvas></SceneBoundary>;
}
