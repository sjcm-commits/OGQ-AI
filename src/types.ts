export enum PlatformType {
  SOOP = "SOOP (인터넷 방송)",
  BLOG = "블로그 (리뷰/정보)",
  DAILY = "일상/채팅 (Daily)"
}

export enum StickerType {
  CHARACTER = "캐릭터",
  CHARACTER_TEXT = "캐릭터 + 텍스트",
  TEXT_ONLY = "텍스트 전용"
}

export enum TargetJob {
  STUDENT = "학생",
  STUDENT_UNIV = "대학생",
  OFFICE_WORKER = "직장인",
  FREELANCER = "프리랜서",
  CUSTOM = "직접 입력"
}

export enum TargetAge {
  AGE_10 = "10대",
  AGE_20 = "20대",
  AGE_30 = "30대",
  AGE_40_PLUS = "40대 이상",
  ALL = "전연령"
}

export enum TargetGender {
  MALE = "남성 타겟",
  FEMALE = "여성 타겟",
  NEUTRAL = "성별 무관"
}

export enum TextStyle {
  HANDWRITTEN = "손글씨/감성",
  MINIMAL = "심플/미니멀",
  RETRO = "레트로/힙",
  BOLD = "볼드/팝아트",
  WATERCOLOR = "수채화/파스텔"
}

export enum TextUsage {
  DIVIDER = "포스팅 구분선",
  DISCLOSURE = "공정위/대가성 표기",
  DAILY = "일상 감성 문구",
  AUTHENTICITY = "내돈내산 인증",
  FOOTER = "블로그 하단(공감/이웃추가)"
}

export enum MainCategory {
  SOOP_STREAMING = "[1. SOOP / 방송 & 스트리밍]",
  BLOG_REVIEW = "[2. 네이버 블로그 / 포스팅 & 리뷰]",
  DAILY_PERSONA = "[3. 일상 & 페르소나]",
  EMOTION_ART = "[4. 감정 & 아트 스타일]",
  CUSTOM = "직접 입력"
}

export const SubCategories: Record<string, string[]> = {
  [MainCategory.SOOP_STREAMING]: [
    "스트리머/BJ 전용",
    "리액션/도네이션",
    "게임/콘텐츠/티어",
    "방송 기념일/이벤트",
    "병맛/개그 리액션"
  ],
  [MainCategory.BLOG_REVIEW]: [
    "맛집/카페/탐방",
    "내돈내산/제품리뷰",
    "여행/장소정보/지도",
    "재테크(주식/코인/부동산)",
    "환경/에코/갓생",
    "라인/테이프/구분선 스티커"
  ],
  [MainCategory.DAILY_PERSONA]: [
    "직장인(출근/야근/퇴사)",
    "학생(공부/시험/방학)",
    "가족/육아/반려동물",
    "커플/연애/기념일",
    "취미/생활스포츠"
  ],
  [MainCategory.EMOTION_ART]: [
    "기본 감정(희노애락)",
    "글씨/메시지/캘리그라피",
    "웹툰/일러스트 스타일",
    "사람 캐릭터 전용",
    "동물(강아지/고양이/햄찌 등)"
  ]
};

export enum SpeechCategory {
  BJ_TENSION = "화끈한 BJ 텐션",
  CALM_BLOGGER = "조곤조곤 블로거",
  CYNICAL_VIEWER = "시니컬한 시청자",
  TSUNDERE = "츤데레",
  POLITE = "정중함",
  TIMID = "소심함"
}

export enum GenreType {
  COMEDY = "코믹/병맛",
  OFFICE = "직장/사회생활",
  RETRO = "레트로/Y2K",
  HEALING = "힐링/감성",
  HORROR = "공포/스릴러"
}

export interface CharacterInput {
  name: string;
  image?: string; // base64
  stickerType: StickerType;
  platform: PlatformType;
  tone: string;
  description: string;
  targetJob: TargetJob;
  customTargetJob?: string;
  targetAge: TargetAge;
  targetGender: TargetGender;
  mainCategory: MainCategory;
  subCategory: string;
  customConcept: string;
  stickerCount: 24;
}

export interface StickerPlan {
  id: number;
  text: string;
  visualSituation: string;
  detailedDirecting: string; // [Body ratio, Screen position, Props]
  emotion: string; // Will include (보조 효과: ...)
  individualPrompt: string;
}

export interface ObjectiveAnalysis {
  texture: string;
  colors: string;
  form: string;
}

export interface SEOAnalysis {
  keywordCombinations: {
    combination: string;
    strategy: string;
  }[];
}

export interface ThumbnailStrategy {
  recommendedId: number;
  reason: string;
  hookPhrase: string;
}

export interface TitleRecommendations {
  usageOriented: string;
  characterOriented: string;
  trendOriented: string;
}

export interface PlanningReport {
  characterAnalysis: ObjectiveAnalysis;
  thumbnailStrategy: ThumbnailStrategy;
  titleRecommendations: TitleRecommendations;
  stickerSetPlan: StickerPlan[];
  globalPrompt: string;
  imageGenerationPrompt?: string;
  ogqGuidelines: string;
  hashtags: string[];
  seoAnalysis: SEOAnalysis;
  technicalSpecs: {
    format: string;
    ratio: string;
    resolution: string;
    size: string;
  };
}
