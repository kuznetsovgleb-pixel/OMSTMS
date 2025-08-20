export async function POST(req){try{const body=await req.json();console.log('Webhook event:',body);return Response.json({ok:true});}catch(e){return new Response(String(e),{status:500})}}
