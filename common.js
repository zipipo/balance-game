import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set, get, update, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { FIREBASE_CONFIG } from "./config.js";

export const app = initializeApp(FIREBASE_CONFIG);
export const db = getDatabase(app);
export { ref, onValue, set, get, update, remove, serverTimestamp };

export const TOTAL = 75; // 참석 학생 + 연구교수·박사후연구원
export const ADVISORS = ["김요한","김충섭","김훈","박별리","박종찬","송민경","육심명","윤기정","이상아","이소아","이재철","정상전","조덕","조용범"];

// ?room=test 로 열면 테스트용 공간을 따로 씀 (기본은 live)
export const ROOM = (new URLSearchParams(location.search).get("room") || "live").replace(/[^\w-]/g, "");
export const P = path => `rooms/${ROOM}/${path}`;

// 상위 몇 명까지 (테스트할 땐 host.html?room=test&target=1 처럼 줄일 수 있음)
export const TARGET = Number(new URLSearchParams(location.search).get("target")) || 10;
export const VOTE_SECONDS = 20;    // 라운드 투표 시간

// 앞 8개를 기본으로 쓰고, 뒤 4개는 예비
// t/a/b: 한국어, te/ae/be: 영어
export const QUESTIONS = [
  { t: "평생 하나만", te: "Forever, pick one", a: "학식 평생 무료", ae: "Free campus meals for life", b: "매주 금요일 교수님 카드 회식", be: "Every Friday dinner on your advisor's card" },
  { t: "학회 간다면", te: "Conference trip", a: "하와이, 대신 구두 발표", ae: "Hawaii, but you give an oral talk", b: "제주, 발표 없음", be: "Jeju, no presentation" },
  { t: "능력 하나를 준다면", te: "Pick one superpower", a: "실험 결과 미리 보기", ae: "See your experiment results in advance", b: "논문이 저절로 써짐", be: "Your papers write themselves" },
  { t: "보너스로 받는다면", te: "Pick your bonus", a: "인센티브 70만원", ae: "A ₩700K incentive", b: "눈치 안 보는 휴가 일주일 (교수님이 실험 다 해주심)", be: "A guilt-free week off (your advisor runs your experiments)" },
  { t: "랩미팅, 차라리 이게 낫다", te: "Lab meeting: which is better?", a: "월요일 오전 9시", ae: "Monday 9 AM", b: "금요일 오후 4시", be: "Friday 4 PM" },
  { t: "휴가 스타일", te: "Your time off", a: "매달 하루 연차 (모아서 못 씀)", ae: "One day off every month (cannot save them up)", b: "5일 연속 휴가 (여름·겨울 다 가능, 쪼개기 불가)", be: "5 days in a row (summer or winter, cannot split)" },
  { t: "학회 발표에서 더 무서운 것", te: "Scarier at a conference talk", a: "영어 질문 폭탄", ae: "A flood of questions in English", b: "아무도 질문 안 함", be: "Nobody asks anything" },
  { t: "사수 선배", te: "Your senior mentor", a: "천재인데 불친절함", ae: "A genius but unfriendly", b: "친절한데 자주 틀림", be: "Kind but often wrong" },
  { t: "주말 vs 평일", te: "Weekend vs weekdays", a: "평일 5시 퇴근, 토요일도 출근", ae: "Leave at 5 PM, but work Saturdays too", b: "주말 다 쉬고 평일 밤 9시 퇴근", be: "Weekends off, leave at 9 PM on weekdays" },
  { t: "더 듣고 싶은 말", te: "The words you would rather hear", a: "교수님: \"이번 데이터 좋네\"", ae: "Advisor: \"Great data this time\"", b: "후배: \"선배 덕분에 살았어요\"", be: "Junior: \"You saved me\"" },
  { t: "더 끔찍한 아침", te: "The worse morning", a: "-80℃ 냉동고 고장", ae: "The -80℃ freezer broke down", b: "인큐베이터 전체 오염", be: "The whole incubator is contaminated" },
  // 예비
  { t: "장비 예약이 이것밖에 없다", te: "The only slot left to book the equipment", a: "새벽 6시", ae: "6 AM", b: "밤 11시", be: "11 PM" },
  { t: "논문 결과 통보", te: "Your paper decision", a: "1주 만에 리젝", ae: "Rejected in 1 week", b: "6개월 기다리고 Major revision", be: "Major revision after 6 months" },
  { t: "졸업한다면", te: "Graduation", a: "2학기 늦게, 좋은 저널 (IF 10 이상)", ae: "Two semesters late, top journal (IF 10+)", b: "제때, 낮은 저널 (IF 1)", be: "On time, low journal (IF 1)" },
  { t: "리뷰어 코멘트", te: "Reviewer comments", a: "Major revision 1번", ae: "One major revision", b: "Minor revision 3번", be: "Three minor revisions" },
  { t: "논문 저자 자리", te: "Authorship", a: "단독 1저자, 실험 혼자 다 함", ae: "Sole first author, did every experiment alone", b: "공동 1저자, 협업 지옥", be: "Co-first author, collaboration hell" },
  { t: "지도교수님 스타일", te: "Advisor style", a: "연구비 빵빵 + 마이크로매니징", ae: "Plenty of funding + micromanaging", b: "완전 방목 + 연구비 빠듯", be: "Total freedom + tight funding" },
  { t: "실험 망한 걸 알게 되는 순간", te: "When you find out the experiment failed", a: "시작하자마자", ae: "Right at the start", b: "분석까지 다 끝내고", be: "After finishing all the analysis" },
  { t: "평생 하나만 해야 한다면", te: "If you could only do one forever", a: "실험만 하고 논문은 남이 씀", ae: "Only experiments, someone else writes", b: "논문만 쓰고 실험은 남이 함", be: "Only writing, someone else does experiments" },
];

export const SIDE = { A: { ko: "빨강", en: "RED" }, B: { ko: "파랑", en: "BLUE" } };

export function norm(s) { return (s || "").toLowerCase().replace(/\s+/g, ""); }
// 명단은 저장소에 두지 않고 Firebase advisors/<지도교수님>에만 있음
let NAMES = {};
export function setNames(m){ NAMES = m || {}; }
export function nameOf(id){ const j = NAMES[id]; return (j && j.n) || id; }
export function nameHtml(id){ const p = advOf(id); return `${nameOf(id)}${p ? `<small class="adv">(${p}교수님)</small>` : ""}`; }
export function advOf(id){ const j = NAMES[id]; return (j && j.p) || ""; }
export function keys(o) { return o ? Object.keys(o) : []; }
