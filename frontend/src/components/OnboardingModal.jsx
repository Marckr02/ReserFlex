import { useState } from 'react';
import { X } from 'lucide-react';

const STEPS = [
  {
    title: 'Bienvenido',
    description: 'Has creado tu cuenta. te guiaremos para configurar tu negocio.',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    content: null
  },
  {
    title: 'Configura tus servicios',
    description: 'Define los servicios que ofrecerás a tus clientes con precios y duración.',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    content: (
      <div className="space-y-3 text-sm text-slate-600">
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">1</div>
          <div>Ve a <strong>Servicios</strong> en el menú lateral</div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">2</div>
          <div>Crea cada servicio con nombre, precio y duración</div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">3</div>
          <div>Asigna los servicios a cada empleado</div>
        </div>
      </div>
    )
  },
  {
    title: 'Define tus horarios',
    description: 'Establece los días y horarios en que atenderás a tus clientes.',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    content: (
      <div className="space-y-3 text-sm text-slate-600">
        <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">1</div>
          <div>Ve a <strong>Horarios</strong> en el menú lateral</div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">2</div>
          <div>Configura la hora de apertura y cierre para cada día</div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">3</div>
          <div>Activa solo los días que trabajarás</div>
        </div>
      </div>
    )
  },
  {
    title: '¡Listo para recibir reservas!',
    description: 'Tu negocio está configurado. Comparte tu enlace público para empezar a recibir reservas.',
    icon: 'M5 13l4 4L19 7',
    content: (
      <div className="space-y-3 text-sm text-slate-600">
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <p className="font-semibold text-green-800 mb-1">Tu enlace público:</p>
          <code className="text-xs bg-white px-3 py-2 rounded-lg block mt-2 font-mono text-slate-700 break-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/reservas/` : '/reservas/[slug]'}
          </code>
        </div>
        <p className="text-center text-slate-500">Encontrarás el enlace completo en tu panel de administración</p>
      </div>
    )
  }
];

export default function OnboardingModal({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={STEPS[currentStep].icon} />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{STEPS[currentStep].title}</h2>
            </div>
          </div>
          <button onClick={handleSkip} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-600 mb-6">{STEPS[currentStep].description}</p>

          {STEPS[currentStep].content}

          <div className="mt-6 flex gap-2">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Paso {currentStep + 1} de {STEPS.length}
          </p>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl hover:bg-slate-100 transition-colors font-semibold"
            >
              Anterior
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg shadow-blue-500/30"
          >
            {currentStep === STEPS.length - 1 ? 'Comenzar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}