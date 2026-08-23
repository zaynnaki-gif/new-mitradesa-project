import { Router } from 'express';
import { asyncHandler } from '../../utils/response.js';
import { notificationService } from '../../services/notification.service.js';

const router = Router();

/**
 * @route   POST /api/public/webhook/fonnte
 * @desc    Receive incoming WhatsApp messages from Fonnte
 * @access  Public
 */
router.post(
  '/fonnte',
  asyncHandler(async (req, res) => {
    // Fonnte sends URL-encoded form data or JSON depending on their config.
    // Assuming express is configured to parse JSON and urlencoded body
    const body = req.body || {};

    const sender = body.sender;
    const message = body.message || body.text;

    if (sender && message) {
      // Process incoming message asynchronously
      // We don't await because Fonnte expects a fast 200 OK response
      notificationService.handleIncomingMessage(sender, message).catch(err => {
        console.error('Error in handleIncomingMessage:', err);
      });
    }

    // Always return 200 OK to Fonnte quickly so it doesn't retry
    res.status(200).json({ status: true, message: 'Webhook received' });
  })
);

export default router;
