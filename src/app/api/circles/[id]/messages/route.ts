

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Circle from '@/models/Circle';
import CircleMessage from '@/models/CircleMessage';
import User from '@/models/User';
import { pusherServer } from '@/lib/pusher-server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getAuthUser(req: Request) {
  try {
    let token = null;
    
    // 1. Try Cookies
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('hidayah_token')?.value;
    } catch (e) {}

    // 2. Try Authorization Header
    if (!token) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) return null;

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    return jwt.verify(token, secret) as any;
  } catch (e) {
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user = null;
    try {
      user = await getAuthUser(req);
    } catch (e) {
      // Ignore during build
    }

    if (!user) return NextResponse.json({ messages: [] }, { headers: { 'Access-Control-Allow-Origin': '*' } });

    const { id } = await params;
    await dbConnect();

    // Resolve circleId if it's a slug or title
    let circleId = id;
    if (!mongoose.isValidObjectId(id)) {
      await dbConnect();
      let circle = await Circle.findOne({ slug: id }).select('_id');
      if (!circle) {
        circle = await Circle.findOne({ title: { $regex: new RegExp(id.replace(/-/g, ' '), 'i') } }).select('_id');
      }
      if (circle) {
        circleId = circle._id.toString();
      } else {
        return NextResponse.json({ messages: [] }, { headers: { 'Access-Control-Allow-Origin': '*' } }); // Or 404
      }
    }
    
    if (!mongoose.isValidObjectId(circleId)) {
      return NextResponse.json({ messages: [] }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Mark messages as read for this user in this circle
    if (user && user.userId) {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.updateMany(
        { recipientId: user.userId, circleId: circleId, type: 'circle_message', isRead: false },
        { $set: { isRead: true } }
      ).catch((e: any) => console.error("Error marking messages as read:", e));
    }

    const messages = await CircleMessage.find({ circleId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username image')
      .populate({
        path: 'replyTo',
        populate: { path: 'senderId', select: 'username' }
      })
      .lean();

    // Map senderId to senderName for frontend compatibility
    const formattedMessages = messages.map((m: any) => ({
      ...m,
      senderName: m.senderId?.username || 'Unknown',
      senderImage: m.senderId?.image || null,
    }));

    return NextResponse.json({ messages: formattedMessages }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    console.error('Fetch Messages Error:', error);
    return NextResponse.json({ message: 'Error fetching messages' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const user = await getAuthUser(req);
    if (!user) {
      console.warn('Unauthorized message attempt');
      return NextResponse.json({ message: 'Unauthorized. Please log in again.' }, { 
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const { id } = await params;
    
    // Resolve circleId if it's a slug or title
    let circleId = id;
    if (!mongoose.isValidObjectId(id)) {
      let circle = await Circle.findOne({ slug: id }).select('_id');
      if (!circle) {
        // Try fuzzy match for title if slug fails (case-insensitive)
        circle = await Circle.findOne({ title: { $regex: new RegExp(`^${id.replace(/-/g, ' ')}$`, 'i') } }).select('_id');
      }
      
      if (circle) {
        circleId = circle._id.toString();
      } else {
        console.error(`Circle not found for identity: ${id}`);
        return NextResponse.json({ message: 'Circle not found' }, { 
          status: 404,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    // Final validation
    if (!mongoose.isValidObjectId(circleId)) {
      return NextResponse.json({ message: 'Invalid circle identity' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    let text, replyToId, imageUrl, fileUrl, fileName;
    
    const contentType = req.headers.get('content-type') || '';
    try {
      if (contentType.includes('application/json')) {
        const data = await req.json();
        text = data.text;
        replyToId = data.replyToId;
        imageUrl = data.imageUrl;
        fileUrl = data.fileUrl;
        fileName = data.fileName;
      } else {
        const formData = await req.formData();
        text = formData.get('text') as string;
        replyToId = formData.get('replyToId') as string;
        imageUrl = formData.get('imageUrl') as string;
        fileUrl = formData.get('fileUrl') as string;
        fileName = formData.get('fileName') as string;
      }
    } catch (e: any) {
      console.error('Request parsing error:', e);
      return NextResponse.json({ message: 'Failed to parse request data', details: e.message }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    console.log(`Sending message to circle ${circleId} from user ${user.userId}`);

    if (!user.userId) {
      return NextResponse.json({ message: 'User identity missing from token' }, { 
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (!text && !imageUrl && !fileUrl) {
      return NextResponse.json({ message: 'Message content is required' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const newMessage = await CircleMessage.create({
      circleId: circleId,
      senderId: user.userId,
      text: text || "",
      imageUrl: imageUrl || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      replyTo: (replyToId && replyToId !== "") ? replyToId : null,
    });

    // Update circle's last activity
    await Circle.findByIdAndUpdate(circleId, {
      lastMessageAt: new Date(),
      lastMessageText: text || (imageUrl ? "Shared an image" : (fileUrl ? "Shared a file" : ""))
    }).catch(e => console.error("Circle update error:", e));

    const populatedMessage = await CircleMessage.findById(newMessage._id)
      .populate('senderId', 'username image')
      .populate({
        path: 'replyTo',
        populate: { path: 'senderId', select: 'username' }
      })
      .lean();

    if (!populatedMessage) {
      throw new Error("Failed to retrieve message after creation");
    }

    const formattedMessage = {
      ...populatedMessage,
      senderName: (populatedMessage.senderId as any)?.username || 'Unknown',
      senderImage: (populatedMessage.senderId as any)?.image || null,
    };

    // Lightweight Pusher trigger (strip large Base64 strings)
    const pusherMessage = {
      ...formattedMessage,
      imageUrl: formattedMessage.imageUrl ? 'PENDING' : null,
      fileUrl: formattedMessage.fileUrl ? 'PENDING' : null,
    };

    try {
      // Use the resolved circleId for consistent channel names if possible, 
      // but keep 'id' (slug) for compatibility with existing client subscriptions
      await pusherServer.trigger(`circle-${id}`, 'new-message', pusherMessage);

      // Create in-app notifications for all members EXCEPT the sender
      const circle = await Circle.findById(circleId).select('members title');
      if (circle && circle.members && circle.members.length > 0) {
        const Notification = (await import('@/models/Notification')).default;
        
        const otherMembers = circle.members.filter((m: any) => m.toString() !== user.userId.toString());
        
        if (otherMembers.length > 0) {
          // Prepare in-app notification data
          const notificationData = otherMembers.map((memberId: any) => ({
            recipientId: memberId,
            senderId: user.userId,
            senderName: formattedMessage.senderName,
            type: 'circle_message',
            circleId: circleId,
            circleTitle: circle.title,
            commentText: text ? (text.length > 60 ? text.substring(0, 57) + '...' : text) : (imageUrl ? "Shared an image" : "Shared a file"),
          }));

          // Bulk insert for efficiency
          await Notification.insertMany(notificationData, { ordered: false }).catch(e => console.error("Notification bulk insert error:", e));

          // Realtime badge update
          otherMembers.forEach((memberId: any) => {
            pusherServer.trigger(`user-${memberId}`, 'notification', { type: 'circle_message', circleId }).catch(e => console.error("Pusher error:", e));
          });

          // ----------------------------------------------------
          // FIREBASE PUSH NOTIFICATIONS
          // ----------------------------------------------------
          try {
            const { messaging } = await import('@/lib/firebase');
            if (messaging) {
              // Fetch users who have FCM tokens and have NOT muted this circle
              const membersToNotify = await User.find({
                _id: { $in: otherMembers },
                fcmTokens: { $exists: true, $not: { $size: 0 } },
                mutedCircles: { $ne: circleId }
              }).select('fcmTokens');

              const tokens: string[] = [];
              membersToNotify.forEach(member => {
                if (member.fcmTokens) {
                  tokens.push(...member.fcmTokens);
                }
              });

              if (tokens.length > 0) {
                // Remove duplicates just in case
                const uniqueTokens = [...new Set(tokens)];
                
                const messageText = text ? (text.length > 100 ? text.substring(0, 97) + '...' : text) : (imageUrl ? "📷 Image" : "📁 File");
                
                await messaging.sendEachForMulticast({
                  tokens: uniqueTokens,
                  notification: {
                    title: `New message in ${circle.title}`,
                    body: `${formattedMessage.senderName}: ${messageText}`,
                  },
                  data: {
                    route: `/community/chat/${circle.slug || circleId}`
                  },
                  android: {
                    priority: 'high',
                    notification: {
                      sound: 'default',
                      channelId: 'messages'
                    }
                  },
                  apns: {
                    payload: {
                      aps: {
                        sound: 'default',
                        badge: 1
                      }
                    }
                  }
                });
                console.log(`Pushed to ${uniqueTokens.length} devices.`);
              }
            }
          } catch (fcmErr) {
            console.error("Firebase Cloud Messaging Error:", fcmErr);
          }
        }
      }
    } catch (e) {
      console.error('Notification/Pusher Error (non-fatal):', e);
    }

    return NextResponse.json({ message: formattedMessage }, { 
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error: any) {
    console.error('CRITICAL SEND MESSAGE ERROR:', error);
    return NextResponse.json({ 
      message: 'Failed to send. Please ensure your connection is stable.', 
      details: error.message,
    }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
