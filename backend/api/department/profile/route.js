import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import mongoose from 'mongoose'

const DepartmentModel = mongoose.models.Department || mongoose.model('Department')

// GET /api/department/profile?id=DEPT_ID
export async function GET(req) {
  await dbConnect()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing department id' }, { status: 400 })
  }
  try {
    const dept = await DepartmentModel.findById(id).lean()
    if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    return NextResponse.json(dept)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
