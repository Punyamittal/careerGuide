import { getSupabaseAdmin } from "../../config/supabase.js";

export async function listMbsDomains() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mbs_domains")
    .select("id, code, label, career_group, career_domain, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * @param {{ mbsDomain?: string; careerGroup?: string; q?: string; limit?: number; offset?: number }} opts
 */
export async function searchMbsOccupations(opts = {}) {
  const supabase = getSupabaseAdmin();
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  const offset = Math.max(0, opts.offset ?? 0);

  let query = supabase
    .from("onet_mbs_classifications")
    .select(
      "soc_code, mbs_domain_id, career_group, career_domain, confidence, highlights, mbs_domains(id, label)",
      { count: "exact" }
    );

  if (opts.mbsDomain) query = query.eq("mbs_domain_id", opts.mbsDomain);
  if (opts.careerGroup) query = query.eq("career_group", opts.careerGroup);

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);

  let rows = data ?? [];
  if (opts.q?.trim()) {
    const q = opts.q.trim().toLowerCase();
    rows = rows.filter((r) => {
      const title = String(r.highlights?.title ?? "").toLowerCase();
      return title.includes(q) || r.soc_code.toLowerCase().includes(q);
    });
  }

  return {
    occupations: rows.map((r) => ({
      socCode: r.soc_code,
      mbsDomainId: r.mbs_domain_id,
      mbsDomainLabel: r.mbs_domains?.label ?? null,
      careerGroup: r.career_group,
      careerDomain: r.career_domain,
      confidence: r.confidence,
      title: r.highlights?.title ?? null,
      description: r.highlights?.description ?? null
    })),
    total: count ?? rows.length,
    limit,
    offset
  };
}

export async function getMbsOccupationBySoc(socCode) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("onet_mbs_classifications")
    .select("*, mbs_domains(id, label, career_group)")
    .eq("soc_code", socCode)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    socCode: data.soc_code,
    mbsDomainId: data.mbs_domain_id,
    mbsDomainLabel: data.mbs_domains?.label ?? null,
    careerGroup: data.career_group,
    careerDomain: data.career_domain,
    confidence: data.confidence,
    highlights: data.highlights
  };
}
