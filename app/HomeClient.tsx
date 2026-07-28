"use client";

import {
  CSSProperties,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Room = "全部" | "客厅" | "厨房" | "卧室" | "卫生间" | "阳台";
type Tab = "today" | "week" | "archive";
type PlanPeriod = "week" | "quarter" | "half";
type Skin = "imagine" | "industrial" | "journal" | "pixel";
type WeekDay = "一" | "二" | "三" | "四" | "五" | "六" | "日";
type CalendarDay = {
  day: WeekDay;
  date: string;
  month: number;
  year: number;
  dateKey: string;
  current: boolean;
};
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Task = {
  id: string;
  title: string;
  room: Exclude<Room, "全部">;
  frequency: string;
  code: string;
  estimate: number;
  priority?: boolean;
  scheduledDays?: WeekDay[];
  scheduledMonthDay?: number;
  nextRunDate?: string;
};

const baseTasks: Task[] = [
  {
    id: "counter",
    title: "台面及灶台擦拭",
    room: "厨房",
    frequency: "每周 2–3 次",
    code: "KIT-012",
    estimate: 12,
    priority: true,
    scheduledDays: ["二", "五"],
  },
  {
    id: "floor",
    title: "地面清洁（扫地＋拖地）",
    room: "客厅",
    frequency: "每周 1–2 次",
    code: "LIV-004",
    estimate: 20,
    scheduledDays: ["三", "六"],
  },
  {
    id: "bed",
    title: "床品除尘与整理",
    room: "卧室",
    frequency: "每周 1 次",
    code: "BED-008",
    estimate: 15,
    scheduledDays: ["六"],
  },
  {
    id: "mirror",
    title: "镜子与台面去水渍",
    room: "卫生间",
    frequency: "每周 1 次",
    code: "BAT-006",
    estimate: 10,
    priority: true,
    scheduledDays: ["五"],
  },
  {
    id: "books",
    title: "书籍与常用物品归位",
    room: "客厅",
    frequency: "每周 1 次",
    code: "LIV-011",
    estimate: 8,
    scheduledDays: ["三"],
  },
  {
    id: "fridge",
    title: "冰箱过期食品检查",
    room: "厨房",
    frequency: "每月 7 日",
    code: "KIT-021",
    estimate: 10,
    scheduledMonthDay: 7,
  },
  {
    id: "plants",
    title: "绿植浇水与叶面养护",
    room: "阳台",
    frequency: "每周 1 次",
    code: "BAL-005",
    estimate: 12,
    scheduledDays: ["二"],
  },
  {
    id: "basin",
    title: "洗手盆与龙头清洁",
    room: "卫生间",
    frequency: "每周 2 次",
    code: "BAT-009",
    estimate: 10,
    scheduledDays: ["一", "四"],
  },
  {
    id: "dust",
    title: "桌面与电器表面除尘",
    room: "客厅",
    frequency: "每周 2 次",
    code: "LIV-014",
    estimate: 12,
    scheduledDays: ["二", "五"],
  },
  {
    id: "bins",
    title: "垃圾桶清洗消毒",
    room: "厨房",
    frequency: "每周 2 次",
    code: "KIT-018",
    estimate: 10,
    scheduledDays: ["三", "六"],
  },
  {
    id: "washer",
    title: "洗衣机胶圈与滤网检查",
    room: "阳台",
    frequency: "每周 1 次",
    code: "BAL-010",
    estimate: 12,
    scheduledDays: ["日"],
  },
];

const rooms: Room[] = ["全部", "客厅", "厨房", "卧室", "卫生间", "阳台"];
const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const skins: Array<{
  id: Skin;
  label: string;
  description: string;
}> = [
  { id: "imagine", label: "蓝图档案", description: "技术网格 / 档案系统" },
  { id: "industrial", label: "极简工艺", description: "色块分区 / 大留白" },
  { id: "journal", label: "晨光手账", description: "大圆角 / 彩色卡片" },
  { id: "pixel", label: "像素花园", description: "十字绣网格 / 森林色" },
];
const allWeekDays: WeekDay[] = ["一", "二", "三", "四", "五", "六", "日"];
const appTodayKey = "2026-08-07";
const appCurrentWeekStart = "2026-08-03";
const firstWeekStart = "2025-12-29";
const lastWeekStart = "2026-12-28";
const longTermYears = [2026, 2027];
const yearMonths = Array.from({ length: 12 }, (_, index) => index + 1);
const pixelSceneColumns = 36;
const pixelSceneRows = 18;
const yellowPixelFlowers = new Set([
  "7-10",
  "8-9",
  "8-10",
  "8-11",
  "9-10",
  "14-9",
  "15-8",
  "15-9",
  "15-10",
  "16-9",
  "28-12",
  "29-11",
  "29-12",
  "29-13",
  "30-12",
]);
const pinkPixelFlowers = new Set([
  "20-10",
  "21-9",
  "21-10",
  "21-11",
  "22-10",
  "11-14",
  "12-13",
  "12-14",
  "12-15",
  "13-14",
  "25-15",
  "26-14",
  "26-15",
  "26-16",
  "27-15",
]);
const flowerCenters = new Set([
  "8-10",
  "15-9",
  "21-10",
  "12-14",
  "26-15",
  "29-12",
]);

function getPixelSceneCell(index: number) {
  const column = index % pixelSceneColumns;
  const row = Math.floor(index / pixelSceneColumns);
  const key = `${column}-${row}`;
  const horizon =
    6 + Math.round(Math.sin(column * 0.42) * 1.45) + (column % 11 === 0 ? 1 : 0);
  const hash = (column * 17 + row * 29 + column * row * 3) % 19;

  if (yellowPixelFlowers.has(key)) {
    return flowerCenters.has(key)
      ? "pixel-cell flower-center"
      : "pixel-cell flower-yellow";
  }
  if (pinkPixelFlowers.has(key)) {
    return flowerCenters.has(key)
      ? "pixel-cell flower-center"
      : "pixel-cell flower-pink";
  }
  if (row < horizon) {
    const cloud =
      (row === 2 && column >= 4 && column <= 8) ||
      (row === 3 && column >= 18 && column <= 22) ||
      (row === 1 && column >= 29 && column <= 32);
    return `pixel-cell ${cloud ? "cloud" : "sky"} ${
      hash === 0 || hash === 7 ? "stitch" : ""
    }`;
  }

  const depth = row - horizon;
  const grassTone =
    depth > 7
      ? hash < 9
        ? "grass-deep"
        : "grass-dark"
      : hash < 5
        ? "grass-light"
        : hash < 12
          ? "grass-mid"
          : "grass-dark";
  return `pixel-cell ${grassTone} ${hash === 2 || hash === 13 ? "stitch" : ""}`;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function shiftDateKey(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKey(date);
}

function getWeekStartKey(dateKey: string) {
  const date = parseDateKey(dateKey);
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - weekday + 1);
  return formatDateKey(date);
}

function buildWeekDays(weekStart: string): CalendarDay[] {
  const monday = parseDateKey(weekStart);

  return allWeekDays.map((day, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    const dateKey = formatDateKey(date);

    return {
      day,
      date: String(date.getUTCDate()).padStart(2, "0"),
      month: date.getUTCMonth() + 1,
      year: date.getUTCFullYear(),
      dateKey,
      current: dateKey === appTodayKey,
    };
  });
}

function formatWeekRange(days: CalendarDay[]) {
  const first = days[0];
  const last = days[days.length - 1];

  if (first.year === last.year && first.month === last.month) {
    return `${first.year}年${first.month}月${first.date}–${last.date}日`;
  }

  if (first.year === last.year) {
    return `${first.year}年${first.month}月${first.date}日–${last.month}月${last.date}日`;
  }

  return `${first.year}.${String(first.month).padStart(2, "0")}.${first.date}–${last.year}.${String(last.month).padStart(2, "0")}.${last.date}`;
}

function getSuggestedMultiDays(anchor: WeekDay) {
  const anchorIndex = allWeekDays.indexOf(anchor);
  return [anchor, allWeekDays[(anchorIndex + 2) % allWeekDays.length]];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getMinimumLongTermDay(year: number, month: number) {
  return year === 2026 && month === 7 ? 27 : 1;
}

function isPastLongTermDate(year: number, month: number, day: number) {
  return year * 10000 + month * 100 + day < 20260727;
}

function getIsoWeekNumber(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const firstDayOfWeekYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));

  return Math.ceil(
    ((date.getTime() - firstDayOfWeekYear.getTime()) / 86400000 + 1) / 7,
  );
}

