import Joi = require("joi");
import * as Result from "../../../result";
import * as AdditionalData from "../additional_data";

export interface ProvisioningStatus {
  isProvisioned: Boolean;
  message: string;
}

export interface SystemInformation {
  provisioningStatus: ProvisioningStatus;
}

const provisioningStatusSchema = Joi.object().keys({
  isProvisioned: Joi.boolean().required(),
  message: Joi.string().required(),
});

const systemInformationSchema = Joi.object({
  provisioningStatus: provisioningStatusSchema,
  additionalData: AdditionalData.schema,
});

export function validate(input: any): Result.Type<SystemInformation> {
  const { error, value } = Joi.validate(input, systemInformationSchema);
  return !error ? value : error;
}
