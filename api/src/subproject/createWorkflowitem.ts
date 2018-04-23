import { AuthToken } from "../authz/token";
import { AllowedUserGroupsByIntent } from "../authz/types";
import {
  AuthenticatedRequest,
  HttpResponse,
  throwParseError,
  throwParseErrorIfUndefined
} from "../httpd/lib";
import { isNonemptyString } from "../lib";
import { MultichainClient } from "../multichain/Client.h";
import * as Workflowitem from "../workflowitem";
import { randomString } from "../multichain/hash";

const value = (name, val, isValid) => {
  if (isValid !== undefined && !isValid(val)) {
    throwParseError([name]);
  }
  return val;
};

export const createWorkflowItem = async (
  multichain: MultichainClient,
  req: AuthenticatedRequest
): Promise<HttpResponse> => {
  const body = req.body;

  if (body.apiVersion !== "1.0") throwParseError(["apiVersion"]);
  throwParseErrorIfUndefined(body, ["data"]);
  const data = body.data;

  await Workflowitem.create(
    multichain,
    req.token,
    value("projectId", data.projectId, isNonemptyString),
    value("subprojectId", data.subprojectId, isNonemptyString),
    {
      id: isNonemptyString(data.workflowitemId) ? data.workflowitemId : randomString(),
      displayName: value("displayName", data.displayName, isNonemptyString),
      amount: value("amount", data.amount, x => x !== undefined && typeof x === "number"),
      currency: value("currency", data.currency, isNonemptyString),
      amountType: value("amountType", data.amountType, x =>
        ["N/A", "disbursed", "allocated"].includes(x)
      ),
      description: value("description", data.description, x => typeof x === "string"),
      status: value("status", data.status, x => ["open", "closed"].includes(x)),
      documents: data.documents, // not checked right now
      previousWorkflowitemId: data.previousWorkflowitemId // optional
    },
    getWorkflowitemDefaultPermissions(req.token)
  );

  return [
    201,
    {
      apiVersion: "1.0",
      data: { created: true }
    }
  ];
};

const getWorkflowitemDefaultPermissions = (token: AuthToken): AllowedUserGroupsByIntent => ({
  "workflowitem.permission.list": [token.userId],
  "workflowitem.permission.grant": [token.userId],
  "workflowitem.permission.revoke": [token.userId],
  "workflowitem.viewSummary": [token.userId],
  "workflowitem.viewDetails": [token.userId],
  "workflowitem.assign": [token.userId],
  "workflowitem.update": [token.userId],
  "workflowitem.close": [token.userId],
  "workflowitem.archive": [token.userId]
});
