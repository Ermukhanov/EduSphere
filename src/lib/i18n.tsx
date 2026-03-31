import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Lang = "ru" | "kz";

const translations: Record<string, Record<Lang, string>> = {
  "splash.title": { ru: "EduSphere", kz: "EduSphere" },
  "splash.subtitle": { ru: "Будущее образования", kz: "Білім беру болашағы" },
  "splash.loading": { ru: "Загрузка...", kz: "Жүктелуде..." },
  "onboard.about.title": { ru: "Добро пожаловать в EduSphere!", kz: "EduSphere-ге қош келдіңіз!" },
  "onboard.about.desc": { ru: "Единая платформа для учеников, родителей, учителей и школ", kz: "Оқушылар, ата-аналар, мұғалімдер және мектептер үшін бірыңғай платформа" },
  "onboard.lang.title": { ru: "Выберите язык", kz: "Тілді таңдаңыз" },
  "onboard.lang.ru": { ru: "Русский", kz: "Орысша" },
  "onboard.lang.kz": { ru: "Қазақша", kz: "Қазақша" },
  "onboard.stats.title": { ru: "Нам доверяют", kz: "Бізге сенеді" },
  "onboard.stats.schools": { ru: "школ", kz: "мектеп" },
  "onboard.stats.students": { ru: "учеников", kz: "оқушы" },
  "onboard.stats.teachers": { ru: "учителей", kz: "мұғалім" },
  "onboard.stats.parents": { ru: "родителей", kz: "ата-ана" },
  "onboard.features.title": { ru: "Всё для школы", kz: "Мектеп үшін бәрі" },
  "onboard.features.grades": { ru: "Электронный дневник", kz: "Электрондық күнделік" },
  "onboard.features.schedule": { ru: "Расписание уроков", kz: "Сабақ кестесі" },
  "onboard.features.chat": { ru: "Чат с учителями", kz: "Мұғалімдермен чат" },
  "onboard.features.ai": { ru: "AI-помощник", kz: "AI-көмекші" },
  "onboard.features.news": { ru: "Новости школы", kz: "Мектеп жаңалықтары" },
  "onboard.features.achievements": { ru: "Достижения", kz: "Жетістіктер" },
  "onboard.roles.title": { ru: "4 роли — 1 приложение", kz: "4 рөл — 1 қосымша" },
  "onboard.roles.student": { ru: "Ученик", kz: "Оқушы" },
  "onboard.roles.parent": { ru: "Родитель", kz: "Ата-ана" },
  "onboard.roles.teacher": { ru: "Учитель", kz: "Мұғалім" },
  "onboard.roles.admin": { ru: "Администратор", kz: "Әкімші" },
  "onboard.join.title": { ru: "Присоединяйтесь к нам!", kz: "Бізге қосылыңыз!" },
  "onboard.join.login": { ru: "Войти", kz: "Кіру" },
  "onboard.join.apply": { ru: "Внедрить школу", kz: "Мектепті қосу" },
  "auth.login": { ru: "Вход", kz: "Кіру" },
  "auth.register": { ru: "Регистрация", kz: "Тіркелу" },
  "auth.email": { ru: "Электронная почта", kz: "Электрондық пошта" },
  "auth.password": { ru: "Пароль", kz: "Құпия сөз" },
  "auth.username": { ru: "Имя пользователя", kz: "Пайдаланушы аты" },
  "auth.schoolId": { ru: "ID школы", kz: "Мектеп ID" },
  "auth.childId": { ru: "ID ребёнка", kz: "Бала ID" },
  "auth.fullName": { ru: "ФИО", kz: "Аты-жөні" },
  "auth.class": { ru: "Класс", kz: "Сынып" },
  "auth.selectRole": { ru: "Выберите роль", kz: "Рөлді таңдаңыз" },
  "auth.google": { ru: "Войти через Google", kz: "Google арқылы кіру" },
  "auth.noAccount": { ru: "Нет аккаунта?", kz: "Аккаунт жоқ па?" },
  "auth.hasAccount": { ru: "Уже есть аккаунт?", kz: "Аккаунт бар ма?" },
  "auth.selectSchool": { ru: "Выберите школу", kz: "Мектепті таңдаңыз" },
  "auth.selectClass": { ru: "Выберите класс", kz: "Сыныпты таңдаңыз" },
  "auth.schoolNotFound": { ru: "Школа не найдена", kz: "Мектеп табылмады" },
  "auth.error": { ru: "Ошибка", kz: "Қате" },
  "auth.registrationSuccess": { ru: "Регистрация успешна! Проверьте почту.", kz: "Тіркелу сәтті! Поштаңызды тексеріңіз." },
  "apply.title": { ru: "Заявка на внедрение школы", kz: "Мектепті қосу өтінімі" },
  "apply.directorName": { ru: "ФИО директора", kz: "Директордың аты-жөні" },
  "apply.schoolName": { ru: "Название школы", kz: "Мектеп атауы" },
  "apply.city": { ru: "Город", kz: "Қала" },
  "apply.phone": { ru: "Телефон", kz: "Телефон" },
  "apply.comment": { ru: "Комментарий", kz: "Пікір" },
  "apply.send": { ru: "Отправить заявку", kz: "Өтінімді жіберу" },
  "nav.home": { ru: "Главная", kz: "Басты бет" },
  "nav.ai": { ru: "Sphere AI", kz: "Sphere AI" },
  "nav.chat": { ru: "Чат", kz: "Чат" },
  "nav.grades": { ru: "Оценки", kz: "Бағалар" },
  "nav.profile": { ru: "Профиль", kz: "Профиль" },
  "nav.schedule": { ru: "Расписание", kz: "Кесте" },
  "home.greeting": { ru: "Привет", kz: "Сәлем" },
  "home.aiMessage": { ru: "начнём сегодня день с уроков!", kz: "бүгінгі күнді сабақтан бастайық!" },
  "home.todayGrades": { ru: "Оценки за сегодня", kz: "Бүгінгі бағалар" },
  "home.streak": { ru: "дней подряд", kz: "күн қатарынан" },
  "home.news": { ru: "Новости", kz: "Жаңалықтар" },
  "home.feed": { ru: "Лента", kz: "Лента" },
  "home.rating": { ru: "Рейтинг", kz: "Рейтинг" },
  "home.schedule": { ru: "Расписание на сегодня", kz: "Бүгінгі кесте" },
  "home.leaderboard": { ru: "Топ-5 класса", kz: "Сыныптың Топ-5" },
  "home.aiInsight": { ru: "AI-совет", kz: "AI-кеңес" },
  "home.performance": { ru: "Моя успеваемость", kz: "Менің үлгерімім" },
  "home.xp": { ru: "Опыт", kz: "Тәжірибе" },
  "home.level": { ru: "Уровень", kz: "Деңгей" },
  "home.achievements": { ru: "Достижения", kz: "Жетістіктер" },
  "home.noGrades": { ru: "Нет оценок", kz: "Бағалар жоқ" },
  "home.noLessons": { ru: "Нет уроков", kz: "Сабақтар жоқ" },
  "home.replacement": { ru: "Замена", kz: "Ауыстыру" },
  "home.gpa": { ru: "Средний балл", kz: "Орташа балл" },
  "profile.followers": { ru: "подписчики", kz: "жазылушылар" },
  "profile.achievements": { ru: "достижения", kz: "жетістіктер" },
  "profile.likes": { ru: "лайки", kz: "лайктар" },
  "profile.edit": { ru: "Редактировать", kz: "Өзгерту" },
  "profile.share": { ru: "Поделиться", kz: "Бөлісу" },
  "profile.certificates": { ru: "Сертификаты", kz: "Сертификаттар" },
  "profile.about": { ru: "О себе", kz: "Өзі туралы" },
  "profile.friends": { ru: "Друзья", kz: "Достар" },
  "profile.addFriend": { ru: "Добавить друга", kz: "Дос қосу" },
  "profile.logout": { ru: "Выйти", kz: "Шығу" },
  "next": { ru: "Далее", kz: "Келесі" },
  "back": { ru: "Назад", kz: "Артқа" },
  "skip": { ru: "Пропустить", kz: "Өткізу" },
  "continue": { ru: "Продолжить", kz: "Жалғастыру" },
  "save": { ru: "Сохранить", kz: "Сақтау" },
  "cancel": { ru: "Отмена", kz: "Болдырмау" },
  "send": { ru: "Отправить", kz: "Жіберу" },
  // Post-registration onboarding
  "postOnboard.howFound.title": { ru: "Как вы узнали о EduSphere?", kz: "EduSphere туралы қалай білдіңіз?" },
  "postOnboard.howFound.news": { ru: "Из новостей / статьи", kz: "Жаңалықтардан / мақаладан" },
  "postOnboard.howFound.social": { ru: "Из соц. сетей", kz: "Әлеуметтік желілерден" },
  "postOnboard.howFound.friends": { ru: "От друзей или родных", kz: "Достардан немесе туыстардан" },
  "postOnboard.howFound.school": { ru: "Школа рекомендовала", kz: "Мектеп ұсынды" },
  "postOnboard.howFound.search": { ru: "Из поиска в Google", kz: "Google іздеуден" },
  "postOnboard.howFound.other": { ru: "Другое", kz: "Басқа" },
  "postOnboard.whatAwaits.title": { ru: "Вот что вас ждёт!", kz: "Сізді не күтіп тұр!" },
  "postOnboard.student.feat1": { ru: "Умное расписание", kz: "Ақылды кесте" },
  "postOnboard.student.feat1.desc": { ru: "Актуальное расписание с уведомлениями о заменах", kz: "Ауыстырулар туралы хабарландырулармен нақты кесте" },
  "postOnboard.student.feat2": { ru: "AI-Помощник", kz: "AI-Көмекші" },
  "postOnboard.student.feat2.desc": { ru: "Персональные советы по учёбе и подготовке к СОР/СОЧ", kz: "Оқу және БЖБ/ТЖБ-ге дайындық бойынша жеке кеңестер" },
  "postOnboard.student.feat3": { ru: "Геймификация", kz: "Геймификация" },
  "postOnboard.student.feat3.desc": { ru: "Зарабатывай XP, получай достижения и соревнуйся!", kz: "XP жина, жетістіктерге жет және жарыс!" },
  "postOnboard.parent.feat1": { ru: "Контроль успеваемости", kz: "Үлгерімді бақылау" },
  "postOnboard.parent.feat1.desc": { ru: "Оценки ребёнка в реальном времени", kz: "Баланың бағалары нақты уақытта" },
  "postOnboard.parent.feat2": { ru: "Связь с учителями", kz: "Мұғалімдермен байланыс" },
  "postOnboard.parent.feat2.desc": { ru: "Прямой чат с классным руководителем", kz: "Сынып жетекшісімен тікелей чат" },
  "postOnboard.parent.feat3": { ru: "Уведомления", kz: "Хабарландырулар" },
  "postOnboard.parent.feat3.desc": { ru: "Мгновенные оповещения об оценках и событиях", kz: "Бағалар мен оқиғалар туралы лезде хабарлау" },
  "postOnboard.teacher.feat1": { ru: "Управление классом", kz: "Сыныпты басқару" },
  "postOnboard.teacher.feat1.desc": { ru: "Журнал, оценки и аналитика", kz: "Журнал, бағалар және аналитика" },
  "postOnboard.teacher.feat2": { ru: "AI-Ассистент", kz: "AI-Ассистент" },
  "postOnboard.teacher.feat2.desc": { ru: "Автоматизация рутинных задач", kz: "Күнделікті тапсырмаларды автоматтандыру" },
  "postOnboard.teacher.feat3": { ru: "Коммуникация", kz: "Коммуникация" },
  "postOnboard.teacher.feat3.desc": { ru: "Чат с родителями и учениками", kz: "Ата-аналар мен оқушылармен чат" },
  "postOnboard.contacts.title": { ru: "Найдите своих друзей", kz: "Достарыңызды табыңыз" },
  "postOnboard.contacts.desc": { ru: "Разрешите доступ к контактам, чтобы найти знакомых", kz: "Таныстарды табу үшін контактыларға рұқсат беріңіз" },
  "postOnboard.contacts.allow": { ru: "Разрешить доступ", kz: "Рұқсат беру" },
  "postOnboard.contacts.noContacts": { ru: "Контакты не найдены в EduSphere", kz: "EduSphere-де контактылар табылмады" },
  "postOnboard.notifications.title": { ru: "Включите уведомления", kz: "Хабарландыруларды қосыңыз" },
  "postOnboard.notifications.desc": { ru: "Получайте оповещения об оценках, расписании и событиях", kz: "Бағалар, кесте және оқиғалар туралы хабарландырулар алыңыз" },
  "postOnboard.notifications.allow": { ru: "Разрешить", kz: "Рұқсат беру" },
  "postOnboard.notifications.skip": { ru: "Не сейчас", kz: "Қазір емес" },
  "postOnboard.ready": { ru: "Всё готово! 🎉", kz: "Бәрі дайын! 🎉" },
  "postOnboard.start": { ru: "Начать!", kz: "Бастау!" },
};

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "kz",
  setLang: () => {},
  t: (key) => key,
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("edusphere-lang");
    return (saved as Lang) || "kz";
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("edusphere-lang", l);
  }, []);

  const t = useCallback((key: string) => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
