import { FastifyInstance } from "fastify";

import { toHttpError } from "./http_errors";
import * as NotAuthenticated from "./http_errors/not_authenticated";
import { AuthenticatedRequest } from "./httpd/lib";
import { Ctx } from "./lib/ctx";
import { ServiceUser } from "./service/domain/organization/service_user";
import * as Notification from "./service/domain/workflow/notification";

function mkSwaggerSchema(server: FastifyInstance) {
  return {
    beforeHandler: [(server as any).authenticate],
    description: "List (a part of) an authenticated user's notifications.",
    tags: ["notification"],
    summary: "List (a part of) an authenticated user's notifications.",
    security: [{ bearerToken: [] }],
    querystring: {
      type: "object",
      properties: {
        limit: {
          type: "string",
          description: "Limit to the number of notifications to return.",
          example: "10",
        },
        offset: {
          type: "string",
          description:
            "The index of the first notification; all other notifications are for " +
            "events that happened after that first notification. The `offset` may also " +
            "be negative. For example, an `offset` of `-10` with limit `10` requests " +
            "the 10 most recent notifications.",
          example: "0",
        },
      },
    },
    response: {
      200: {
        description: "Notifications for the authenticated user.",
        type: "object",
        properties: {
          apiVersion: { type: "string", example: "1.0" },
          data: {
            type: "object",
            properties: {
              userId: { type: "string", example: "jdoe" },
              notifications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", example: "fff7242a-cd42-45e7-9719-8e41c219d8ee" },
                    isRead: { type: "boolean", example: false },
                    businessEvent: {
                      type: "object",
                      properties: {
                        type: { type: "string", example: "project_assigned" },
                        time: { type: "string", example: "2019-03-13T10:18:31.800Z" },
                        publisher: { type: "string", example: "jdoe" },
                      },
                    },
                    projectId: { type: "string", example: "d0e8c69eg298c87e3899119e025eff1f" },
                    subprojectId: { type: "string", example: "d0e8c69eg298c87e389923413451234f" },
                    workflowitemId: { type: "string", example: "d0e8c69eg298c87234534115045eff1f" },
                  },
                },
              },
            },
          },
        },
      },
      401: NotAuthenticated.schema,
    },
  };
}

interface ExposedNotification {
  id: string;
  isRead: boolean;
  businessEvent: {
    type: string;
    time: string; // ISO timestamp
    publisher: string;
  };
  projectId?: string;
  subprojectId?: string;
  workflowitemId?: string;
}

interface Service {
  getNotificationsForUser(ctx: Ctx, user: ServiceUser): Promise<Notification.Notification[]>;
}

export function addHttpHandler(server: FastifyInstance, urlPrefix: string, service: Service) {
  server.get(`${urlPrefix}/notification.list`, mkSwaggerSchema(server), async (request, reply) => {
    const ctx: Ctx = { requestId: request.id, source: "http" };

    const user: ServiceUser = {
      id: (request as AuthenticatedRequest).user.userId,
      groups: (request as AuthenticatedRequest).user.groups,
    };

    const offset = parseInt(request.query.offset || 0, 10);
    if (isNaN(offset)) {
      reply.status(400).send({
        apiVersion: "1.0",
        error: {
          code: 400,
          message: "if present, the query parameter `offset` must be an integer",
        },
      });
      return;
    }

    let limit: number | undefined = parseInt(request.query.limit, 10);
    if (isNaN(limit)) {
      limit = undefined;
    } else if (limit <= 0) {
      reply.status(400).send({
        apiVersion: "1.0",
        error: {
          code: 400,
          message: "if present, the query parameter `limit` must be a positive integer",
        },
      });
      return;
    }

    try {
      const notifications: Notification.Notification[] = await service.getNotificationsForUser(
        ctx,
        user,
      );

      notifications.sort(byEventTime);

      const offsetIndex = offset < 0 ? Math.max(0, notifications.length + offset) : offset;
      const slice = notifications.slice(
        offsetIndex,
        limit === undefined ? undefined : offsetIndex + limit,
      );

      const exposed: ExposedNotification[] = slice.map(notification => ({
        id: notification.id,
        isRead: notification.isRead,
        businessEvent: {
          type: notification.businessEvent.type,
          time: notification.businessEvent.time,
          publisher: notification.businessEvent.publisher,
        },
        projectId: notification.projectId,
        subprojectId: notification.subprojectId,
        workflowitemId: notification.workflowitemId,
      }));

      const code = 200;
      const body = {
        apiVersion: "1.0",
        data: {
          userId: user.id,
          notifications: exposed,
        },
      };
      reply.status(code).send(body);
    } catch (err) {
      const { code, body } = toHttpError(err);
      reply.status(code).send(body);
    }
  });
}

function byEventTime(a: Notification.Notification, b: Notification.Notification): -1 | 0 | 1 {
  const timeA = new Date(a.businessEvent.time);
  const timeB = new Date(b.businessEvent.time);
  if (timeA < timeB) return -1;
  if (timeA > timeB) return 1;
  return 0;
}