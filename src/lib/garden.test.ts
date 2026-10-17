import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseStory, demoScreen, seeds } from './garden';
test('selection prioritizes zero approved responses and rotates fairly within language',()=>{
 const picks=Array.from({length:3},(_,i)=>chooseStory(seeds,'my',i)!);
 assert.equal(new Set(picks.map(s=>s.id)).size,3);
 assert.ok(picks.every(s=>s.language==='my'&&s.encouragements.length===0));
});
test('pending and deleted material never enters public selection',()=>{
 const stories=seeds.map(s=>({...s,status:'held' as const}));
 assert.equal(chooseStory(stories,'en',0),undefined);
 assert.equal(chooseStory([{...seeds[0],status:'deleted'}],'my',0),undefined);
});
test('lower approved counts are preferred once zero-response stories are absent',()=>{
 const stories=seeds.filter(s=>s.language==='en').map((s,i)=>({...s,encouragements:Array(i+1).fill('Kind words')}));
 const picks=Array.from({length:15},(_,i)=>chooseStory(stories,'en',i)?.id);
 assert.ok(picks.filter(id=>id===stories[0].id).length>picks.filter(id=>id===stories[4].id).length);
 assert.equal(new Set(picks).size,5);
});
test('sensitive disclosures are held rather than keyword rejected; no automatic approval',()=>{
 for(const body of ['I survived abuse and feel sad.','စိတ်ပင်ပန်းနေတယ်။','Thank you for sharing.']) assert.equal(demoScreen(body).outcome,'held');
 assert.deepEqual(demoScreen('Email me at example@example.com'),{outcome:'rejected',reason:'private'});
});
