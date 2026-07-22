import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface ModalOptions {
  title: string;
  description?: string;
  type: 'confirm' | 'prompt' | 'custom';
  defaultValue?: string; // For prompt
  confirmText?: string;
  cancelText?: string;
  content?: ReactNode; // For custom
  actions?: ModalAction[]; // For custom
}

interface ModalContextType {
  confirm: (title: string, description?: string) => Promise<boolean>;
  prompt: (title: string, defaultValue?: string, description?: string) => Promise<string | null>;
  openModal: (title: string, content: ReactNode, actions?: ModalAction[]) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ModalOptions;
    resolve: (value: any) => void;
  } | null>(null);

  const [inputValue, setInputValue] = useState('');

  const confirmAction = useCallback((title: string, description: string = 'Are you sure you want to proceed?') => {
    return new Promise<boolean>((resolve) => {
      setModalState({ isOpen: true, options: { title, description, type: 'confirm' }, resolve });
    });
  }, []);

  const promptAction = useCallback((title: string, defaultValue: string = '', description: string = 'Please enter a value:') => {
    return new Promise<string | null>((resolve) => {
      setInputValue(defaultValue);
      setModalState({ isOpen: true, options: { title, description, type: 'prompt', defaultValue }, resolve });
    });
  }, []);

  const openModal = useCallback((title: string, content: ReactNode, actions?: ModalAction[]) => {
    setModalState({ isOpen: true, options: { title, type: 'custom', content, actions }, resolve: () => {} });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(null);
  }, []);

  const handleConfirm = () => {
    if (modalState) {
      if (modalState.options.type === 'prompt') {
        modalState.resolve(inputValue);
      } else {
        modalState.resolve(true);
      }
      setModalState(null);
    }
  };

  const handleCancel = () => {
    if (modalState) {
      if (modalState.options.type === 'prompt') {
        modalState.resolve(null);
      } else {
        modalState.resolve(false);
      }
      setModalState(null);
    }
  };

  return (
    <ModalContext.Provider value={{ confirm: confirmAction, prompt: promptAction, openModal, closeModal }}>
      {children}
      {modalState?.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-[0_16px_48px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-[20px] font-black text-g3 mb-2">{modalState.options.title}</h3>
              <p className="text-[14px] text-muted leading-relaxed mb-6">{modalState.options.description}</p>
              
              {modalState.options.type === 'prompt' && (
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border-design mb-6 text-[14px] font-medium outline-none focus:border-g1"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                />
              )}
              
              {modalState.options.type === 'custom' && modalState.options.content && (
                <div className="mb-6">{modalState.options.content}</div>
              )}
              
              <div className="flex gap-3 justify-end">
                {modalState.options.type === 'custom' && modalState.options.actions ? (
                  modalState.options.actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={action.onClick}
                      className={`px-5 py-2.5 rounded-xl font-bold text-[14px] transition cursor-pointer border ${
                        action.variant === 'primary' 
                          ? 'border-none bg-g1 text-white hover:bg-g3' 
                          : action.variant === 'danger'
                            ? 'border-none bg-red-600 text-white hover:bg-red-700'
                            : 'border-border-design bg-off text-txt hover:bg-gray-100'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))
                ) : (
                  <>
                    <button 
                      onClick={handleCancel}
                      className="px-5 py-2.5 rounded-xl border border-border-design bg-off text-txt font-bold text-[14px] hover:bg-gray-100 transition cursor-pointer"
                    >
                      {modalState.options.cancelText || 'Cancel'}
                    </button>
                    <button 
                      onClick={handleConfirm}
                      className="px-5 py-2.5 rounded-xl border-none bg-g1 text-white font-bold text-[14px] hover:bg-g3 transition cursor-pointer"
                    >
                      {modalState.options.confirmText || 'Confirm'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within ModalProvider');
  return context;
};
