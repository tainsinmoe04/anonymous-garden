# Telegram notification ချိတ်နည်း

ပုံမှန် Bot API notification အတွက် paid plan မလိုပါဘူး။ ဒီ project က paid broadcast မသုံးပါဘူး။ စစ်စရာရှိကြောင်းနဲ့ Admin link ပဲပို့ပြီး ရင်ဖွင့်စာ၊ အားပေးစာ၊ private management link မပို့ပါဘူး။

1. Telegram ထဲက တရားဝင် **@BotFather** ကိုဖွင့်ပြီး `/newbot` နဲ့ ဒီ project အတွက် bot သီးသန့်တစ်ခု ဖန်တီးပါ။ ပေးလာတဲ့ token ကို လုံခြုံစွာ သိမ်းပါ။ ChatGPT chat ထဲ မပို့ပါနဲ့။
2. ဖန်တီးထားတဲ့ ကိုယ့် bot ကိုဖွင့်ပြီး **Start** နှိပ်ပါ၊ သို့မဟုတ် `/start` ပို့ပါ။
3. ဒီ project folder ရဲ့ terminal မှာ `npm run telegram:setup` လုပ်ပါ။
4. Token ကို terminal ထဲမှာပဲ ဖြည့်ပါ။ ရိုက်ထားတဲ့ token ကို screen ပေါ် မပြပါဘူး။
5. ပြထားတဲ့ private chat စာရင်းထဲက **ကိုယ့် chat** နံပါတ်ကို ရွေးပါ။ Chat ID ရှာပေးတဲ့ တခြား bot ဆီ မပို့ရပါဘူး။
6. မှန်ကြောင်းစစ်ပြီး `SAVE` ရိုက်ပါ။ Git မတင်တဲ့ `.env.local` ထဲမှာပဲ သိမ်းပေးပါမယ်။ Setup က notification မပို့သေးပါဘူး။
7. လက်ရှိ server ကို ရပ်ပြီး `npm run start -- -p 3001` နဲ့ ပြန်ဖွင့်ပါ။

Bot token က ရှိပြီးသား webhook နဲ့သုံးနေတယ်ဆိုရင် ဒီ project အတွက် bot သီးသန့်သစ်တစ်ခု သုံးပါ။ Setup က webhook ကို ဖျက်တာ၊ ပြောင်းတာ မလုပ်ပါဘူး။ Private chat မတွေ့ရင် ကိုယ့် bot ဆီ `/start` ထပ်ပို့ပြီး setup ပြန်လုပ်ပါ။

စစ်ရန်စာ တကယ်ရှိတဲ့အခါ notification ပို့ပါမယ်။ စောင့်နေတဲ့ notification ကို `npm run notifications:send` နဲ့လည်း ပို့စမ်းနိုင်ပါတယ်။ ငါးမိနစ်အတွင်း ထပ်ခါထပ်ခါ မပို့အောင် ထိန်းထားပါတယ်။ ပို့မရရင် outbox မှာ ပြန်စမ်းဖို့ ကျန်ပါတယ်။ GARDEN_NOTIFICATION_WORKER=1 ဖြစ်ရင် local server ဖွင့်ထားသရွေ့ တစ်မိနစ်တစ်ခါ outbox ကို စစ်ပြီး ပို့ချိန်ရောက်တဲ့ notification ကို ပြန်စမ်းပါတယ်။ Server ပိတ်ရင် ရပ်ပါတယ်။ Admin retry နဲ့ command ကိုလည်း သုံးနိုင်ပါတယ်။

**လက်ရှိ local အဆင့်** — `127.0.0.1` Admin link က ဒီ website run ထားတဲ့စက်မှာပဲ အလုပ်လုပ်ပါတယ်။ ဖုန်းကနေ ဝင်စစ်ဖို့ secured hosting ပြီးမှ ရပါမယ်။ Telegram ချိတ်တာက website ကို အများပြည်သူဆီ ဖွင့်ပေးတာ မဟုတ်ပါဘူး။

Token ပေါက်ကြားရင် @BotFather ကနေ revoke လုပ်ပြီး setup ပြန်လုပ်ပါ။

တရားဝင်စာတမ်းများ: [Bot ဖန်တီးခြင်း](https://core.telegram.org/bots/tutorial), [Telegram Bot API](https://core.telegram.org/bots/api).
