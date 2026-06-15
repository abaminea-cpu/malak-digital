// Plays a short notification chime using the Web Audio API (no asset needed).
export function playNotificationSound() {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [880, 1175];
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.3);
    });
  } catch {}
}

export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `213${digits.slice(1)}` : digits.startsWith("213") ? digits : `213${digits}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

export const WA_TEMPLATES = {
  confirm: (name: string, orderNo: string) =>
    `Bonjour ${name}, c'est Malak Digital. Je vous appelle pour confirmer votre commande #${orderNo}. Merci !`,
  shipped: (name: string, orderNo: string, tracking?: string) =>
    `Bonjour ${name}, votre commande #${orderNo} a été expédiée${tracking ? ` (suivi: ${tracking})` : ""}. Merci de votre confiance — Malak Digital.`,
  abandoned: (name: string) =>
    `Bonjour ${name}, vous avez laissé un produit dans votre panier sur Malak Digital. Souhaitez-vous finaliser votre commande ? Paiement à la livraison disponible.`,
};
