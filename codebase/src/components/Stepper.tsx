import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, onSelectStep }) => {
  const steps = [
    { number: 1, label: '1. Nhập yêu cầu' },
    { number: 2, label: '2. Duyệt nguồn' },
    { number: 3, label: '3. Kịch bản có dẫn chứng' },
  ];

  const getProgressWidth = () => {
    if (currentStep === 1) return '0%';
    if (currentStep === 2) return '50%';
    return '100%';
  };

  return (
    <section className="bg-white border-b border-slate-200 shadow-xs" id="workflow-stepper">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <nav aria-label="Tiến trình soạn kịch bản">
          <ol role="list" className="flex items-center justify-between relative">
            {/* Background Connector Line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-500 transition-all duration-300"
                style={{ width: getProgressWidth() }}
              />
            </div>

            {steps.map((step) => {
              const isPassed = step.number < currentStep;
              const isCurrent = step.number === currentStep;

              return (
                <li key={step.number} className="relative z-10">
                  <button
                    id={`step-btn-${step.number}`}
                    onClick={() => onSelectStep(step.number)}
                    className="group flex flex-col items-center focus:outline-none cursor-pointer"
                  >
                    <span
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50'
                          : isCurrent
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-50'
                          : 'bg-white border-2 border-slate-300 text-slate-500 group-hover:border-slate-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-5 h-5 text-white" /> : step.number}
                    </span>
                    <span
                      className={`mt-2 text-xs font-semibold transition-colors ${
                        isPassed
                          ? 'text-emerald-700'
                          : isCurrent
                          ? 'text-indigo-700'
                          : 'text-slate-500 group-hover:text-slate-700'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </section>
  );
};
