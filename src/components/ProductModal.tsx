import React from 'react';
import { Crosshair, Wrench, X } from 'lucide-react';
import { ComponentId, RACK_COMPONENTS } from '../data/rackData';

interface ProductModalProps {
  componentId: ComponentId | null;
  onClose: () => void;
  onFocus3D: (id: ComponentId) => void;
  onRequestSupport: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  componentId,
  onClose,
  onFocus3D,
  onRequestSupport,
}) => {
  if (!componentId) return null;
  const product = RACK_COMPONENTS[componentId];
  if (!product) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-[#2d323e] bg-[#191c22] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono-tech text-xs font-medium text-[#f26522]">
              REF: {product.ref} · {product.uRange}
            </div>
            <h2
              id="product-modal-title"
              className="mt-1 text-lg font-bold leading-snug text-white"
            >
              {product.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar ficha técnica"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#9ca3af] transition-colors hover:bg-[#252a35] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[#cbd5e1]">{product.desc}</p>

        {/* Specification Table */}
        <div className="mt-4 overflow-hidden rounded-lg border border-[#2d323e]">
          <table className="w-full border-collapse text-xs">
            <tbody className="divide-y divide-[#262b36]">
              {Object.entries(product.specs).map(([key, value]) => (
                <tr key={key} className="bg-[#1e222b]">
                  <td className="w-2/5 px-3 py-2 font-semibold text-[#9ca3af]">{key}</td>
                  <td className="font-mono-tech px-3 py-2 text-[#e6e8ec]">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Installation Tip */}
        <div className="mt-4 rounded-lg border border-[#2d323e] bg-[#14171d] p-3.5">
          <div className="text-xs font-semibold text-[#f26522]">
            Recomendação de Montagem Barpa
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#b8c0d0]">{product.installTip}</p>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              onFocus3D(product.id);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#3a4152] bg-[#22262f] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:border-[#f26522]"
          >
            <Crosshair className="h-3.5 w-3.5 text-[#f26522]" />
            <span>Aproximar no 3D</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestSupport();
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#f26522] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d85213]"
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Pedir Apoio Técnico</span>
          </button>
        </div>
      </div>
    </div>
  );
};
