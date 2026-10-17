import test from 'node:test';
import assert from 'node:assert/strict';
import {localRequest,sameOrigin} from './security';
test('hosted API requires one explicit HTTPS origin and rejects cross-origin mutations',()=>{
 const previous={mode:process.env.GARDEN_DEPLOYMENT_MODE,origin:process.env.GARDEN_ORIGIN};
 try{
  process.env.GARDEN_DEPLOYMENT_MODE='hosted';process.env.GARDEN_ORIGIN='https://garden.example';
  const good=new Request('https://garden.example/api/garden/stories',{method:'POST',headers:{host:'garden.example',origin:'https://garden.example','sec-fetch-site':'same-origin'}});
  assert.doesNotThrow(()=>sameOrigin(good));
  assert.throws(()=>localRequest(new Request('https://attacker.example/api/garden/state')),/origin_not_allowed/);
  assert.throws(()=>sameOrigin(new Request('https://garden.example/api/garden/stories',{method:'POST',headers:{host:'garden.example',origin:'https://attacker.example'}})),/origin_not_allowed/);
  process.env.GARDEN_ORIGIN='http://garden.example';
  assert.throws(()=>localRequest(good),/deployment_not_configured/);
  delete process.env.GARDEN_ORIGIN;
  assert.throws(()=>localRequest(good),/deployment_not_configured/);
 }finally{if(previous.mode===undefined)delete process.env.GARDEN_DEPLOYMENT_MODE;else process.env.GARDEN_DEPLOYMENT_MODE=previous.mode;if(previous.origin===undefined)delete process.env.GARDEN_ORIGIN;else process.env.GARDEN_ORIGIN=previous.origin;}
});
