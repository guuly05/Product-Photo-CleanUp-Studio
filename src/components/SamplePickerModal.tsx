import React from 'react';
import { X, Sparkles, ArrowRight, Images } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../data/samples';
import { SampleProduct } from '../types';

interface SamplePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleProduct) => void;
}

export const SamplePickerModal: React.FC<SamplePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-auto space-y-5 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Select a Sample Product Photo</h2>
              <p className="text-xs text-slate-400">
                Test background removal, blemish cleanup, and studio staging instantly
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sample Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAMPLE_PRODUCTS.map((sample) => (
            <div
              key={sample.id}
              className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/60 transition group flex flex-col justify-between"
            >
              {/* Image Preview */}
              <div className="relative h-44 bg-slate-900 overflow-hidden">
                <img
                  src={sample.url}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                  {sample.category}
                </span>
              </div>

              {/* Details & Actions */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{sample.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {sample.description}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onSelectSample(sample);
                    onClose();
                  }}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Use This Sample Photo</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="text-center pt-2 text-xs text-slate-500">
          Or upload your own product photo directly using the upload button on the main toolbar.
        </div>

      </div>
    </div>
  );
};
