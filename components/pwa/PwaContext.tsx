'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIos: boolean;
  promptInstall: () => Promise<void>;
  showInstallModal: boolean;
  setShowInstallModal: (show: boolean) => void;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isInstalled: false,
  isIos: false,
  promptInstall: async () => {},
  showInstallModal: false,
  setShowInstallModal: () => {},
});

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showAutoPopup, setShowAutoPopup] = useState(false);

  useEffect(() => {
    // Check if running as installed standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SabiPredict PWA Service Worker active:', reg.scope))
        .catch((err) => console.warn('SW registration skipped:', err));
    }

    // Capture PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Trigger automatic install prompt on supported mobile browsers
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      const isMobile = /android|iphone|ipad|ipod|mobile/.test(userAgent);
      if (isMobile && !dismissed && !isStandalone) {
        setTimeout(() => {
          setShowAutoPopup(true);
        }, 2500);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowAutoPopup(false);
      setShowInstallModal(false);
      console.log('SabiPredict AI PWA was installed successfully.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        setIsInstallable(false);
        setShowAutoPopup(false);
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    } else if (isIos) {
      setShowInstallModal(true);
    } else {
      setShowInstallModal(true);
    }
  };

  const dismissAutoPopup = () => {
    setShowAutoPopup(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIos,
        promptInstall,
        showInstallModal,
        setShowInstallModal,
      }}
    >
      {children}

      {/* Automatic PWA Installation Popup Prompt */}
      {showAutoPopup && !isInstalled && (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-5 duration-300">
          <div className="rounded-2xl border border-[#48CAE4]/40 bg-[#111C38]/98 p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-[#3A506B] to-[#48CAE4] text-[#0B132B] font-black text-xs shadow-md">
                SABI
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-xs font-bold text-white">Install SabiPredict AI App</h4>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Add to your home screen for quick daily VIP predictions and instant match alerts.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={promptInstall}
                    className="rounded-xl bg-[#48CAE4] px-3.5 py-1.5 text-xs font-bold text-[#0B132B] hover:bg-[#00B4D8] transition shadow-md"
                  >
                    Install App
                  </button>
                  <button
                    onClick={dismissAutoPopup}
                    className="rounded-xl border border-[#223156] px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Install Instruction Modal (iOS or unsupported prompt fallback) */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-[#1C2541] bg-[#111C38] p-6 text-xs text-slate-300 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-[#3A506B] to-[#48CAE4] text-[#0B132B] font-black">
                SABI
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">How to Install SabiPredict</h3>
                <p className="text-[11px] text-slate-400">Add to your device home screen</p>
              </div>
            </div>

            {isIos ? (
              <ol className="space-y-2 list-decimal list-inside text-slate-200">
                <li>Tap the <strong>Share</strong> button at the bottom of Safari (<span className="text-[#48CAE4]">􀈂</span>).</li>
                <li>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</li>
                <li>Tap <strong>&quot;Add&quot;</strong> in the top-right corner.</li>
              </ol>
            ) : (
              <p className="leading-relaxed">
                Open your browser menu (three dots <strong className="text-white">&#8942;</strong>) and select{' '}
                <strong className="text-[#48CAE4]">&quot;Install App&quot;</strong> or{' '}
                <strong className="text-[#48CAE4]">&quot;Add to Home screen&quot;</strong>.
              </p>
            )}

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full rounded-xl bg-[#48CAE4] py-2 text-center font-bold text-[#0B132B] hover:bg-[#00B4D8]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  return useContext(PwaContext);
}