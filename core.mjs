export const trainingSets = [
  {
    id: "paper-cutting",
    sourceLabel: "六级翻译常见主题 · 民间艺术",
    theme: "剪纸：一张纸里的中国祝愿",
    sentences: [
      {
        id: "paper-cutting-1",
        order: 1,
        chinese: "剪纸是中国最受欢迎的民间艺术之一，已有一千多年的历史。",
        reference: "Paper cutting is one of the most popular forms of folk art in China and has a history of more than one thousand years.",
        rubric: [
          { id: "one-of", category: "语法", label: "one of the most popular forms of", alternatives: ["one of the most popular forms of", "one of china's most popular", "one of the popular forms"], advice: "“最受欢迎的……之一”可用 one of the most popular forms of + 名词复数。" },
          { id: "folk-art", category: "词汇", label: "folk art", alternatives: ["folk art", "folk-art"], advice: "“民间艺术”常译为 folk art。" },
          { id: "history", category: "搭配", label: "has a history of", alternatives: ["has a history of", "with a history of", "has over"], advice: "表达历史长度时，has a history of 是稳妥搭配。" },
        ],
        collocations: [
          { id: "history-of", expression: "have a history of", meaning: "有……的历史", example: "The town has a history of more than 800 years." },
          { id: "folk-art", expression: "folk art", meaning: "民间艺术", example: "Paper cutting is a well-known form of folk art." },
        ],
      },
      {
        id: "paper-cutting-2",
        order: 2,
        chinese: "人们常在春节或婚礼等喜庆场合把剪纸贴在窗户上，以表达对幸福生活的祝愿。",
        reference: "People often put paper cuttings on windows during festive occasions such as the Spring Festival and weddings to express their wishes for a happy life.",
        rubric: [
          { id: "put-on", category: "搭配", label: "put ... on windows", alternatives: ["put paper cuttings on windows", "put them on windows", "stick paper cuttings on windows"], advice: "“把剪纸贴在窗户上”可用 put/stick paper cuttings on windows。" },
          { id: "during", category: "语法", label: "during festive occasions", alternatives: ["during festive occasions", "during festivals", "on festive occasions"], advice: "描述节庆期间时，during festive occasions 很自然。" },
          { id: "wishes", category: "表达", label: "express wishes for", alternatives: ["express their wishes for", "express wishes for", "wish for a happy life"], advice: "“表达对……的祝愿”可用 express one's wishes for。" },
        ],
        collocations: [
          { id: "festive-occasion", expression: "festive occasion", meaning: "喜庆场合", example: "The square is decorated for festive occasions." },
          { id: "wishes-for", expression: "express one's wishes for", meaning: "表达对……的祝愿", example: "They expressed their wishes for peace and prosperity." },
        ],
      },
    ],
  },
  {
    id: "tea-culture",
    sourceLabel: "六级翻译常见主题 · 传统文化",
    theme: "茶文化：慢下来的一杯茶",
    sentences: [
      { id: "tea-1", order: 1, chinese: "中国人饮茶的历史悠久，茶不仅是一种饮料，也是一种生活方式。", reference: "Chinese people have a long history of drinking tea. Tea is not only a beverage but also a way of life.", rubric: [
        { id: "long-history", category: "搭配", label: "have a long history of", alternatives: ["have a long history of", "a long history of drinking tea"], advice: "“有悠久的……历史”常用 have a long history of。" },
        { id: "not-only", category: "语法", label: "not only ... but also", alternatives: ["not only", "but also"], advice: "并列强调可用 not only ... but also ...。" },
        { id: "way-life", category: "表达", label: "a way of life", alternatives: ["a way of life", "lifestyle"], advice: "“一种生活方式”可以用 a way of life。" },
      ], collocations: [{ id: "long-history", expression: "have a long history of", meaning: "有悠久的……历史", example: "China has a long history of tea drinking." }, { id: "way-of-life", expression: "a way of life", meaning: "一种生活方式", example: "For many people, reading is a way of life." }] },
      { id: "tea-2", order: 2, chinese: "如今，越来越多的年轻人通过茶馆和品茶活动了解传统文化。", reference: "Today, an increasing number of young people learn about traditional culture through teahouses and tea-tasting activities.", rubric: [
        { id: "increasing-number", category: "表达", label: "an increasing number of", alternatives: ["an increasing number of", "more and more young people"], advice: "“越来越多的”可用 an increasing number of 或 more and more。" },
        { id: "learn-about", category: "搭配", label: "learn about", alternatives: ["learn about", "get to know"], advice: "“了解”常用 learn about。" },
        { id: "through", category: "语法", label: "through", alternatives: ["through teahouses", "through tea houses", "by visiting teahouses"], advice: "“通过某种渠道”可用 through + 名词。" },
      ], collocations: [{ id: "learn-about", expression: "learn about", meaning: "了解", example: "Visitors can learn about local customs." }, { id: "tea-tasting", expression: "tea-tasting activity", meaning: "品茶活动", example: "The museum holds tea-tasting activities every weekend." }] },
    ],
  },
  {
    id: "high-speed-rail",
    sourceLabel: "六级翻译常见主题 · 社会发展",
    theme: "高铁：缩短距离的轨道",
    sentences: [
      { id: "rail-1", order: 1, chinese: "近年来，高速铁路的发展使人们的出行更加方便，也加强了城市之间的联系。", reference: "In recent years, the development of high-speed rail has made travel more convenient and strengthened connections between cities.", rubric: [
        { id: "in-recent-years", category: "搭配", label: "in recent years", alternatives: ["in recent years", "recently"], advice: "“近年来”常用 in recent years。" },
        { id: "made-travel", category: "语法", label: "make travel more convenient", alternatives: ["made travel more convenient", "made traveling more convenient", "make travel convenient"], advice: "make + 宾语 + 形容词可表达“使……更……”。" },
        { id: "connections", category: "词汇", label: "connections between cities", alternatives: ["connections between cities", "links between cities", "city connections"], advice: "“城市之间的联系”可用 connections/links between cities。" },
      ], collocations: [{ id: "high-speed-rail", expression: "high-speed rail", meaning: "高速铁路", example: "High-speed rail has changed the way people travel." }, { id: "strengthen-connections", expression: "strengthen connections", meaning: "加强联系", example: "The project will strengthen connections between regions." }] },
      { id: "rail-2", order: 2, chinese: "它让人们能够在更短的时间内到达目的地，并促进了沿线地区的旅游和贸易。", reference: "It enables people to reach their destinations in less time and promotes tourism and trade in regions along the railway.", rubric: [
        { id: "enables", category: "语法", label: "enable sb. to do", alternatives: ["enables people to", "allows people to", "makes it possible for people to"], advice: "“使某人能够做某事”可用 enable/allow sb. to do。" },
        { id: "less-time", category: "搭配", label: "in less time", alternatives: ["in less time", "in a shorter time", "more quickly"], advice: "“在更短时间内”可用 in less time。" },
        { id: "along", category: "表达", label: "along the railway", alternatives: ["along the railway", "along the rail line", "areas along the line"], advice: "“沿线地区”可用 regions along the railway。" },
      ], collocations: [{ id: "reach-destination", expression: "reach one's destination", meaning: "到达目的地", example: "The train reaches its destination before noon." }, { id: "promote-tourism", expression: "promote tourism and trade", meaning: "促进旅游和贸易", example: "Better transport can promote tourism and trade." }] },
    ],
  },
  {
    id: "community-service",
    sourceLabel: "六级翻译常见主题 · 社会生活",
    theme: "社区服务：邻里间的温度",
    sentences: [
      { id: "community-1", order: 1, chinese: "随着人口老龄化，许多社区正在为老年人提供更方便的医疗和生活服务。", reference: "With the aging of the population, many communities are providing more convenient medical and daily-life services for older people.", rubric: [
        { id: "with-aging", category: "表达", label: "with the aging of the population", alternatives: ["with the aging of the population", "as the population ages", "with an aging population"], advice: "“随着人口老龄化”可用 with the aging of the population。" },
        { id: "provide-for", category: "搭配", label: "provide ... for", alternatives: ["providing", "provide", "offer"], advice: "“为某人提供”可用 provide/offer + 服务 + for + 人。" },
        { id: "older-people", category: "词汇", label: "older people", alternatives: ["older people", "the elderly", "senior citizens"], advice: "“老年人”可译为 older people、the elderly 或 senior citizens。" },
      ], collocations: [{ id: "aging-population", expression: "the aging of the population", meaning: "人口老龄化", example: "The aging of the population brings new challenges." }, { id: "provide-services", expression: "provide services for", meaning: "为……提供服务", example: "The center provides services for local residents." }] },
      { id: "community-2", order: 2, chinese: "志愿者也会定期上门探望，帮助他们解决日常生活中遇到的困难。", reference: "Volunteers also pay regular visits to them and help them solve difficulties they encounter in daily life.", rubric: [
        { id: "regular-visits", category: "搭配", label: "pay regular visits", alternatives: ["pay regular visits", "visit regularly", "make regular visits"], advice: "“定期上门探望”可用 pay regular visits。" },
        { id: "help-solve", category: "语法", label: "help sb. solve", alternatives: ["help them solve", "help them with", "assist them in solving"], advice: "help sb. solve sth. 是简洁自然的表达。" },
        { id: "encounter", category: "词汇", label: "encounter in daily life", alternatives: ["encounter in daily life", "face in daily life", "meet in daily life"], advice: "“在日常生活中遇到”可用 encounter/face in daily life。" },
      ], collocations: [{ id: "pay-visits", expression: "pay regular visits to", meaning: "定期探望", example: "Volunteers pay regular visits to people living alone." }, { id: "daily-life", expression: "daily life", meaning: "日常生活", example: "Technology has changed our daily life." }] },
    ],
  },
  {
    id: "ancient-town",
    sourceLabel: "六级翻译常见主题 · 文化遗产",
    theme: "古镇：被时间保存的街巷",
    sentences: [
      { id: "town-1", order: 1, chinese: "许多古镇保存着传统建筑和独特的生活习俗，是了解当地历史的重要窗口。", reference: "Many ancient towns preserve traditional buildings and distinctive customs, offering an important window into local history.", rubric: [
        { id: "preserve", category: "词汇", label: "preserve", alternatives: ["preserve", "keep"], advice: "“保存”传统文化与建筑时，preserve 更准确。" },
        { id: "distinctive-customs", category: "搭配", label: "distinctive customs", alternatives: ["distinctive customs", "unique customs", "special customs"], advice: "“独特的习俗”可用 distinctive customs。" },
        { id: "window-into", category: "表达", label: "a window into", alternatives: ["a window into", "a way to learn about"], advice: "“了解……的窗口”可用 a window into。" },
      ], collocations: [{ id: "preserve-tradition", expression: "preserve traditional buildings", meaning: "保存传统建筑", example: "The city works to preserve traditional buildings." }, { id: "window-into", expression: "a window into", meaning: "了解……的窗口", example: "The exhibition offers a window into local history." }] },
      { id: "town-2", order: 2, chinese: "为了保护这些文化遗产，当地政府限制过度商业开发，并鼓励居民参与保护工作。", reference: "To protect this cultural heritage, local governments limit excessive commercial development and encourage residents to take part in conservation efforts.", rubric: [
        { id: "to-protect", category: "语法", label: "to protect", alternatives: ["to protect", "in order to protect"], advice: "句首可用 to do 表目的。" },
        { id: "limit-development", category: "搭配", label: "limit excessive commercial development", alternatives: ["limit excessive commercial development", "restrict excessive development", "limit over-commercialization"], advice: "“限制过度商业开发”可用 limit excessive commercial development。" },
        { id: "take-part", category: "表达", label: "take part in conservation efforts", alternatives: ["take part in conservation efforts", "participate in conservation", "join protection work"], advice: "“参与保护工作”可用 take part in conservation efforts。" },
      ], collocations: [{ id: "cultural-heritage", expression: "cultural heritage", meaning: "文化遗产", example: "The site is an important part of cultural heritage." }, { id: "take-part", expression: "take part in", meaning: "参与", example: "Residents can take part in conservation efforts." }] },
    ],
  },
];

