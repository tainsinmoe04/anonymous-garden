export type Decision = 'approved' | 'held' | 'rejected';
export interface Screening { decision: Decision; flags: string[]; crisis: boolean; }

// A review aid, never a complete safety classifier. Version with the policy.
export const POLICY_VERSION = 'local-rules-2026-10-16-v1';
const reviewRules: [string, RegExp][] = [
 ['harm', /\b(kill|suicid\w*|self[ -]?harm|overdose|murder|shoot|stab|hang myself|end my life|hurt (myself|yourself))\b|သတ်သေ|ကိုယ့်ကိုယ်ကို.{0,12}ထိခိုက်|ကိုယ့်အသက်|သတ်ပစ်|သေလိုက်|သေချင်|မနေချင်တော့|သတ်မယ်|သတ်ပေး/iu],
 ['abuse_or_trauma', /\b(rape|raped|sexual assault|molest\w*|abuse|abused|trauma|incest|exploitat\w*)\b|မုဒိမ်း|အဓမ္မ|လိင်ပိုင်း|အနိုင်ကျင့်|နှိပ်စက်|အကြမ်းဖက်|စော်ကား/iu],
 ['harassment', /\b(fuck\w*|shit|bitch\w*|cunt\w*|nigger\w*|faggot\w*|worthless|idiot|retard\w*|hate you)\b|မအေလိုး|မင်းအမေ|လီး|စောက်|ကောင်မ|ခွေးမ|သောက်ရူး/iu],
 ['sexual_content', /\b(porn\w*|nudes?|naked|sexual|sex|minor|underage|child)\b|လိင်ဆက်ဆံ|အပြာကား|ဝတ်လစ်|ကလေး/iu],
 ['sensitive_health', /\b(depress\w*|panic attack|eating disorder|anorexi\w*)\b|စိတ်ကျရောဂါ|စိတ်ကျန်းမာရေး|အစာမစား/iu],
 ['possible_location', /\b(my address|i live at|street|avenue|apartment|social handle)\b|လိပ်စာ|အိမ်အမှတ်|လမ်းအမှတ်|ရပ်ကွက်|ကျေးရွာ/iu],
 ['risky_advice_or_solicitation', /\b(medication|diagnos\w*|stop (your |taking )?medic\w*|send (me )?money|bank transfer|crypto|kys|stfu)\b|ဆေးမသောက်|ငွေလွှဲ|ပိုက်ဆံပို့|သေသင့်/iu],
];
export function normalizedText(body: string) {
 return body.normalize('NFKC').replace(/[၀-၉]/g, d=>String(d.charCodeAt(0)-0x1040)).replace(/[\u200B-\u200D\uFEFF]/g,'').toLowerCase();
}
export function screenContent(body:string,kind:'story'|'encouragement',additionalTerms:string[]=[]):Screening{
 if(!body.isWellFormed()||/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(body))return {decision:'rejected',flags:['invalid_encoding'],crisis:false};
 const text=normalizedText(body);const flags:string[]=[];
 if(body.trim().length<(kind==='story'?10:3)||body.length>(kind==='story'?2000:500))return {decision:'rejected',flags:['length'],crisis:false};
 const crisis=reviewRules[0][1].test(text);
 if(/[\w.+-]+\s*@\s*[\w.-]+\.[a-z]{2,}|(?:\+?\d[\s().-]?){8,}|https?:\/\/|www\.|(?:^|\s)@[\p{L}\p{N}_]{3,}/iu.test(text))return {decision:'rejected',flags:['identifying_or_link'],crisis};
 if(/<\s*(?:script|iframe|object)|\u0000|(.)\1{18,}/iu.test(text))return {decision:'rejected',flags:['spam_or_invalid'],crisis};
 for(const [flag,pattern] of reviewRules)if(pattern.test(text))flags.push(flag);
 if(/[\u202A-\u202E\u2066-\u2069\u200B-\u200D\uFEFF]/u.test(body))flags.push('obfuscation_or_formatting');
 // Inspect spaced-out English words without collapsing meaningful Burmese spacing.
 const compact=text.replace(/[^a-z]/g,'');
 if(/killyourself|gokillyourself|ihateyou|fuckyou|suicide/.test(compact)&&!flags.includes('harm'))flags.push('obfuscated_harm_or_abuse');
 if(additionalTerms.some(term=>text.includes(normalizedText(term))))flags.push('custom_review_term');
 return {decision:flags.length?'held':'approved',flags,crisis};
}
