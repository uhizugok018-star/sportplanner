"use strict";

// ============ CONSTANTS ============
const STORE_KEY = "sportplanner_v1";
const GOAL_TIME = "3:12:00";
const GOAL_PACE = "4:33";
const RACE_DATE = "2027-09-27";
const PLAN_START = "2026-09-28"; // Monday of week1

const AI_PROVIDERS = {
  openrouter: {
    name: "OpenRouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    models: [
      {id:"meta-llama/llama-3.1-8b-instruct:free",label:"Llama3.18B (рекомендуется)"},
      {id:"mistralai/mistral-7b-instruct:free",label:"Mistral7B"},
      {id:"google/gemma-2-9b-it:free",label:"Gemma29B"},
      {id:"qwen/qwen-2.5-7b-instruct:free",label:"Qwen2.57B"}
    ],
    hint: "openrouter.ai → Keys → Create Key. Бесплатные модели, без VPN, без карты.",
    keyPlaceholder: "sk-or-v1-..."
  },
  yandex: {
    name: "ЯндексGPT",
    url: "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
    models: [
      {id:"yandexgpt-lite",label:"YandexGPT Lite (быстрее)"},
      {id:"yandexgpt",label:"YandexGPT (точнее)"}
    ],
    hint: "cloud.yandex.ru → API-ключ (сервисный аккаунт). 300₽ бесплатно при регистрации.",
    keyPlaceholder: "t1.9eu... (IAM-токен)"
  }
};

const DEFAULT_SETTINGS = {
  apiKey: "", aiProvider: "openrouter", model: "meta-llama/llama-3.1-8b-instruct:free",
  yandexFolder: ""
};

// ============ TRAINING PLAN DATA ============
// Each week: {n, start, km, phase, tue, thu, sat, sun}
// Phases: base(ФБ), buildup(НК), competitive(СП), race(ПМ)
// Days: Mon=rest, Tue=quality, Wed=easy, Thu=quality, Fri=rest, Sat=quality(long/tempo), Sun=long/easy