trainingSets.forEach((set) => {
  set.kind = "theme-practice";
  set.sentencePatterns = set.sentences.map((sentence) => ({
    function: "介绍文化或社会现象",
    frame: "... is one of the most ... and has a history of ...",
    example: sentence.reference,
  }));
});

trainingSets.unshift({
  id: "cet6-2013-12-mid-autumn",
  kind: "past-paper",
  sourceLabel: "2013 年 12 月 CET-6 真题 · 第 1 套",
  theme: "中秋节：团圆与传统",
  exam: { year: 2013, month: 12, paper: "第 1 套", sourceName: "文都教育：2013年12月大学英语六级考试真题", sourceUrl: "https://www.wendu.com/uploadfile/2017/1123/20171123094145760.pdf" },
  sentences: [
    { id: "mid-autumn-1", order: 1, chinese: "中国人自古以来就在中秋时节庆祝丰收，这与北美地区庆祝感恩节的习俗十分相似。", reference: "Since ancient times, Chinese people have celebrated the harvest during the Mid-Autumn Festival, much as people in North America celebrate Thanksgiving.", rubric: [{ id: "since-ancient", category: "搭配", label: "since ancient times", alternatives: ["since ancient times", "for centuries"], advice: "“自古以来”可用 since ancient times。" }, { id: "celebrate-harvest", category: "搭配", label: "celebrate the harvest", alternatives: ["celebrate the harvest", "celebrate harvest"], advice: "“庆祝丰收”可用 celebrate the harvest。" }, { id: "similar-custom", category: "表达", label: "similar to", alternatives: ["similar to", "much as"], advice: "比较两种习俗时可用 be similar to 或 much as。" }], collocations: [{ id: "since-ancient", expression: "since ancient times", meaning: "自古以来", example: "Tea has been enjoyed in China since ancient times." }] },
    { id: "mid-autumn-2", order: 2, chinese: "过中秋节的习俗在唐代早期开始在中国各地流行。", reference: "The tradition of celebrating the Mid-Autumn Festival became popular throughout China in the early Tang Dynasty.", rubric: [{ id: "tradition-of", category: "搭配", label: "the tradition of doing", alternatives: ["the tradition of celebrating", "tradition of celebrating"], advice: "“……的习俗”常用 the tradition of doing。" }, { id: "became-popular", category: "表达", label: "became popular", alternatives: ["became popular", "grew popular"], advice: "“开始流行”可用 became popular。" }, { id: "throughout", category: "词汇", label: "throughout China", alternatives: ["throughout china", "across china"], advice: "“在中国各地”可用 throughout China。" }], collocations: [{ id: "throughout-china", expression: "throughout China", meaning: "遍及中国各地", example: "The custom spread throughout China." }] },
  ],
  sentencePatterns: [{ function: "表达历史沿革", frame: "The tradition of ... became popular throughout ... in ...", example: "The tradition of celebrating the Mid-Autumn Festival became popular throughout China in the early Tang Dynasty." }],
});

