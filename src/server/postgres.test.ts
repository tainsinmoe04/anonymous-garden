import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import type {Pool} from 'pg';
import {PostgresDatabase,initializeDatabase,postgresSql} from './database';
import {GardenStore} from './store';
import {issueSession,validSession,limited} from './security';

test('Postgres schema and complete anonymous review/edit/delete journey',async()=>{
 const native=await PGlite.create();
 const query=async(sql:string,params?:unknown[])=>{
  const results=params?await native.query(sql,params):await native.exec(sql);
  const result=Array.isArray(results)?results[results.length-1]:results;
  return {rows:result?.rows??[],rowCount:result?.affectedRows??0};
 };
 const pool={query,connect:async()=>({query,release(){}}),end:()=>native.close()};
 const db=new PostgresDatabase(pool as unknown as Pool),store=new GardenStore(db);
 try{
  await initializeDatabase(db);
  assert.equal(await store.accepting(),false);
  await db.prepare("UPDATE settings SET value='1' WHERE key='accepting'").run();
  const a=await store.create('en','daisy','A fictional peaceful walk in the morning.');
  const b=await store.create('en','lily','Another fictional peaceful walk in the morning.');
  assert.ok(a.id&&a.secret&&b.id);
  assert.equal(await store.capability(a.id,a.secret),true);
  assert.equal(await store.capability(a.id,'a'.repeat(43)),false);
  assert.equal((await store.list('en')).stories.length,2);
  const held=await store.encourage(a.id,'A fictional disclosure about abuse.');
  assert.equal(held.screening.decision,'held');
  assert.equal((await store.get(a.id)).encouragements.length,0);
  await store.moderate('encouragement',held.id!,'approve',1);
  assert.equal((await store.next('en'))?.id,b.id);
  assert.equal((await store.get(a.id)).encouragements.length,1);
  await store.edit(a.id,'A changed fictional story about an afternoon walk.','lily',1);
  await assert.rejects(()=>store.get(a.id));
  await assert.rejects(()=>store.moderate('story',a.id!,'approve',1),/version_conflict/);
  await store.moderate('story',a.id,'approve',2);
  await store.report('story',a.id,'other','fictional-session');
  assert.equal((await store.queue()).reports.length,1);
  const session=await issueSession(db,'management',3600,a.id);
  assert.equal(await validSession(db,session,'management',a.id),true);
  await limited(db,'test',1,60);
  await assert.rejects(()=>limited(db,'test',1,60),/rate_limited/);
  const lease=Date.now()+60000;
  await db.prepare("INSERT INTO settings(key,value) VALUES('notification_delivery_lease',?)").run(lease+':test');
  const acquired=await db.prepare("INSERT INTO settings(key,value) VALUES('notification_delivery_lease',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(settings.value AS INTEGER)<? RETURNING value").get((lease+1)+':other',Date.now());
  assert.equal(acquired,undefined);
  await store.remove(a.id);
  assert.equal(await validSession(db,session,'management',a.id),false);
  assert.equal((await store.queue()).reports.length,0);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM encouragements').get())?.n,0);
 }finally{await db.close();}
});
test('Postgres placeholders preserve literal question marks and escaped quotes',()=>{
 assert.equal(postgresSql("SELECT '?' AS literal,? AS value,'it''s ?' AS quoted,? AS second"),"SELECT '?' AS literal,$1 AS value,'it''s ?' AS quoted,$2 AS second");
});
