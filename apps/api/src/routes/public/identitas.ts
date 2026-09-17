import { asyncHandler, response } from "../../utils/response.js";
import { identitasDesaService } from "../../services/identitas-desa.service.js";

const router = require("express").Router();

/**
 * @route   GET /api/public/identitas
 * @desc    Get village identity (Public access)
 * @access  Public
 */
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const identitas = await identitasDesaService.getIdentitasDesa();

    // Return an empty object if identitas is not configured yet
    if (!identitas) {
      return response.success(res, {});
    }

    return response.success(res, identitas);
  }),
);

export default router;
