import { Request, Response } from "express";
import * as announcementService from "../services/announcementService";

export const createAnnouncementController = async (req: Request, res: Response) => {
  const user = req.user as any;
  const createdBy = user?.id || user?._id;
  if (!createdBy) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const body = {
    ...req.body,
    message: req.body?.message ?? req.body?.content,
  };

  if (!body.title || !body.message) {
    return res.status(400).json({
      success: false,
      message: "title and content (or message) are required",
    });
  }

  const announcement = await announcementService.createAnnouncement(body, String(createdBy));
  res.status(201).json({ success: true, data: announcement });
};

export const getAnnouncementsController = async (req: Request, res: Response) => {
  const announcements = await announcementService.getAnnouncements();
  res.status(200).json({ success: true, data: announcements });
};

export const updateAnnouncementController = async (req: Request, res: Response) => {
  const announcement = await announcementService.updateAnnouncement(req.params.id, req.body);
  res.status(200).json({ success: true, data: announcement });
};

export const deleteAnnouncementController = async (req: Request, res: Response) => {
  await announcementService.deleteAnnouncement(req.params.id);
  res.status(204).send();
};
