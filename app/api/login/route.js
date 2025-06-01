export async function POST(req) {
  const { email, password } = await req.json();

  // Validate against env variables
  if (
    email === process.env.LOGIN_EMAIL &&
    password === process.env.LOGIN_PASSWORD
  ) {
    return new Response(
      JSON.stringify({ token: process.env.LOGIN_TOKEN }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ error: "Invalid email or password" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
