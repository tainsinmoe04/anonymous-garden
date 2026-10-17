import {existsSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {database,initializeDatabase} from '../src/server/database';
import {hashPassword,token} from '../src/server/security';
async function main(){
 const index=process.argv.indexOf('--env-file');
 if(index>=0)process.loadEnvFile(process.argv[index+1]);
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL must be configured privately before hosted initialization.');
 if(!existsSync('.vercel/project.json'))throw new Error('Link the intended Vercel project before initializing its database.');
 const linkage=JSON.parse(readFileSync('.vercel/project.json','utf8'));if(!linkage.projectId||!linkage.orgId)throw new Error('Invalid Vercel project linkage.');
 const db=await database();
 try{
  if(db.dialect!=='postgres')throw new Error('Hosted initialization requires PostgreSQL.');
  await initializeDatabase(db);
  if(await db.prepare("SELECT value FROM settings WHERE key='moderator_password'").get()){console.log('Schema verified; existing moderator password preserved.');return;}
  const password=token();
  await db.prepare("INSERT INTO settings VALUES('moderator_password',?)").run(hashPassword(password));
  mkdirSync('.garden-data',{recursive:true});
  writeFileSync('.garden-data/hosted-admin-login.txt',`HOSTED ADMIN — do not share or commit\nAdmin URL: ${process.env.GARDEN_ORIGIN??'(set GARDEN_ORIGIN)'}/admin\nPassword: ${password}\nSave securely. New hosted submissions are initially paused.\n`,{mode:0o600});
  console.log('Hosted schema initialized. Moderator password saved privately in .garden-data/hosted-admin-login.txt; submissions paused. No local stories were uploaded.');
 }finally{await db.close();}
}
void main().catch(()=>{console.error('Hosted initialization failed. Check private database credentials and Vercel linkage; no secrets logged.');process.exitCode=1;});
