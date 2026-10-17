import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const issues:string[]=[];
for(const file of files){
 if(/(^|\/)(\.env(?!\.example$)|\.vercel\/|\.garden-data\/)|\.(sqlite|sqlite-wal|sqlite-shm|log)$/.test(file))issues.push(`${file}: private/runtime file must not be published`);
 if(!/\.(ts|tsx|js|mjs|cjs|json|md|ya?ml|txt)$/.test(file))continue;
 const content=readFileSync(file,'utf8');
 for(const [label,pattern] of [
  ['Telegram token',/\b\d{8,}:[A-Za-z0-9_-]{25,}\b/],
  ['GitHub credential',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['personal notification address',/[A-Za-z0-9._%+-]+@gmail\.com/],
 ] as const){if(pattern.test(content))issues.push(`${file}: possible ${label}`);}
}
if(issues.length){for(const issue of issues)console.error(issue);process.exitCode=1;}else console.log(`PASS: ${files.length} publishable files checked; ignored credentials, database and runtime folders excluded. No matching secret patterns found. Manual review is still required.`);
