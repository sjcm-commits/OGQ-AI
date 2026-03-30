import { GoogleGenAI, Type } from "@google/genai";
import { CharacterInput, PlanningReport, PlatformType, TargetJob, StickerType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * 추천 스티커 세트 이름 생성
 */
export const recommendStickerSetNames = async (input: CharacterInput): Promise<string[]> => {
  const model = "gemini-3-flash-preview";
  const targetStr = `${input.targetJob === TargetJob.CUSTOM ? input.customTargetJob : input.targetJob} / ${input.targetAge} / ${input.targetGender}`;
  const conceptStr = `${input.mainCategory} > ${input.subCategory} (${input.customConcept})`;
  
  const prompt = `
    당신은 "OGQ 스티커 마스터 플래너"입니다. 다음 기획 데이터를 바탕으로 OGQ 마켓에서 판매량이 검증된 '3가지 서로 다른 스타일의 타이틀'을 추천해주세요.
    
    [기획 데이터]
    - 캐릭터 이름: ${input.stickerType === StickerType.TEXT_ONLY ? "N/A (텍스트 전용)" : input.name}
    - 스티커 유형: ${input.stickerType}
    - 핵심 플랫폼: ${input.platform}
    - 타겟: ${targetStr}
    - 컨셉: ${conceptStr}
    - 성격 키워드: ${input.tone}
    - 외형 및 상세 특징: ${input.description}
    
    [타이틀 추천 스타일 (중복 금지)]
    1. [용도 중심]: 사용자가 이 스티커를 어떤 상황에서 쓸지 직관적으로 표현 (예: "블로그 리뷰 필수템", "방송 리액션 끝판왕")
    2. [캐릭터 중심]: 캐릭터의 이름과 성격, 매력을 강조 (예: "귀염뽀짝 분홍이의 하루", "츤데레 댕댕이의 일상")
    3. [트렌드/밈 중심]: 최신 유행어나 밈, 찰진 표현을 활용 (예: "ㄹㅇㅋㅋ 킹받는 햄찌", "갓생 사는 프로 블로거")
    
    결과는 반드시 JSON 배열 형식으로만 출력하세요. 예: ["용도 중심 제목", "캐릭터 중심 제목", "트렌드/밈 중심 제목"]
    예시 캐릭터로 '파댕이'는 절대 사용하지 마세요.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
};

/**
 * 전문 기획 보고서 생성
 */
export const generatePlanningReport = async (input: CharacterInput): Promise<PlanningReport> => {
  const model = "gemini-3-flash-preview";
  const targetStr = `${input.targetJob === TargetJob.CUSTOM ? input.customTargetJob : input.targetJob} / ${input.targetAge}세 / ${input.targetGender}`;
  const conceptStr = `${input.mainCategory} > ${input.subCategory} (${input.customConcept})`;

  const systemInstruction = `당신은 OGQ 스티커 기획 전문가입니다. 모든 결과물은 반드시 100% 한국어로 작성하세요.
  
  [스티커 유형별 기획 규칙 - 엄격 준수]
  1. 캐릭터 전용 (CHARACTER_ONLY): 
     - 'text' 필드는 반드시 "텍스트 없음"으로 작성하세요.
     - 캐릭터의 '역동적인 동작'과 '비주얼 상황' 묘사에 100% 집중하세요.
  2. 텍스트 + 캐릭터 (CHARACTER_TEXT): 
     - 캐릭터의 '동작'과 그에 어울리는 '한국어 문구'를 완벽하게 조합하세요.
  3. 텍스트 전용 (TEXT_ONLY): 
     - 캐릭터 묘사를 최소화하세요.
     - '타이포그래피 스타일', '글꼴 느낌', '배경 효과' 중심의 상세 연출을 기획하세요.

  [핵심 규칙]
  1. [캐릭터 분석]: 캐릭터의 재질, 메인 컬러(Hex), 형태를 분석합니다. (이미지가 있으면 이미지 기반, 없으면 텍스트 기반)
  2. [썸네일 전략]: 1~24번 중 대표 이미지 추천 번호 1개, 선정 이유, 클릭 유도 문구.
  3. [AI 스마트 제목 추천]: 용도 중심, 캐릭터 중심, 트렌드 밈 중심의 3가지 스타일 제목.
  4. [24종 스티커 세트 기획안]: 반드시 정확히 24개의 항목을 생성하세요. 
  5. [이미지 생성 프롬프트]: 
     - [전체 프롬프트]: 캐릭터 공통 외형/화풍 영어 프롬프트.
     - [개별 프롬프트]: 24종 각각의 상세한 영어 프롬프트. 
  6. [SEO 분석]: 키워드 조합 5가지와 전략.
  
  예시 캐릭터로 '파댕이'는 절대 사용하지 마세요. 대신 '분홍이', '댕댕이', '햄찌' 등을 참고하세요.`;

  const prompt = `
    다음 데이터를 바탕으로 "OGQ 스티커 마스터 플래너"로서 핵심 기획 보고서를 작성해주세요.
    
    [기획 데이터]
    - 캐릭터 이름: ${input.name}
    - 스티커 유형: ${input.stickerType}
    - 핵심 플랫폼: ${input.platform}
    - 성격 키워드: ${input.tone}
    - 외형 및 상세 특징: ${input.description}
    - 타겟: ${targetStr}
    - 컨셉: ${conceptStr}
    
    [출력 요구사항]
    - stickerSetPlan은 반드시 정확히 24개의 객체를 포함해야 합니다.
    - 스티커 유형(${input.stickerType})에 따른 기획 규칙을 엄격히 준수하세요.
    - individualPrompt는 DALL-E 3 등에서 바로 사용할 수 있도록 상세한 영어 묘사를 작성하세요.
    - 텍스트가 포함된 유형인 경우, 프롬프트에 "The text '[문구]' must be written in Korean"과 같은 지시를 포함하세요.
    
    반드시 다음 JSON 구조로 응답하세요:
    {
      "characterAnalysis": { "texture": "...", "colors": "...", "form": "..." },
      "thumbnailStrategy": { "recommendedId": 1, "reason": "...", "hookPhrase": "..." },
      "titleRecommendations": { "usageOriented": "...", "characterOriented": "...", "trendOriented": "..." },
      "stickerSetPlan": [
        { 
          "id": 1, 
          "text": "문구 (캐릭터 전용인 경우 '텍스트 없음')", 
          "visualSituation": "상황 설명", 
          "detailedDirecting": "상세 연출 가이드",
          "emotion": "감정 및 효과", 
          "individualPrompt": "Detailed English prompt" 
        }
      ],
      "globalPrompt": "Common English prompt for character consistency",
      "ogqGuidelines": "생략 (빈 문자열)",
      "seoAnalysis": {
        "keywordCombinations": [
          { "combination": "#키워드1_키워드2", "strategy": "전략" }
        ]
      },
      "hashtags": ["#키워드1", "#키워드2", ...],
      "technicalSpecs": { "format": "PNG (Transparent)", "ratio": "1:1", "resolution": "740 x 740 px", "size": "500KB 이하" }
    }
  `;

  const parts: any[] = [{ text: prompt }];
  
  if (input.image) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: input.image.split(",")[1],
      },
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          characterAnalysis: {
            type: Type.OBJECT,
            properties: {
              texture: { type: Type.STRING },
              colors: { type: Type.STRING },
              form: { type: Type.STRING }
            },
            required: ["texture", "colors", "form"]
          },
          thumbnailStrategy: {
            type: Type.OBJECT,
            properties: {
              recommendedId: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              hookPhrase: { type: Type.STRING }
            },
            required: ["recommendedId", "reason", "hookPhrase"]
          },
          titleRecommendations: {
            type: Type.OBJECT,
            properties: {
              usageOriented: { type: Type.STRING },
              characterOriented: { type: Type.STRING },
              trendOriented: { type: Type.STRING }
            },
            required: ["usageOriented", "characterOriented", "trendOriented"]
          },
          stickerSetPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                text: { type: Type.STRING },
                visualSituation: { type: Type.STRING },
                detailedDirecting: { type: Type.STRING },
                emotion: { type: Type.STRING },
                individualPrompt: { type: Type.STRING }
              },
              required: ["id", "text", "visualSituation", "detailedDirecting", "emotion", "individualPrompt"]
            }
          },
          globalPrompt: { type: Type.STRING },
          ogqGuidelines: { type: Type.STRING },
          seoAnalysis: {
            type: Type.OBJECT,
            properties: {
              keywordCombinations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    combination: { type: Type.STRING },
                    strategy: { type: Type.STRING }
                  },
                  required: ["combination", "strategy"]
                }
              }
            },
            required: ["keywordCombinations"]
          },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          technicalSpecs: {
            type: Type.OBJECT,
            properties: {
              format: { type: Type.STRING },
              ratio: { type: Type.STRING },
              resolution: { type: Type.STRING },
              size: { type: Type.STRING }
            },
            required: ["format", "ratio", "resolution", "size"]
          }
        },
        required: [
          "characterAnalysis", 
          "thumbnailStrategy",
          "titleRecommendations",
          "stickerSetPlan", 
          "globalPrompt",
          "ogqGuidelines",
          "seoAnalysis",
          "hashtags",
          "technicalSpecs"
        ]
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  return data as PlanningReport;
};

/**
 * 이미지 생성 프롬프트 고도화 (별도 호출 가능)
 */
export const generateImagePrompt = async (report: PlanningReport, input: CharacterInput): Promise<string> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    당신은 "AI 이미지 생성 프롬프트 전문가"입니다. 
    다음 스티커 기획안을 바탕으로 DALL-E/Midjourney에서 일관된 스타일로 24종 스티커를 생성할 수 있는 '마스터 영어 프롬프트'를 작성해주세요.
    
    [기획 데이터]
    - 캐릭터 이름: ${input.name}
    - 분석: ${JSON.stringify(report.characterAnalysis)}
    - 상세 설명: ${input.description}
    - 24종 기획: ${JSON.stringify(report.stickerSetPlan)}
    
    [요구사항]
    - 캐릭터의 일관성(Consistency)을 유지하기 위한 상세 외형 묘사 포함.
    - 배경은 반드시 'Solid white background' 또는 'Transparent background'로 설정.
    - 스타일 키워드 (예: Flat design, 3D render, Vector art 등) 명시.
    
    결과는 영어 프롬프트 텍스트만 출력하세요.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text || "";
};
