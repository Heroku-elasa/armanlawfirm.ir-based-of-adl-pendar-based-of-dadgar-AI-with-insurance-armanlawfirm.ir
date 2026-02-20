interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  
  const results: any = {
    timestamp: new Date().toISOString(),
    d1_configured: !!env.DB,
    tests: []
  };

  if (!env.DB) {
    results.tests.push({
      name: 'D1 Connection',
      status: 'FAIL',
      message: 'D1 database binding not found. Make sure wrangler.toml has [[d1_databases]] configured.'
    });
    return jsonResponse(results, 500);
  }

  try {
    const tableCheck = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all();
    
    results.tests.push({
      name: 'D1 Connection',
      status: 'PASS',
      tables: tableCheck.results?.map((t: any) => t.name) || []
    });

    if (!tableCheck.results?.find((t: any) => t.name === 'users')) {
      results.tests.push({
        name: 'Schema Check',
        status: 'WARNING',
        message: 'Tables not found. Run migration: npm run db:migrate'
      });
    } else {
      const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
      const postCount = await env.DB.prepare('SELECT COUNT(*) as count FROM posts').first();
      const orderCount = await env.DB.prepare('SELECT COUNT(*) as count FROM orders').first();
      
      results.tests.push({
        name: 'Schema Check',
        status: 'PASS',
        data: {
          users: (userCount as any)?.count || 0,
          posts: (postCount as any)?.count || 0,
          orders: (orderCount as any)?.count || 0
        }
      });
    }

    results.overall_status = 'PASS';
  } catch (error) {
    results.tests.push({
      name: 'D1 Query',
      status: 'FAIL',
      error: String(error)
    });
    results.overall_status = 'FAIL';
  }

  return jsonResponse(results);
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
