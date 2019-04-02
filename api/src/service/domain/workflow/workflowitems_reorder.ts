import { produce } from "immer";
import isEqual = require("lodash.isequal");

import { Ctx } from "../../../lib/ctx";
import * as Result from "../../../result";
import { BusinessEvent } from "../business_event";
import { InvalidCommand } from "../errors/invalid_command";
import { NotAuthorized } from "../errors/not_authorized";
import { NotFound } from "../errors/not_found";
import { ServiceUser } from "../organization/service_user";
import * as Project from "./project";
import * as Subproject from "./subproject";
import * as WorkflowitemOrdering from "./workflowitem_ordering";
import * as WorkflowitemsReordered from "./workflowitems_reordered";

interface Repository {
  getSubproject(
    projectId: string,
    subprojectId: string,
  ): Promise<Result.Type<Subproject.Subproject>>;
}

export async function setWorkflowitemOrdering(
  ctx: Ctx,
  issuer: ServiceUser,
  projectId: Project.Id,
  subprojectId: Subproject.Id,
  ordering: WorkflowitemOrdering.WorkflowitemOrdering,
  repository: Repository,
): Promise<Result.Type<{ newEvents: BusinessEvent[] }>> {
  const subproject = await repository.getSubproject(projectId, subprojectId);
  if (Result.isErr(subproject)) {
    return new NotFound(ctx, "subproject", subprojectId);
  }
  const currentOrder = subproject.workflowitemOrdering;

  if (isEqual(currentOrder, ordering)) {
    // Ordering hasn't changed, therefore do nothing
    return { newEvents: [] };
  }

  // TODO(kevin): Check that each ID refers to an existing workflowitem

  const reorderEvent = WorkflowitemsReordered.createEvent(
    ctx.source,
    issuer.id,
    projectId,
    subprojectId,
    ordering,
  );

  // Check authorization (if not root):
  if (issuer.id !== "root") {
    const intent = "subproject.reorderWorkflowitems";
    if (!Subproject.permits(subproject, issuer, [intent])) {
      return new NotAuthorized(ctx, issuer.id, intent, subproject);
    }
  }

  // Check that the new event is indeed valid:
  const result = produce(subproject, draft =>
    WorkflowitemsReordered.apply(ctx, reorderEvent, draft),
  );

  if (Result.isErr(result)) {
    return new InvalidCommand(ctx, reorderEvent, [result]);
  }

  return { newEvents: [reorderEvent] };
}
