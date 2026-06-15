import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/notifications";
import { formatDA } from "@/lib/format";

/** Mount once inside the admin layout. Listens to new orders and shows a toast + chime. */
export function RealtimeOrdersListener() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const o: any = payload.new;
          playNotificationSound();
          toast.success(`Nouvelle commande #${o.order_number}`, {
            description: `${o.customer_first_name} ${o.customer_last_name} — ${formatDA(Number(o.total))}`,
            duration: 8000,
          });
          qc.invalidateQueries({ queryKey: ["admin-orders"] });
          qc.invalidateQueries({ queryKey: ["admin-stats"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return null;
}
