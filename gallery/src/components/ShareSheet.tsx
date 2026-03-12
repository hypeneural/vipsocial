import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, MessageCircle, Copy, Check } from 'lucide-react';
import { trackPhotoDownload } from '@/services/gallery';
import type { PhotoItem } from '@/types/gallery';

interface ShareSheetProps {
  photo: PhotoItem;
  onClose: () => void;
}

export function ShareSheet({ photo, onClose }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const photoUrl = photo.largeUrl;
  const shareUrl = window.location.href;
  const shareText = photo.caption || `Foto ${photo.sequence} - Cobertura VIP`;

  const handleWhatsApp = useCallback(() => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, '_blank', 'noopener');
  }, [shareText, shareUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await trackPhotoDownload(photo.id);
      const response = await fetch(photoUrl, { mode: 'cors' });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `cobertura-vip-${photo.sequence}.jpg`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      window.open(photoUrl, '_blank', 'noopener');
    } finally {
      setDownloading(false);
    }
  }, [photo.id, photo.sequence, photoUrl]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cobertura VIP',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    }
  }, [shareText, shareUrl]);

  const actions = [
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      onClick: handleWhatsApp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Download,
      label: downloading ? 'Baixando...' : 'Salvar foto',
      onClick: handleDownload,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: copied ? Check : Copy,
      label: copied ? 'Copiado!' : 'Copiar link',
      onClick: handleCopyLink,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
    ...(navigator.share
      ? [
          {
            icon: Share2,
            label: 'Mais opcoes',
            onClick: handleNativeShare,
            color: 'text-muted-foreground',
            bgColor: 'bg-muted',
          },
        ]
      : []),
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-foreground/40"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          className="relative w-full max-w-md rounded-t-2xl bg-card px-4 pb-safe-area pt-3"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Compartilhar</h3>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-border"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 py-4">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex flex-col items-center gap-2 rounded-xl p-3 transition-colors active:bg-muted"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${action.bgColor}`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <span className="text-center text-[11px] font-medium leading-tight text-foreground">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
