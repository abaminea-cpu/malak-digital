import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, ShieldCheck, Shield, Trash2, Search, Plus, Pencil, KeyRound } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  adminListUsersFn, adminSetUserRoleFn, adminDeleteUserFn,
  adminCreateUserFn, adminUpdateUserFn,
} from "@/lib/users.functions";

export function UsersTab() {
  const listFn = useServerFn(adminListUsersFn);
  const setRoleFn = useServerFn(adminSetUserRoleFn);
  const delFn = useServerFn(adminDeleteUserFn);
  const createFn = useServerFn(adminCreateUserFn);
  const updateFn = useServerFn(adminUpdateUserFn);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => listFn({}) });
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [pwUser, setPwUser] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  const users = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter((u: any) =>
      u.email?.toLowerCase().includes(s) ||
      u.full_name?.toLowerCase().includes(s) ||
      u.phone?.includes(s),
    );
  }, [data, q]);

  async function toggleAdmin(user: any) {
    const isAdmin = user.roles.includes("admin");
    try {
      await setRoleFn({ data: { user_id: user.id, role: "admin", action: isAdmin ? "remove" : "add" } });
      toast.success(isAdmin ? "Rôle admin retiré" : "Promu administrateur");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
  }

  async function removeUser(id: string) {
    try {
      await delFn({ data: { user_id: id } });
      toast.success("Utilisateur supprimé");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await createFn({ data: {
        email: String(f.get("email") || ""),
        password: String(f.get("password") || ""),
        full_name: String(f.get("full_name") || ""),
        phone: String(f.get("phone") || ""),
        is_admin: f.get("is_admin") === "on",
      }});
      toast.success("Utilisateur créé");
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setBusy(false); }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editUser) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await updateFn({ data: {
        user_id: editUser.id,
        email: String(f.get("email") || editUser.email),
        full_name: String(f.get("full_name") || ""),
        phone: String(f.get("phone") || ""),
      }});
      toast.success("Utilisateur mis à jour");
      setEditUser(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setBusy(false); }
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pwUser) return;
    const f = new FormData(e.currentTarget);
    const pw = String(f.get("password") || "");
    if (pw.length < 8) { toast.error("Mot de passe : 8 caractères min."); return; }
    setBusy(true);
    try {
      await updateFn({ data: { user_id: pwUser.id, password: pw } });
      toast.success("Mot de passe changé");
      setPwUser(null);
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher par email, nom, téléphone…" className="max-w-sm" />
          <span className="text-xs text-muted-foreground">{users.length} utilisateur(s)</span>
          <Button size="sm" className="ml-auto bg-gradient-gold text-primary-foreground" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un utilisateur
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">Aucun utilisateur.</div>
      ) : (
        <div className="space-y-2">
          {users.map((u: any) => {
            const isAdmin = u.roles.includes("admin");
            return (
              <div key={u.id} className="rounded-xl border border-border/60 bg-card/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="truncate">{u.full_name || u.email || "Sans nom"}</strong>
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          <Shield className="h-3 w-3" /> Client
                        </span>
                      )}
                      {!u.email_confirmed_at && (
                        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-500">
                          Email non confirmé
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{u.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.phone ? `${u.phone} • ` : ""}
                      Inscrit le {new Date(u.created_at).toLocaleDateString("fr-FR")}
                      {u.last_sign_in_at ? ` • dernière connexion ${new Date(u.last_sign_in_at).toLocaleDateString("fr-FR")}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Admin</span>
                      <Switch checked={isAdmin} onCheckedChange={() => toggleAdmin(u)} />
                    </div>
                    <Button variant="ghost" size="icon" title="Modifier" onClick={() => setEditUser(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Changer mot de passe" onClick={() => setPwUser(u)}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Supprimer">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Le compte de {u.email} sera définitivement supprimé.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeUser(u.id)} className="bg-destructive text-destructive-foreground">
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvel utilisateur</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div><Label>Email *</Label><Input name="email" type="email" required /></div>
            <div><Label>Mot de passe *</Label><Input name="password" type="password" minLength={8} required /></div>
            <div><Label>Nom complet</Label><Input name="full_name" /></div>
            <div><Label>Téléphone</Label><Input name="phone" /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_admin" className="h-4 w-4" />
              Administrateur
            </label>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={busy} className="bg-gradient-gold text-primary-foreground">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier l'utilisateur</DialogTitle></DialogHeader>
          {editUser && (
            <form onSubmit={handleEdit} className="space-y-3">
              <div><Label>Email</Label><Input name="email" type="email" defaultValue={editUser.email} required /></div>
              <div><Label>Nom complet</Label><Input name="full_name" defaultValue={editUser.full_name ?? ""} /></div>
              <div><Label>Téléphone</Label><Input name="phone" defaultValue={editUser.phone ?? ""} /></div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditUser(null)}>Annuler</Button>
                <Button type="submit" disabled={busy} className="bg-gradient-gold text-primary-foreground">
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Password dialog */}
      <Dialog open={!!pwUser} onOpenChange={(o) => !o && setPwUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Changer le mot de passe</DialogTitle></DialogHeader>
          {pwUser && (
            <form onSubmit={handlePassword} className="space-y-3">
              <p className="text-sm text-muted-foreground">Utilisateur : <strong>{pwUser.email}</strong></p>
              <div><Label>Nouveau mot de passe (8 caractères min.)</Label><Input name="password" type="password" minLength={8} required /></div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setPwUser(null)}>Annuler</Button>
                <Button type="submit" disabled={busy} className="bg-gradient-gold text-primary-foreground">
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Changer
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
