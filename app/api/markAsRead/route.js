import { connectToDB } from '../../lib/db';
import Message from '../../model/Message';

export async function POST(req) {
  const { phone } = await req.json();
  
  try {
    await connectToDB();
    await Message.updateMany(
      { phone, direction: 'incoming' },
      { $set: { read: true } }
    );
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}