trainingSets.push({ id: "prediction-green-life", kind: "prediction", sourceLabel: "原创预测 · 非真题", theme: "绿色生活：城市低碳出行", sentences: [
  { id: "prediction-1", order: 1, chinese: "越来越多的城市鼓励居民选择公共交通和骑行，以减少碳排放。", reference: "An increasing number of cities encourage residents to use public transport and cycle in order to reduce carbon emissions.", rubric: [{ id: "increase-cities", category: "表达", label: "an increasing number of", alternatives: ["an increasing number of", "more and more cities"], advice: "“越来越多的”可用 an increasing number of。" }], collocations: [{ id: "carbon-emissions", expression: "reduce carbon emissions", meaning: "减少碳排放", example: "The policy aims to reduce carbon emissions." }] },
  { id: "prediction-2", order: 2, chinese: "这种改变不仅改善了空气质量，也使社区生活更加便利。", reference: "This change not only improves air quality but also makes community life more convenient.", rubric: [{ id: "not-only-pred", category: "语法", label: "not only ... but also", alternatives: ["not only", "but also"], advice: "并列强调可用 not only ... but also。" }], collocations: [{ id: "air-quality", expression: "improve air quality", meaning: "改善空气质量", example: "Trees can improve air quality." }] },
], sentencePatterns: [{ function: "表达措施的双重效果", frame: "... not only ... but also ...", example: "This change not only improves air quality but also makes community life more convenient." }] });

