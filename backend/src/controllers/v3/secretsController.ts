import { Request, Response } from "express";
import { Types } from "mongoose";
import { SecretService, EventService } from "../../services";
import { eventPushSecrets } from "../../events";
import { BotService } from "../../services";
import { repackageSecretToRaw } from "../../helpers/secrets";
import { encryptSymmetric128BitHexKeyUTF8 } from "../../utils/crypto";

/**
 * Return secrets for workspace with id [workspaceId] and environment
 * [environment] in plaintext
 * @param req
 * @param res
 */
export const getSecretsRaw = async (req: Request, res: Response) => {
  const workspaceId = req.query.workspaceId as string;
  const environment = req.query.environment as string;
  const secretPath = req.query.secretPath as string;

  const secrets = await SecretService.getSecrets({
    workspaceId: new Types.ObjectId(workspaceId),
    environment,
    secretPath,
    authData: req.authData,
  });

  const key = await BotService.getWorkspaceKeyWithBot({
    workspaceId: new Types.ObjectId(workspaceId)
  });

  return res.status(200).send({
    secrets: secrets.map((secret) => {
      const rep = repackageSecretToRaw({
        secret,
        key
      });

      return rep;
    })
  });
};

/**
 * Return secret with name [secretName] in plaintext
 * @param req
 * @param res
 */
export const getSecretByNameRaw = async (req: Request, res: Response) => {
  const { secretName } = req.params;
  const workspaceId = req.query.workspaceId as string;
  const environment = req.query.environment as string;
  const secretPath = req.query.secretPath as string;
  const type = req.query.type as "shared" | "personal" | undefined;

  const secret = await SecretService.getSecret({
    secretName,
    workspaceId: new Types.ObjectId(workspaceId),
    environment,
    type,
    secretPath,
    authData: req.authData,
  });

  const key = await BotService.getWorkspaceKeyWithBot({
    workspaceId: new Types.ObjectId(workspaceId)
  });

  return res.status(200).send({
    secret: repackageSecretToRaw({
      secret,
      key
    })
  });
};

/**
 * Create secret with name [secretName] in plaintext
 * @param req
 * @param res 
 */
export const createSecretRaw = async (req: Request, res: Response) => {
  const { secretName } = req.params;
  const {
    workspaceId,
    environment,
    type,
    secretValue,
    secretComment,
    secretPath = "/"
  } = req.body;

  const key = await BotService.getWorkspaceKeyWithBot({
    workspaceId: new Types.ObjectId(workspaceId)
  });

  const secretKeyEncrypted = encryptSymmetric128BitHexKeyUTF8({
    plaintext: secretName,
    key
  });

  const secretValueEncrypted = encryptSymmetric128BitHexKeyUTF8({
    plaintext: secretValue,
    key
  });

  const secretCommentEncrypted = encryptSymmetric128BitHexKeyUTF8({
    plaintext: secretComment,
    key
  });

  const secret = await SecretService.createSecret({
    secretName,
    workspaceId: new Types.ObjectId(workspaceId),
    environment,
    type,
    authData: req.authData,
    secretKeyCiphertext: secretKeyEncrypted.ciphertext,
    secretKeyIV: secretKeyEncrypted.iv,
    secretKeyTag: secretKeyEncrypted.tag,
    secretValueCiphertext: secretValueEncrypted.ciphertext,
    secretValueIV: secretValueEncrypted.iv,
    secretValueTag: secretValueEncrypted.tag,
    secretPath,
    secretCommentCiphertext: secretCommentEncrypted.ciphertext,
    secretCommentIV: secretCommentEncrypted.iv,
    secretCommentTag: secretCommentEncrypted.tag
  });

  await EventService.handleEvent({
    event: eventPushSecrets({
      workspaceId: new Types.ObjectId(workspaceId),
      environment,
    }),
  });

  const secretWithoutBlindIndex = secret.toObject();
  delete secretWithoutBlindIndex.secretBlindIndex;

  return res.status(200).send({
    secret: repackageSecretToRaw({
      secret: secretWithoutBlindIndex,
      key
    })
  });
}

/**
 * Update secret with name [secretName]
 * @param req
 * @param res
 */
export const updateSecretByNameRaw = async (req: Request, res: Response) => {
  const { secretName } = req.params;
  const {
    workspaceId,
    environment,
    type,
    secretValue,
    secretPath = "/",
  } = req.body;

  const key = await BotService.getWorkspaceKeyWithBot({
    workspaceId: new Types.ObjectId(workspaceId)
  });

  const secretValueEncrypted = encryptSymmetric128BitHexKeyUTF8({
    plaintext: secretValue,
    key
  });

  const secret = await SecretService.updateSecret({
    secretName,
    workspaceId,
    environment,
    type,
    authData: req.authData,
    secretValueCiphertext: secretValueEncrypted.ciphertext,
    secretValueIV: secretValueEncrypted.iv,
    secretValueTag: secretValueEncrypted.tag,
    secretPath,
  });

  await EventService.handleEvent({
    event: eventPushSecrets({
      workspaceId: new Types.ObjectId(workspaceId),
      environment,
    }),
  });

  return res.status(200).send({
    secret: repackageSecretToRaw({
      secret,
      key
    })
  });
};

