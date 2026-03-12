import { Request, Response } from 'express';
import Message from '../models/Message';
import { Types } from 'mongoose';
import { User } from '../../auth/models/User';
import { emitToUser } from '../../../integrations/socket';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'recruiter' | 'candidate' | 'admin';
    email?: string;
    [key: string]: any; // Allow additional properties
  };
}

export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    const query: any = {
      conversationId,
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    };

    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'name email avatar')
      .populate('recipient', 'name email avatar')
      .lean();

    return res.status(200).json({
      success: true,
      data: messages.reverse() // Return in chronological order
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const recipient = req.body.recipient || req.body.receiverId;
    const { content } = req.body;
    const providedConversationId = req.body.conversationId;
    const sender = req.user?.id;

    if (!sender || !recipient || !content) {
      return res.status(400).json({
        success: false,
        message: 'Sender, recipient (or receiverId), and content are required'
      });
    }

    if (!Types.ObjectId.isValid(sender) || !Types.ObjectId.isValid(recipient)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sender or recipient ID'
      });
    }

    if (String(sender) === String(recipient)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send message to yourself'
      });
    }

    const [senderUser, recipientUser] = await Promise.all([
      User.findById(sender).select('role').lean(),
      User.findById(recipient).select('role').lean(),
    ]);

    if (!senderUser || !recipientUser) {
      return res.status(404).json({
        success: false,
        message: 'Sender or recipient not found'
      });
    }

    const allowedRoles = new Set(['candidate', 'recruiter']);
    if (!allowedRoles.has(senderUser.role) || !allowedRoles.has(recipientUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only recruiter-candidate chat is allowed'
      });
    }

    if (senderUser.role === recipientUser.role) {
      return res.status(403).json({
        success: false,
        message: 'Chat is allowed between recruiter and candidate only'
      });
    }

    const conversationId = providedConversationId || [String(sender), String(recipient)].sort().join(':');

    const normalizedContent = String(content).trim();
    if (!normalizedContent) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty'
      });
    }

    const message = new Message({
      sender,
      recipient,
      content: normalizedContent,
      conversationId
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('recipient', 'name email avatar');

    // Emit realtime message to both sender and recipient sockets.
    emitToUser(String(sender), 'chat:new_message', populatedMessage);
    emitToUser(String(recipient), 'chat:new_message', populatedMessage);

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    const message = await Message.findOneAndUpdate(
      { _id: messageId, recipient: userId },
      { $set: { read: true } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or not authorized'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: message
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark message as read'
    });
  }
};
