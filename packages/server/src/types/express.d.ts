import type { User } from "@broadcast/shared";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
