const PAGE = 1000;

/**
 * Paginated fetch for Supabase tables (PostgREST 1000-row default cap).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} table
 * @param {object} filters - eq filters
 * @param {string} select
 * @param {{ order?: string, ascending?: boolean }} [sort]
 */
export const fetchAllRows = async (supabase, table, filters, select = "*", sort = null) => {
  const rows = [];
  let from = 0;

  while (true) {
    let q = supabase.from(table).select(select).range(from, from + PAGE - 1);
    for (const [key, value] of Object.entries(filters)) {
      q = q.eq(key, value);
    }
    if (sort?.order) {
      q = q.order(sort.order, { ascending: sort.ascending !== false });
    }
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return rows;
};