/**
 * Delete secret with name [secretName]
 * @param req
 * @param res
 */
export const deleteSecretByNameRaw = async (req: Request, res: Response) => {
  const { secretName } = req.params;
  const {
    workspaceId,
    environment,
    type,
    secretPath = "/"
  } = req.body;

  const { secret } = await SecretService.deleteSecret({
    secretName,
    workspaceId,
    environment,
    type,
    authData: req.authData,
    secretPath,
  });

  await EventService.handleEvent({
    event: eventPushSecrets({
      workspaceId: new Types.ObjectId(workspaceId),
      environment,
    }),
  });

  const key = await BotService.getWorkspaceKeyWithBot({
    workspaceId: new Types.ObjectId(workspaceId)
  });

  return res.status(200).send({
    secret: repackageSecretToRaw({
      secret,
      key
    })
  });
};

/**
 * Get secrets for workspace with id [workspaceId] and environment
 * [environment]
 * @param req
 * @param res
 */
export const getSecrets = async (req: Request, res: Response) => {
  const workspaceId = req.query.workspaceId as string;
  const environment = req.query.environment as string;
  const secretPath = req.query.secretPath as string;

  const secrets = await SecretService.getSecrets({
    workspaceId: new Types.ObjectId(workspaceId),
    environment,
    secretPath,
    authData: req.authData,
  });

  return res.status(200).send({
    secrets,
  });
};

/**
 * Return secret with name [secretName]
 * @param req
 * @param res
 */
export const getSecretByName = async (req: Request, res: Response) => {
  const { secretName } = req.params;
  const workspaceId = req.query.workspaceId as string;
  const environment = req.query.environment as string;
  const secretPath = req.query.secretPath as string;
  const type = req.query.type as "shared" | "personal" | undefined;

  const secret = await SecretService.getSecret({
    secretName,
    workspaceId: new Types.ObjectId(workspaceId),
    environment,
    type,
    secretPath,
    authData: req.authData,
  });

  return res.status(200).send({
    secret,
  });
};

/**
 * Create secret with name [secretName]
 * @param req
 * @param res
 */
export const createSecret = async (req: Request, res: Response) => {
  const { secretName } = req.params;
  const {
    workspaceId,
    environment,
    type,
    secretKeyCiphertext,
    secretKeyIV,
    secretKeyTag,
    secretValueCiphertext,
    secretValueIV,
    secretValueTag,
    secretCommentCiphertext,
    secretCommentIV,
    secretCommentTag,
    secretPath = "/",
  } = req.body;

  const secret = await SecretService.createSecret({
    secretName,
    workspaceId: new Types.ObjectId(workspaceId),
    environment,
    type,
    authData: req.authData,
    secretKeyCiphertext,
    secretKeyIV,
    secretKeyTag,
    secretValueCiphertext,
    secretValueIV,
    secretValueTag,
    secretPath,
    secretCommentCiphertext,
    secretCommentIV,
    secretCommentTag
  });

  await EventService.handleEvent({
    event: eventPushSecrets({
      workspaceId: new Types.ObjectId(workspaceId),
      environment,
    }),
  });

  const secretWithoutBlindIndex = secret.toObject();
  delete secretWithoutBlindIndex.secretBlindIndex;

  return res.status(200).send({
    secret: secretWithoutBlindIndex,
  });
};


/**
 * Update secret with name [secretName]
 * @param req
 * @param res
 */
export const updateSecretByName = async (req: Request, res: Response) => {
  const { secretName } = req.params;
  const {
    workspaceId,
    environment,
    type,
    secretValueCiphertext,
    secretValueIV,
    secretValueTag,
    secretPath = "/",
  } = req.body;

  const secret = await SecretService.updateSecret({
    secretName,
    workspaceId,
    environment,
    type,
    authData: req.authData,
    secretValueCiphertext,
    secretValueIV,
    secretValueTag,
    secretPath,
  });

  await EventService.handleEvent({
    event: eventPushSecrets({
      workspaceId: new Types.ObjectId(workspaceId),
      environment,
    }),
  });

  return res.status(200).send({
    secret,
  });
};

/**
 * Delete secret with name [secretName]
 * @param req
 * @param res
 */
export const deleteSecretByName = async (req: Request, res: Response) => {
  const { secretName } = req.params;
  const {
    workspaceId,
    environment,
    type,
    secretPath = "/"
  } = req.body;

  const { secret } = await SecretService.deleteSecret({
    secretName,
    workspaceId,
    environment,
    type,
    authData: req.authData,
    secretPath,
  });

  await EventService.handleEvent({
    event: eventPushSecrets({
      workspaceId: new Types.ObjectId(workspaceId),
      environment,
    }),
  });

  return res.status(200).send({
    secret,
  });
};
