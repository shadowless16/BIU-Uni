import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { deptId } = params;
  try {
    // Proxy the request to your Express backend (corrected path)
    const backendRes = await fetch(`https://biu-uni.onrender.com/api/department/departments/${deptId}`);
    if (!backendRes.ok) {
      return NextResponse.json({ error: "Department not found" }, { status: backendRes.status });
    }
    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
