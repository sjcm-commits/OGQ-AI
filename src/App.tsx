import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Upload, 
  FileText, 
  Loader2, 
  RefreshCcw,
  Download,
  Settings,
  User,
  MessageSquare,
  Sparkles,
  Layout,
  ChevronDown,
  Palette,
  PenTool,
  Type,
  Move,
  Video,
  Monitor,
  Globe,
  Layers,
  MousePointer2,
  Brush,
  Target,
  Zap,
  MessageCircle,
  Wand2,
  Search,
  Image
} from 'lucide-react';
import { 
  CharacterInput, 
  PlatformType, 
  StickerType,
  TextStyle,
  TextUsage,
  TargetJob,
  TargetAge,
  TargetGender,
  MainCategory, 
  SubCategories, 
  SpeechCategory, 
  PlanningReport,
  GenreType
} from './types';
import { generatePlanningReport, recommendStickerSetNames, generateImagePrompt } from './services/geminiService';

const OGQ_GUIDELINES = `
1. 저작권 및 초상권: 타인의 저작권이나 초상권을 침해하지 않는 순수 창작물이어야 합니다.
2. 선정성 및 폭력성: 과도한 노출, 성적 묘사, 폭력적인 연출은 금지됩니다.
3. 혐오 표현: 특정 집단에 대한 차별, 비하, 혐오를 조장하는 콘텐츠는 승인되지 않습니다.
4. 가독성: 텍스트가 포함된 경우 배경과 대비가 명확하여 읽기 쉬워야 합니다.
5. 이미지 품질: 해상도가 낮거나 노이즈가 심한 이미지는 반려될 수 있습니다. (권장 740x740px)
6. 중복 등록: 동일하거나 유사한 스티커를 중복해서 등록할 수 없습니다.
`.trim();

const PLATFORM_KEYWORDS: Record<PlatformType, string[]> = {
  [PlatformType.SOOP]: ["ㄹㅇㅋㅋ", "킹받네", "ㄴㅇㅅ", "가즈아", "비상", "억까", "나락"],
  [PlatformType.BLOG]: ["내돈내산", "정중한", "깔끔한", "솔직한", "꿀팁전수", "정보성"],
  [PlatformType.DAILY]: ["친근한", "츤데레", "갓생살기", "몽글몽글", "시니컬한", "하찮은"]
};

const GENRE_KEYWORDS: Record<GenreType, string[]> = {
  [GenreType.COMEDY]: ["웃겨", "드립", "개그", "병맛", "엽기", "유머", "폭소", "깔깔", "피식", "허무"],
  [GenreType.OFFICE]: ["출근", "퇴근", "월급", "회의", "야근", "점심", "커피", "보고", "피곤", "휴가"],
  [GenreType.RETRO]: ["추억", "감성", "옛날", "빈티지", "그때그시절", "아날로그", "클래식", "도트", "Y2K", "세기말"],
  [GenreType.HEALING]: ["위로", "휴식", "평온", "따뜻", "힐링", "여유", "행복", "사랑", "응원", "토닥"],
  [GenreType.HORROR]: ["공포", "소름", "심령", "무서워", "오싹", "괴담", "미스터리", "어둠", "비명", "탈출"]
};

