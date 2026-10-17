import {AsyncLocalStorage} from 'node:async_hooks';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {Pool,types,type PoolClient} from 'pg';
import {POSTGRES_SCHEMA,SQLITE_SCHEMA} from './schema';
import type {DatabaseSync,SQLInputValue} from 'node:sqlite';
export type Row=Record<string,string|number|null>;
type Result={rows:Row[];changes:number};
export interface GardenDatabase{
 dialect:'sqlite'|'postgres';
 prepare(sql:string):{get(...args:unknown[]):Promise<Row|undefined>;all(...args:unknown[]):Promise<Row[]>;run(...args:unknown[]):Promise<{changes:number}>};
 exec(sql:string):Promise<void>;
 transact<T>(action:()=>Promise<T>):Promise<T>;
 close():Promise<void>;
}
// Only SQL placeholders outside quoted literals are translated.
export function postgresSql(sql:string){let quoted=false,index=0,result='';for(let i=0;i<sql.length;i++){const c=sql[i];if(c==="'"){if(quoted&&sql[i+1]==="'"){result+="''";i++;continue;}quoted=!quoted;}result+=c==='?'&&!quoted?`$${++index}`:c;}return result.replace(/CAST\(settings.value AS INTEGER\)/g,"CAST(split_part(settings.value, ':', 1) AS BIGINT)");}
function statements(query:(sql:string,args:unknown[])=>Promise<Result>,sql:string){return {get:async(...args:unknown[])=>(await query(sql,args)).rows[0],all:async(...args:unknown[])=>(await query(sql,args)).rows,run:async(...args:unknown[])=>({changes:(await query(sql,args)).changes})};}
class SqliteDatabase implements GardenDatabase{
 dialect='sqlite' as const;
 private ownership=new AsyncLocalStorage<boolean>();
 private tail:Promise<unknown>=Promise.resolve();
 constructor(private native:DatabaseSync){}
 private async exclusive<T>(action:()=>Promise<T>){if(this.ownership.getStore())return action();const previous=this.tail;let release!:()=>void;this.tail=new Promise<void>(r=>{release=r;});await previous;try{return await this.ownership.run(true,action);}finally{release();}}
 prepare(sql:string){return statements(async(statement,args)=>this.exclusive(async()=>{const prepared=this.native.prepare(statement);if(/^\s*(SELECT|WITH)|\bRETURNING\b/i.test(statement)){const rows=prepared.all(...args as SQLInputValue[]) as Row[];return {rows,changes:rows.length};}const result=prepared.run(...args as SQLInputValue[]);return {rows:[],changes:Number(result.changes)};}),sql);}
 async exec(sql:string){await this.exclusive(async()=>{this.native.exec(sql);});}
 async transact<T>(action:()=>Promise<T>){return this.exclusive(async()=>{this.native.exec('BEGIN IMMEDIATE');try{const value=await action();this.native.exec('COMMIT');return value;}catch(error){this.native.exec('ROLLBACK');throw error;}});}
 async close(){await this.exclusive(async()=>{this.native.close();});}
}
export class PostgresDatabase implements GardenDatabase{
 dialect='postgres' as const;
 private context=new AsyncLocalStorage<PoolClient>();
 constructor(private pool:Pool){}
 prepare(sql:string){return statements(async(statement,args)=>{const result=await (this.context.getStore()??this.pool).query(postgresSql(statement),args);return {rows:result.rows,changes:result.rowCount??0};},sql);}
 async exec(sql:string){if(/^PRAGMA/i.test(sql))return;await (this.context.getStore()??this.pool).query(sql);}
 async transact<T>(action:()=>Promise<T>){if(this.context.getStore())return action();const client=await this.pool.connect();try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(1729031701)');const result=await this.context.run(client,action);await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
 async close(){await this.pool.end();}
}
export async function openDatabase(filename=process.env.DATABASE_URL||process.env.GARDEN_DB_PATH||path.join(process.cwd(),'.garden-data','garden.sqlite')):Promise<GardenDatabase>{
 if(/^postgres(ql)?:\/\//.test(filename)){
  const url=new URL(filename);if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)){
   // Verify the database certificate; never inherit a weaker sslmode=require setting.
   for(const key of ['sslmode','sslcert','sslkey','sslrootcert'])url.searchParams.delete(key);
  }
  types.setTypeParser(20,value=>Number(value));
  const remote=!['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  const db=new PostgresDatabase(new Pool({connectionString:url.toString(),max:4,connectionTimeoutMillis:10000,idleTimeoutMillis:10000,ssl:remote?{rejectUnauthorized:true}:undefined}));
  return db;
 }
 if(process.env.VERCEL)throw new Error('Persistent DATABASE_URL is required on Vercel; local SQLite is disabled.');
 if(filename!==':memory:')mkdirSync(path.dirname(filename),{recursive:true,mode:0o700});
 const {DatabaseSync}=await import('node:sqlite');const db=new SqliteDatabase(new DatabaseSync(filename,{timeout:5000}));await db.exec(SQLITE_SCHEMA);return db;
}
let singleton:Promise<GardenDatabase>|undefined;
export function database(){return singleton??=openDatabase();}
export async function initializeDatabase(db:GardenDatabase){await db.exec(db.dialect==='postgres'?POSTGRES_SCHEMA:SQLITE_SCHEMA);}
export async function transaction<T>(db:GardenDatabase,action:()=>Promise<T>){return db.transact(action);}