export function isVerifiedPastPaper(set) { return set.kind === "past-paper" && Boolean(set.exam?.year && set.exam?.month && set.exam?.paper && set.exam?.sourceName && /^https:\/\//.test(set.exam?.sourceUrl || "")); }
export function getExtraPractice(state, limit = 3) { return [...trainingSets].filter((set) => !state.submissions[set.id]).sort((a, b) => Number(isVerifiedPastPaper(b)) - Number(isVerifiedPastPaper(a))).slice(0, limit); }
export function canSubmitAttempt(answers) { return Array.isArray(answers) && answers.length === 2 && answers.every((answer) => String(answer || "").trim()); }
const adviceByCategory = { "词汇": "每天选 3 个主题词：先遮住英文口头说出，再用其中 1 个写完整句。", "搭配": "把本周遗漏的搭配抄成“中文提示 → 英文搭配”，每天做 5 组替换。", "语法": "先圈出中文主干，再只写英文主干；确认主谓和时态后再补修饰。", "表达": "把参考译文中的句式骨架摘出，替换主题词后重写一遍。" };
export function getPracticeAdvice(state) { return Object.values(state.mistakes).sort((a, b) => b.count - a.count).reduce((list, item) => list.some((x) => x.category === item.category) ? list : [...list, { category: item.category, text: adviceByCategory[item.category] }], []).slice(0, 2); }

export function normalizeAnswer(answer) {
  return String(answer || "").toLowerCase().replace(/[.,;:!?()[\]{}"']/g, " ").replace(/\s+/g, " ").trim();
}

export function gradeSentence(prompt, answer) {
  const normalized = normalizeAnswer(answer);
  const matched = prompt.rubric.filter((item) => item.alternatives.some((term) => normalized.includes(normalizeAnswer(term))));
  const missed = prompt.rubric.filter((item) => !matched.includes(item));
  const notices = [];
  if (!String(answer || "").trim()) notices.push("这一句还没有译文，先试着完成再对照参考答案。");
  if (String(answer || "").trim() && /^[a-z]/.test(String(answer).trim())) notices.push("注意英文句首通常需要大写。 ");
  if (/\s{2,}/.test(String(answer || ""))) notices.push("句中有连续空格，提交前可整理一下。 ");
  if (String(answer || "").trim() && !/[.!?]$/.test(String(answer).trim())) notices.push("建议补上句末标点，让表达更完整。 ");
  return { coverage: prompt.rubric.length ? Math.round((matched.length / prompt.rubric.length) * 100) : 0, matched, missed, notices };
}

export function getTrainingSetForDate(date) {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return trainingSets[((day % trainingSets.length) + trainingSets.length) % trainingSets.length];
}

export function createEmptyState() {
  return { version: 1, submissions: {}, mistakes: [], collocations: {}, lastPracticeDate: null, streak: 0 };
}

function nextStreak(previousDate, today) {
  if (!previousDate) return 1;
  const previous = new Date(`${previousDate}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);
  const difference = Math.round((current - previous) / 86400000);
  return difference === 0 ? null : difference === 1 ? "increment" : 1;
}

export function recordSubmission(state, submission) {
  if (state.submissions[submission.setId]) return state;
  const mistakes = [...state.mistakes];
  submission.results.flatMap((result) => result.missed).forEach((item) => {
    const found = mistakes.find((mistake) => mistake.id === item.id);
    if (found) found.count += 1;
    else mistakes.push({ id: item.id, category: item.category, label: item.label, advice: item.advice, count: 1, setId: submission.setId });
  });
  const streakChange = nextStreak(state.lastPracticeDate, submission.date);
  return {
    ...state,
    submissions: { ...state.submissions, [submission.setId]: submission },
    mistakes,
    lastPracticeDate: submission.date,
    streak: streakChange === null ? state.streak : streakChange === "increment" ? state.streak + 1 : streakChange,
  };
}

export function toggleCollocation(state, collocation) {
  const saved = state.collocations[collocation.id];
  if (saved) return state;
  return { ...state, collocations: { ...state.collocations, [collocation.id]: { ...collocation, savedAt: new Date().toISOString(), mastered: false } } };
}

export function toggleMastered(state, id) {
  const item = state.collocations[id];
  if (!item) return state;
  return { ...state, collocations: { ...state.collocations, [id]: { ...item, mastered: !item.mastered } } };
}

export const STORAGE_KEY = "yike-learning-state-v1";

export function loadLearningState(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && parsed.version === 1 && parsed.submissions && Array.isArray(parsed.mistakes) && parsed.collocations ? parsed : createEmptyState();
  } catch {
    return createEmptyState();
  }
}

export function saveLearningState(state, storage) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