const cyclePlans = {
  quarter: [
    {
      id: "q-ac",
      date: "08.23",
      title: "空调滤网清洁与消毒",
      area: "全屋",
      code: "QTR-001",
      note: "拆洗滤网，晾干后复位",
    },
    {
      id: "q-hood",
      date: "08.30",
      title: "油烟机滤网深度清洗",
      area: "厨房",
      code: "QTR-002",
      note: "浸泡除油，检查集油盒",
    },
    {
      id: "q-fridge",
      date: "09.06",
      title: "冰箱冷凝区与背部除尘",
      area: "厨房",
      code: "QTR-003",
      note: "断电后清洁散热区域",
    },
    {
      id: "q-curtain",
      date: "09.13",
      title: "窗帘、纱窗集中清洗",
      area: "全屋",
      code: "QTR-004",
      note: "按材质选择清洗方式",
    },
    {
      id: "q-mattress",
      date: "09.20",
      title: "床垫翻面与除螨",
      area: "卧室",
      code: "QTR-005",
      note: "吸尘后通风 2 小时",
    },
    {
      id: "q-drain",
      date: "09.27",
      title: "厨房及卫浴下水养护",
      area: "厨卫",
      code: "QTR-006",
      note: "清理滤网并检查排水速度",
    },
  ],
  half: [
    {
      id: "h-alarm",
      date: "07月",
      title: "烟雾报警器电池检查",
      area: "全屋",
      code: "HYR-001",
      note: "测试警报，记录电池日期",
    },
    {
      id: "h-ac",
      date: "08月",
      title: "空调内部深度维护",
      area: "全屋",
      code: "HYR-002",
      note: "蒸发器、风轮及排水管检查",
    },
    {
      id: "h-storage",
      date: "09月",
      title: "全屋柜体断舍离",
      area: "全屋",
      code: "HYR-003",
      note: "按保留、转赠、丢弃分类",
    },
    {
      id: "h-light",
      date: "10月",
      title: "高位灯具与吊顶除尘",
      area: "全屋",
      code: "HYR-004",
      note: "断电操作，检查灯泡状态",
    },
    {
      id: "h-upholstery",
      date: "11月",
      title: "沙发与床垫深度清洁",
      area: "客卧",
      code: "HYR-005",
      note: "重点处理缝隙与织物表面",
    },
    {
      id: "h-appliance",
      date: "12月",
      title: "冰箱与洗衣机保养",
      area: "家电",
      code: "HYR-006",
      note: "清洁密封条、滤网与滚筒",
    },
  ],
};

