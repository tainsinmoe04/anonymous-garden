export type Language = 'my' | 'en';
export type FlowerType = 'lily' | 'daisy' | 'forget' | 'lavender' | 'camellia';
export type Outcome = 'held' | 'rejected' | 'approved';
export interface Story { id: string; language: Language; flower: FlowerType; body: string; encouragements: string[]; status: 'approved' | 'held' | 'deleted' | 'rejected'; messages?:{id:string;body:string}[];contentWarnings?:string[];version?:number;isSeed?:boolean; }
export const flowers: {type: FlowerType; color: string; en: string; my: string; meaning: [string,string]}[] = [
 {type:'lily',color:'#eee9cf',en:'Lily',my:'လီလီ',meaning:['Healing, renewal','သက်သာခြင်း၊ အသစ်ပြန်စခြင်း']},
 {type:'daisy',color:'#e8ba4d',en:'Daisy',my:'ဒေစီ',meaning:['New beginnings','အစသစ်များ']},
 {type:'forget',color:'#75b2eb',en:'Forget-Me-Not',my:'ဖော်ဂက်မီနော့',meaning:['Remembrance, being heard','သတိရခြင်း၊ နားထောင်ပေးခြင်း']},
 {type:'lavender',color:'#a18bca',en:'Lavender',my:'လာဗင်ဒါ',meaning:['Calm, devotion','အေးချမ်းခြင်း၊ စေတနာ']},
 {type:'camellia',color:'#e7a9b8',en:'Camellia',my:'ကမဲလီယာ',meaning:['Affection, admiration','မေတ္တာ၊ လေးစားခြင်း']},
];
export const seeds: Story[] = [
 {id:'blue-morning',language:'my',flower:'forget',body:'တစ်ခါတလေ ကိုယ့်စကားတွေကို နားထောင်ပေးမယ့်သူတစ်ယောက်ပဲ လိုအပ်တာပါ။ ဒီနေ့တော့ အလုပ်တွေများပြီး ပင်ပန်းနေတယ်။ အားလုံးအဆင်ပြေပါတယ်လို့ ပြောနေပေမယ့် ခဏနားချင်မိတယ်။ ဒီမှာ စာလေးရေးလိုက်ရတာ နည်းနည်းတော့ ပေါ့ပါးသွားတယ်။',encouragements:[],status:'approved'},
 {id:'small-beginning',language:'my',flower:'daisy',body:'အသစ်တစ်ခု စတင်ဖို့ ကြိုးစားနေတယ်။ အခြားသူတွေနဲ့ နှိုင်းယှဉ်မိတိုင်း ကိုယ့်ခြေလှမ်းတွေက နှေးနေသလို ခံစားရတယ်။ ဒီနေ့တော့ သေးသေးလေးပဲဖြစ်ဖြစ် ရှေ့တစ်လှမ်း တိုးနိုင်ခဲ့တယ်။',encouragements:[],status:'approved'},
 {id:'quiet-memory',language:'my',flower:'lily',body:'မတွေ့ရတော့တဲ့သူတစ်ယောက်ကို ဒီနေ့ အရမ်းသတိရနေတယ်။ အတူတူ ရယ်ခဲ့ကြတဲ့ အချိန်လေးတွေကို ပြန်တွေးမိတယ်။ အမှတ်တရတွေကို ဒီပန်းလေးနဲ့ ခဏထားခဲ့ချင်တယ်။',encouragements:['သတိရတဲ့စိတ်ကို နေရာပေးလို့ရပါတယ်။ မင်းရဲ့စာလေးကို ဖတ်ပြီး နားထောင်ပေးနေပါတယ်။'],status:'approved'},
 {id:'slow-evening',language:'my',flower:'lavender',body:'အရာအားလုံးကို အချိန်မီပြီးအောင် လုပ်နေရင်း ကိုယ့်အတွက် အချိန်မပေးဖြစ်တာ ကြာပြီ။ ဒီညတော့ ခဏနားပြီး အသက်ရှူချင်တယ်။',encouragements:['ခဏနားတာလည်း လိုအပ်တဲ့အရာပါ။ ဒီနေ့ ကြိုးစားခဲ့တာတွေကို အသိအမှတ်ပြုပေးချင်တယ်။'],status:'approved'},
 {id:'soft-heart',language:'my',flower:'camellia',body:'ကိုယ့်ကိုယ်ကို ကြင်နာဖို့ သင်ယူနေတယ်။ တချို့နေ့တွေမှာ လွယ်ပေမယ့် တချို့နေ့တွေမှာ ခက်တယ်။ နည်းနည်းချင်း ဆက်ကြိုးစားကြည့်မယ်။',encouragements:[],status:'approved'},
 {id:'room-to-breathe',language:'en',flower:'forget',body:'I have been saying “I’m fine” all week. Today I just wanted somewhere to admit that I am tired. I don’t need someone to fix everything. It helps to know that someone might read this and understand.',encouragements:[],status:'approved'},
 {id:'begin-again',language:'en',flower:'daisy',body:'I am starting something new and I keep comparing my beginning to everybody else’s middle. Today I took one small step. I am trying to let that be enough.',encouragements:[],status:'approved'},
 {id:'a-memory',language:'en',flower:'lily',body:'I miss someone today. A little everyday thing reminded me of the way we used to laugh. I wanted to leave that memory somewhere gentle.',encouragements:['Thank you for sharing this memory. There is room here for missing someone.'],status:'approved'},
 {id:'rest',language:'en',flower:'lavender',body:'It feels like there is always one more thing to finish. Tonight I am trying to give myself permission to rest, even with a few things unfinished.',encouragements:['You do not have to earn a quiet evening. I hear you.'],status:'approved'},
 {id:'kindness',language:'en',flower:'camellia',body:'I am learning to speak to myself with the kindness I would offer a friend. Some days are easier than others. I am still trying.',encouragements:[],status:'approved'},
];
// Local prototype rotation. Production must make eligibility/count changes transactional.
export function chooseStory(stories: Story[], language: Language, turn: number): Story | undefined {
 const eligible = stories.filter(s => s.status === 'approved' && s.language === language);
 if (!eligible.length) return;
 const minimum = Math.min(...eligible.map(s=>s.encouragements.length));
 // With no unheard stories, every story gets a slot, with extra slots for fewer replies.
 // This bounded cycle favors lower counts without permanently starving other stories.
 const pool=minimum===0?eligible.filter(s=>s.encouragements.length===0):eligible.flatMap(s=>Array(Math.max(1,5-(s.encouragements.length-minimum))).fill(s) as Story[]);
 return pool[((turn % pool.length)+pool.length)%pool.length];
}
// This is a transparent demonstration, not a moderation engine or safety guarantee.
// No keyword can approve text. Sensitive disclosures are never rejected for keywords.
export function demoScreen(text: string): {outcome: Outcome; reason: 'private' | 'review'} {
 const identifiers = /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\s().-]?){8,}|https?:\/\//iu;
 return identifiers.test(text) ? {outcome:'rejected', reason:'private'} : {outcome:'held', reason:'review'};
}
