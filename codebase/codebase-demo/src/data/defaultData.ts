import { SourceItem, ScriptSentence, LectureForm } from '../types';

export const initialFormData: LectureForm = {
  topic: 'Prompt Engineering cho người mới',
  goal: 'Người học hiểu prompt là gì và viết được prompt cơ bản',
  audience: 'Sinh viên mới bắt đầu học AI',
  duration: '5 phút',
};

export const sampleTopics: LectureForm[] = [
  {
    topic: 'Prompt Engineering cho người mới',
    goal: 'Người học hiểu prompt là gì và viết được prompt cơ bản',
    audience: 'Sinh viên mới bắt đầu học AI',
    duration: '5 phút',
  },
  {
    topic: 'Machine Learning cơ bản trong giáo dục',
    goal: 'Hiểu sự khác biệt giữa học có giám sát và không giám sát',
    audience: 'Giảng viên và nghiên cứu sinh',
    duration: '7 phút',
  },
  {
    topic: 'Bảo mật thông tin khi ứng dụng Generative AI',
    goal: 'Nắm vững quy tắc bảo vệ dữ liệu nhạy cảm và tuân thủ bản quyền',
    audience: 'Sinh viên ngành CNTT & Pháp lý',
    duration: '10 phút',
  }
];

export const initialSources: SourceItem[] = [
  {
    id: 'A',
    code: 'Nguồn A',
    name: 'Prompt engineering best practices',
    org: 'OpenAI (2025)',
    year: '2025',
    link: 'platform.openai.com/docs/guides/prompt-engineering',
    quote: '“A prompt is the set of instructions provided to guide the model\'s output. Giving clear instructions, providing reference text, and breaking complex tasks into simpler subtasks are foundational practices for high-accuracy completions.”',
    reliability: 'high',
    isExcluded: false,
    statusText: 'Độ tin cậy: Cao (Nguồn chính thức)',
    reason: 'Tài liệu chính thức từ đơn vị phát triển mô hình AI, có cơ sở thực nghiệm và cập nhật chuẩn hóa.',
    isAutoApproved: true,
  },
  {
    id: 'B',
    code: 'Nguồn B',
    name: 'Prompt design guide',
    org: 'Google AI (2025)',
    year: '2025',
    link: 'ai.google.dev/gemini-api/docs/prompting-guide',
    quote: '“Effective prompt design requires explicit context: define the persona, set clear constraints, specify the format, and iterate with multiple test cases to systematically benchmark accuracy.”',
    reliability: 'high',
    isExcluded: false,
    statusText: 'Độ tin cậy: Cao (Hướng dẫn kỹ thuật chính thống)',
    reason: 'Hướng dẫn kỹ thuật từ nguồn chính thức, kiểm chứng bởi đội ngũ AI Research uy tín.',
    isAutoApproved: true,
  },
  {
    id: 'C',
    code: 'Nguồn C',
    name: '10 mẹo prompt giúp AI luôn chính xác',
    org: 'Blog cá nhân (Không rõ tác giả, không rõ ngày)',
    year: 'Không rõ',
    link: 'medium.com/@anonymous-blogger/10-prompt-tips',
    quote: '“Cứ viết thật dài trên 100 từ thì AI mới hiểu hết ý và tự động luôn luôn đúng 100% không bao giờ gặp lỗi ngụy tạo thông tin.”',
    reliability: 'low',
    isExcluded: false,
    statusText: 'Độ tin cậy: Thấp (Khuyến cáo không dùng)',
    reason: 'Không có tác giả, ngày xuất bản và dẫn chứng rõ ràng. Chứa khẳng định phóng đại thiếu căn cứ thực nghiệm.',
    isAutoApproved: false,
  },
];

export const initialSentences: ScriptSentence[] = [
  {
    id: 1,
    originalText: '“Prompt là hướng dẫn mà bạn cung cấp để AI hiểu nhiệm vụ cần thực hiện.”',
    currentText: '“Prompt là hướng dẫn mà bạn cung cấp để AI hiểu nhiệm vụ cần thực hiện.”',
    sourceIds: ['A'],
    badgeStatus: 'valid',
  },
  {
    id: 2,
    originalText: '“Một prompt hiệu quả thường nêu rõ vai trò, mục tiêu và bối cảnh.”',
    currentText: '“Một prompt hiệu quả thường nêu rõ vai trò, mục tiêu và bối cảnh.”',
    sourceIds: ['A', 'B'],
    badgeStatus: 'multi_valid',
  },
  {
    id: 3,
    originalText: '“Prompt dài hơn 100 từ luôn cho kết quả tốt hơn.”',
    currentText: '“Prompt dài hơn 100 từ luôn cho kết quả tốt hơn.”',
    sourceIds: ['C'],
    requiresSourceC: true,
    isRewritten: false,
    rewrittenText: '“Độ dài của prompt không quyết định chất lượng; điều quan trọng là yêu cầu rõ ràng và có đủ ngữ cảnh.”',
    rewrittenSourceIds: ['A', 'B'],
    badgeStatus: 'warning',
  },
  {
    id: 4,
    originalText: '“Hãy bắt đầu bằng một yêu cầu cụ thể, sau đó thử và chỉnh sửa dần.”',
    currentText: '“Hãy bắt đầu bằng một yêu cầu cụ thể, sau đó thử và chỉnh sửa dần.”',
    sourceIds: ['A'],
    badgeStatus: 'valid',
  },
  {
    id: 5,
    originalText: '“Bạn có thể so sánh nhiều phiên bản prompt để chọn kết quả phù hợp.”',
    currentText: '“Bạn có thể so sánh nhiều phiên bản prompt để chọn kết quả phù hợp.”',
    sourceIds: ['B'],
    badgeStatus: 'valid',
  },
];
