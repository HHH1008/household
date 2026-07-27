"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Room = "全部" | "客厅" | "厨房" | "卧室" | "卫生间" | "阳台";
type Tab = "today" | "week" | "archive";
type PlanPeriod = "week" | "quarter" | "half";
type WeekDay = "一" | "二" | "三" | "四" | "五" | "六" | "日";

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
    scheduledDays: ["一", "三", "六"],
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
    scheduledDays: ["三", "日"],
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
    scheduledDays: ["二", "六"],
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

const weekDays = [
  { day: "一" as WeekDay, date: "03" },
  { day: "二" as WeekDay, date: "04" },
  { day: "三" as WeekDay, date: "05" },
  { day: "四" as WeekDay, date: "06" },
  { day: "五" as WeekDay, date: "07", current: true },
  { day: "六" as WeekDay, date: "08" },
  { day: "日" as WeekDay, date: "09" },
];

const allWeekDays = weekDays.map((item) => item.day);

function getSuggestedMultiDays(anchor: WeekDay) {
  const anchorIndex = allWeekDays.indexOf(anchor);
  return [anchor, allWeekDays[(anchorIndex + 2) % allWeekDays.length]];
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

function isTaskScheduled(task: Task, day: WeekDay) {
  const date = weekDays.find((item) => item.day === day)?.date;

  if (task.scheduledMonthDay && date) {
    return Number(date) === task.scheduledMonthDay;
  }

  if (task.nextRunDate && date) {
    return task.nextRunDate === `2026-08-${date}`;
  }

  return (task.scheduledDays ?? ["五"]).includes(day);
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [planPeriod, setPlanPeriod] = useState<PlanPeriod>("week");
  const [selectedDay, setSelectedDay] = useState<WeekDay>("五");
  const [activeRoom, setActiveRoom] = useState<Room>("全部");
  const [completed, setCompleted] = useState<string[]>(["floor", "books"]);
  const [cycleCompleted, setCycleCompleted] = useState<string[]>([]);
  const [customTasks, setCustomTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newRoom, setNewRoom] = useState<Exclude<Room, "全部">>("客厅");
  const [newFrequency, setNewFrequency] = useState("每周 1 次");
  const [newTaskDays, setNewTaskDays] = useState<WeekDay[]>(["五"]);
  const [newMonthDay, setNewMonthDay] = useState(7);
  const [newLongTermDate, setNewLongTermDate] = useState("2026-08-07");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("household-archive-done");
      if (saved) setCompleted(JSON.parse(saved));
      const savedCycle = window.localStorage.getItem(
        "household-archive-cycle-done",
      );
      if (savedCycle) setCycleCompleted(JSON.parse(savedCycle));
      setCustomTasks(readStoredTasks());
    } catch {
      // The app remains fully usable when browser storage is unavailable.
    }
  }, []);

  const tasks = useMemo(() => [...baseTasks, ...customTasks], [customTasks]);
  const selectedDayTasks = useMemo(
    () => tasks.filter((task) => isTaskScheduled(task, selectedDay)),
    [selectedDay, tasks],
  );
  const filteredTasks = useMemo(
    () =>
      activeRoom === "全部"
        ? selectedDayTasks
        : selectedDayTasks.filter((task) => task.room === activeRoom),
    [activeRoom, selectedDayTasks],
  );

  const doneCount = selectedDayTasks.filter((task) =>
    completed.includes(task.id),
  ).length;
  const progress = selectedDayTasks.length
    ? Math.round((doneCount / selectedDayTasks.length) * 100)
    : 0;
  const totalMinutes = selectedDayTasks.reduce(
    (sum, task) => sum + task.estimate,
    0,
  );
  const finishedMinutes = selectedDayTasks
    .filter((task) => completed.includes(task.id))
    .reduce((sum, task) => sum + task.estimate, 0);
  const selectedDayMeta =
    weekDays.find((item) => item.day === selectedDay) ?? weekDays[4];
  const pageTitle =
    activeTab === "today"
      ? selectedDay === "五"
        ? "今日作业"
        : `周${selectedDay}作业`
      : activeTab === "week"
        ? "周期计划"
        : "档案总览";
  const selectedDateHeading =
    selectedDay === "五"
      ? `8月${selectedDayMeta.date}日 · 今日`
      : `8月${selectedDayMeta.date}日 · 周${selectedDay}`;
  const isDailyFrequency = newFrequency === "每天 1 次";
  const isMultiFrequency = newFrequency === "每周 2–3 次";
  const isWeeklyFrequency =
    newFrequency === "每周 1 次" || isMultiFrequency;
  const isMonthlyFrequency = newFrequency === "每月 1 次";
  const isLongTermFrequency =
    newFrequency === "每季度 1 次" || newFrequency === "每半年 1 次";
  const isNewScheduleValid = isDailyFrequency
    ? newTaskDays.length === allWeekDays.length
    : isMultiFrequency
      ? newTaskDays.length >= 2 && newTaskDays.length <= 3
      : newFrequency === "每周 1 次"
        ? newTaskDays.length === 1
        : isMonthlyFrequency
          ? newMonthDay >= 1 && newMonthDay <= 31
          : Boolean(newLongTermDate);
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

  function toggleTask(id: string) {
    const next = completed.includes(id)
      ? completed.filter((taskId) => taskId !== id)
      : [...completed, id];
    setCompleted(next);
    window.localStorage.setItem("household-archive-done", JSON.stringify(next));
    setNotice(next.includes(id) ? "已完成一项，档案已更新" : "已撤销完成状态");
    window.setTimeout(() => setNotice(""), 1800);
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
    setNewFrequency("每周 1 次");
    setNewTaskDays([selectedDay]);
    setNewMonthDay(Number(selectedDayMeta.date));
    setNewLongTermDate(`2026-08-${selectedDayMeta.date}`);
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
    const scheduledDate = isMonthlyFrequency
      ? String(newMonthDay).padStart(2, "0")
      : isLongTermFrequency
        ? newLongTermDate.slice(-2)
        : undefined;
    const matchedDay = scheduledDate
      ? weekDays.find((item) => item.date === scheduledDate)?.day
      : undefined;
    setSelectedDay(matchedDay ?? newTaskDays[0] ?? selectedDay);
    setIsAdding(false);
    setActiveTab("today");
    setNotice("新任务已归档");
    window.setTimeout(() => setNotice(""), 1800);
  }

  function resetArchive() {
    setCompleted([]);
    window.localStorage.setItem("household-archive-done", "[]");
    setNotice("本周打卡已重置");
    window.setTimeout(() => setNotice(""), 1800);
  }

  return (
    <main className="blueprint-shell">
      <section className="mini-app" aria-label="家务档案小程序">
        <header className="app-header">
          <div className="technical-strip">
            <div>
              <span>档案编号</span>
              <strong>H.A—2026—08</strong>
            </div>
            <div>
              <span>当前周期</span>
              <strong>第 01 周 / 周{selectedDay}</strong>
            </div>
            <div>
              <span>更新日期</span>
              <strong>08.{selectedDayMeta.date}.2026</strong>
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
                    background: `conic-gradient(var(--blue) ${progress}%, #dfe4f5 ${progress}% 100%)`,
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
                      {selectedDay === "五"
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

              <section className="week-ruler" aria-label="本周日期">
                {weekDays.map((item) => {
                  const dayTasks = tasks.filter((task) =>
                    isTaskScheduled(task, item.day),
                  );
                  const dayDone = dayTasks.filter((task) =>
                    completed.includes(task.id),
                  ).length;
                  return (
                    <button
                      aria-label={`切换到周${item.day}，8月${item.date}日`}
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
                    const isDone = completed.includes(task.id);
                    return (
                      <label
                        className={`task-card ${isDone ? "is-done" : ""}`}
                        key={task.id}
                      >
                        <span className="task-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <input
                          checked={isDone}
                          onChange={() => toggleTask(task.id)}
                          type="checkbox"
                        />
                        <span className="checkmark" aria-hidden="true">
                          {isDone ? "✓" : ""}
                        </span>
                        <span className="task-copy">
                          <strong>{task.title}</strong>
                          <span>
                            {task.room} / {task.frequency}
                          </span>
                        </span>
                        <span className="task-meta">
                          <small>{task.code}</small>
                          <strong>{task.estimate}&apos;</strong>
                        </span>
                      </label>
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
                  {planPeriod === "week" && "本周安排"}
                  {planPeriod === "quarter" && "第三季度"}
                  {planPeriod === "half" && "下半年"}
                </h2>
                <p>
                  {planPeriod === "week" &&
                    `8月${selectedDayMeta.date}日 / 周${selectedDay} / ${selectedDayTasks.length} 项维护任务`}
                  {planPeriod === "quarter" && "2026年第 3 季度 / 6 项深度维护"}
                  {planPeriod === "half" && "2026年下半年 / 6 项系统保养"}
                </p>
              </div>

              <div className="period-switch" aria-label="选择计划周期">
                {[
                  ["week", "本周", "7 DAYS"],
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
                  <div className="week-grid">
                    {weekDays.map((item) => {
                      const dayTasks = tasks.filter((task) =>
                        isTaskScheduled(task, item.day),
                      );
                      const dayDone = dayTasks.filter((task) =>
                        completed.includes(task.id),
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
                          08.{selectedDayMeta.date} / 周{selectedDay}
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
            onClick={() => setActiveTab("today")}
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
                    <label className="exact-date-field">
                      <span>选择完整日期</span>
                      <input
                        aria-label="首次执行日期"
                        min="2026-07-27"
                        onChange={(event) =>
                          setNewLongTermDate(event.target.value)
                        }
                        type="date"
                        value={newLongTermDate}
                      />
                    </label>
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
