import { createHash } from 'crypto';
import * as assistantService from '../services/assistantService.js';

export async function chat(req, res, next) {
  try {
    const anonymousSource = `${req.ip || 'unknown'}:${req.get('user-agent') || 'unknown'}`;
    const safetyIdentifier = `anon_${createHash('sha256').update(anonymousSource).digest('hex').slice(0, 32)}`;
    const result = await assistantService.chat({ ...req.body, safetyIdentifier });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export function status(req, res) {
  res.status(200).json({ success: true, data: assistantService.getAssistantStatus() });
}
