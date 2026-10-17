'use client';
import {useState} from 'react';
import type {Story} from '@/lib/garden';
import type {serviceCopy} from '@/lib/service-copy';
import FlowerIcon from './FlowerIcon';
import ReportForm from './ReportForm';
export default function StoryContent({story,t}:{story:Story;t:typeof serviceCopy.en}){
 const [revealed,setRevealed]=useState(false);const sensitive=!!story.contentWarnings?.length;
 if(sensitive&&!revealed)return <><div className="story-meta"><FlowerIcon type={story.flower} size={38}/><span>{story.isSeed?t.fictional:t.sampleStory}</span></div><div className="notice"><p>{t.sensitive}</p><button className="small-button" onClick={()=>setRevealed(true)}>{t.reveal}</button></div><ReportForm type="story" id={story.id} t={t}/></>;
 return <><div className="story-meta"><FlowerIcon type={story.flower} size={38}/><span>{story.isSeed?t.fictional:t.sampleStory}</span></div>{sensitive&&!revealed?<div className="notice"><p>{t.sensitive}</p><button className="small-button" onClick={()=>setRevealed(true)}>{t.reveal}</button></div>:<p className="story-body">{story.body}</p>}<ReportForm type="story" id={story.id} t={t}/><div className="encouragement"><h3>{t.kindWords}</h3>{story.encouragements.length?story.encouragements.map((body,i)=><div key={story.messages?.[i]?.id??i}><p className="kind-word">{body}</p>{story.messages?.[i]?<ReportForm type="encouragement" id={story.messages[i].id} t={t}/>:null}</div>):<p className="hint">{t.noWords}</p>}</div></>;
}
