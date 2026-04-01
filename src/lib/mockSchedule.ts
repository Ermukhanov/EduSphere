export type MockLesson = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
  status?: string | null;
  subjects: {
    name: string;
  };
};

export const MOCK_DAY_ORDER = [1, 2, 3, 4] as const;

const baseWeeklySchedule: Omit<MockLesson, "id">[] = [
  { day_of_week: 1, start_time: "08:30", end_time: "09:15", room: "201", subjects: { name: "Математика" } },
  { day_of_week: 1, start_time: "09:25", end_time: "10:10", room: "305", subjects: { name: "Русский язык" } },
  { day_of_week: 1, start_time: "10:20", end_time: "11:05", room: "112", subjects: { name: "История" } },
  { day_of_week: 1, start_time: "11:20", end_time: "12:05", room: "401", subjects: { name: "Информатика" } },
  { day_of_week: 2, start_time: "08:30", end_time: "09:15", room: "203", subjects: { name: "Физика" } },
  { day_of_week: 2, start_time: "09:25", end_time: "10:10", room: "205", subjects: { name: "Английский язык" } },
  { day_of_week: 2, start_time: "10:20", end_time: "11:05", room: "107", subjects: { name: "Биология" } },
  { day_of_week: 2, start_time: "11:20", end_time: "12:05", room: "Gym", subjects: { name: "Физкультура" } },
  { day_of_week: 3, start_time: "08:30", end_time: "09:15", room: "208", subjects: { name: "Химия" } },
  { day_of_week: 3, start_time: "09:25", end_time: "10:10", room: "303", subjects: { name: "Казахский язык" } },
  { day_of_week: 3, start_time: "10:20", end_time: "11:05", room: "114", subjects: { name: "География" } },
  { day_of_week: 3, start_time: "11:20", end_time: "12:05", room: "402", subjects: { name: "Информатика" } },
  { day_of_week: 4, start_time: "08:30", end_time: "09:15", room: "202", subjects: { name: "Алгебра" } },
  { day_of_week: 4, start_time: "09:25", end_time: "10:10", room: "108", subjects: { name: "Литература" } },
  { day_of_week: 4, start_time: "10:20", end_time: "11:05", room: "210", subjects: { name: "Физика" } },
  { day_of_week: 4, start_time: "11:20", end_time: "12:05", room: "Act", subjects: { name: "Классный час" } },
];

const classScheduleOverrides: Record<string, Partial<MockLesson>[]> = {
  "5A": [
    { subjects: { name: "Математика" }, room: "101" },
    { subjects: { name: "Русский язык" }, room: "102" },
    { subjects: { name: "Познание мира" }, room: "103" },
    { subjects: { name: "ИЗО" }, room: "104" },
  ],
  "7B": [
    { subjects: { name: "Алгебра" }, room: "207" },
    { subjects: { name: "Английский язык" }, room: "205" },
    { subjects: { name: "Биология" }, room: "109" },
    { subjects: { name: "Информатика" }, room: "403" },
  ],
  "9A": [
    { subjects: { name: "Алгебра" }, room: "211" },
    { subjects: { name: "Физика" }, room: "214" },
    { subjects: { name: "Химия" }, room: "208" },
    { subjects: { name: "История Казахстана" }, room: "117" },
  ],
  "10A": [
    { subjects: { name: "Алгебра" }, room: "215" },
    { subjects: { name: "Информатика" }, room: "404" },
    { subjects: { name: "Физика" }, room: "216" },
    { subjects: { name: "Английский язык" }, room: "206" },
  ],
  "11A": [
    { subjects: { name: "Математика" }, room: "217" },
    { subjects: { name: "Информатика" }, room: "405" },
    { subjects: { name: "Подготовка к ЕНТ" }, room: "218" },
    { subjects: { name: "История" }, room: "116" },
  ],
};

function normalizeClassName(className?: string | null) {
  return (className || "10A").replace(/\s+/g, "").toUpperCase();
}

export function getMockScheduleForClass(className?: string | null): MockLesson[] {
  const normalized = normalizeClassName(className);
  const overrides = classScheduleOverrides[normalized] || classScheduleOverrides["10A"];

  return baseWeeklySchedule.map((lesson, index) => {
    const override = overrides[index % overrides.length] || {};
    return {
      ...lesson,
      ...override,
      id: `${normalized}-${lesson.day_of_week}-${index}`,
      subjects: override.subjects || lesson.subjects,
      room: override.room || lesson.room,
      status: lesson.day_of_week === 2 && index % 4 === 1 ? "changed" : null,
    };
  });
}

export function getMockScheduleForDay(className?: string | null, dayOfWeek?: number) {
  const safeDay = dayOfWeek && dayOfWeek >= 1 && dayOfWeek <= 7 ? dayOfWeek : 1;
  return getMockScheduleForClass(className).filter((lesson) => lesson.day_of_week === safeDay);
}

export function getClassScheduleMap(classNames: string[]) {
  return classNames.reduce<Record<string, MockLesson[]>>((acc, className) => {
    acc[className] = getMockScheduleForClass(className);
    return acc;
  }, {});
}
