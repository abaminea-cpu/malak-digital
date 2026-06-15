import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="space-y-3">
          <div className="text-xl font-display font-bold">
            <span className="text-gradient-gold">Malak</span>
            <span className="text-foreground"> Digital</span>
          </div>
          <p className="text-sm text-muted-foreground">{t("footer.about")}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{t("footer.links")}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop" className="text-muted-foreground hover:text-gold">{t("nav.shop")}</Link></li>
            <li><Link to="/about" className="text-muted-foreground hover:text-gold">{t("nav.about")}</Link></li>
            <li><Link to="/contact" className="text-muted-foreground hover:text-gold">{t("nav.contact")}</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{t("footer.contact")}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gold" /> +213 555 000 000</li>
            <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gold" /> contact@malakdigital.dz</li>
            <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gold" /> Alger, Algérie</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Newsletter</h3>
          <p className="text-sm text-muted-foreground">Nos meilleures offres directement dans votre boîte.</p>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container mx-auto px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
          © {year} Malak Digital. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