const WEEKS = [
  // === BLOCK1: BASE (Sep28 - Nov22,9 weeks) ===
  {n:1,start:"2026-09-28",km:35,phase:"base",
   tue:{type:"fartlek",km:7,pace:"5:15",desc:"7×1мин быстро /2мин легко"},
   thu:{type:"easy",km:8,pace:"5:20"},
   sat:{type:"easy",km:8,pace:"5:20",desc:"с4 ускорениями100м"},
   sun:{type:"long",km:12,pace:"5:25-5:35"}},
  {n:2,start:"2026-10-05",km:37,phase:"base",
   tue:{type:"fartlek",km:8,pace:"5:15",desc:"8×1мин/2мин"},
   thu:{type:"tempo",km:9,pace:"4:55",desc:"3км разм+4км темп+2км зам"},
   sat:{type:"easy",km:8,pace:"5:20"},
   sun:{type:"long",km:12,pace:"5:25-5:35"}},
  {n:3,start:"2026-10-12",km:40,phase:"base",
   tue:{type:"fartlek",km:8,pace:"5:10",desc:"6×2мин/2мин"},
   thu:{type:"easy",km:9,pace:"5:15",desc:"с4×100м ускорениями"},
   sat:{type:"tempo",km:10,pace:"4:55",desc:"3км разм+5км темп+2км зам"},
   sun:{type:"long",km:13,pace:"5:20-5:30"}},
  {n:4,start:"2026-10-19",km:36,phase:"base",
   tue:{type:"easy",km:7,pace:"5:20"},
   thu:{type:"fartlek",km:8,pace:"5:10",desc:"8×1мин/2мин"},
   sat:{type:"easy",km:8,pace:"5:20"},
   sun:{type:"long",km:13,pace:"5:20-5:30"}},
  {n:5,start:"2026-10-26",km:40,phase:"base",
   tue:{type:"fartlek",km:9,pace:"5:10",desc:"5×2мин/2мин"},
   thu:{type:"tempo",km:10,pace:"4:50",desc:"3км разм+5км темп+2км зам"},
   sat:{type:"easy",km:7,pace:"5:20",desc:"с4×100м"},
   sun:{type:"long",km:14,pace:"5:15-5:25"}},
  {n:6,start:"2026-11-02",km:42,phase:"base",
   tue:{type:"fartlek",km:9,pace:"5:10",desc:"6×2мин/2мин"},
   thu:{type:"easy",km:9,pace:"5:15"},
   sat:{type:"tempo",km:10,pace:"4:50",desc:"3км разм+5км темп+2км зам"},
   sun:{type:"long",km:14,pace:"5:15-5:25"}},
  {n:7,start:"2026-11-09",km:42,phase:"base",
   tue:{type:"fartlek",km:9,pace:"5:10",desc:"7×2мин/2мин"},
   thu:{type:"easy",km:8,pace:"5:20"},
   sat:{type:"easy",km:9,pace:"5:15"},
   sun:{type:"long",km:16,pace:"5:15-5:25"}},
  {n:8,start:"2026-11-16",km:40,phase:"base",
   tue:{type:"tempo",km:10,pace:"4:50",desc:"3км разм+5км темп+2км зам"},
   thu:{type:"easy",km:8,pace:"5:20"},
   sat:{type:"fartlek",km:8,pace:"5:10",desc:"8×1мин/2мин"},
   sun:{type:"long",km:14,pace:"5:20-5:30"}},
  {n:9,start:"2026-11-23",km:42,phase:"base",
   tue:{type:"fartlek",km:9,pace:"5:05",desc:"6×2мин/90сек"},
   thu:{type:"tempo",km:10,pace:"4:45",desc:"3км разм+5км темп+2км зам"},
   sat:{type:"easy",km:7,pace:"5:20"},
   sun:{type:"long",km:16,pace:"5:10-5:25"}},

  // === BLOCK2: BUILDUP (Nov30 - Feb22,12 weeks) ===
  {n:10,start:"2026-11-30",km:44,phase:"buildup",
   tue:{type:"tempo",km:11,pace:"4:45",desc:"3км разм+6км темп+2км зам"},
   thu:{type:"easy",km:8,pace:"5:15"},
   sat:{type:"fartlek",km:9,pace:"5:05",desc:"8×2мин/90сек"},
   sun:{type:"long",km:16,pace:"5:10-5:20"}},
  {n:11,start:"2026-12-07",km:46,phase:"buildup",
   tue:{type:"intervals",km:10,pace:"4:20",desc:"2км разм+5×1км@4:20(отдых90сек)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:15"},
   sat:{type:"easy",km:9,pace:"5:15",desc:"с4×150м ускорениями"},
   sun:{type:"long",km:18,pace:"5:10-5:20"}},
  {n:12,start:"2026-12-14",km:46,phase:"buildup",
   tue:{type:"tempo",km:11,pace:"4:40",desc:"3км разм+6км темп+2км зам"},
   thu:{type:"fartlek",km:9,pace:"5:05",desc:"10×1мин/90сек"},
   sat:{type:"easy",km:8,pace:"5:20"},
   sun:{type:"long",km:18,pace:"5:10-5:20"}},
  {n:13,start:"2026-12-21",km:42,phase:"buildup",
   tue:{type:"easy",km:8,pace:"5:20"},
   thu:{type:"tempo",km:10,pace:"4:40",desc:"3км разм+5км темп+2км зам"},
   sat:{type:"easy",km:8,pace:"5:20"},
   sun:{type:"long",km:16,pace:"5:15-5:25"}},
  {n:14,start:"2026-12-28",km:46,phase:"buildup",
   tue:{type:"fartlek",km:10,pace:"5:05",desc:"8×2мин/90сек"},
   thu:{type:"easy",km:8,pace:"5:15"},
   sat:{type:"tempo",km:10,pace:"4:40",desc:"3км разм+5км темп+2км зам"},
   sun:{type:"long",km:18,pace:"5:10-5:20"}},
  {n:15,start:"2027-01-04",km:48,phase:"buildup",
   tue:{type:"intervals",km:11,pace:"4:15",desc:"2км разм+6×1км@4:15(отдых90сек)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:15"},
   sat:{type:"easy",km:8,pace:"5:15",desc:"с4×150м"},
   sun:{type:"long",km:20,pace:"5:05-5:15"}},
  {n:16,start:"2027-01-11",km:48,phase:"buildup",
   tue:{type:"tempo",km:12,pace:"4:35",desc:"3км разм+7км темп+2км зам"},
   thu:{type:"fartlek",km:9,pace:"5:00",desc:"10×1мин/90сек"},
   sat:{type:"easy",km:8,pace:"5:15"},
   sun:{type:"long",km:19,pace:"5:05-5:15"}},
  {n:17,start:"2027-01-18",km:44,phase:"buildup",
   tue:{type:"easy",km:8,pace:"5:15"},
   thu:{type:"tempo",km:10,pace:"4:40",desc:"3км разм+5км темп+2км зам"},
   sat:{type:"easy",km:8,pace:"5:15"},
   sun:{type:"long",km:18,pace:"5:10-5:20"}},
  {n:18,start:"2027-01-25",km:48,phase:"buildup",
   tue:{type:"fartlek",km:10,pace:"5:00",desc:"8×2мин/60сек"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"tempo",km:9,pace:"4:35",desc:"3км разм+4км темп+2км зам"},
   sun:{type:"long",km:20,pace:"5:00-5:15"}},
  {n:19,start:"2027-02-01",km:50,phase:"buildup",
   tue:{type:"intervals",km:11,pace:"4:10",desc:"2км разм+5×1.2км@4:10(отдых2мин)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"easy",km:9,pace:"5:10",desc:"с4×150м"},
   sun:{type:"long",km:21,pace:"5:00-5:15"}},
  {n:20,start:"2027-02-08",km:50,phase:"buildup",
   tue:{type:"tempo",km:12,pace:"4:30",desc:"3км разм+7км темп+2км зам"},
   thu:{type:"fartlek",km:9,pace:"5:00",desc:"10×1мин/60сек"},
   sat:{type:"easy",km:8,pace:"5:15"},
   sun:{type:"long",km:21,pace:"5:00-5:15"}},
  {n:21,start:"2027-02-15",km:44,phase:"buildup",
   tue:{type:"easy",km:8,pace:"5:15"},
   thu:{type:"tempo",km:10,pace:"4:35",desc:"3км разм+5км темп+2км зам"},
   sat:{type:"easy",km:8,pace:"5:15"},
   sun:{type:"long",km:18,pace:"5:05-5:15"}},

  // === BLOCK3: COMPETITIVE (Feb22 - May31,14 weeks) ===
  {n:22,start:"2027-02-22",km:50,phase:"competitive",
   tue:{type:"intervals",km:11,pace:"4:05",desc:"2км разм+6×1км@4:05(отдых90сек)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"tempo",km:10,pace:"4:30",desc:"3км разм+5км темп+2км зам"},
   sun:{type:"long",km:20,pace:"5:00-5:10"}},
  {n:23,start:"2027-03-01",km:52,phase:"competitive",
   tue:{type:"tempo",km:13,pace:"4:25",desc:"3км разм+8км темп+2км зам"},
   thu:{type:"fartlek",km:10,pace:"4:55",desc:"12×1мин/60сек"},
   sat:{type:"easy",km:8,pace:"5:10"},
   sun:{type:"long",km:21,pace:"4:55-5:10"}},
  {n:24,start:"2027-03-08",km:52,phase:"competitive",
   tue:{type:"intervals",km:12,pace:"4:00",desc:"2км разм+5×1.5км@4:00(отдых2мин)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"easy",km:9,pace:"5:10",desc:"с4×150м"},
   sun:{type:"long",km:22,pace:"4:55-5:05"}},
  {n:25,start:"2027-03-15",km:48,phase:"competitive",
   tue:{type:"easy",km:8,pace:"5:15"},
   thu:{type:"tempo",km:10,pace:"4:30",desc:"3км разм+5км темп+2км зам"},
   sat:{type:"easy",km:8,pace:"5:15"},
   sun:{type:"long",km:22,pace:"5:00-5:10"}},
  {n:26,start:"2027-03-22",km:54,phase:"competitive",
   tue:{type:"tempo",km:13,pace:"4:25",desc:"3км разм+8км темп+2км зам"},
   thu:{type:"fartlek",km:10,pace:"4:50",desc:"8×2мин/60сек"},
   sat:{type:"easy",km:9,pace:"5:10"},
   sun:{type:"long",km:22,pace:"4:55-5:05"}},
  {n:27,start:"2027-03-29",km:54,phase:"competitive",
   tue:{type:"intervals",km:12,pace:"3:55",desc:"2км разм+5×1.5км@3:55(отдых2мин)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"tempo",km:10,pace:"4:25",desc:"3км разм+5км темп+2км зам"},
   sun:{type:"long",km:23,pace:"4:50-5:05"}},
  {n:28,start:"2027-04-05",km:56,phase:"competitive",
   tue:{type:"tempo",km:14,pace:"4:20",desc:"3км разм+9км темп+2км зам"},
   thu:{type:"fartlek",km:10,pace:"4:50",desc:"12×1мин/60сек"},
   sat:{type:"easy",km:9,pace:"5:10"},
   sun:{type:"long",km:23,pace:"4:50-5:05"}},
  {n:29,start:"2027-04-12",km:56,phase:"competitive",
   tue:{type:"intervals",km:12,pace:"3:55",desc:"2км разм+4×2км@3:55(отдых2мин30сек)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"tempo",km:10,pace:"4:20",desc:"3км разм+5км темп+2км зам"},
   sun:{type:"long",km:25,pace:"4:50-5:00"}},
  {n:30,start:"2027-04-19",km:50,phase:"competitive",
   tue:{type:"easy",km:8,pace:"5:10"},
   thu:{type:"tempo",km:10,pace:"4:25",desc:"3км разм+5км темп+2км зам"},
   sat:{type:"easy",km:8,pace:"5:15"},
   sun:{type:"long",km:24,pace:"4:55-5:05"}},
  {n:31,start:"2027-04-26",km:58,phase:"competitive",
   tue:{type:"tempo",km:14,pace:"4:20",desc:"3км разм+9км темп+2км зам"},
   thu:{type:"fartlek",km:10,pace:"4:50",desc:"8×2мин/60сек"},
   sat:{type:"easy",km:9,pace:"5:10"},
   sun:{type:"long",km:25,pace:"4:50-5:00"}},
  {n:32,start:"2027-05-03",km:58,phase:"competitive",
   tue:{type:"intervals",km:12,pace:"3:50",desc:"2км разм+5×1.5км@3:50(отдых2мин)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"tempo",km:10,pace:"4:20",desc:"3км разм+5км темп+2км зам"},
   sun:{type:"long",km:27,pace:"4:50-5:00"}},
  {n:33,start:"2027-05-10",km:58,phase:"competitive",
   tue:{type:"tempo",km:14,pace:"4:15",desc:"3км разм+9км темп+2км зам"},
   thu:{type:"fartlek",km:10,pace:"4:45",desc:"12×1мин/60сек"},
   sat:{type:"easy",km:8,pace:"5:10"},
   sun:{type:"long",km:26,pace:"4:50-5:00"}},
  {n:34,start:"2027-05-17",km:52,phase:"competitive",
   tue:{type:"intervals",km:12,pace:"3:50",desc:"2км разм+4×2км@3:50(отдых2мин30сек)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"easy",km:9,pace:"5:10"},
   sun:{type:"long",km:22,pace:"4:55-5:05"}},

  // === BLOCK4: RACE-SPECIFIC (May25 - Sep13,16 weeks) ===
  {n:35,start:"2027-05-25",km:56,phase:"race",
   tue:{type:"tempo",km:13,pace:"4:15",desc:"3км разм+8км темп+2км зам"},
   thu:{type:"fartlek",km:10,pace:"4:45",desc:"10×1мин/60сек"},
   sat:{type:"easy",km:9,pace:"5:10"},
   sun:{type:"long",km:24,pace:"4:40-4:55",desc:"с10км@4:33 МП"}},
  {n:36,start:"2027-06-01",km:58,phase:"race",
   tue:{type:"intervals",km:12,pace:"3:50",desc:"2км разм+5×1.5км@3:50(отдых2мин)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"tempo",km:10,pace:"4:15",desc:"3км разм+5км темп+2км зам"},
   sun:{type:"long",km:27,pace:"4:40-4:55",desc:"с12км@4:33 МП"}},
  {n:37,start:"2027-06-08",km:58,phase:"race",
   tue:{type:"tempo",km:14,pace:"4:15",desc:"3км разм+9км темп+2км зам"},
   thu:{type:"fartlek",km:10,pace:"4:45",desc:"12×1мин/60сек"},
   sat:{type:"easy",km:8,pace:"5:10"},
   sun:{type:"long",km:26,pace:"4:45-4:55",desc:"с12км@4:33 МП"}},
  {n:38,start:"2027-06-15",km:56,phase:"race",
   tue:{type:"intervals",km:12,pace:"3:50",desc:"2км разм+4×2км@3:50(отдых2мин30сек)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"easy",km:9,pace:"5:10"},
   sun:{type:"long",km:26,pace:"4:45-4:55",desc:"с14км@4:33 МП"}},
  {n:39,start:"2027-06-22",km:58,phase:"race",
   tue:{type:"tempo",km:13,pace:"4:10",desc:"3км разм+8км темп+2км зам"},
   thu:{type:"fartlek",km:10,pace:"4:45",desc:"8×2мин/60сек"},
   sat:{type:"easy",km:9,pace:"5:10"},
   sun:{type:"long",km:26,pace:"4:40-4:55",desc:"с12км@4:33 МП"}},
  {n:40,start:"2027-06-29",km:58,phase:"race",
   tue:{type:"intervals",km:12,pace:"3:45",desc:"2км разм+5×1.5км@3:45(отдых2мин)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"tempo",km:10,pace:"4:15",desc:"3км разм+5км темп+2км зам"},
   sun:{type:"long",km:27,pace:"4:40-4:55",desc:"с14км@4:33 МП"}},
  {n:41,start:"2027-07-06",km:58,phase:"race",
   tue:{type:"tempo",km:14,pace:"4:10",desc:"3км разм+9км темп+2км зам"},
   thu:{type:"fartlek",km:10,pace:"4:45",desc:"10×1мин/60сек"},
   sat:{type:"easy",km:8,pace:"5:10"},
   sun:{type:"long",km:26,pace:"4:40-4:55",desc:"с14км@4:33 МП"}},
  {n:42,start:"2027-07-13",km:56,phase:"race",
   tue:{type:"intervals",km:12,pace:"3:45",desc:"2км разм+4×2км@3:45(отдых2мин30сек)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"easy",km:9,pace:"5:10"},
   sun:{type:"long",km:26,pace:"4:40-4:55",desc:"с14км@4:33 МП"}},
  {n:43,start:"2027-07-20",km:58,phase:"race",
   tue:{type:"tempo",km:13,pace:"4:10",desc:"3км разм+8км темп+2км зам"},
   thu:{type:"fartlek",km:10,pace:"4:45",desc:"12×1мин/60сек"},
   sat:{type:"easy",km:9,pace:"5:10"},
   sun:{type:"long",km:26,pace:"4:40-4:55",desc:"с14км@4:33 МП"}},
  {n:44,start:"2027-07-27",km:58,phase:"race",
   tue:{type:"intervals",km:12,pace:"3:45",desc:"2км разм+5×1.5км@3:45(отдых2мин)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"tempo",km:10,pace:"4:10",desc:"3км разм+5км темп+2км зам"},
   sun:{type:"long",km:27,pace:"4:35-4:50",desc:"с16км@4:33 МП"}},
  {n:45,start:"2027-08-03",km:58,phase:"race",
   tue:{type:"tempo",km:14,pace:"4:10",desc:"3км разм+9км темп+2км зам"},
   thu:{type:"fartlek",km:10,pace:"4:45",desc:"10×1мин/60сек"},
   sat:{type:"easy",km:8,pace:"5:10"},
   sun:{type:"long",km:26,pace:"4:35-4:50",desc:"с14км@4:33 МП"}},
  {n:46,start:"2027-08-10",km:56,phase:"race",
   tue:{type:"intervals",km:12,pace:"3:45",desc:"2км разм+4×2км@3:45(отдых2мин)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"easy",km:9,pace:"5:10"},
   sun:{type:"long",km:26,pace:"4:40-4:55",desc:"с14км@4:33 МП"}},

  // PEAK + TAPER (Aug17 - Sep27,6 weeks)
  {n:47,start:"2027-08-17",km:55,phase:"race",
   tue:{type:"tempo",km:13,pace:"4:10",desc:"3км разм+8км темп+2км зам"},
   thu:{type:"fartlek",km:10,pace:"4:45",desc:"12×1мин/60сек"},
   sat:{type:"easy",km:8,pace:"5:10"},
   sun:{type:"long",km:24,pace:"4:40-4:55",desc:"с12км@4:33 МП"}},
  {n:48,start:"2027-08-24",km:52,phase:"race",
   tue:{type:"intervals",km:12,pace:"3:50",desc:"2км разм+5×1.5км@3:50(отдых2мин)+2км зам"},
   thu:{type:"easy",km:9,pace:"5:10"},
   sat:{type:"tempo",km:10,pace:"4:15",desc:"3км разм+5км темп+2км зам"},
   sun:{type:"long",km:21,pace:"4:50-5:00"}},
  {n:49,start:"2027-08-31",km:48,phase:"race",
   tue:{type:"tempo",km:12,pace:"4:15",desc:"3км разм+7км темп+2км зам"},
   thu:{type:"fartlek",km:9,pace:"4:50",desc:"10×1мин/60сек"},
   sat:{type:"easy",km:8,pace:"5:15"},
   sun:{type:"long",km:19,pace:"4:55-5:05"}},
  {n:50,start:"2027-09-07",km:42,phase:"race",
   tue:{type:"intervals",km:11,pace:"4:00",desc:"2км разм+4×1км@4:00(отдых90сек)+2км зам"},
   thu:{type:"easy",km:8,pace:"5:15"},
   sat:{type:"easy",km:8,pace:"5:15",desc:"с3×100м ускорениями"},
   sun:{type:"long",km:15,pace:"5:00-5:10"}},
  {n:51,start:"2027-09-14",km:36,phase:"race",
   tue:{type:"tempo",km:10,pace:"4:20",desc:"3км разм+4км темп+3км зам"},
   thu:{type:"easy",km:8,pace:"5:20"},
   sat:{type:"easy",km:8,pace:"5:20",desc:"с3×100м ускорениями"},
   sun:{type:"long",km:10,pace:"5:10-5:20"}},
  {n:52,start:"2027-09-21",km:25,phase:"race",
   tue:{type:"easy",km:7,pace:"5:20",desc:"с3×100м ускорениями"},
   thu:{type:"easy",km:5,pace:"5:30"},
   sat:{type:"easy",km:5,pace:"5:30",desc:"с2×80м ускорениями"},
   sun:{type:"race",km:4.3,pace:"лёгкая",desc:"Предстартовая activation. 2-3км легко + пара ускорений."}}
];

// ============ PLAN GENERATOR ============
function generatePlan(){
  const plan = [];
  for(const w of WEEKS){
    const mon = addDaysStr(PLAN_START, (w.n-1)*7);
    const t = w.tue, s = w.sat, u = w.sun;
    // Mon: rest
    plan.push(mkDay(mon, w.n, "rest", "Отдых", 0, "—", ""));
    // Tue: quality
    const tTitle = buildTitle(t.type, t.km, t.pace, t.desc);
    plan.push(mkDay(addDaysStr(mon,1), w.n, t.type, tTitle, t.km, t.pace, t.desc||""));
    // Wed: easy (km distributed from weekly total)
    const qualKm = t.km + (w.thu?.km||0) + s.km + u.km;
    const easyKm = Math.max(5, Math.round((w.km - qualKm)/2));
    plan.push(mkDay(addDaysStr(mon,2), w.n, "easy", "Лёгкий бег", easyKm, "5:15-5:25", ""));
    // Thu: quality or easy
    if(w.thu){
      const thTitle = buildTitle(w.thu.type, w.thu.km, w.thu.pace, w.thu.desc);
      plan.push(mkDay(addDaysStr(mon,3), w.n, w.thu.type, thTitle, w.thu.km, w.thu.pace, w.thu.desc||""));
    } else {
      plan.push(mkDay(addDaysStr(mon,3), w.n, "easy", "Лёгкий бег", easyKm, "5:20-5:30", ""));
    }
    // Fri: rest
    plan.push(mkDay(addDaysStr(mon,4), w.n, "rest", "Отдых", 0, "—", ""));
    // Sat: quality
    const sTitle = buildTitle(s.type, s.km, s.pace, s.desc);
    plan.push(mkDay(addDaysStr(mon,5), w.n, s.type, sTitle, s.km, s.pace, s.desc||""));
    // Sun: long/easy
    const uTitle = buildTitle(u.type, u.km, u.pace, u.desc);
    plan.push(mkDay(addDaysStr(mon,6), w.n, u.type, uTitle, u.km, u.pace, u.desc||""));
  }
  // Add race day
  plan.push({
    date: RACE_DATE, wd: wdRu(RACE_DATE), weekN: 52, type: "race",
    title: "МАРАФОН — цель <3:15:00", km: 42.2, pace: "4:33",
    desc: "Московский марафон. Раскладка: 1-10км @4:35-4:37, 10-30км @4:30-4:33, 30-42км — по самочувствию. Ровный старт, не увлекаться темпом в первой трети."
  });
  return plan;
}

function mkDay(date, weekN, type, title, km, pace, desc){
  return {date, wd: wdRu(date), weekN, type, title, km, pace, desc};
}

function buildTitle(type, km, pace, desc){
  const names = {easy:"Лёгкий бег",long:"Длительный",tempo:"Темповая",intervals:"Интервалы",fartlek:"Фартлек",rest:"Отдых",race:"Старт"};
  let title = names[type]||type;
  if(km) title += ` ${km}км`;
  if(desc && desc.length>0 && desc.length<60) title += " · "+desc;
  return title;
}

// ============ HISTORICAL RESULTS (from original project) ============
const HISTORY = [
  {date:"2026-04-26",wd:"Вс",type:"race",title:"Московский ПМ",km:21.1,pace:"4:25",desc:"Базовый результат: 1:33:00.",locked:true,
   actual:{dist:21.1,timeSec:5580,paceSec:265,rpe:9,hr:null,temp:null,cond:"",notes:"Стартовый ПМ.",status:"done"}},
  {date:"2026-04-28",wd:"Вт",type:"easy",title:"Восстановительная",km:6,pace:"5:15",desc:"Первая после ПМ.",locked:true,
   actual:{dist:6,timeSec:1890,paceSec:315,rpe:4,hr:null,temp:null,cond:"",notes:"1-я после ПМ.",status:"done"}},
  {date:"2026-04-29",wd:"Ср",type:"easy",title:"Аэробный лёгкий",km:8.3,pace:"5:37",desc:"Корректный аэробный темп.",locked:true,
   actual:{dist:8.3,timeSec:2799,paceSec:337,rpe:4,hr:null,temp:null,cond:"",notes:"",status:"done"}},
  // Weeks1-8 training (Apr30 - Jun14)
  {date:"2026-04-30",wd:"Чт",type:"easy",title:"Лёгкий бег",km:8,pace:"5:30-5:40",desc:"Восстановительная аэробика."},
  {date:"2026-05-01",wd:"Пт",type:"rest",title:"Отдых или4км трусцой",km:4,pace:"6:00",desc:"По самочувствию."},
  {date:"2026-05-02",wd:"Сб",type:"long",title:"Длительный14км",km:14,pace:"5:10-5:20",desc:"Ровный аэробный темп."},
  {date:"2026-05-03",wd:"Вс",type:"easy",title:"Восстановление +4×100м",km:6,pace:"5:30",desc:"4 ускорения по100м после бега."},
  {date:"2026-05-04",wd:"Пн",type:"rest",title:"Отдых",km:0,pace:"—",desc:"Полный отдых или растяжка/мобилити."},
  {date:"2026-05-05",wd:"Вт",type:"intervals",title:"Интервалы5×1000м",km:10,pace:"4:00-4:05",desc:"2км разм. +5×1000м @4:00-4:05 (отдых2′ трусцой) +2км заминка."},
  {date:"2026-05-06",wd:"Ср",type:"easy",title:"Лёгкий бег",km:8,pace:"5:30",desc:"Аэробика."},
  {date:"2026-05-07",wd:"Чт",type:"tempo",title:"Темповая6км",km:11,pace:"4:15",desc:"3км разм. +6км @4:15 +2км заминка."},
  {date:"2026-05-08",wd:"Пт",type:"rest",title:"Отдых",km:0,pace:"—",desc:""},
  {date:"2026-05-09",wd:"Сб",type:"easy",title:"Восстановление (День Победы)",km:6,pace:"5:40",desc:"Длительная перенесена на10.05."},
  {date:"2026-05-10",wd:"Вс",type:"long",title:"Длительный18км с прогрессией",km:18,pace:"5:10→4:30",desc:"Первые13км @5:10-5:15, последние5км @4:30."},
  {date:"2026-05-11",wd:"Пн",type:"rest",title:"Отдых",km:0,pace:"—",desc:""},
  {date:"2026-05-12",wd:"Вт",type:"intervals",title:"Интервалы4×1500м",km:10,pace:"4:08-4:12",desc:"2км разм. +4×1500м @4:08-4:12 (отдых2′30″) +2км заминка."},
  {date:"2026-05-13",wd:"Ср",type:"easy",title:"Лёгкий бег",km:7,pace:"5:30",desc:""},
  {date:"2026-05-14",wd:"Чт",type:"easy",title:"Лёгкий +6×100м",km:6,pace:"5:30 / 3:50",desc:"6 ускорений по100м в темпе ~3:50."},
  {date:"2026-05-15",wd:"Пт",type:"rest",title:"Отдых или активация",km:3,pace:"очень легко",desc:"3км трусцой +3 ускорения."},
  {date:"2026-05-16",wd:"Сб",type:"race",title:"СТАРТ «Садовое кольцо»15км",km:15,pace:"4:13-4:16",desc:"Контрольный темповый старт.",locked:true,
   actual:{dist:15,timeSec:3840,paceSec:256,rpe:8,hr:null,temp:null,cond:"Жарко",notes:"15км @4:16 в жару.",status:"done"}},
  {date:"2026-05-17",wd:"Вс",type:"easy",title:"Велокросс130км",km:0,pace:"—",desc:"Велосипед вместо восстановительного бега.",locked:true,
   actual:{dist:null,timeSec:16260,paceSec:null,rpe:6,hr:null,temp:null,cond:"",notes:"Велосипед130км @28.8км/ч.",status:"done"}},
  {date:"2026-05-18",wd:"Пн",type:"rest",title:"Отдых",km:0,pace:"—",desc:"Полный отдых после контрольной15км и вело130км.",locked:true,
   actual:{dist:null,timeSec:null,paceSec:null,rpe:1,hr:null,temp:null,cond:"",notes:"Отдых.",status:"done"}},
  {date:"2026-05-19",wd:"Вт",type:"rest",title:"Отдых (коррекция тейпера)",km:0,pace:"—",desc:"Заменено на отдых после жаркой контрольной +130км вело.",locked:true,
   actual:{dist:null,timeSec:null,paceSec:null,rpe:1,hr:null,temp:null,cond:"",notes:"Отдых вместо темповой.",status:"done"}},
  {date:"2026-05-20",wd:"Ср",type:"easy",title:"Лёгкая активация +4×100м",km:7,pace:"5:10-5:30",desc:"Разбудить ноги перед стартом."},
  {date:"2026-05-21",wd:"Чт",type:"tempo",title:"Короткая работа3×1км @ПМ",km:9,pace:"4:10-4:14",desc:"2км разминка +3×1км в темпе ПМ."},
  {date:"2026-05-22",wd:"Пт",type:"rest",title:"Мини-разгрузка",km:3,pace:"5:30",desc:"3-4км трусцой +2-3 ускорения."},
  {date:"2026-05-23",wd:"Сб",type:"race",title:"ПОЛУМАРАФОН — цель <1:30:00",km:21.1,pace:"4:14",desc:"Раскладка: 1-5км @4:15-4:17, 5-15км @4:12-4:14, 15-21км — по самочувствию.",locked:true,
   actual:{dist:21.1,timeSec:5489,paceSec:260,rpe:9,hr:null,temp:18,cond:"Тепло ~18°C, влажность ~68%",notes:"ЗаБег.РФ, Москва. 1:31:29, ср. темп4:20/км. Пробежал по форме. Недобор до sub-1:30 —89 с (~4 с/км).",status:"done"}},
  // Jun-Oct gap (user runs3x/week informally)
  {date:"2026-06-15",wd:"Пн",type:"easy",title:"Свободный бег",km:8,pace:"5:20-5:40",desc:"Поддержание формы после ПМ."},
  {date:"2026-07-15",wd:"Ср",type:"easy",title:"Свободный бег",km:10,pace:"5:15-5:35",desc:"Свободная пробежка."},
  {date:"2026-08-15",wd:"Сб",type:"easy",title:"Свободный бег",km:10,pace:"5:15-5:30",desc:"Свободная пробежка."}
];

const DEFAULT_PROFILE = {age:36,height:174,weight:86,goal:GOAL_TIME};

// ============ UTILITIES ============
function addDaysStr(dateStr, n){
  const d = new Date(dateStr+"T00:00:00");
  d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
}
function wdRu(ds){
  const d = new Date(ds+"T00:00:00");
  return ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"][d.getDay()===0?6:d.getDay()-1];
}
const TODAY = new Date().toISOString().slice(0,10);
function pad(n){return String(n).padStart(2,"0")}
function fmtSec(s){if(s==null||isNaN(s))return"—";const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),x=Math.floor(s%60);return h?`${h}:${pad(m)}:${pad(x)}`:`${m}:${pad(x)}`}
function parseTime(t){if(!t)return null;t=String(t).trim();const p=t.split(":").map(x=>parseInt(x,10));if(p.some(isNaN))return null;if(p.length===3)return p[0]*3600+p[1]*60+p[2];if(p.length===2)return p[0]*60+p[1];return null}
function formatTimeInput(raw){const d=String(raw||"").replace(/\D/g,"").slice(0,6);if(d.length===0)return"";if(d.length<=2)return d;if(d.length===3)return`${d[0]}:${d.slice(1)}`;if(d.length===4)return`${d.slice(0,2)}:${d.slice(2)}`;if(d.length===5)return`${d[0]}:${d.slice(1,3)}:${d.slice(3)}`;return`${d.slice(0,2)}:${d.slice(2,4)}:${d.slice(4)}`}
function formatPaceInput(raw){const d=String(raw||"").replace(/\D/g,"").slice(0,4);if(d.length===0)return"";if(d.length<=2)return d;if(d.length===3)return`${d[0]}:${d.slice(1)}`;return`${d.slice(0,2)}:${d.slice(2)}`}
function paceFmt(s){if(!s)return"—";const m=Math.floor(s/60),x=Math.round(s%60);return`${m}:${pad(x)}`}
function ddmm(d){const dt=new Date(d);return`${pad(dt.getDate())}.${pad(dt.getMonth()+1)}`}
function parsePlanPaceSec(paceStr){
  if(!paceStr||paceStr==="—"||/[а-яёА-ЯЁ]/.test(paceStr))return null;
  const parts=paceStr.split(/[–—→\s]+/);let best=null;
  for(const part of parts){const s=parseTime(part.trim());if(s&&(best===null||s<best))best=s;}
  return best;
}
function parsePlanPaceRange(paceStr){
  if(!paceStr||paceStr==="—"||/[а-яёА-ЯЁ]/.test(paceStr))return null;
  const parts=paceStr.split(/[–—→\s\/]+/);let min=null,max=null;
  for(const part of parts){const s=parseTime(part.trim());if(s){if(min===null||s<min)min=s;if(max===null||s>max)max=s;}}
  return min!==null?{min,max}:null;
}
function shiftPaceStr(paceStr,deltaSec){return paceStr.replace(/(\d+):(\d{2})/g,m=>{const s=parseTime(m);if(!s)return m;return paceFmt(Math.max(180,s+deltaSec))})}
function daysUntil(d){const a=new Date(TODAY),b=new Date(d);return Math.round((b-a)/86400000)}
function escapeHtml(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function typeRu(t){return{easy:"Лёгкий",long:"Длительный",tempo:"Темп",intervals:"Интервалы",rest:"Отдых",race:"Старт",fartlek:"Фартлек"}[t]||t}

// ============ PREDICTION ============
function predictMarathon(){
  const done=state.plan.filter(p=>p.actual&&(p.actual.status==="done"||p.actual.status==="over")&&p.actual.dist&&p.actual.timeSec&&p.actual.dist>=5);
  if(done.length===0)return null;
  const recent=done.slice(-5);
  let best=recent[0];
  for(const r of recent){if(r.actual.paceSec<best.actual.paceSec)best=r;}
  // Riegel: T2=T1*(D2/D1)^1.06
  const t=best.actual.timeSec*Math.pow(42.195/best.actual.dist,1.06);
  return Math.round(t);
}

// ============ AUTO ADJUSTMENTS ============
function paceTrend(){
  const items=state.plan.filter(p=>p.actual&&["done","over","partial"].includes(p.actual.status)&&p.actual.paceSec&&parsePlanPaceRange(p.pace)&&p.type!=="race");
  if(items.length<3)return null;
  const recent=items.slice(-5);
  const deltas=recent.map(p=>{const r=parsePlanPaceRange(p.pace);const a=p.actual.paceSec;if(a<r.min)return a-r.min;if(a>r.max)return a-r.max;return0;});
  const nonZero=deltas.filter(d=>d!==0);
  if(nonZero.length<3)return null;
  const avg=nonZero.reduce((a,b)=>a+b,0)/nonZero.length;
  if(Math.abs(avg)<5)return null;
  const sameSign=nonZero.filter(d=>Math.sign(d)===Math.sign(avg)).length;
  if(sameSign<nonZero.length*0.7)return null;
  return{deltaSec:Math.round(avg),count:recent.length};
}
function findNextRestDay(fromIdx){
  for(let i=fromIdx+1;i<state.plan.length;i++){
    const p=state.plan[i];
    if(p.type==="rest"&&!p.actual&&p.date>=TODAY)return i;
  }
  return-1;
}
function analyzeAdjustments(){
  if(!state.dismissed)state.dismissed=[];
  const sugs=[];
  state.plan.forEach((p,i)=>{
    if(p.actual&&p.actual.status==="skipped"&&p.km>0){
      const restIdx=findNextRestDay(i);
      if(restIdx>=0){
        const id=`resched-${p.date}-${state.plan[restIdx].date}`;
        if(!state.dismissed.includes(id)){
          sugs.push({
            id,type:"reschedule",icon:"↪",title:"Перенос пропущенной",
            text:`Пропущено ${ddmm(p.date)}: <b>${escapeHtml(p.title)}</b> (${p.km}км). Перенести на день отдыха ${ddmm(state.plan[restIdx].date)}?`,
            payload:{srcIdx:i,dstIdx:restIdx}
          });
        }
      }
    }
  });
  const trend=paceTrend();
  if(trend){
    const id=`pace-${Math.round(trend.deltaSec/3)*3}`;
    if(!state.dismissed.includes(id)){
      const dir=trend.deltaSec>0?"медленнее":"быстрее";
      const abs=Math.abs(trend.deltaSec);
      const sign=trend.deltaSec>0?"+":"";
      sugs.push({
        id,type:"pace",icon:"⏱",title:"Корректировка целевых темпов",
        text:`По ${trend.count} последним: фактический темп систематически <b>${dir} плана на ${abs} сек/км</b>. Сдвинуть будущие плановые темпы на ${sign}${trend.deltaSec} сек/км (кроме старта)?`,
        payload:{deltaSec:trend.deltaSec}
      });
    }
  }
  return sugs;
}
function applySuggestion(s){
  if(s.type==="reschedule"){
    const src=state.plan[s.payload.srcIdx];const dst=state.plan[s.payload.dstIdx];
    dst.type=src.type;dst.title=src.title+" (перенос)";dst.km=src.km;dst.pace=src.pace;dst.desc=src.desc;
  }else if(s.type==="pace"){
    state.plan.forEach(p=>{
      if(p.date<=TODAY)return;if(p.actual)return;if(p.type==="race"||p.type==="rest")return;
      if(!p.pace||p.pace==="—")return;p.pace=shiftPaceStr(p.pace,s.payload.deltaSec);
    });
  }
  if(!state.dismissed)state.dismissed=[];
  state.dismissed.push(s.id);save();render();
}
function dismissSuggestion(s){
  if(!state.dismissed)state.dismissed=[];
  state.dismissed.push(s.id);save();render();
}
function renderSuggestions(){
  const $s=document.getElementById("suggestions");if(!$s)return;
  if(state.zoom!=="day"){$s.innerHTML="";return;}
  const sugs=analyzeAdjustments();
  if(sugs.length===0){$s.innerHTML="";return;}
  $s.innerHTML=sugs.map((s,i)=>`
    <div class="sugg">
      <div class="sugg-head"><span class="sugg-icon">${s.icon}</span><span class="sugg-title">${s.title}</span></div>
      <div class="sugg-text">${s.text}</div>
      <div class="sugg-actions">
        <button class="sugg-dismiss" data-act="dismiss" data-i="${i}">Отклонить</button>
        <button class="sugg-apply" data-act="apply" data-i="${i}">Применить</button>
      </div>
    </div>
  `).join("");
  $s.querySelectorAll("button").forEach(b=>{
    b.addEventListener("click",()=>{const i=parseInt(b.dataset.i,10);const s=sugs[i];if(b.dataset.act==="apply")applySuggestion(s);else dismissSuggestion(s);});
  });
}

// ============ STATE ============
let state = load();

function load(){
  try{
    const raw=localStorage.getItem(STORE_KEY);
    if(!raw)return fresh();
    const s=JSON.parse(raw);
    if(!s.plan||s.plan.length===0)s.plan=generatePlan();
    if(!s.profile)s.profile={...DEFAULT_PROFILE};
    if(!s.settings)s.settings={...DEFAULT_SETTINGS};
    if(!s.dismissed)s.dismissed=[];
    // migrate old settings
    if(!s.settings.aiProvider)s.settings.aiProvider=DEFAULT_SETTINGS.aiProvider;
    if(!s.settings.model)s.settings.model=DEFAULT_SETTINGS.model;
    if(s.settings.yandexFolder===undefined)s.settings.yandexFolder="";
    return s;
  }catch(e){return fresh()}
}
function fresh(){
  return{plan:generatePlan(),profile:{...DEFAULT_PROFILE},settings:{...DEFAULT_SETTINGS},zoom:"day",cursor:null,dismissed:[]};
}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state));}

// ============ RENDER ============
const $cards=document.getElementById("cards");
const $main=document.getElementById("main");
const $weeknav=document.getElementById("weeknav");
const $periodLabel=document.getElementById("periodLabel");

function refreshHeader(){
  const days=daysUntil(RACE_DATE);
  document.getElementById("countdown").textContent=days>0?`${days} дн. до марафона · сегодня ${ddmm(TODAY)}`:days===0?"Сегодня марафон!":"Марафон прошёл";
  const total=state.plan.length;
  const done=state.plan.filter(p=>p.actual&&(p.actual.status==="done"||p.actual.status==="over")).length;
  document.getElementById("stDone").textContent=done;
  document.getElementById("stTotal").textContent=total;
  document.getElementById("stKmPlan").textContent=state.plan.reduce((a,p)=>a+(p.km||0),0).toFixed(0);
  document.getElementById("stKmAct").textContent=state.plan.reduce((a,p)=>a+(p.actual&&p.actual.dist?p.actual.dist:0),0).toFixed(1);
  const pred=predictMarathon();
  document.getElementById("stPredict").textContent=pred?fmtSec(pred):"—";
}

function dcardHTML(p,idx){
  const a=p.actual;
  const status=a?.status||"pending";
  const stCls="st-"+status;
  const stTxt={pending:"План",done:"Сделано",partial:"Частично",skipped:"Пропуск",over:"★ Сверх нормы"}[status]||status;
  const isToday=p.date===TODAY;
  const cls=["daycard",`t-${p.type}`,status,isToday?"today":""].filter(Boolean).join(" ");
  let actualHTML="";
  if(a&&a.status!=="pending"){
    const planParts=[];
    if(p.km)planParts.push(`${p.km} км`);
    if(p.pace&&p.pace!=="—")planParts.push(`темп ${p.pace}`);
    const planRow=planParts.length?`<div class="a-plan">План: <span>${planParts.join(" · ")}</span></div>`:"";
    const parts=[];
    if(a.dist){
      const delta=p.km?+(a.dist-p.km).toFixed(1):null;
      let s=`<b>${a.dist} км</b>`;
      if(delta!==null)s+=` <span class="${delta>=0?"delta-good":"delta-bad"}">(${delta>=0?"+":""}${delta})</span>`;
      parts.push(s);
    }
    if(a.timeSec)parts.push(`<b>${fmtSec(a.timeSec)}</b>`);
    if(a.paceSec){
      const planPs=parsePlanPaceSec(p.pace);
      let s=`темп <b>${paceFmt(a.paceSec)}</b>`;
      if(planPs){const diff=planPs-a.paceSec;s+=` <span class="${diff>=0?"delta-good":"delta-bad"}">(${diff>=0?"-":"+"}${paceFmt(Math.abs(diff))})</span>`;}
      parts.push(s);
    }
    if(a.hr)parts.push(`HR <b>${a.hr}</b>`);
    if(a.rpe)parts.push(`RPE <b>${a.rpe}</b>`);
    if(a.temp!=null&&a.temp!=="")parts.push(`<b>${a.temp}°</b>`);
    if(a.cond)parts.push(a.cond);
    actualHTML=`<div class="actual">${planRow}<div class="a-row">${parts.join(" · ")}</div>${a.notes?`<div class="a-note">${escapeHtml(a.notes)}</div>`:""}</div>`;
  }
  return`<button class="${cls}" data-idx="${idx}">
    <div class="dc-head">
      <div class="dc-date">${ddmm(p.date)} · ${p.wd}</div>
      <span class="tag ${p.type}">${typeRu(p.type)}</span>
      <span class="dc-status ${stCls}">${stTxt}</span>
    </div>
    <div class="dc-title">${escapeHtml(p.title)}</div>
    <div class="dc-meta">${p.km?`<b>${p.km} км</b>`:""} ${p.pace&&p.pace!=="—"?`· темп ${p.pace}`:""}</div>
    <div class="dc-desc">${escapeHtml(p.desc||"")}</div>
    ${actualHTML}
  </button>`;
}

function startOfWeek(d){const dt=new Date(d);const wd=(dt.getDay()+6)%7;dt.setDate(dt.getDate()-wd);return dt.toISOString().slice(0,10)}
function addDays(d,n){const dt=new Date(d);dt.setDate(dt.getDate()+n);return dt.toISOString().slice(0,10)}

let cursor=TODAY;

function render(){
  refreshHeader();renderSuggestions();
  $main.classList.remove("zoom-day","zoom-week","zoom-all");
  $main.classList.add("zoom-"+state.zoom);
  $cards.innerHTML="";
  if(state.zoom==="day"){
    $weeknav.style.display="flex";
    if(!isInPlan(cursor))cursor=nearestPlanDate(TODAY);
    const idx=state.plan.findIndex(p=>p.date===cursor);
    $periodLabel.textContent=idx>=0?`${ddmm(cursor)} · ${state.plan[idx].wd}`:ddmm(cursor);
    if(idx>=0)$cards.innerHTML=dcardHTML(state.plan[idx],idx);
    else $cards.innerHTML=`<div style="color:var(--fg2);text-align:center;padding:30px">Этого дня нет в плане</div>`;
  }else if(state.zoom==="week"){
    $weeknav.style.display="flex";
    const ws=startOfWeek(cursor);const we=addDays(ws,6);
    $periodLabel.textContent=`${ddmm(ws)} – ${ddmm(we)}`;
    const items=state.plan.map((p,i)=>({p,i})).filter(x=>x.p.date>=ws&&x.p.date<=we);
    const km=items.reduce((a,x)=>a+(x.p.km||0),0);
    const kmAct=items.reduce((a,x)=>a+(x.p.actual&&x.p.actual.dist?x.p.actual.dist:0),0);
    $cards.innerHTML=`<div class="weekhead"><span>Неделя</span><span class="wsum">${kmAct.toFixed(1)} / ${km.toFixed(0)} км</span></div>`+items.map(x=>dcardHTML(x.p,x.i)).join("");
    if(items.length===0)$cards.innerHTML+=`<div style="color:var(--fg2);text-align:center;padding:30px">Эта неделя вне плана</div>`;
  }else{
    $weeknav.style.display="none";
    const groups={};
    state.plan.forEach((p,i)=>{const ws=startOfWeek(p.date);(groups[ws]=groups[ws]||[]).push({p,i});});
    const html=Object.keys(groups).sort().map(ws=>{
      const arr=groups[ws];
      const km=arr.reduce((a,x)=>a+(x.p.km||0),0);
      const kmAct=arr.reduce((a,x)=>a+(x.p.actual&&x.p.actual.dist?x.p.actual.dist:0),0);
      return`<div class="weekhead"><span>${ddmm(ws)} – ${ddmm(addDays(ws,6))}</span><span class="wsum">${kmAct.toFixed(0)} / ${km.toFixed(0)} км</span></div>`+arr.map(x=>dcardHTML(x.p,x.i)).join("");
    }).join("");
    $cards.innerHTML=html;
  }
  $cards.querySelectorAll(".daycard").forEach(el=>{el.addEventListener("click",()=>openLog(parseInt(el.dataset.idx,10)));});
}
function isInPlan(d){return state.plan.some(p=>p.date===d)}
function nearestPlanDate(d){
  const ds=state.plan.map(p=>p.date);
  if(ds.includes(d))return d;
  const future=ds.filter(x=>x>=d).sort()[0];
  return future||ds[ds.length-1];
}

// ============ ZOOM ============
document.querySelectorAll(".zoombar button").forEach(b=>{
  b.addEventListener("click",()=>{
    document.querySelectorAll(".zoombar button").forEach(x=>x.classList.remove("on"));
    b.classList.add("on");state.zoom=b.dataset.z;save();render();
  });
});
function setZoom(z){
  state.zoom=z;
  document.querySelectorAll(".zoombar button").forEach(b=>b.classList.toggle("on",b.dataset.z===z));
  save();render();
}

// ============ NAV ============
document.getElementById("prevPeriod").addEventListener("click",()=>{
  if(state.zoom==="day"){
    const idx=state.plan.findIndex(p=>p.date===cursor);
    if(idx>0)cursor=state.plan[idx-1].date;
    else cursor=addDays(cursor,-1);
  }else cursor=addDays(startOfWeek(cursor),-7);
  render();
});
document.getElementById("nextPeriod").addEventListener("click",()=>{
  if(state.zoom==="day"){
    const idx=state.plan.findIndex(p=>p.date===cursor);
    if(idx>=0&&idx<state.plan.length-1)cursor=state.plan[idx+1].date;
    else cursor=addDays(cursor,1);
  }else cursor=addDays(startOfWeek(cursor),7);
  render();
});
document.getElementById("btnToday").addEventListener("click",()=>{cursor=nearestPlanDate(TODAY);setZoom("day");});

// ============ PINCH ZOOM ============
let pinchStart=null;
$main.addEventListener("touchstart",e=>{
  if(e.touches.length===2){
    const dx=e.touches[0].clientX-e.touches[1].clientX;const dy=e.touches[0].clientY-e.touches[1].clientY;
    pinchStart={d:Math.hypot(dx,dy),zoom:state.zoom};
  }
},{passive:true});
$main.addEventListener("touchmove",e=>{
  if(e.touches.length===2&&pinchStart){
    const dx=e.touches[0].clientX-e.touches[1].clientX;const dy=e.touches[0].clientY-e.touches[1].clientY;
    const d=Math.hypot(dx,dy);const r=d/pinchStart.d;
    const order=["day","week","all"];let cur=order.indexOf(pinchStart.zoom);
    if(r<0.7&&cur<2){setZoom(order[cur+1]);pinchStart=null;}
    else if(r>1.4&&cur>0){setZoom(order[cur-1]);pinchStart=null;}
  }
},{passive:true});
$main.addEventListener("touchend",()=>{pinchStart=null});

// ============ LOG MODAL ============
let logIdx=-1;
const $modalLog=document.getElementById("modalLog");
function openLog(idx){
  logIdx=idx;const p=state.plan[idx];
  document.getElementById("logTitle").textContent=`${ddmm(p.date)} · ${p.title}`;
  document.getElementById("logPlan").textContent=`План: ${p.km||0} км · темп ${p.pace}`;
  const a=p.actual||{};
  document.getElementById("fDist").value=a.dist??"";
  if(a.timeSec){
    const h=Math.floor(a.timeSec/3600),m=Math.floor((a.timeSec%3600)/60),s=Math.floor(a.timeSec%60);
    document.getElementById("fTimeH").value=h||"";document.getElementById("fTimeM").value=m;document.getElementById("fTimeS").value=s;
  }else{document.getElementById("fTimeH").value="";document.getElementById("fTimeM").value="";document.getElementById("fTimeS").value="";}
  if(a.paceSec){document.getElementById("fPaceM").value=Math.floor(a.paceSec/60);document.getElementById("fPaceS").value=Math.floor(a.paceSec%60);}
  else{document.getElementById("fPaceM").value="";document.getElementById("fPaceS").value="";}
  document.getElementById("fHr").value=a.hr??"";
  document.getElementById("fTemp").value=a.temp??"";
  document.getElementById("fCond").value=a.cond??"";
  document.getElementById("fNote").value=a.notes??"";
  setRpe(a.rpe||0);setStat(a.status||"pending");
  $modalLog.classList.add("on");
}
function closeLog(){$modalLog.classList.remove("on")}
document.getElementById("btnLogClose").addEventListener("click",closeLog);
$modalLog.addEventListener("click",e=>{if(e.target===$modalLog)closeLog()});

let curRpe=0;
function setRpe(n){curRpe=n;document.querySelectorAll("#rpe button").forEach(b=>b.classList.toggle("on",parseInt(b.dataset.r,10)===n));}
document.querySelectorAll("#rpe button").forEach(b=>{b.addEventListener("click",()=>setRpe(parseInt(b.dataset.r,10)));});

let curStat="pending";
function setStat(s){curStat=s;document.querySelectorAll("#statpick button").forEach(b=>b.classList.toggle("on",b.dataset.s===s));}
document.querySelectorAll("#statpick button").forEach(b=>{b.addEventListener("click",()=>setStat(b.dataset.s));});

function readTimeFields(){
  const h=parseInt(document.getElementById("fTimeH").value,10)||0;
  const m=parseInt(document.getElementById("fTimeM").value,10)||0;
  const s=parseInt(document.getElementById("fTimeS").value,10)||0;
  return h*3600+m*60+s;
}
function autoPace(){
  const d=parseFloat(document.getElementById("fDist").value);const t=readTimeFields();
  if(d>0&&t>0){const ps=t/d;document.getElementById("fPaceM").value=Math.floor(ps/60);document.getElementById("fPaceS").value=Math.round(ps%60);autoStatus(d,ps);}
}
function autoStatus(dist,paceSec){
  if(logIdx<0)return;const p=state.plan[logIdx];
  const planDist=p.km||0;const planPace=parsePlanPaceSec(p.pace);
  if(planDist>0&&planPace&&dist>planDist&&paceSec<planPace)setStat("over");
  else if(curStat==="over")setStat("done");
}
document.getElementById("fDist").addEventListener("input",autoPace);
["fTimeH","fTimeM","fTimeS"].forEach(id=>{document.getElementById(id).addEventListener("input",autoPace);});

document.getElementById("btnLogSave").addEventListener("click",()=>{
  if(logIdx<0)return;const p=state.plan[logIdx];
  const dist=parseFloat(document.getElementById("fDist").value)||null;
  const timeSec=readTimeFields()||null;
  const pm=parseInt(document.getElementById("fPaceM").value,10)||0;
  const ps=parseInt(document.getElementById("fPaceS").value,10)||0;
  let paceSec=(pm*60+ps)||null;
  if(!paceSec&&dist&&timeSec)paceSec=timeSec/dist;
  p.actual={status:curStat,dist,timeSec,paceSec:paceSec?Math.round(paceSec):null,
    hr:parseFloat(document.getElementById("fHr").value)||null,rpe:curRpe||null,
    temp:document.getElementById("fTemp").value===""?null:parseFloat(document.getElementById("fTemp").value),
    cond:document.getElementById("fCond").value||"",notes:document.getElementById("fNote").value||""};
  save();render();closeLog();
});
document.getElementById("btnLogReset").addEventListener("click",()=>{
  if(logIdx<0)return;if(!confirm("Сбросить факт по этой тренировке?"))return;
  delete state.plan[logIdx].actual;save();render();closeLog();
});

// ============ AI ============
const $modalAi=document.getElementById("modalAi");
const $aiOut=document.getElementById("aiOut");
document.getElementById("btnAi").addEventListener("click",()=>{
  document.getElementById("aiPrompt").value="";$aiOut.textContent="";
  $modalAi.classList.add("on");
});
document.getElementById("btnAiClose").addEventListener("click",()=>$modalAi.classList.remove("on"));
$modalAi.addEventListener("click",e=>{if(e.target===$modalAi)$modalAi.classList.remove("on")});

function buildAiContext(){
  const profile=`Бегун: ${state.profile.age} лет, ${state.profile.height}см, ${state.profile.weight}кг.`;
  const items=state.plan.map(p=>{
    const a=p.actual;
    let line=`${p.date} (${p.wd}) [${p.type}] ${p.title} — план ${p.km||0}км @ ${p.pace}`;
    if(a){line+=` | факт: ${a.status}`;
      if(a.dist)line+=`, ${a.dist}км`;if(a.timeSec)line+=`, ${fmtSec(a.timeSec)}`;
      if(a.paceSec)line+=`, темп ${paceFmt(a.paceSec)}`;if(a.hr)line+=`, HR ${a.hr}`;
      if(a.rpe)line+=`, RPE ${a.rpe}`;if(a.temp!=null)line+=`, ${a.temp}°`;
      if(a.cond)line+=`, ${a.cond}`;if(a.notes)line+=`, "${a.notes}"`;}
    return line;
  }).join("\n");
  const pred=predictMarathon();
  const predStr=pred?`Текущий прогноз марафон по факту: ${fmtSec(pred)}.`:"";
  return`${profile}\nЦель: марафон ${RACE_DATE}, ${GOAL_TIME} (темп ${GOAL_PACE}/км).\nСегодня: ${TODAY}.\n${predStr}\n\nПлан и факт по дням:\n${items}`;
}

const AI_SYSTEM_PROMPT=`Ты — опытный беговой тренер. Анализируешь план подготовки к марафону и фактические результаты любителя. Даёшь конкретные, безопасные рекомендации с учётом возраста и веса. Отвечай кратко, по-русски: 1) оценка состояния, 2) прогноз на марафон, 3) что изменить в плане (по датам), 4) на что обратить внимание. Без медицинских советов; при жалобах на боль — рекомендуй разгрузку.`;

document.getElementById("btnAiCopy").addEventListener("click",async()=>{
  const userQ=document.getElementById("aiPrompt").value||"Проанализируй ход подготовки и предложи корректировки плана.";
  const txt=`Я готовлюсь к марафону. Помоги скорректировать план.\n\nВопрос: ${userQ}\n\n${buildAiContext()}`;
  try{await navigator.clipboard.writeText(txt);$aiOut.textContent="Скопировано. Вставьте в любой LLM-чат (ChatGPT, Claude, Gemini).";}
  catch(e){$aiOut.textContent=txt;}
});

document.getElementById("btnAiSend").addEventListener("click",async()=>{
  const cfg=state.settings;
  if(!cfg.apiKey){
    $aiOut.textContent="Добавьте API key в настройках (⚙ вверху справа).";
    return;
  }
  const userQ=document.getElementById("aiPrompt").value||"Проанализируй ход подготовки и предложи корректировки плана.";
  const provider=cfg.aiProvider||"openrouter";
  const model=cfg.model||AI_PROVIDERS.openrouter.models[0].id;
  $aiOut.textContent="Запрашиваю AI…";

  try{
    let headers,body,url;
    if(provider==="yandex"){
      // YandexGPT API
      const folderId=cfg.yandexFolder||cfg.apiKey.split(":")[0]||"";
      url=AI_PROVIDERS.yandex.url;
      headers={"Authorization":`Bearer ${cfg.apiKey}`,"Content-Type":"application/json"};
      body=JSON.stringify({
        modelUri:`gpt://${folderId}/${model}`,
        completionMessages:[
          {role:"system",text:AI_SYSTEM_PROMPT},
          {role:"user",text:`${userQ}\n\n${buildAiContext()}`}
        ],
        stream:false,
        completionOptions:{temperature:0.7,maxTokens:2000}
      });
    }else{
      // OpenRouter (OpenAI-compatible)
      url=AI_PROVIDERS.openrouter.url;
      headers={"Authorization":`Bearer ${cfg.apiKey}`,"Content-Type":"application/json",
        "HTTP-Referer":"https://sportplanner.local","X-Title":"SportPlanner"};
      body=JSON.stringify({
        model:model,
        messages:[
          {role:"system",content:AI_SYSTEM_PROMPT},
          {role:"user",content:`${userQ}\n\n${buildAiContext()}`}
        ],
        temperature:0.7,max_tokens:2000
      });
    }

    const r=await fetch(url,{method:"POST",headers,body});
    if(!r.ok){
      const t=await r.text();
      if(r.status===429){
        $aiOut.textContent=`Ошибка429: превышен лимит запросов. Подождите минуту и попробуйте снова.\n\nПодробно: ${t.slice(0,300)}`;
        return;
      }
      if(r.status===401||r.status===403){
        $aiOut.textContent=`Ошибка ${r.status}: неверный API key. Проверьте в настройках (⚙).\n\nПодробно: ${t.slice(0,300)}`;
        return;
      }
      $aiOut.textContent=`Ошибка ${r.status}: ${t.slice(0,500)}`;
      return;
    }
    const j=await r.json();
    let txt="";
    if(provider==="yandex"){
      txt=(j.result?.alternatives||[]).map(a=>a.message?.text).filter(Boolean).join("\n");
    }else{
      txt=(j.choices||[]).map(c=>c.message?.content).filter(Boolean).join("\n");
    }
    if(!txt){
      $aiOut.textContent=`Пустой ответ. Ответ сервера: ${JSON.stringify(j).slice(0,500)}`;
      return;
    }
    $aiOut.textContent=txt;
  }catch(e){
    $aiOut.textContent=`Ошибка: ${e.message}\n\nПроверьте подключение к интернету и API key в настройках.`;
  }
});

// ============ EXPORT ============
document.getElementById("btnExport").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=`sportplanner-${TODAY}.json`;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
});

// ============ SETTINGS ============
const $modalSet=document.getElementById("modalSet");

function populateModelSelect(){
  const provider=state.settings.aiProvider||"openrouter";
  const models=AI_PROVIDERS[provider]?.models||[];
  const $sel=document.getElementById("model");
  $sel.innerHTML=models.map(m=>`<option value="${m.id}">${m.label}</option>`).join("");
  if(state.settings.model&&models.some(m=>m.id===state.settings.model)){
    $sel.value=state.settings.model;
  }else if(models.length>0){
    $sel.value=models[0].id;
  }
  document.getElementById("modelHint").textContent=models.length?"":"";
}

function updateProviderUI(){
  const provider=document.getElementById("aiProvider").value;
  const cfg=AI_PROVIDERS[provider];
  document.getElementById("providerHint").textContent=cfg?.hint||"";
  document.getElementById("apiKeyLabel").textContent=provider==="yandex"?"IAM-токен":"API key";
  document.getElementById("apiKey").placeholder=cfg?.keyPlaceholder||"";
  document.getElementById("yandexExtra").classList.toggle("hidden",provider!=="yandex");
  populateModelSelect();
}

document.getElementById("aiProvider").addEventListener("change",()=>{
  state.settings.aiProvider=document.getElementById("aiProvider").value;
  updateProviderUI();
});

document.getElementById("btnSettings").addEventListener("click",()=>{
  document.getElementById("apiKey").value=state.settings.apiKey||"";
  document.getElementById("aiProvider").value=state.settings.aiProvider||"openrouter";
  document.getElementById("yandexFolder").value=state.settings.yandexFolder||"";
  document.getElementById("pAge").value=state.profile.age;
  document.getElementById("pWeight").value=state.profile.weight;
  document.getElementById("pHeight").value=state.profile.height;
  document.getElementById("pGoal").value=state.profile.goal;
  updateProviderUI();
  $modalSet.classList.add("on");
});
$modalSet.addEventListener("click",e=>{if(e.target===$modalSet)$modalSet.classList.remove("on")});

document.getElementById("btnSetSave").addEventListener("click",()=>{
  state.settings.apiKey=document.getElementById("apiKey").value.trim();
  state.settings.aiProvider=document.getElementById("aiProvider").value;
  state.settings.model=document.getElementById("model").value;
  state.settings.yandexFolder=document.getElementById("yandexFolder").value.trim();
  state.profile.age=parseInt(document.getElementById("pAge").value,10)||state.profile.age;
  state.profile.weight=parseFloat(document.getElementById("pWeight").value)||state.profile.weight;
  state.profile.height=parseInt(document.getElementById("pHeight").value,10)||state.profile.height;
  state.profile.goal=document.getElementById("pGoal").value||state.profile.goal;
  save();render();$modalSet.classList.remove("on");
});
document.getElementById("btnReset").addEventListener("click",()=>{
  if(!confirm("Сбросить ВСЕ данные (план, факт, настройки)? Действие необратимо."))return;
  localStorage.removeItem(STORE_KEY);state=fresh();save();render();$modalSet.classList.remove("on");
});

// ============ INIT ============
cursor=nearestPlanDate(TODAY);
state.zoom=state.zoom||"day";
document.querySelectorAll(".zoombar button").forEach(b=>b.classList.toggle("on",b.dataset.z===state.zoom));
render();