function readStoredTasks(): Task[] {
  try {
    const saved = window.localStorage.getItem("household-archive-custom");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function isTaskScheduled(task: Task, calendarDay: CalendarDay) {
  if (task.scheduledMonthDay) {
    return Number(calendarDay.date) === task.scheduledMonthDay;
  }

  if (task.nextRunDate) {
    return task.nextRunDate === calendarDay.dateKey;
  }

  return (task.scheduledDays ?? ["五"]).includes(calendarDay.day);
}

function getCompletionKey(dateKey: string, taskId: string) {
  return `${dateKey}:${taskId}`;
}

function updatePwaSkinAssets(nextSkin: Skin) {
  const themeColors: Record<Skin, string> = {
    imagine: "#f4f4f1",
    industrial: "#f5f5f3",
    journal: "#eceff2",
    pixel: "#d6e3d5",
  };

  document.documentElement.dataset.startupSkin = nextSkin;
  document
    .getElementById("pwa-manifest")
    ?.setAttribute(
      "href",
      `${publicBasePath}/manifest-${nextSkin}.webmanifest`,
    );
  document
    .getElementById("pwa-apple-icon")
    ?.setAttribute("href", `${publicBasePath}/icons/${nextSkin}-180.png`);
  document
    .getElementById("pwa-theme-color")
    ?.setAttribute("content", themeColors[nextSkin]);
}

export default function Home() {
  const appScrollRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [planPeriod, setPlanPeriod] = useState<PlanPeriod>("week");
  const [skin, setSkin] = useState<Skin>("industrial");
  const [isSkinMenuOpen, setIsSkinMenuOpen] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState(
    appCurrentWeekStart,
  );
  const [selectedDay, setSelectedDay] = useState<WeekDay>("五");
  const [activeRoom, setActiveRoom] = useState<Room>("全部");
  const [completed, setCompleted] = useState<string[]>([
    "2026-08-05:floor",
    "2026-08-05:books",
  ]);
  const [cycleCompleted, setCycleCompleted] = useState<string[]>([]);
  const [customTasks, setCustomTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newRoom, setNewRoom] = useState<Exclude<Room, "全部">>("客厅");
  const [newFrequency, setNewFrequency] = useState("每周 1 次");
  const [newTaskDays, setNewTaskDays] = useState<WeekDay[]>(["五"]);
  const [newMonthDay, setNewMonthDay] = useState(7);
  const [newLongTermYear, setNewLongTermYear] = useState(2026);
  const [newLongTermMonth, setNewLongTermMonth] = useState(8);
  const [newLongTermDay, setNewLongTermDay] = useState(7);
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null);
  const [isInstallHelpOpen, setIsInstallHelpOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("household-archive-done");
      if (saved) {
        const stored: string[] = JSON.parse(saved);
        setCompleted(
          stored.map((value) =>
            value.includes(":") ? value : `${appTodayKey}:${value}`,
          ),
        );
      }
      const savedCycle = window.localStorage.getItem(
        "household-archive-cycle-done",
      );
      if (savedCycle) setCycleCompleted(JSON.parse(savedCycle));
      const savedSkin = window.localStorage.getItem("household-archive-skin");
      const migratedSkin =
        savedSkin === "blueprint"
          ? "imagine"
          : savedSkin === "warm"
            ? "journal"
            : savedSkin === "forest"
              ? "pixel"
              : savedSkin;
      if (skins.some((item) => item.id === migratedSkin)) {
        const restoredSkin = migratedSkin as Skin;
        setSkin(restoredSkin);
        updatePwaSkinAssets(restoredSkin);
      }
      setCustomTasks(readStoredTasks());
    } catch {
      // The app remains fully usable when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const navigatorWithStandalone = window.navigator as Navigator & {
      standalone?: boolean;
    };
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const syncStandaloneState = () =>
      setIsStandalone(
        displayMode.matches || navigatorWithStandalone.standalone === true,
      );
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
      setNotice("已安装到手机桌面");
      window.setTimeout(() => setNotice(""), 1800);
    };

    syncStandaloneState();
    displayMode.addEventListener?.("change", syncStandaloneState);
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${publicBasePath}/sw.js`, {
          scope: `${publicBasePath || ""}/`,
        })
        .catch(() => {
          // Online use remains available if the browser blocks offline caching.
        });
    }

    return () => {
      displayMode.removeEventListener?.("change", syncStandaloneState);
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    appScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  useEffect(() => {
    if (!isSkinMenuOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setIsSkinMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSkinMenuOpen]);

  const tasks = useMemo(() => [...baseTasks, ...customTasks], [customTasks]);
  const weekDays = useMemo(
    () => buildWeekDays(selectedWeekStart),
    [selectedWeekStart],
  );
  const selectedDayMeta =
    weekDays.find((item) => item.day === selectedDay) ?? weekDays[4];
  const selectedDayTasks = useMemo(
    () => tasks.filter((task) => isTaskScheduled(task, selectedDayMeta)),
    [selectedDayMeta, tasks],
  );
  const filteredTasks = useMemo(
    () =>
      activeRoom === "全部"
        ? selectedDayTasks
        : selectedDayTasks.filter((task) => task.room === activeRoom),
    [activeRoom, selectedDayTasks],
  );

  const doneCount = selectedDayTasks.filter((task) =>
    completed.includes(getCompletionKey(selectedDayMeta.dateKey, task.id)),
  ).length;
  const progress = selectedDayTasks.length
    ? Math.round((doneCount / selectedDayTasks.length) * 100)
    : 0;
  const totalMinutes = selectedDayTasks.reduce(
    (sum, task) => sum + task.estimate,
    0,
  );
  const finishedMinutes = selectedDayTasks
    .filter((task) =>
      completed.includes(getCompletionKey(selectedDayMeta.dateKey, task.id)),
    )
    .reduce((sum, task) => sum + task.estimate, 0);
  const remainingMinutes = Math.max(totalMinutes - finishedMinutes, 0);
  const priorityCount = selectedDayTasks.filter(
    (task) => task.priority,
  ).length;
  const annualWeekNumber = getIsoWeekNumber(
    selectedDayMeta.year,
    selectedDayMeta.month,
    Number(selectedDayMeta.date),
  );
  const isActualToday = selectedDayMeta.dateKey === appTodayKey;
  const weekRangeLabel = formatWeekRange(weekDays);
  const isCurrentWeek = selectedWeekStart === appCurrentWeekStart;
  const pageTitle =
    activeTab === "today"
      ? isActualToday
        ? "今日作业"
        : `周${selectedDay}作业`
      : activeTab === "week"
        ? "周期计划"
        : "档案总览";
  const selectedDateHeading = `${selectedDayMeta.month}月${selectedDayMeta.date}日 · ${
    isActualToday ? "今日" : `周${selectedDay}`
  }`;
  const isDailyFrequency = newFrequency === "每天 1 次";
  const isMultiFrequency = newFrequency === "每周 2–3 次";
  const isWeeklyFrequency =
    newFrequency === "每周 1 次" || isMultiFrequency;
  const isMonthlyFrequency = newFrequency === "每月 1 次";
  const isLongTermFrequency =
    newFrequency === "每季度 1 次" || newFrequency === "每半年 1 次";
  const newLongTermDate = `${newLongTermYear}-${String(
    newLongTermMonth,
  ).padStart(2, "0")}-${String(newLongTermDay).padStart(2, "0")}`;
  const longTermDaysInMonth = getDaysInMonth(
    newLongTermYear,
    newLongTermMonth,
  );
  const isNewScheduleValid = isDailyFrequency
    ? newTaskDays.length === allWeekDays.length
    : isMultiFrequency
      ? newTaskDays.length >= 2 && newTaskDays.length <= 3
      : newFrequency === "每周 1 次"
        ? newTaskDays.length === 1
        : isMonthlyFrequency
          ? newMonthDay >= 1 && newMonthDay <= 31
          : isLongTermFrequency &&
            !isPastLongTermDate(
              newLongTermYear,
              newLongTermMonth,
              newLongTermDay,
            );
  const scheduleLegend = isDailyFrequency
    ? "每天执行"
    : isMultiFrequency
      ? "选择 2–3 个星期"
      : newFrequency === "每周 1 次"
        ? "选择星期"
        : isMonthlyFrequency
          ? "选择每月执行日"
          : "首次执行日期";
  const scheduleHint = isDailyFrequency
    ? "已自动选择整周，每天都会出现在任务清单中"
    : isMultiFrequency
      ? `已选择 ${newTaskDays.length} 天，请选择 2–3 天`
      : newFrequency === "每周 1 次"
        ? "任务将在所选星期重复"
        : isMonthlyFrequency
          ? `任务将在每月 ${newMonthDay} 日出现`
          : "从所选日期开始计算下一次周期";
  const submitScheduleLabel = isDailyFrequency
    ? "添加为每日任务"
    : isMultiFrequency
      ? `添加到 ${newTaskDays.map((day) => `周${day}`).join("、")}`
      : newFrequency === "每周 1 次"
        ? `添加到周${newTaskDays[0] ?? selectedDay}`
        : isMonthlyFrequency
          ? `设为每月 ${newMonthDay} 日`
          : `首次执行 ${newLongTermDate.slice(5).replace("-", "月")}日`;

  function toggleTaskForDate(id: string, dateKey: string) {
    const completionKey = getCompletionKey(dateKey, id);
    const next = completed.includes(completionKey)
      ? completed.filter((key) => key !== completionKey)
      : [...completed, completionKey];
    setCompleted(next);
    window.localStorage.setItem("household-archive-done", JSON.stringify(next));
    setNotice(
      next.includes(completionKey)
        ? "已完成一项，档案已更新"
        : "已撤销完成状态",
    );
    window.setTimeout(() => setNotice(""), 1800);
  }

  function cycleWeeklyTask(id: string, occurrences: CalendarDay[]) {
    const occurrenceKeys = occurrences.map((item) =>
      getCompletionKey(item.dateKey, id),
    );
    const completedCount = occurrenceKeys.filter((key) =>
      completed.includes(key),
    ).length;
    const isComplete = completedCount === occurrenceKeys.length;
    const selectedDateKey = getCompletionKey(selectedDayMeta.dateKey, id);
    const nextKey =
      occurrenceKeys.includes(selectedDateKey) &&
      !completed.includes(selectedDateKey)
        ? selectedDateKey
        : occurrenceKeys.find((key) => !completed.includes(key));
    const next = isComplete
      ? completed.filter((key) => !occurrenceKeys.includes(key))
      : nextKey
        ? [...completed, nextKey]
        : completed;

    setCompleted(next);
    window.localStorage.setItem("household-archive-done", JSON.stringify(next));
    setNotice(
      isComplete
        ? "本周完成次数已重置"
        : `本周进度 ${completedCount + 1}/${occurrenceKeys.length}`,
    );
    window.setTimeout(() => setNotice(""), 1800);
  }

  function toggleTask(id: string) {
    toggleTaskForDate(id, selectedDayMeta.dateKey);
  }

  function changeWeek(offset: -1 | 1) {
    setSelectedWeekStart((current) => shiftDateKey(current, offset * 7));
  }

  function goToCurrentWeek() {
    setSelectedWeekStart(appCurrentWeekStart);
    setSelectedDay("五");
  }

  function selectSkin(nextSkin: Skin) {
    const nextSkinMeta = skins.find((item) => item.id === nextSkin);
    setSkin(nextSkin);
    setIsSkinMenuOpen(false);
    window.localStorage.setItem("household-archive-skin", nextSkin);
    updatePwaSkinAssets(nextSkin);
    setNotice(`已切换为${nextSkinMeta?.label}皮肤`);
    window.setTimeout(() => setNotice(""), 1800);
  }

  async function installApp() {
    if (isStandalone) {
      setNotice("私人版本已经安装在当前设备");
      window.setTimeout(() => setNotice(""), 1800);
      return;
    }

    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
      }
      return;
    }

    setIsInstallHelpOpen(true);
  }

  function openToday() {
    goToCurrentWeek();
    setActiveTab("today");
  }

  function toggleCycleTask(id: string) {
    const next = cycleCompleted.includes(id)
      ? cycleCompleted.filter((taskId) => taskId !== id)
      : [...cycleCompleted, id];
    setCycleCompleted(next);
    window.localStorage.setItem(
      "household-archive-cycle-done",
      JSON.stringify(next),
    );
    setNotice(next.includes(id) ? "周期维护已完成" : "已撤销完成状态");
    window.setTimeout(() => setNotice(""), 1800);
  }

  function openTaskModal() {
    const longTermBaseDate = parseDateKey(
      selectedDayMeta.dateKey < appTodayKey
        ? appTodayKey
        : selectedDayMeta.dateKey,
    );
    setNewFrequency("每周 1 次");
    setNewTaskDays([selectedDay]);
    setNewMonthDay(Number(selectedDayMeta.date));
    setNewLongTermYear(longTermBaseDate.getUTCFullYear());
    setNewLongTermMonth(longTermBaseDate.getUTCMonth() + 1);
    setNewLongTermDay(longTermBaseDate.getUTCDate());
    setIsAdding(true);
  }

  function chooseFrequency(frequency: string) {
    setNewFrequency(frequency);

    if (frequency === "每天 1 次") {
      setNewTaskDays(allWeekDays);
      return;
    }

    if (frequency === "每周 2–3 次") {
      setNewTaskDays((current) =>
        current.length >= 2 && current.length <= 3
          ? current
          : getSuggestedMultiDays(current[0] ?? selectedDay),
      );
      return;
    }

    if (frequency === "每周 1 次") {
      setNewTaskDays((current) => [current[0] ?? selectedDay]);
    }
  }

  function chooseLongTermYear(year: number) {
    const month = year === 2026 && newLongTermMonth < 7 ? 7 : newLongTermMonth;
    const minimumDay = getMinimumLongTermDay(year, month);
    const maximumDay = getDaysInMonth(year, month);

    setNewLongTermYear(year);
    setNewLongTermMonth(month);
    setNewLongTermDay((current) =>
      Math.max(minimumDay, Math.min(current, maximumDay)),
    );
  }

  function chooseLongTermMonth(month: number) {
    const minimumDay = getMinimumLongTermDay(newLongTermYear, month);
    const maximumDay = getDaysInMonth(newLongTermYear, month);

    setNewLongTermMonth(month);
    setNewLongTermDay((current) =>
      Math.max(minimumDay, Math.min(current, maximumDay)),
    );
  }

  function toggleNewTaskDay(day: WeekDay) {
    if (isDailyFrequency) return;

    if (!isMultiFrequency) {
      setNewTaskDays([day]);
      return;
    }

    setNewTaskDays((current) => {
      if (current.includes(day)) {
        return current.filter((item) => item !== day);
      }
      return current.length < 3 ? [...current, day] : current;
    });
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim() || !isNewScheduleValid) return;

    const task: Task = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      room: newRoom,
      frequency: isMonthlyFrequency
        ? `每月 ${newMonthDay} 日`
        : isLongTermFrequency
          ? `${newFrequency} · 首次 ${newLongTermDate
              .slice(5)
              .replace("-", ".")}`
          : newFrequency,
      code: `USR-${String(customTasks.length + 1).padStart(3, "0")}`,
      estimate: 15,
      scheduledDays:
        isDailyFrequency || isWeeklyFrequency ? newTaskDays : undefined,
      scheduledMonthDay: isMonthlyFrequency ? newMonthDay : undefined,
      nextRunDate: isLongTermFrequency ? newLongTermDate : undefined,
    };
    const next = [...customTasks, task];
    setCustomTasks(next);
    window.localStorage.setItem(
      "household-archive-custom",
      JSON.stringify(next),
    );
    setNewTitle("");
    const targetWeekDays = isLongTermFrequency
      ? buildWeekDays(getWeekStartKey(newLongTermDate))
      : weekDays;
    const matchedDay = isLongTermFrequency
      ? targetWeekDays.find((item) => item.dateKey === newLongTermDate)?.day
      : isMonthlyFrequency
        ? targetWeekDays.find(
            (item) => Number(item.date) === newMonthDay,
          )?.day
        : undefined;
    if (isLongTermFrequency) {
      setSelectedWeekStart(getWeekStartKey(newLongTermDate));
    }
    setSelectedDay(matchedDay ?? newTaskDays[0] ?? selectedDay);
    setIsAdding(false);
    setActiveTab("today");
    setNotice("新任务已归档");
    window.setTimeout(() => setNotice(""), 1800);
  }

  function resetArchive() {
    const visibleDates = new Set(weekDays.map((item) => item.dateKey));
    const next = completed.filter(
      (key) => !visibleDates.has(key.split(":")[0]),
    );
    setCompleted(next);
    window.localStorage.setItem(
      "household-archive-done",
      JSON.stringify(next),
    );
    setNotice("本周打卡已重置");
    window.setTimeout(() => setNotice(""), 1800);
  }

  const weekNavigator = (
    <div className="week-navigator" aria-label="切换周次">
      <button
        aria-label="查看上一周"
        disabled={selectedWeekStart === firstWeekStart}
        onClick={() => changeWeek(-1)}
        type="button"
      >
        <b>←</b>
        <span>上一周</span>
      </button>
      <button
        aria-label={isCurrentWeek ? "当前周" : "返回本周"}
        className="week-range-summary"
        disabled={isCurrentWeek}
        onClick={goToCurrentWeek}
        type="button"
      >
        <small>
          2026 / W{String(annualWeekNumber).padStart(2, "0")}
        </small>
        <strong>{weekRangeLabel}</strong>
        <em>{isCurrentWeek ? "本周" : "返回本周"}</em>
      </button>
      <button
        aria-label="查看下一周"
        disabled={selectedWeekStart === lastWeekStart}
        onClick={() => changeWeek(1)}
        type="button"
      >
        <b>→</b>
        <span>下一周</span>
      </button>
    </div>
  );

  const skinPicker = (
    <div className="skin-picker">
      <button
        aria-controls="skin-menu"
        aria-expanded={isSkinMenuOpen}
        aria-haspopup="listbox"
        aria-label={`当前为${skins.find((item) => item.id === skin)?.label}皮肤，打开皮肤菜单`}
        className="skin-switcher"
        onClick={() => setIsSkinMenuOpen((current) => !current)}
        type="button"
      >
        <i aria-hidden="true" />
        <span>皮肤 · {skins.find((item) => item.id === skin)?.label}</span>
        <b aria-hidden="true">{isSkinMenuOpen ? "↑" : "↓"}</b>
      </button>
      {isSkinMenuOpen && (
        <>
          <button
            aria-label="关闭皮肤菜单"
            className="skin-menu-scrim"
            onClick={() => setIsSkinMenuOpen(false)}
            type="button"
          />
          <ul
            aria-label="选择页面皮肤"
            className="skin-menu"
            id="skin-menu"
            role="listbox"
          >
            {skins.map((item, index) => (
              <li key={item.id}>
                <button
                  aria-selected={skin === item.id}
                  className={skin === item.id ? "active" : ""}
                  onClick={() => selectSkin(item.id)}
                  role="option"
                  type="button"
                >
                  <i
                    aria-hidden="true"
                    className={`skin-preview skin-preview-${item.id}`}
                  />
                  <span>
                    <small>{String(index + 1).padStart(2, "0")}</small>
                    <strong>{item.label}</strong>
                    <em>{item.description}</em>
                  </span>
                  <b aria-hidden="true">{skin === item.id ? "✓" : "→"}</b>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );

  const skinHeader = (
    <header className={`app-header app-header-${skin}`}>
      {skin === "imagine" && (
        <>
          <div className="technical-strip blueprint-strip">
            <div>
              <span>档案编号</span>
              <strong>
                H.A—{selectedDayMeta.year}—
                {String(selectedDayMeta.month).padStart(2, "0")}
              </strong>
            </div>
            <div>
              <span>年度周次</span>
              <strong>
                第 {String(annualWeekNumber).padStart(2, "0")} 周 / 周
                {selectedDay}
              </strong>
            </div>
            <div className="skin-cell">
              <span>更新日期</span>
              <strong>
                {String(selectedDayMeta.month).padStart(2, "0")}.
                {selectedDayMeta.date}.{selectedDayMeta.year}
              </strong>
              {skinPicker}
            </div>
          </div>

          <div className="hero-title blueprint-landing">
            <p>HOUSEHOLD ARCHIVE / 家庭维护系统</p>
            <h1>{pageTitle}</h1>
            <div className="title-footer">
              <span>ARCHIVE_VOL.01</span>
              <span>GRID UNIT: 10MM</span>
            </div>
          </div>
        </>
      )}

      {skin === "industrial" && (
        <>
          <div className="industrial-masthead">
            <div className="industrial-brand">
              <b>HA / 2026</b>
              <small>家庭维护工作台</small>
            </div>
            <div className="industrial-period">
              <span>W{String(annualWeekNumber).padStart(2, "0")}</span>
              <strong>{selectedDateHeading}</strong>
            </div>
            {skinPicker}
          </div>
          <div className="industrial-landing">
            <div>
              <p>家庭维护系统 · 正常运行</p>
              <h1>{pageTitle}</h1>
            </div>
            <div className="industrial-hero-stat">
              <strong>{String(progress).padStart(2, "0")}</strong>
              <span>% 完成进度</span>
            </div>
          </div>
        </>
      )}

      {skin === "journal" && (
        <>
          <div className="journal-topbar">
            <div>
              <strong>
                {selectedDayMeta.month}月{selectedDayMeta.date}日 周{selectedDay}
              </strong>
              <small>每日概览</small>
            </div>
            {skinPicker}
          </div>
          <div className="journal-landing">
            <div className="journal-week">
              <strong>{String(annualWeekNumber).padStart(2, "0")}</strong>
              <span>年度周</span>
            </div>
            <div className="journal-heading">
              <span>轻触 · 家务卡片</span>
              <h1>{isActualToday ? "嗨，今天照顾什么？" : pageTitle}</h1>
              <p>
                {pageTitle} · {doneCount}/{selectedDayTasks.length} 个任务 ·
                进度 {progress}%
              </p>
            </div>
            <div className="journal-micro-grid" aria-hidden="true">
              {Array.from({ length: 28 }, (_, index) => (
                <i
                  className={index < Math.round((progress / 100) * 28) ? "on" : ""}
                  key={index}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {skin === "pixel" && (
        <>
          <div className="pixel-topbar">
            <div>
              <span>家务花园.EXE</span>
              <strong>W{String(annualWeekNumber).padStart(2, "0")}</strong>
            </div>
            {skinPicker}
          </div>
          <div className="pixel-landing">
            <div className="pixel-scene" aria-hidden="true">
              {Array.from(
                { length: pixelSceneColumns * pixelSceneRows },
                (_, index) => (
                  <i className={getPixelSceneCell(index)} key={index} />
                ),
              )}
            </div>
            <div className="pixel-title-panel">
              <p>任务种植区 / {selectedDateHeading}</p>
              <h1>{pageTitle}</h1>
              <div className="pixel-hero-status">
                <span>存档 {selectedDayMeta.dateKey.replaceAll("-", ".")}</span>
                <span>
                  成长 {doneCount}/{selectedDayTasks.length}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );

  const todayDashboard =
    skin === "imagine" ? (
      <section className="today-overview blueprint-overview" aria-label="今日概览">
        <div
          className="progress-dial"
          style={{
            background: `conic-gradient(var(--blue) ${progress}%, rgba(var(--accent-rgb), 0.12) ${progress}% 100%)`,
          }}
          aria-label={`${pageTitle}进度 ${progress}%`}
        >
          <div>
            <strong>
              {doneCount}
              <small>/{selectedDayTasks.length}</small>
            </strong>
            <span>已完成</span>
          </div>
        </div>
        <div className="overview-copy">
          <div className="section-kicker">
            <span>01</span>
            <p>{isActualToday ? "今日执行" : "所选日期任务"}</p>
          </div>
          <h2>{selectedDateHeading}</h2>
          <p>
            预计剩余 {remainingMinutes} 分钟 · 优先处理 {priorityCount} 项
          </p>
          <div className="progress-line">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>
    ) : skin === "industrial" ? (
      <section
        className="skin-dashboard industrial-dashboard"
        aria-label="今日概览"
      >
        <div className="industrial-progress-block">
          <span>01 / 执行进度</span>
          <strong>
            {doneCount}
            <small>/{selectedDayTasks.length}</small>
          </strong>
          <p>已完成任务</p>
        </div>
        <div className="industrial-metrics">
          <article>
            <span>预计剩余</span>
            <strong>{remainingMinutes}&apos;</strong>
          </article>
          <article>
            <span>优先处理</span>
            <strong>{String(priorityCount).padStart(2, "0")}</strong>
          </article>
          <div className="industrial-meter">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>
    ) : skin === "journal" ? (
      <section className="skin-dashboard journal-dashboard" aria-label="今日概览">
        <div>
          <small>● 家务提醒 · 刚刚</small>
          <strong>让家里轻一点。</strong>
          <p>预计还需 {remainingMinutes} 分钟，优先处理 {priorityCount} 项任务</p>
        </div>
        <span className="journal-completion">
          <b>{doneCount}</b> / {selectedDayTasks.length}
        </span>
      </section>
    ) : (
      <section className="skin-dashboard pixel-dashboard" aria-label="今日概览">
        <div className="pixel-map" aria-hidden="true">
          {Array.from({ length: 40 }, (_, index) => (
            <i
              className={
                index < Math.round((progress / 100) * 40)
                  ? index % 9 === 0
                    ? "flower"
                    : "grown"
                  : ""
              }
              key={index}
            />
          ))}
        </div>
        <div>
          <span>花园状态</span>
          <strong>{progress}% 已生长</strong>
          <small>剩余 {remainingMinutes} 分钟</small>
        </div>
      </section>
    );

  return (
    <main className="blueprint-shell">
      <section
        className="mini-app"
        data-skin={skin}
        aria-label="家务档案小程序"
        ref={appScrollRef}
      >
        {skinHeader}

        <div className="content-frame">
          {activeTab === "today" && (
            <>
              {todayDashboard}

              {weekNavigator}

              <section className="week-ruler" aria-label="本周日期">
                {weekDays.map((item) => {
                  const dayTasks = tasks.filter((task) =>
                    isTaskScheduled(task, item),
                  );
                  const dayDone = dayTasks.filter((task) =>
                    completed.includes(
                      getCompletionKey(item.dateKey, task.id),
                    ),
                  ).length;
                  return (
                    <button
                      aria-label={`切换到周${item.day}，${item.month}月${item.date}日`}
                      aria-pressed={selectedDay === item.day}
                      className={selectedDay === item.day ? "current" : ""}
                      key={item.day}
                      onClick={() => setSelectedDay(item.day)}
                      type="button"
                    >
                      <span>周{item.day}</span>
                      <strong>{item.date}</strong>
                      <em
                        className={
                          dayTasks.length > 0 && dayDone === dayTasks.length
                            ? "complete"
                            : ""
                        }
                      >
                        {dayDone}/{dayTasks.length}
                      </em>
                    </button>
                  );
                })}
              </section>

              <section className="task-section">
                <div className="filter-heading">
                  <div>
                    <span>周{selectedDay}任务清单</span>
                    <strong>
                      {String(filteredTasks.length).padStart(2, "0")} 项任务
                    </strong>
                  </div>
                  <button
                    className="add-inline"
                    onClick={openTaskModal}
                    type="button"
                  >
                    ＋ 新任务
                  </button>
                </div>

                <div className="room-filters" aria-label="按房间筛选">
                  {rooms.map((room) => (
                    <button
                      className={activeRoom === room ? "active" : ""}
                      key={room}
                      onClick={() => setActiveRoom(room)}
                      type="button"
                    >
                      {room}
                    </button>
                  ))}
                </div>

                <div className="task-list">
                  {filteredTasks.map((task, index) => {
                    const isDone = completed.includes(
                      getCompletionKey(selectedDayMeta.dateKey, task.id),
                    );
                    const weeklyOccurrences =
                      task.frequency.includes("每周") &&
                      (task.scheduledDays?.length ?? 0) > 1
                        ? weekDays.filter((item) =>
                            task.scheduledDays?.includes(item.day),
                          )
                        : [];
                    const completedOccurrences = weeklyOccurrences.filter(
                      (item) =>
                        completed.includes(
                          getCompletionKey(item.dateKey, task.id),
                        ),
                    ).length;
                    const isFullyDone =
                      weeklyOccurrences.length > 1
                        ? completedOccurrences === weeklyOccurrences.length
                        : isDone;
                    const hasMultipleOccurrences =
                      weeklyOccurrences.length > 1;
                    const progressPercent = hasMultipleOccurrences
                      ? Math.round(
                          (completedOccurrences /
                            weeklyOccurrences.length) *
                            100,
                        )
                      : 0;
                    const activateTask = () => {
                      if (hasMultipleOccurrences) {
                        cycleWeeklyTask(task.id, weeklyOccurrences);
                      } else {
                        toggleTask(task.id);
                      }
                    };
                    const handleTaskKeyDown = (
                      event: KeyboardEvent<HTMLElement>,
                    ) => {
                      if (
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        activateTask();
                      }
                    };
                    return (
                      <article
                        className={`task-card ${
                          isDone ? "current-done" : ""
                        } ${isFullyDone ? "is-done" : ""} ${
                          hasMultipleOccurrences ? "has-occurrences" : ""
                        }`}
                        onClick={activateTask}
                        onKeyDown={handleTaskKeyDown}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isFullyDone}
                        aria-label={
                          hasMultipleOccurrences
                            ? `${task.title}，本周已完成 ${completedOccurrences}/${weeklyOccurrences.length} 次，${
                                isFullyDone
                                  ? "轻点重置本周次数"
                                  : "轻点继续打卡"
                              }`
                            : `${task.title}，${
                                isDone
                                  ? "已完成，轻点整行撤销"
                                  : "未完成，轻点整行打卡"
                              }`
                        }
                        style={
                          hasMultipleOccurrences
                            ? ({
                                "--task-progress": `${progressPercent}%`,
                              } as CSSProperties)
                            : undefined
                        }
                        key={task.id}
                      >
                        <span className="task-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {hasMultipleOccurrences ? (
                          <span
                            className="task-progress-count"
                            aria-hidden="true"
                          >
                            <strong>{completedOccurrences}</strong>
                            <small>/{weeklyOccurrences.length}</small>
                          </span>
                        ) : (
                          <span
                            className="task-primary-check"
                            aria-hidden="true"
                          >
                            <span className="checkmark">
                              {isDone ? "✓" : ""}
                            </span>
                          </span>
                        )}
                        <span className="task-copy">
                          <strong>{task.title}</strong>
                          <span>
                            {task.room} / {task.frequency}
                          </span>
                          {hasMultipleOccurrences && (
                            <span className="task-progress-note">
                              <span>
                                {weeklyOccurrences
                                  .map((item) => `周${item.day}`)
                                  .join(" · ")}
                              </span>
                              <b>
                                {isFullyDone ? "本周已完成" : "轻点整行打卡"}
                              </b>
                            </span>
                          )}
                        </span>
                        <span className="task-meta">
                          <small>{task.code}</small>
                          <strong>{task.estimate}&apos;</strong>
                        </span>
                      </article>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {activeTab === "week" && (
            <section className="week-view" aria-labelledby="week-title">
              <div className="page-heading">
                <div className="section-kicker">
                  <span>02</span>
                  <p>周期维护</p>
                </div>
                <h2 id="week-title">
                  {planPeriod === "week" &&
                    (isCurrentWeek
                      ? "本周安排"
                      : `第 ${annualWeekNumber} 周安排`)}
                  {planPeriod === "quarter" && "第三季度"}
                  {planPeriod === "half" && "下半年"}
                </h2>
                <p>
                  {planPeriod === "week" &&
                    `${selectedDayMeta.month}月${selectedDayMeta.date}日 / 周${selectedDay} / ${selectedDayTasks.length} 项维护任务`}
                  {planPeriod === "quarter" && "2026年第 3 季度 / 6 项深度维护"}
                  {planPeriod === "half" && "2026年下半年 / 6 项系统保养"}
                </p>
              </div>

              <div className="period-switch" aria-label="选择计划周期">
                {[
                  ["week", "周计划", "7 天"],
                  ["quarter", "季度", "3 个月"],
                  ["half", "半年", "6 个月"],
                ].map(([value, label, english]) => (
                  <button
                    className={planPeriod === value ? "active" : ""}
                    key={value}
                    onClick={() => setPlanPeriod(value as PlanPeriod)}
                    type="button"
                  >
                    <span>{label}</span>
                    <small>{english}</small>
                  </button>
                ))}
              </div>

              {planPeriod === "week" && (
                <>
                  {weekNavigator}

                  <div className="week-grid">
                    {weekDays.map((item) => {
                      const dayTasks = tasks.filter((task) =>
                        isTaskScheduled(task, item),
                      );
                      const dayDone = dayTasks.filter((task) =>
                        completed.includes(
                          getCompletionKey(item.dateKey, task.id),
                        ),
                      ).length;
                      const dayProgress = dayTasks.length
                        ? (dayDone / dayTasks.length) * 100
                        : 0;
                      return (
                        <button
                          aria-label={`查看周${item.day}计划`}
                          aria-pressed={selectedDay === item.day}
                          className={selectedDay === item.day ? "current" : ""}
                          key={item.day}
                          onClick={() => setSelectedDay(item.day)}
                          type="button"
                        >
                          <span>周{item.day}</span>
                          <strong>{item.date}</strong>
                          <b>
                            {dayDone}/{dayTasks.length}
                          </b>
                          <i
                            style={{
                              height: `${Math.max(dayProgress, 6)}%`,
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="schedule-table">
                    <div className="schedule-head">
                      <span>执行日期</span>
                      <span>维护项目</span>
                      <span>区域</span>
                    </div>
                    {selectedDayTasks.map((task) => (
                      <div className="schedule-row" key={task.id}>
                        <span>
                          {String(selectedDayMeta.month).padStart(2, "0")}.
                          {selectedDayMeta.date} / 周{selectedDay}
                        </span>
                        <strong>{task.title}</strong>
                        <span>{task.room}</span>
                      </div>
                    ))}
                  </div>

                  <div className="blue-note">
                    <span>维护备注 01</span>
                    <p>
                      周末安排耗时较长的深度清洁；日常维护尽量控制在 20
                      分钟内。
                    </p>
                  </div>
                </>
              )}

              {planPeriod !== "week" && (
                <>
                  <div className="cycle-overview">
                    <div>
                      <span>
                        {planPeriod === "quarter" ? "第三季度" : "下半年"} · 2026
                      </span>
                      <strong>
                        {
                          cyclePlans[planPeriod].filter((item) =>
                            cycleCompleted.includes(item.id),
                          ).length
                        }
                        <small>/06</small>
                      </strong>
                      <p>已完成计划</p>
                    </div>
                    <div className="cycle-copy">
                      <small>周期维护</small>
                      <h3>
                        {planPeriod === "quarter"
                          ? "季度深度维护"
                          : "半年系统保养"}
                      </h3>
                      <p>
                        {planPeriod === "quarter"
                          ? "集中处理日常清洁覆盖不到的家电、织物与管道。"
                          : "检查家庭关键设备，完成高位、重型及季节性项目。"}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`cycle-ruler ${
                      planPeriod === "quarter" ? "quarter" : "half"
                    }`}
                  >
                    {(planPeriod === "quarter"
                      ? ["7月", "8月", "9月"]
                      : [
                          "7月",
                          "8月",
                          "9月",
                          "10月",
                          "11月",
                          "12月",
                        ]
                    ).map((month, index) => (
                      <div key={month}>
                        <span>{month}</span>
                        <i className={index === 1 ? "current" : ""} />
                      </div>
                    ))}
                  </div>

                  <div className="cycle-list">
                    <div className="cycle-list-head">
                      <span>执行 / 项目</span>
                      <span>周期档案号</span>
                    </div>
                    {cyclePlans[planPeriod].map((item, index) => {
                      const isDone = cycleCompleted.includes(item.id);
                      return (
                        <label
                          className={`cycle-item ${isDone ? "is-done" : ""}`}
                          key={item.id}
                        >
                          <input
                            checked={isDone}
                            onChange={() => toggleCycleTask(item.id)}
                            type="checkbox"
                          />
                          <span className="cycle-check">
                            {isDone ? "✓" : String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="cycle-date">{item.date}</span>
                          <span className="cycle-item-copy">
                            <strong>{item.title}</strong>
                            <small>
                              {item.area} / {item.note}
                            </small>
                          </span>
                          <span className="cycle-code">{item.code}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="blue-note">
                    <span>
                      {planPeriod === "quarter"
                        ? "季度备注"
                        : "半年备注"}
                    </span>
                    <p>
                      完成后勾选归档；涉及拆机、登高或电路的项目，建议安排专业人员处理。
                    </p>
                  </div>
                </>
              )}
            </section>
          )}

          {activeTab === "archive" && (
            <section className="archive-view" aria-labelledby="archive-title">
              <div className="page-heading">
                <div className="section-kicker">
                  <span>03</span>
                  <p>档案索引</p>
                </div>
                <h2 id="archive-title">2026年8月</h2>
                <p>2026年8月 / 家庭维护记录</p>
              </div>

              <div className="stat-grid">
                <article>
                  <span>本月完成</span>
                  <strong>32</strong>
                  <small>较上月 +12%</small>
                </article>
                <article>
                  <span>连续打卡</span>
                  <strong>06</strong>
                  <small>天</small>
                </article>
                <article>
                  <span>计划完成率</span>
                  <strong>{progress}%</strong>
                  <small>本周实时</small>
                </article>
                <article>
                  <span>维护区域</span>
                  <strong>05</strong>
                  <small>个区域</small>
                </article>
              </div>

              <div className="room-index">
                <div className="index-title">
                  <span>区域索引</span>
                  <small>维护项目统计</small>
                </div>
                {[
                  ["01", "客厅", "日常维护", "12 项"],
                  ["02", "厨房", "清洁与消毒", "18 项"],
                  ["03", "卧室", "除尘与整理", "09 项"],
                  ["04", "卫生间", "深度清洁", "13 项"],
                  ["05", "阳台", "收纳与养护", "08 项"],
                ].map((room) => (
                  <div className="index-row" key={room[0]}>
                    <b>{room[0]}</b>
                    <strong>{room[1]}</strong>
                    <span>{room[2]}</span>
                    <small>{room[3]}</small>
                  </div>
                ))}
              </div>

              <section className="install-panel" aria-label="安装私人版本">
                <img
                  alt=""
                  height="72"
                  src={`${publicBasePath}/icons/${skin}-192.png`}
                  width="72"
                />
                <div>
                  <strong>
                    {isStandalone ? "私人版本已安装" : "安装到手机桌面"}
                  </strong>
                  <p>
                    {isStandalone
                      ? "当前已作为独立 App 运行，任务数据只保存在本机。"
                      : `图标与启动页将使用“${
                          skins.find((item) => item.id === skin)?.label
                        }”皮肤。`}
                  </p>
                </div>
                <button onClick={installApp} type="button">
                  {isStandalone ? "已安装" : "安装"}
                </button>
              </section>

              <button className="reset-button" onClick={resetArchive} type="button">
                重置本周打卡
              </button>
              <p className="storage-note">数据仅保存在当前设备</p>
            </section>
          )}
        </div>

        <nav className="bottom-nav" aria-label="主导航">
          <button
            className={activeTab === "today" ? "active" : ""}
            onClick={openToday}
            type="button"
          >
            <span>01</span>
            今日
          </button>
          <button
            className={activeTab === "week" ? "active" : ""}
            onClick={() => setActiveTab("week")}
            type="button"
          >
            <span>02</span>
            周期计划
          </button>
          <button
            className="new-task-nav"
            onClick={openTaskModal}
            type="button"
          >
            <span>＋</span>
            新任务
          </button>
          <button
            className={activeTab === "archive" ? "active" : ""}
            onClick={() => setActiveTab("archive")}
            type="button"
          >
            <span>03</span>
            档案
          </button>
        </nav>

        {isAdding && (
          <div
            className="modal-backdrop"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setIsAdding(false);
            }}
          >
            <form
              aria-labelledby="new-task-title"
              aria-modal="true"
              className="task-modal"
              onSubmit={submitTask}
              role="dialog"
            >
              <div className="sheet-handle" aria-hidden="true" />
              <div className="modal-head">
                <div>
                  <small>新增任务 · 04</small>
                  <h2 id="new-task-title">新增任务</h2>
                </div>
                <button
                  aria-label="关闭新增任务"
                  onClick={() => setIsAdding(false)}
                  type="button"
                >
                  ×
                </button>
              </div>

              <div className="task-form-body">
                <label className="task-name-field">
                  <span>任务名称</span>
                  <input
                    enterKeyHint="done"
                    maxLength={30}
                    onChange={(event) => setNewTitle(event.target.value)}
                    placeholder="例如：清洁空调滤网"
                    required
                    value={newTitle}
                  />
                </label>

                <fieldset className="mobile-choice-field">
                  <legend>执行频次</legend>
                  <div className="choice-grid frequency-choice-grid">
                    {[
                      "每天 1 次",
                      "每周 1 次",
                      "每周 2–3 次",
                      "每月 1 次",
                      "每季度 1 次",
                      "每半年 1 次",
                    ].map((frequency) => (
                      <button
                        aria-pressed={newFrequency === frequency}
                        className={
                          newFrequency === frequency ? "active" : ""
                        }
                        key={frequency}
                        onClick={() => chooseFrequency(frequency)}
                        type="button"
                      >
                        {frequency}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mobile-choice-field">
                  <legend>{scheduleLegend}</legend>

                  {isDailyFrequency && (
                    <div className="daily-schedule-summary">
                      <strong>周一 — 周日</strong>
                      <span>每天自动执行</span>
                    </div>
                  )}

                  {isWeeklyFrequency && (
                    <div className="task-day-picker weekday-only">
                      {weekDays.map((item) => (
                        <button
                          aria-pressed={newTaskDays.includes(item.day)}
                          className={
                            newTaskDays.includes(item.day) ? "active" : ""
                          }
                          key={item.day}
                          onClick={() => toggleNewTaskDay(item.day)}
                          type="button"
                        >
                          <strong>周{item.day}</strong>
                        </button>
                      ))}
                    </div>
                  )}

                  {isMonthlyFrequency && (
                    <div
                      aria-label="每月执行日"
                      className="month-day-picker"
                      role="group"
                    >
                      {Array.from({ length: 31 }, (_, index) => index + 1).map(
                        (day) => (
                          <button
                            aria-label={`每月${day}日`}
                            aria-pressed={newMonthDay === day}
                            className={newMonthDay === day ? "active" : ""}
                            key={day}
                            onClick={() => setNewMonthDay(day)}
                            type="button"
                          >
                            {day}
                          </button>
                        ),
                      )}
                    </div>
                  )}

                  {isLongTermFrequency && (
                    <div className="archive-date-picker">
                      <div
                        aria-live="polite"
                        className="archive-date-display"
                      >
                        <span>已选日期</span>
                        <strong>
                          {newLongTermYear}.
                          {String(newLongTermMonth).padStart(2, "0")}.
                          {String(newLongTermDay).padStart(2, "0")}
                        </strong>
                      </div>

                      <div className="archive-date-section">
                        <span>年份</span>
                        <div
                          aria-label="选择年份"
                          className="archive-year-options"
                          role="group"
                        >
                          {longTermYears.map((year) => (
                            <button
                              aria-pressed={newLongTermYear === year}
                              className={
                                newLongTermYear === year ? "active" : ""
                              }
                              key={year}
                              onClick={() => chooseLongTermYear(year)}
                              type="button"
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="archive-date-section">
                        <span>月份</span>
                        <div
                          aria-label="选择月份"
                          className="archive-month-options"
                          role="group"
                        >
                          {yearMonths.map((month) => (
                            <button
                              aria-label={`${month}月`}
                              aria-pressed={newLongTermMonth === month}
                              className={
                                newLongTermMonth === month ? "active" : ""
                              }
                              disabled={
                                newLongTermYear === 2026 && month < 7
                              }
                              key={month}
                              onClick={() => chooseLongTermMonth(month)}
                              type="button"
                            >
                              {String(month).padStart(2, "0")}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="archive-date-section">
                        <span>日期</span>
                        <div
                          aria-label="选择日期"
                          className="archive-day-options"
                          role="group"
                        >
                          {Array.from(
                            { length: longTermDaysInMonth },
                            (_, index) => index + 1,
                          ).map((day) => (
                            <button
                              aria-label={`${newLongTermMonth}月${day}日`}
                              aria-pressed={newLongTermDay === day}
                              className={
                                newLongTermDay === day ? "active" : ""
                              }
                              disabled={isPastLongTermDate(
                                newLongTermYear,
                                newLongTermMonth,
                                day,
                              )}
                              key={day}
                              onClick={() => setNewLongTermDay(day)}
                              type="button"
                            >
                              {String(day).padStart(2, "0")}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <p
                    className={`choice-hint ${
                      isNewScheduleValid ? "" : "warning"
                    }`}
                  >
                    {scheduleHint}
                  </p>
                </fieldset>

                <fieldset className="mobile-choice-field">
                  <legend>所在区域</legend>
                  <div className="choice-grid room-choice-grid">
                    {rooms.slice(1).map((room) => (
                      <button
                        aria-pressed={newRoom === room}
                        className={newRoom === room ? "active" : ""}
                        key={room}
                        onClick={() =>
                          setNewRoom(room as Exclude<Room, "全部">)
                        }
                        type="button"
                      >
                        {room}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="modal-action">
                <button
                  className="submit-task"
                  disabled={!newTitle.trim() || !isNewScheduleValid}
                  type="submit"
                >
                  {submitScheduleLabel}
                  <span>保存任务 ↗</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {isInstallHelpOpen && (
          <div
            className="modal-backdrop"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) {
                setIsInstallHelpOpen(false);
              }
            }}
          >
            <section
              aria-labelledby="install-title"
              aria-modal="true"
              className="task-modal install-modal"
              role="dialog"
            >
              <div className="sheet-handle" aria-hidden="true" />
              <div className="modal-head">
                <div>
                  <small>私人版本</small>
                  <h2 id="install-title">安装到 iPhone</h2>
                </div>
                <button
                  aria-label="关闭安装说明"
                  onClick={() => setIsInstallHelpOpen(false)}
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="install-guide">
                <div className="install-skin-preview">
                  <img
                    alt={`${skins.find((item) => item.id === skin)?.label}应用图标`}
                    height="96"
                    src={`${publicBasePath}/icons/${skin}-192.png`}
                    width="96"
                  />
                  <p>
                    当前将安装为
                    <strong>
                      {skins.find((item) => item.id === skin)?.label}
                    </strong>
                  </p>
                </div>
                <ol>
                  <li>
                    <span>1</span>
                    <p>
                      用 <strong>Safari</strong> 打开当前安装地址
                    </p>
                  </li>
                  <li>
                    <span>2</span>
                    <p>轻点浏览器底部的“分享”按钮</p>
                  </li>
                  <li>
                    <span>3</span>
                    <p>选择“添加到主屏幕”，再确认添加</p>
                  </li>
                </ol>
                <p className="install-limit-note">
                  启动页会记住最近使用的皮肤。苹果不会自动替换已经安装的桌面图标；换皮肤后若想同步图标，需要删除旧图标再重新添加。
                </p>
                <button
                  className="install-guide-done"
                  onClick={() => setIsInstallHelpOpen(false)}
                  type="button"
                >
                  我知道了
                </button>
              </div>
            </section>
          </div>
        )}

        {notice && (
          <div className="notice" role="status">
            <span>✓</span>
            {notice}
          </div>
        )}
      </section>
    </main>
  );
}
