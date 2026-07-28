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
type Skin = "blueprint" | "warm" | "forest";
type WeekDay = "一" | "二" | "三" | "四" | "五" | "六" | "日";
type CalendarDay = {
  day: WeekDay;
  date: string;
  month: number;
  year: number;
  dateKey: string;
  current: boolean;
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
const skins: Array<{ id: Skin; label: string }> = [
  { id: "blueprint", label: "蓝图" },
  { id: "warm", label: "暖纸" },
  { id: "forest", label: "墨绿" },
];
const allWeekDays: WeekDay[] = ["一", "二", "三", "四", "五", "六", "日"];
const appTodayKey = "2026-08-07";
const appCurrentWeekStart = "2026-08-03";
const firstWeekStart = "2025-12-29";
const lastWeekStart = "2026-12-28";
const longTermYears = [2026, 2027];
const yearMonths = Array.from({ length: 12 }, (_, index) => index + 1);

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

export default function Home() {
  const appScrollRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [planPeriod, setPlanPeriod] = useState<PlanPeriod>("week");
  const [skin, setSkin] = useState<Skin>("blueprint");
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
      if (skins.some((item) => item.id === savedSkin)) {
        setSkin(savedSkin as Skin);
      }
      setCustomTasks(readStoredTasks());
    } catch {
      // The app remains fully usable when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    appScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

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
    ? "每天执行 / EVERY DAY"
    : isMultiFrequency
      ? "选择 2–3 个星期 / WEEKDAYS"
      : newFrequency === "每周 1 次"
        ? "选择星期 / WEEKDAY"
        : isMonthlyFrequency
          ? "选择每月执行日 / DAY OF MONTH"
          : "首次执行日期 / FIRST RUN";
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

  function cycleSkin() {
    const currentIndex = skins.findIndex((item) => item.id === skin);
    const nextSkin = skins[(currentIndex + 1) % skins.length];
    setSkin(nextSkin.id);
    window.localStorage.setItem("household-archive-skin", nextSkin.id);
    setNotice(`已切换为${nextSkin.label}皮肤`);
    window.setTimeout(() => setNotice(""), 1800);
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

  return (
    <main className="blueprint-shell">
      <section
        className="mini-app"
        data-skin={skin}
        aria-label="家务档案小程序"
        ref={appScrollRef}
      >
        <header className="app-header">
          <div className="technical-strip">
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
            <div>
              <span>更新日期</span>
              <strong>
                {String(selectedDayMeta.month).padStart(2, "0")}.
                {selectedDayMeta.date}.{selectedDayMeta.year}
              </strong>
              <button
                aria-label={`当前为${skins.find((item) => item.id === skin)?.label}皮肤，轻点切换`}
                className="skin-switcher"
                onClick={cycleSkin}
                type="button"
              >
                <i aria-hidden="true" />
                <span>
                  皮肤 · {skins.find((item) => item.id === skin)?.label}
                </span>
              </button>
            </div>
          </div>

          <div className="hero-title">
            <p>HOUSEHOLD ARCHIVE / 家庭维护系统</p>
            <h1>{pageTitle}</h1>
            <div className="title-footer">
              <span>ARCHIVE_VOL.01</span>
              <span>GRID UNIT: 10MM</span>
            </div>
          </div>
        </header>

        <div className="content-frame">
          {activeTab === "today" && (
            <>
              <section className="today-overview" aria-labelledby="today-title">
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
                    <p>
                      {isActualToday
                        ? "TODAY'S OPERATION"
                        : "SELECTED DAY OPERATION"}
                    </p>
                  </div>
                  <h2 id="today-title">{selectedDateHeading}</h2>
                  <p>
                    预计剩余 {Math.max(totalMinutes - finishedMinutes, 0)} 分钟
                    · 优先处理{" "}
                    {selectedDayTasks.filter((task) => task.priority).length} 项
                  </p>
                  <div className="progress-line">
                    <i style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </section>

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
                    <strong>{String(filteredTasks.length).padStart(2, "0")} ITEMS</strong>
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
                  <p>MAINTENANCE CYCLE</p>
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
                  ["week", "周计划", "7 DAYS"],
                  ["quarter", "季度", "3 MONTHS"],
                  ["half", "半年", "6 MONTHS"],
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
                    <span>MAINTENANCE NOTE / 备注 01</span>
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
                        {planPeriod === "quarter" ? "Q3" : "H2"} / 2026
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
                      <small>PERIODIC MAINTENANCE</small>
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
                      ? ["07 JUL", "08 AUG", "09 SEP"]
                      : [
                          "07 JUL",
                          "08 AUG",
                          "09 SEP",
                          "10 OCT",
                          "11 NOV",
                          "12 DEC",
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
                        ? "QUARTERLY NOTE / 季度备注"
                        : "HALF-YEAR NOTE / 半年备注"}
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
                  <p>ARCHIVE INDEX</p>
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
                  <small>DAYS / 天</small>
                </article>
                <article>
                  <span>计划完成率</span>
                  <strong>{progress}%</strong>
                  <small>本周实时</small>
                </article>
                <article>
                  <span>维护区域</span>
                  <strong>05</strong>
                  <small>ZONES / 区域</small>
                </article>
              </div>

              <div className="room-index">
                <div className="index-title">
                  <span>区域索引</span>
                  <small>ROOM NOMENCLATURE</small>
                </div>
                {[
                  ["01", "客厅", "LIVING ROOM", "12 项"],
                  ["02", "厨房", "KITCHEN", "18 项"],
                  ["03", "卧室", "BEDROOM", "09 项"],
                  ["04", "卫生间", "BATHROOM", "13 项"],
                  ["05", "阳台", "BALCONY", "08 项"],
                ].map((room) => (
                  <div className="index-row" key={room[0]}>
                    <b>{room[0]}</b>
                    <strong>{room[1]}</strong>
                    <span>{room[2]}</span>
                    <small>{room[3]}</small>
                  </div>
                ))}
              </div>

              <button className="reset-button" onClick={resetArchive} type="button">
                重置本周打卡
              </button>
              <p className="storage-note">数据仅保存在当前设备 · LOCAL ARCHIVE</p>
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
                  <small>NEW ARCHIVE ENTRY / 04</small>
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
                  <span>任务名称 / ITEM NAME</span>
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
                  <legend>频次 / FREQUENCY</legend>
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
                        <span>SELECTED DATE</span>
                        <strong>
                          {newLongTermYear}.
                          {String(newLongTermMonth).padStart(2, "0")}.
                          {String(newLongTermDay).padStart(2, "0")}
                        </strong>
                      </div>

                      <div className="archive-date-section">
                        <span>年份 / YEAR</span>
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
                        <span>月份 / MONTH</span>
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
                        <span>日期 / DAY</span>
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
                  <legend>区域 / ZONE</legend>
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