export default function App() {
  const [input, setInput] = useState<CharacterInput>({
    name: '',
    stickerType: StickerType.CHARACTER_TEXT,
    platform: PlatformType.SOOP,
    tone: '',
    description: '',
    targetJob: TargetJob.STUDENT,
    targetAge: TargetAge.AGE_10,
    targetGender: TargetGender.NEUTRAL,
    mainCategory: MainCategory.DAILY_PERSONA,
    subCategory: SubCategories[MainCategory.DAILY_PERSONA][0],
    customConcept: '',
    stickerCount: 24,
  });
  const [stickerSetName, setStickerSetName] = useState('');
  const [recommendedNames, setRecommendedNames] = useState<string[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [report, setReport] = useState<PlanningReport | null>(null);
  const [selectedHashtags, setSelectedHashtags] = useState<Set<string>>(new Set());
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [keywordTab, setKeywordTab] = useState<'platform' | 'genre'>('platform');
  const [selectedGenre, setSelectedGenre] = useState<GenreType>(GenreType.COMEDY);
  const [showIndividualPrompts, setShowIndividualPrompts] = useState(false);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});
  const [tipIndex, setTipIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // 복사 기능 (Fallback 포함)
  const handleCopy = (text: string, id?: string) => {
    if (!text) return;

    // 🔴 문제의 구간: AI Studio 환경에서는 confirm이 작동하지 않으므로 주석 처리합니다.
    /*
    const isPrompt = id === 'global' || id === 'base' || id === 'all-individual' || id?.startsWith('ind-') || id === 'all-prompts';
    const confirmMessage = "AI 생성 이미지는 저작권 및 플랫폼 가이드라인 준수 책임이 사용자에게 있습니다. 확인하시겠습니까?";
    if (isPrompt && !window.confirm(confirmMessage)) return; 
    */

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => {
          // alert("✅ 복사 완료!"); // 🔴 alert도 차단될 수 있으니 콘솔로 대체하거나 생략
          console.log("복사 성공:", text);
          if (id) {
            setCopyStatus(prev => ({ ...prev, [id]: true }));
            setTimeout(() => {
              setCopyStatus(prev => ({ ...prev, [id]: false }));
            }, 2000);
          }
        })
        .catch(() => fallbackCopy(text, id));
    } else {
      fallbackCopy(text, id);
    }
  };

  const fallbackCopy = (text: string, id?: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        // alert("✅ 복사 완료! 메모장에 저장하세요.");
        console.log("복사 성공 (fallback):", text);
        if (id) {
          setCopyStatus(prev => ({ ...prev, [id]: true }));
          setTimeout(() => {
            setCopyStatus(prev => ({ ...prev, [id]: false }));
          }, 2000);
        }
      } else {
        console.error("복사 실패 (fallback)");
      }
    } catch (err) {
      console.error("복사 중 오류 발생 (fallback):", err);
    }
  };

  const LOADING_TIPS = [
    "캐릭터의 일관성을 위해 상세한 외형 묘사를 포함하고 있습니다.",
    "배경은 투명 또는 흰색으로 설정하여 가공이 용이하게 만듭니다.",
    "OGQ 가이드라인에 맞춰 가독성 높은 디자인을 제안합니다.",
    "24종의 다양한 감정 표현을 영어 프롬프트로 변환 중입니다."
  ];

  useEffect(() => {
    if (isGeneratingPrompt) {
      const interval = setInterval(() => {
        setTipIndex(prev => (prev + 1) % LOADING_TIPS.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isGeneratingPrompt]);

  const toggleHashtag = (tag: string) => {
    setSelectedHashtags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'mainCategory') {
      const mainCat = value as MainCategory;
      setInput(prev => {
        let platform = prev.platform;
        if (mainCat === MainCategory.SOOP_STREAMING) platform = PlatformType.SOOP;
        else if (mainCat === MainCategory.BLOG_REVIEW) platform = PlatformType.BLOG;

        return { 
          ...prev, 
          mainCategory: mainCat,
          platform,
          subCategory: SubCategories[mainCat]?.[0] || ''
        };
      });
    } else {
      setInput(prev => ({ ...prev, [name]: value }));
    }
  };

  // Auto-recommendation effect for sticker set names
  useEffect(() => {
    const timer = setTimeout(() => {
      const isCharacterValid = input.stickerType === StickerType.TEXT_ONLY || (input.name && input.name.trim().length >= 1);
      const isTargetValid = input.targetJob !== TargetJob.CUSTOM || (input.customTargetJob && input.customTargetJob.trim().length >= 1);
      const isDescriptionValid = input.description && input.description.trim().length >= 5;

      if (isCharacterValid && isTargetValid && isDescriptionValid) {
        setIsRecommending(true);
        recommendStickerSetNames(input)
          .then(names => setRecommendedNames(names))
          .catch(err => console.error('Failed to recommend names:', err))
          .finally(() => setIsRecommending(false));
      } else {
        setRecommendedNames([]);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    input.name, 
    input.platform, 
    input.targetJob, 
    input.customTargetJob, 
    input.targetAge, 
    input.targetGender, 
    input.stickerType,
    input.mainCategory,
    input.subCategory,
    input.customConcept,
    input.description
  ]);

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword);
      else next.add(keyword);
      return next;
    });
  };

  useEffect(() => {
    setInput(prev => ({ ...prev, tone: Array.from(selectedKeywords).join(', ') }));
  }, [selectedKeywords]);

  const handleExport = () => {
    if (!report) return;

    const exportText = `
[OGQ 스티커 기획 보고서]

1. 캐릭터 분석
- 재질: ${report.characterAnalysis.texture}
- 메인 컬러: ${report.characterAnalysis.colors}
- 형태: ${report.characterAnalysis.form}

2. AI 스마트 제목 추천
- 용도 중심: ${report.titleRecommendations.usageOriented}
- 캐릭터 중심: ${report.titleRecommendations.characterOriented}
- 트렌드 중심: ${report.titleRecommendations.trendOriented}

3. 썸네일 전략
- 추천 번호: ${report.thumbnailStrategy.recommendedId}번
- 선정 이유: ${report.thumbnailStrategy.reason}
- 클릭 유도 문구: ${report.thumbnailStrategy.hookPhrase}

4. 24종 스티커 세트 기획안
${report.stickerSetPlan.map(item => `
[${item.id}번]
- 문구: ${item.text}
- 상황: ${item.visualSituation}
- 연출: ${item.detailedDirecting}
- 감정: ${item.emotion}
`).join('\n')}

5. 마케팅 전략
- 키워드 조합: ${report.seoAnalysis.keywordCombinations.map(k => k.combination).join(', ')}
- 해시태그: ${report.hashtags.join(', ')}
    `.trim();

    handleCopy(exportText);
  };

  const copyAllPrompts = () => {
    if (!report) return;
    const allPrompts = `
[Global Prompt]
${report.globalPrompt}

[Individual Prompts]
${report.stickerSetPlan.map(item => `Cut ${item.id}: ${item.individualPrompt}`).join('\n\n')}
    `.trim();
    handleCopy(allPrompts, 'all-prompts');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setInput(prev => ({ ...prev, image: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!report) return;
    setIsGeneratingPrompt(true);
    try {
      const prompt = await generateImagePrompt(report, input);
      setReport({ ...report, imageGenerationPrompt: prompt });
    } catch (error) {
      console.error("Error generating prompt:", error);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await generatePlanningReport(input);
      setReport(result);
      setSelectedHashtags(new Set());
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error('Failed to generate report:', error);
      if (error instanceof Error && error.message === 'SAFETY_VIOLATION') {
        alert('해당 컨셉은 가이드라인에 따라 기획이 어렵습니다. 더 건전하고 즐거운 컨셉으로 요청해 주세요!');
      } else {
        alert('기획안 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReport(null);
    setSelectedHashtags(new Set());
    setInput({
      name: '',
      stickerType: StickerType.CHARACTER_TEXT,
      platform: PlatformType.SOOP,
      tone: '',
      description: '',
      targetJob: TargetJob.STUDENT,
      targetAge: TargetAge.AGE_10,
      targetGender: TargetGender.NEUTRAL,
      mainCategory: MainCategory.DAILY_PERSONA,
      subCategory: SubCategories[MainCategory.DAILY_PERSONA][0],
      customConcept: '',
      stickerCount: 24,
    });
    setStickerSetName('');
    setRecommendedNames([]);
    setImagePreview(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrint = () => {
    window.print();
  };

  const isTextOnly = input.stickerType === StickerType.TEXT_ONLY;

  return (
    <div className="min-h-screen bg-[#F0FFF9]/20 text-slate-900 font-sans selection:bg-[#00C389]/20 pb-20 print:bg-white print:pb-0">
      {/* Header */}
      <header className="bg-[#00C389] border-b border-[#00C389]/20 sticky top-0 z-30 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">OGQ 맞춤형 스티커 기획 AI봇</h1>
          </div>
          <div className="flex items-center gap-4">
            {report && (
              <button 
                onClick={resetForm}
                className="text-sm font-medium text-white/80 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                새 기획 시작
              </button>
            )}
            <span className="text-xs font-bold px-2 py-1 bg-white/20 text-white rounded border border-white/30 uppercase tracking-wider">Professional Tool</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12 print:py-0 print:space-y-4">
        {/* Top Section: Input Form */}
        <section className="max-w-5xl mx-auto print:hidden">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
            {/* 0. Character Image Upload (Removed from top, will be reordered inside form) */}

            {/* Removed: 스티커 전문 기획 워크시트 section */}

            <form onSubmit={handleSubmit} className="p-8 space-y-10">
              {/* 1. Character Name */}
              <div className="space-y-4">
                <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                  <User className="w-4 h-4 text-[#00C389]" />
                  캐릭터 이름
                  <span className="text-[10px] text-slate-400 font-normal">(예: 분홍이, 댕댕이, 햄찌)</span>
                </label>
                <input
                  required
                  name="name"
                  value={input.name}
                  onChange={handleInputChange}
                  placeholder="캐릭터 이름을 입력하세요"
                  className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00C389] outline-none transition-all bg-[#F0FFF9]/30"
                />
              </div>

              {/* 2. Character Image Upload */}
              <div className="space-y-4">
                <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                  <Upload className="w-4 h-4 text-[#00C389]" />
                  캐릭터 이미지 (Placeholder: {'{{character_image}}'})
                </label>
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-[#F0FFF9]/30 border border-slate-100">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden relative group ${imagePreview ? 'border-[#00C389] bg-white' : 'border-slate-200 bg-white hover:border-[#00C389]'}`}
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <RefreshCcw className="w-5 h-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload</span>
                      </>
                    )}
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold text-slate-700">이미지 분석 기반 기획</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      캐릭터 이미지를 업로드하면 AI가 형태와 색상을 분석하여<br/>
                      OGQ 가이드라인에 최적화된 비주얼 가이드를 생성합니다.
                    </p>
                    {imagePreview && (
                      <button 
                        type="button"
                        onClick={() => { setImagePreview(null); setInput(prev => ({ ...prev, image: undefined })); }}
                        className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 mt-2"
                      >
                        이미지 삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Sticker Type */}
              <div className="space-y-4">
                <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                  <MousePointer2 className="w-4 h-4 text-[#00C389]" />
                  스티커 유형
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.values(StickerType).map(t => (
                    <label 
                      key={t}
                      className={`flex items-center justify-center text-center p-4 rounded-xl border-2 cursor-pointer transition-all ${input.stickerType === t ? 'border-[#00C389] bg-[#F0FFF9] shadow-sm' : 'border-slate-100 hover:border-[#00C389]/30'}`}
                    >
                      <input 
                        type="radio"
                        name="stickerType"
                        value={t}
                        checked={input.stickerType === t}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className={`text-sm font-bold ${input.stickerType === t ? 'text-[#00C389]' : 'text-slate-600'}`}>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Target Platform */}
              <div className="space-y-4">
                <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                  <Globe className="w-4 h-4 text-[#00C389]" />
                  타겟 플랫폼
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.values(PlatformType).map(p => (
                    <label 
                      key={p}
                      className={`flex items-center justify-center text-center p-4 rounded-xl border-2 cursor-pointer transition-all ${input.platform === p ? 'border-[#00C389] bg-[#F0FFF9] shadow-sm' : 'border-slate-100 hover:border-[#00C389]/30'}`}
                    >
                      <input 
                        type="radio"
                        name="platform"
                        value={p}
                        checked={input.platform === p}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className={`text-sm font-bold ${input.platform === p ? 'text-[#00C389]' : 'text-slate-600'}`}>{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 5. Tone & Personality */}
              <div className="space-y-4">
                <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                  <MessageSquare className="w-4 h-4 text-[#00C389]" />
                  톤 & 성격 키워드
                  <span className="text-[10px] text-slate-400 font-normal">(예: ㄹㅇㅋㅋ, ㄱㅇㅇ, 킹받네, 정중함 등)</span>
                </label>
                <div className="space-y-4">
                  <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                    <button
                      type="button"
                      onClick={() => setKeywordTab('platform')}
                      className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${keywordTab === 'platform' ? 'bg-[#00C389] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      플랫폼별 추천
                    </button>
                    <button
                      type="button"
                      onClick={() => setKeywordTab('genre')}
                      className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${keywordTab === 'genre' ? 'bg-[#00C389] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      장르별 추천
                    </button>
                  </div>

                  {keywordTab === 'platform' ? (
                    <div className="flex flex-wrap gap-2">
                      {PLATFORM_KEYWORDS[input.platform]?.map(kw => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => toggleKeyword(kw)}
                          className={`px-3 py-1.5 rounded-xl border transition-all text-[11px] font-bold ${selectedKeywords.has(kw) ? 'bg-[#00C389] border-[#00C389] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-[#00C389] hover:text-[#00C389]'}`}
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value as GenreType)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:ring-1 focus:ring-[#00C389]"
                      >
                        {Object.values(GenreType).map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-2">
                        {GENRE_KEYWORDS[selectedGenre]?.map(kw => (
                          <button
                            key={kw}
                            type="button"
                            onClick={() => toggleKeyword(kw)}
                            className={`px-3 py-1.5 rounded-xl border transition-all text-[11px] font-bold ${selectedKeywords.has(kw) ? 'bg-[#00C389] border-[#00C389] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-[#00C389] hover:text-[#00C389]'}`}
                          >
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      required
                      name="tone"
                      value={input.tone}
                      onChange={handleInputChange}
                      placeholder="선택된 키워드들이 여기에 표시됩니다 (직접 입력도 가능)"
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00C389] outline-none bg-[#F0FFF9]/30 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const custom = prompt("추가할 키워드를 입력하세요:");
                        if (custom) toggleKeyword(custom);
                      }}
                      className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      직접 입력
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. Detailed Personality & Appearance */}
              <div className="space-y-4">
                <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                  <Sparkles className="w-4 h-4 text-[#00C389]" />
                  상세 성격 및 외형 특징
                </label>
                <textarea
                  required
                  name="description"
                  value={input.description}
                  onChange={handleInputChange}
                  placeholder="캐릭터의 외형, 성격, 방송 컨셉 등을 상세히 적어주세요."
                  rows={5}
                  className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00C389] outline-none transition-all resize-none bg-[#F0FFF9]/30 text-sm"
                />
              </div>

              {/* 7. Target Audience */}
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                  <Target className="w-4 h-4 text-[#00C389]" />
                  타겟 오디언스 설정
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase ml-1">직업/신분</span>
                    <select
                      name="targetJob"
                      value={input.targetJob}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00C389] outline-none bg-[#F0FFF9]/30 text-sm font-medium"
                    >
                      {Object.values(TargetJob).map(job => (
                        <option key={job} value={job}>{job}</option>
                      ))}
                    </select>
                    {input.targetJob === TargetJob.CUSTOM && (
                      <input
                        name="customTargetJob"
                        value={input.customTargetJob || ''}
                        onChange={handleInputChange}
                        placeholder="직업 직접 입력"
                        className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#00C389] outline-none bg-[#F0FFF9]/30 text-xs"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase ml-1">연령대</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.values(TargetAge).map(age => (
                        <button
                          key={age}
                          type="button"
                          onClick={() => setInput(prev => ({ ...prev, targetAge: age }))}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${input.targetAge === age ? 'bg-[#00C389] border-[#00C389] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-[#00C389]'}`}
                        >
                          {age}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase ml-1">성별</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.values(TargetGender).map(gender => (
                        <button
                          key={gender}
                          type="button"
                          onClick={() => setInput(prev => ({ ...prev, targetGender: gender }))}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${input.targetGender === gender ? 'bg-[#00C389] border-[#00C389] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-[#00C389]'}`}
                        >
                          {gender}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 8. Concept Selection */}
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                      <Layers className="w-4 h-4 text-[#00C389]" />
                      컨셉 선택
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase ml-1">대분류</span>
                        <select
                          name="mainCategory"
                          value={input.mainCategory}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00C389] outline-none bg-[#F0FFF9]/30 text-sm font-medium"
                        >
                          {Object.values(MainCategory).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      {input.mainCategory !== MainCategory.CUSTOM && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase ml-1">소분류</span>
                          <select
                            name="subCategory"
                            value={input.subCategory}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00C389] outline-none bg-[#F0FFF9]/30 text-sm font-medium"
                          >
                            {SubCategories[input.mainCategory]?.map(sub => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase ml-1">상세 컨셉 (직접 입력)</span>
                      <input
                        name="customConcept"
                        value={input.customConcept}
                        onChange={handleInputChange}
                        placeholder={input.mainCategory === MainCategory.CUSTOM ? "원하시는 컨셉을 자유롭게 입력하세요" : "추가적인 상세 컨셉이 있다면 입력하세요"}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00C389] outline-none bg-[#F0FFF9]/30 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                      <Plus className="w-4 h-4 text-[#00C389]" />
                      스티커 수량 (고정)
                    </label>
                    <div className="flex items-center justify-center p-4 rounded-xl border-2 border-[#00C389] bg-[#F0FFF9] shadow-sm">
                      <span className="text-sm font-bold text-[#00C389]">24개 (OGQ 권장)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">* 전문 기획 리포트는 24컷 구성을 기본으로 합니다.</p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00C389] hover:bg-[#00AB78] disabled:bg-slate-300 text-white font-black py-6 rounded-2xl shadow-xl shadow-[#00C389]/20 transition-all flex items-center justify-center gap-3 text-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      AI 기획안 생성 중...
                    </>
                  ) : (
                    <>
                      <PenTool className="w-6 h-6" />
                      전문 기획안 생성하기
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Bottom Section: Result Worksheet */}
        <div ref={reportRef} className="scroll-mt-24 print:scroll-mt-0">
          <AnimatePresence>
            {report && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 print:space-y-4"
              >
                {/* 1. [캐릭터 분석] */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <Search className="w-6 h-6 text-[#00C389]" />
                    <h3 className="text-lg font-black text-slate-900">🔍 1. [캐릭터 분석] (Character Analysis)</h3>
                  </div>
                  {imagePreview ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">재질 / 질감</span>
                        <p className="text-sm font-bold text-slate-700">{report.characterAnalysis.texture}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">주요 Hex 컬러</span>
                        <p className="text-sm font-bold text-slate-700">{report.characterAnalysis.colors}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">형태</span>
                        <p className="text-sm font-bold text-slate-700">{report.characterAnalysis.form}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-8 rounded-[1.5rem] border border-dashed border-slate-300 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-white rounded-full shadow-sm">
                          <Image className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 italic">
                          "이미지를 업로드하면 정밀 분석이 시작됩니다"
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* 2. [AI 스마트 제목 추천 & 썸네일 전략] */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <Wand2 className="w-6 h-6 text-[#00C389]" />
                    <h3 className="text-lg font-black text-slate-900">🎯 2. [AI 스마트 제목 추천 & 썸네일 전략]</h3>
                  </div>
                  
                  <div className="space-y-8">
                    {/* 제목 추천 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">용도 중심 제목</div>
                        <div className="text-sm font-black text-slate-900">{report.titleRecommendations.usageOriented}</div>
                      </div>
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">캐릭터 중심 제목</div>
                        <div className="text-sm font-black text-slate-900">{report.titleRecommendations.characterOriented}</div>
                      </div>
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">트렌드 밈 중심 제목</div>
                        <div className="text-sm font-black text-slate-900">{report.titleRecommendations.trendOriented}</div>
                      </div>
                    </div>

                    {/* 썸네일 전략 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">추천 썸네일 번호</span>
                        <p className="text-lg font-black text-[#00C389]">{report.thumbnailStrategy.recommendedId}번</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 md:col-span-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">썸네일 선정 이유</span>
                        <p className="text-sm font-bold text-slate-700">{report.thumbnailStrategy.reason}</p>
                      </div>
                      <div className="p-4 bg-[#00C389]/5 rounded-2xl border border-[#00C389]/20 md:col-span-3">
                        <span className="text-[10px] font-black text-[#00C389] uppercase tracking-widest block mb-1">클릭 유도 문구 (Hook)</span>
                        <p className="text-base font-black text-[#00C389]">"{report.thumbnailStrategy.hookPhrase}"</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 3. [24종 스티커 세트 기획안] */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden print:border-none print:shadow-none">
                  <div className="px-10 py-6 border-b border-slate-100 bg-slate-50/50 print:bg-white print:px-0 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Layout className="w-6 h-6 text-[#00C389]" />
                      3. 전문 24종 스티커 세트 기획안
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 print:hidden">
                      <div className="flex items-center gap-1"><Video className="w-3 h-3" /> SOOP</div>
                      <div className="flex items-center gap-1"><FileText className="w-3 h-3" /> 블로그</div>
                      <div className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 채팅</div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 print:bg-slate-50">
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-16">No.</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-48">문구 (Text)</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">비주얼 상황 (Visual Situation)</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-64">상세 연출 (Directing)</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-48">감정 (보조 효과 포함)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.stickerSetPlan.map((item, idx) => (
                          <motion.tr 
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.02 * idx }}
                            className="hover:bg-[#F0FFF9] transition-colors group print:break-inside-avoid"
                          >
                            <td className="px-8 py-5 align-top">
                              <div className="flex flex-col items-center gap-2">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-[10px] font-black text-slate-500 group-hover:bg-[#00C389] group-hover:text-white transition-colors">
                                  {String(item.id).padStart(2, '0')}
                                </span>
                                <button
                                  onClick={() => handleCopy(item.individualPrompt, `ind-${item.id}`)}
                                  className={`p-1.5 rounded-md transition-all border ${copyStatus[`ind-${item.id}`] ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-[#00C389] hover:text-[#00C389]'}`}
                                  title="프롬프트 복사"
                                >
                                  {copyStatus[`ind-${item.id}`] ? <span className="text-[8px] font-bold">OK</span> : <Download className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="px-8 py-5 align-top">
                              <div className="flex gap-2">
                                <Type className="w-4 h-4 text-[#00C389]/60 shrink-0 mt-0.5" />
                                <span className="text-base font-black text-[#00C389]">
                                  "{item.text}"
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-5 align-top">
                              <div className="flex gap-2">
                                <PenTool className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{item.visualSituation}</p>
                              </div>
                            </td>
                            <td className="px-8 py-5 align-top">
                              <div className="flex gap-2">
                                <Move className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-slate-500 leading-relaxed italic">{item.detailedDirecting}</p>
                              </div>
                            </td>
                            <td className="px-8 py-5 align-top">
                              <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase block w-fit mb-1">
                                {item.emotion.split('(')[0].trim()}
                              </span>
                              {item.emotion.includes('(') && (
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">
                                  {item.emotion.match(/\(([^)]+)\)/)?.[0] || ''}
                                </span>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. [마케팅 전략 (해시태그 & 노출 전략)] */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-6 h-6 text-[#00C389]" />
                    <h3 className="text-lg font-black text-slate-900">🚀 4. [OGQ 노출 극대화 팁] (해시태그 & 노출 전략)</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {report.seoAnalysis.keywordCombinations.map((item, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-[#F0FFF9]/30 border border-[#00C389]/10">
                        <div className="text-sm font-black text-[#00C389] mb-2">{item.combination}</div>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.strategy}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-slate-100">
                    <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#00C389]" /> 추천 해시태그
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {report.hashtags.map((tag, i) => (
                        <button 
                          key={i} 
                          onClick={() => toggleHashtag(tag)}
                          className={`px-4 py-2 rounded-xl text-sm font-black border transition-all cursor-pointer ${selectedHashtags.has(tag) ? 'bg-[#00C389] text-white border-[#00C389] shadow-lg scale-[1.05]' : 'bg-[#F0FFF9] text-[#00C389] border-[#00C389]/20 hover:border-[#00C389] hover:bg-[#00C389]/5'}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>

                  {/* 프롬프트 만들기 버튼 (기획안 하단) */}
                  {!report.imageGenerationPrompt && !isGeneratingPrompt && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-12 flex justify-center"
                    >
                      <button
                        onClick={handleGeneratePrompt}
                        className="px-12 py-6 rounded-2xl bg-[#00C389] text-white font-black hover:bg-[#00AB78] transition-all shadow-xl shadow-[#00C389]/30 flex items-center gap-3 text-lg group"
                      >
                        <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        AI 이미지 생성 프롬프트 만들기
                      </button>
                    </motion.div>
                  )}

                {/* 5. [이미지 생성 프롬프트] */}
                {report.imageGenerationPrompt && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <PenTool className="w-24 h-24 text-[#00C389]" />
                    </div>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <PenTool className="w-6 h-6 text-[#00C389]" />
                        <h3 className="text-lg font-black text-white">🎨 5. [이미지 생성 프롬프트] (Image Generation Prompt)</h3>
                      </div>
                      <button
                        onClick={copyAllPrompts}
                        className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 shadow-lg ${copyStatus['all-prompts'] ? 'bg-emerald-500 text-white' : 'bg-[#00C389] text-white hover:bg-[#00AB78]'}`}
                      >
                        {copyStatus['all-prompts'] ? (
                          <>✅ 마스터 프롬프트 복사됨</>
                        ) : (
                          <><Download className="w-4 h-4" /> 마스터 프롬프트 복사하기</>
                        )}
                      </button>
                    </div>
                    
                    <div className="space-y-8">
                      {/* OGQ Guidelines integrated here */}
                      <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="w-4 h-4 text-[#00C389]" />
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">OGQ Sticker Guidelines</h4>
                        </div>
                        <pre className="text-[10px] text-slate-500 font-bold leading-relaxed whitespace-pre-wrap font-sans">
                          {OGQ_GUIDELINES}
                        </pre>
                      </div>

                      {/* Global Prompt Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-[#00C389] uppercase tracking-widest flex items-center gap-2">
                            <Globe className="w-4 h-4" /> [AI 마스터 프롬프트]
                          </h4>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                          <p className="text-xs text-slate-300 font-mono leading-relaxed">{report.imageGenerationPrompt}</p>
                        </div>

                        <div className="pt-4">
                          <h4 className="text-sm font-black text-[#00C389] mb-3 uppercase tracking-widest flex items-center gap-2">
                            <Globe className="w-4 h-4" /> [기본 스타일 프롬프트]
                          </h4>
                          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 relative group">
                            <p className="text-xs text-slate-300 font-mono leading-relaxed">{report.globalPrompt}</p>
                            <button 
                              onClick={() => handleCopy(report.globalPrompt, 'base')}
                              className={`absolute top-4 right-4 p-2 rounded-lg transition-all ${copyStatus['base'] ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                              {copyStatus['base'] ? '✅' : <Download className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Individual Prompts Section */}
                      {!showIndividualPrompts ? (
                        <div className="pt-6 border-t border-slate-800">
                          <button
                            onClick={() => setShowIndividualPrompts(true)}
                            className="w-full py-4 rounded-xl bg-slate-800 text-slate-300 font-black hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-700"
                          >
                            <Layers className="w-4 h-4" />
                            개별 프롬프트 만들기(24종)
                          </button>
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="pt-8 border-t border-slate-800 space-y-6"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-[#00C389] uppercase tracking-widest flex items-center gap-2">
                              <Layers className="w-4 h-4" /> [개별 프롬프트]
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {report.stickerSetPlan.map((item) => (
                              <div key={item.id} className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 group relative">
                                <div className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">{item.id}번 프롬프트</div>
                                <p className="text-[11px] text-slate-400 font-mono leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                                  {item.individualPrompt}
                                </p>
                                <button 
                                  onClick={() => handleCopy(item.individualPrompt, `ind-${item.id}`)}
                                  className={`absolute top-2 right-2 p-1.5 rounded-md transition-all ${copyStatus[`ind-${item.id}`] ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 opacity-0 group-hover:opacity-100'}`}
                                >
                                  {copyStatus[`ind-${item.id}`] ? '✅' : <Download className="w-3 h-3" />}
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 6. Technical Specifications */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-6 h-6 text-[#00C389]" />
                    <h3 className="text-lg font-black text-slate-900">⚙️ 6. [기술 사양] (Technical Specs)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">파일 형식</p>
                      <p className="text-sm font-black text-slate-700">PNG (투명 배경 필수)</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">해상도</p>
                      <p className="text-sm font-black text-slate-700">740 x 640 px (고정)</p>
                    </div>
                  </div>
                </motion.div>

                {/* Export Button Section */}
                <div className="pt-12 pb-24 text-center">
                  <button
                    onClick={handleExport}
                    className="group relative inline-flex items-center gap-4 px-12 py-6 bg-[#00C389] text-white rounded-[2rem] font-black text-xl hover:bg-[#00AB78] transition-all shadow-2xl shadow-[#00C389]/40 hover:scale-105 active:scale-95"
                  >
                    <Download className="w-8 h-8 group-hover:bounce" />
                    전체 기획서 복사하기
                  </button>
                  <p className="mt-6 text-slate-400 font-bold text-sm">
                    ⚠️ 복사 후 메모장에 붙여넣어 보관하세요.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Loading Tips Overlay (Fixed Position) */}
      <AnimatePresence>
        {isGeneratingPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full"
            >
              <Loader2 className="w-16 h-16 text-[#00C389] animate-spin mx-auto mb-8" />
              <h4 className="text-2xl font-black text-white mb-4">AI 프롬프트 최적화 중...</h4>
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 min-h-[100px] flex items-center justify-center">
                <motion.p 
                  key={tipIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[#00C389] text-lg font-bold"
                >
                  {LOADING_TIPS[tipIndex]}
                </motion.p>
              </div>
              <p className="mt-8 text-slate-500 text-sm font-medium">잠시만 기다려주세요. 고퀄리티 이미지를 위한 프롬프트를 구성하고 있습니다.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
