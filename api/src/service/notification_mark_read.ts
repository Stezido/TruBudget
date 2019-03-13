import { Ctx } from "../lib/ctx";
import { ConnToken } from "./conn";
import { ServiceUser } from "./domain/organization/service_user";
import * as UserRecord from "./domain/organization/user_record";
import * as Notification from "./domain/workflow/notification";
import * as NotificationMarkRead from "./domain/workflow/notification_mark_read";
import { loadNotificationEvents } from "./load";
import { store } from "./store";

export async function markRead(
  conn: ConnToken,
  ctx: Ctx,
  user: ServiceUser,
  notificationId: Notification.Id,
): Promise<void> {
  const { newEvents, errors } = await NotificationMarkRead.markRead(ctx, user, notificationId, {
    getUserNotificationEvents: async (userId: UserRecord.Id) =>
      loadNotificationEvents(conn, userId),
  });

  if (errors.length > 0) return Promise.reject(errors);
  if (!newEvents.length) {
    return Promise.reject(`Generating events failed: ${JSON.stringify(newEvents)}`);
  }

  for (const event of newEvents) {
    await store(conn, ctx, event);
  }
}
