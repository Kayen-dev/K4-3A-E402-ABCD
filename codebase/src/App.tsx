import React, { useState } from 'react';
import { Header } from './components/Header';
import { Stepper } from './components/Stepper';
import { Step1Input } from './components/Step1Input';
import { Step2Sources } from './components/Step2Sources';
import { Step3Script } from './components/Step3Script';
import { EvidenceModal } from './components/EvidenceModal';
import { TeleprompterModal } from './components/TeleprompterModal';
import { Toast } from './components/Toast';
import { LectureForm, SourceItem, ScriptSentence } from './types';
import { initialFormData, initialSources, initialSentences } from './data/defaultData';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [form, setForm] = useState<LectureForm>(initialFormData);
  const [sources, setSources] = useState<SourceItem[]>(initialSources);
  const [sentences, setSentences] = useState<ScriptSentence[]>(initialSentences);
  const [isSentence3Rewritten, setIsSentence3Rewritten] = useState<boolean>(false);
  const [activeModalSourceId, setActiveModalSourceId] = useState<string | null>(null);
  const [showTeleprompter, setShowTeleprompter] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  // Form field update
  const handleFormChange = (field: keyof LectureForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Preset switch
  const handleSelectPreset = (preset: LectureForm) => {
    setForm(preset);
    showToast(`Đã chọn chủ đề: "${preset.topic}"`);
  };

  // Step 1 -> Step 2
  const handleProceedToStep2 = () => {
    if (!form.topic.trim()) {
      showToast('Vui lòng nhập chủ đề bài giảng.');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Đã tra cứu 3 nguồn học liệu uy tín cho bài giảng.');
  };

  // Step 2 -> Step 3
  const handleProceedToStep3 = () => {
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Đã sinh 5 câu kịch bản kèm dẫn chứng học thuật.');
  };

  // Toggle Exclude for Source (especially Source C)
  const handleToggleExclude = (sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => {
        if (s.id === sourceId) {
          const nextState = !s.isExcluded;
          if (sourceId === 'C') {
            if (nextState) {
              showToast('Nguồn C đã bị loại khỏi danh mục bảo chứng kịch bản.');
            } else {
              showToast('Đã khôi phục Nguồn C.');
              setIsSentence3Rewritten(false);
            }
          } else {
            showToast(`${nextState ? 'Đã loại' : 'Đã khôi phục'} ${s.code}`);
          }
          return { ...s, isExcluded: nextState };
        }
        return s;
      })
    );
  };

  // Add custom source
  const handleAddCustomSource = (newSource: SourceItem) => {
    setSources((prev) => [...prev, newSource]);
    showToast(`Đã bổ sung ${newSource.code}: ${newSource.name}`);
  };

  // Rewrite sentence 3
  const handleRewriteSentence3 = () => {
    setIsSentence3Rewritten(true);
    showToast('Đã viết lại câu số 03 dựa trên nguồn A & B chuẩn mực!');
  };

  // Reset entire prototype to original state for 2-min demo
  const handleResetDemo = () => {
    setCurrentStep(1);
    setForm(initialFormData);
    setSources(initialSources.map((s) => ({ ...s, isExcluded: false })));
    setSentences(initialSentences);
    setIsSentence3Rewritten(false);
    setActiveModalSourceId(null);
    setShowTeleprompter(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Đã đặt lại kịch bản về trạng thái demo ban đầu (2 phút).');
  };

  // Open modal
  const handleOpenSourceModal = (sourceId: string) => {
    setActiveModalSourceId(sourceId);
  };

  const selectedModalSource = sources.find((s) => s.id === activeModalSourceId) || null;
  const isSourceCExcluded = Boolean(sources.find((s) => s.id === 'C')?.isExcluded);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased">
      {/* Top Header */}
      <Header 
        onReset={handleResetDemo}
        onGoToStep1={() => setCurrentStep(1)}
      />

      {/* 3-Step Progress Stepper */}
      <Stepper 
        currentStep={currentStep}
        onSelectStep={(step) => {
          setCurrentStep(step);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 1 && (
          <Step1Input
            form={form}
            onChange={handleFormChange}
            onSubmit={handleProceedToStep2}
            onSelectPreset={handleSelectPreset}
          />
        )}

        {currentStep === 2 && (
          <Step2Sources
            topic={form.topic}
            sources={sources}
            onToggleExclude={handleToggleExclude}
            onOpenModal={handleOpenSourceModal}
            onGoBack={() => setCurrentStep(1)}
            onProceed={handleProceedToStep3}
            onAddCustomSource={handleAddCustomSource}
          />
        )}

        {currentStep === 3 && (
          <Step3Script
            topic={form.topic}
            sources={sources}
            sentences={sentences}
            isSourceCExcluded={isSourceCExcluded}
            isSentence3Rewritten={isSentence3Rewritten}
            onRewriteSentence3={handleRewriteSentence3}
            onOpenSourceModal={handleOpenSourceModal}
            onGoBackToSources={() => setCurrentStep(2)}
            onResetToStep1={() => {
              setCurrentStep(1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
            onOpenTeleprompter={() => setShowTeleprompter(true)}
          />
        )}
      </main>

      {/* Evidence Modal */}
      <EvidenceModal
        source={selectedModalSource}
        onClose={() => setActiveModalSourceId(null)}
      />

      {/* Teleprompter Modal */}
      {showTeleprompter && (
        <TeleprompterModal
          topic={form.topic}
          sentences={sentences}
          isSentence3Rewritten={isSentence3Rewritten}
          onClose={() => setShowTeleprompter(false)}
        />
      )}

      {/* Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}
