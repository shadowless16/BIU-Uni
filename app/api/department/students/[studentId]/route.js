// Next.js API route: /api/department/students/[studentId]
// Proxies to backend Express server

export async function GET(req, { params }) {
  const { studentId } = params;
  // Use the correct backend path with /api/department
  const backendUrl = `https://biu-uni.onrender.com/api/department/students/${studentId}`;
  try {
    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers/cookies if needed
      },
      // credentials: 'include', // if you need cookies
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
