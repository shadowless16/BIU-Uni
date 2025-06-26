import dbConnect from '@/lib/db';
import Department from '@/models/Department';
import User from '@/models/User';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }
    await dbConnect();
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
    // Find the department by user id (if department has a user reference)
    let department = await Department.findOne({ user: user._id });
    // Or, if department email matches user email
    if (!department) {
      department = await Department.findOne({ email });
    }
    if (!department) {
      return new Response(JSON.stringify({ error: 'Department not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ id: department._id }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
