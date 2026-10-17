import test from 'node:test';
import assert from 'node:assert/strict';
import {screenContent} from './moderation';
test('English/Myanmar disclosures are held, not indiscriminately rejected',()=>{
 for(const s of ['I was abused and I need someone to listen.','မုဒိမ်းမှုကြောင့် စိတ်ထိခိုက်နေပါတယ်။','Sometimes I feel suicidal but I want support.'])assert.equal(screenContent(s,'story').decision,'held');
});
test('directed harm, hostile phrases and common obfuscations require review',()=>{
 for(const s of ['Go kill yourself','you are a bitch','k i l l y o u r s e l f','မင်းကို သတ်ပစ်မယ်','မအေလိုး'])assert.equal(screenContent(s,'encouragement').decision,'held',s);
});
test('PII, Myanmar phone digits, URLs and scripts are not stored for publication',()=>{
 for(const s of ['Call ၀၉၁၂၃၄၅၆၇၈၉','Mail a@example.com','Try https://example.com','<script>alert(1)</script>'])assert.equal(screenContent(s,'story').decision,'rejected');
});
test('unflagged kindness can be approved by configured rules without claiming semantic safety',()=>{
 assert.equal(screenContent('Thank you for sharing. I am listening.','encouragement').decision,'approved');
 assert.equal(screenContent('မင်းပြောတာကို နားထောင်ပေးနေပါတယ်။','encouragement').decision,'approved');
});
test('malformed Unicode and control characters are rejected without crashing normalization',()=>{assert.equal(screenContent('Invalid \ud800 fictional text','story').decision,'rejected');assert.equal(screenContent('Invalid \u0001 fictional text','story').decision,'rejected');});
