import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "kanban-d83d7";

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function getAdminApp() {
  const existing = getApps().find(
    (app) => app.name === "team-members-api",
  );

  if (existing) return existing;

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (process.env.VERCEL && (!clientEmail || !privateKey)) {
    throw new HttpError(
      503,
      "O serviço administrativo ainda não foi configurado.",
    );
  }

  return initializeApp(
    {
      projectId: PROJECT_ID,
      credential:
        clientEmail && privateKey
          ? cert({
              projectId: PROJECT_ID,
              clientEmail,
              privateKey: privateKey.replace(/\\n/g, "\n"),
            })
          : applicationDefault(),
    },
    "team-members-api",
  );
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validateUpdates(value: unknown) {
  if (!isObject(value)) {
    throw new HttpError(400, "Alterações inválidas.");
  }

  const allowed = new Set([
    "name",
    "role",
    "avatar",
    "avatarUrl",
    "isAdmin",
    "isActive",
  ]);

  if (
    Object.keys(value).length === 0 ||
    Object.keys(value).some((key) => !allowed.has(key))
  ) {
    throw new HttpError(
      400,
      "Há campos não permitidos nesta edição.",
    );
  }

  const updates: Record<string, string | boolean> = {};

  for (const [key, field] of Object.entries(value)) {
    if (key === "isAdmin" || key === "isActive") {
      if (typeof field !== "boolean") {
        throw new HttpError(400, `${key} deve ser booleano.`);
      }

      updates[key] = field;
      continue;
    }

    const limit = key === "avatarUrl" ? 2048 : 150;

    if (typeof field !== "string" || field.length > limit) {
      throw new HttpError(400, `${key} é inválido.`);
    }

    if (
      (key === "name" || key === "role") &&
      field.trim().length === 0
    ) {
      throw new HttpError(400, `${key} não pode ficar vazio.`);
    }

    if (key === "avatarUrl" && field !== "") {
      let url: URL;

      try {
        url = new URL(field);
      } catch {
        throw new HttpError(400, "URL de avatar inválida.");
      }

      if (url.protocol !== "https:") {
        throw new HttpError(
          400,
          "O avatar deve usar uma URL HTTPS.",
        );
      }
    }

    updates[key] = field;
  }

  return updates;
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (
  request.method !== "PATCH" &&
  request.method !== "POST" &&
  request.method !== "DELETE"
) {
      return new Response(null, {
        status: 405,
        headers: {
          Allow: "PATCH, POST, DELETE",
          "Cache-Control": "no-store",
        },
      });
    }

    let profileSaved = false;

    try {
      const authorization = request.headers.get("authorization");

      if (!authorization?.startsWith("Bearer ")) {
        throw new HttpError(401, "Faça login para continuar.");
      }

      const app = getAdminApp();
      const auth = getAuth(app);
      const db = getFirestore(app);

      const token = await auth
        .verifyIdToken(authorization.slice(7), true)
        .catch(() => {
          throw new HttpError(
            401,
            "Sessão inválida ou expirada.",
          );
        });

      const actorRef = db.collection("teamMembers").doc(token.uid);
      const actorSnapshot = await actorRef.get();
      const actor = actorSnapshot.data();

      if (
        !actor ||
        actor.isActive !== true ||
        actor.isAdmin !== true ||
        token.isAdmin !== true ||
        typeof token.memberId !== "string" ||
        token.memberId.length === 0 ||
        token.memberId !== actor.id ||
        typeof token.email !== "string" ||
        actor.email !== token.email ||
        (
          actor.firebaseUid !== undefined &&
          actor.firebaseUid !== token.uid
        )
      ) {
        throw new HttpError(
          403,
          "Somente um administrador ativo com cadastro consistente pode executar esta ação.",
        );
      }

      if (
        !request.headers
          .get("content-type")
          ?.includes("application/json")
      ) {
        throw new HttpError(415, "Envie os dados em JSON.");
      }

      const rawBody = await request.text();

      if (Buffer.byteLength(rawBody, "utf8") > 16_384) {
        throw new HttpError(413, "Solicitação muito grande.");
      }

      let body: unknown;

      try {
        body = JSON.parse(rawBody);
      } catch {
        throw new HttpError(400, "JSON inválido.");
      }

      /*
 * =========================================
 * EXCLUIR MEMBRO — DELETE
 * =========================================
 */
if (request.method === "DELETE") {
  if (
    !isObject(body) ||
    Object.keys(body).some((key) => key !== "uid") ||
    typeof body.uid !== "string" ||
    body.uid.trim().length === 0 ||
    body.uid.length > 128 ||
    body.uid.includes("/")
  ) {
    throw new HttpError(400, "UID ou solicitação inválida.");
  }

  const uid = body.uid;

  if (uid === token.uid) {
    throw new HttpError(
      400,
      "Você não pode excluir sua própria conta.",
    );
  }

  const memberRef = db.collection("teamMembers").doc(uid);
  const memberSnapshot = await memberRef.get();
  const member = memberSnapshot.data();

  if (!member) {
    throw new HttpError(
      404,
      "Cadastro não encontrado. Confira também o Authentication antes de repetir a exclusão.",
    );
  }

  if (
    typeof member.id !== "string" ||
    member.id.trim().length === 0 ||
    (
      member.firebaseUid !== undefined &&
      member.firebaseUid !== uid
    )
  ) {
    throw new HttpError(
      409,
      "Cadastro com identificação inconsistente.",
    );
  }

  const memberId = member.id;
  let accountBlocked = false;
  let accountMissing = false;
  let documentsDeleted = false;

  try {
    // Bloqueia novos logins antes de remover os dados.
    try {
      await auth.updateUser(uid, { disabled: true });
      accountBlocked = true;
    } catch (error) {
      if (
        (error as { code?: string })?.code ===
        "auth/user-not-found"
      ) {
        accountMissing = true;
      } else {
        throw error;
      }
    }

    if (!accountMissing) {
      await auth.revokeRefreshTokens(uid);
    }

    const movedTasks = await db.runTransaction(
      async (transaction) => {
        const currentActor = (
          await transaction.get(actorRef)
        ).data();

        const currentMember = (
          await transaction.get(memberRef)
        ).data();

        if (
          !currentActor ||
          currentActor.isActive !== true ||
          currentActor.isAdmin !== true ||
          currentActor.id !== token.memberId ||
          currentActor.email !== token.email ||
          (
            currentActor.firebaseUid !== undefined &&
            currentActor.firebaseUid !== token.uid
          )
        ) {
          throw new HttpError(
            403,
            "Permissão administrativa revogada.",
          );
        }

        if (
          !currentMember ||
          currentMember.id !== memberId ||
          (
            currentMember.firebaseUid !== undefined &&
            currentMember.firebaseUid !== uid
          )
        ) {
          throw new HttpError(
            409,
            "O cadastro mudou durante a exclusão. Recarregue a equipe.",
          );
        }

        const assignedTasks = await transaction.get(
          db
            .collection("tasks")
            .where("assigneeId", "==", memberId)
            .limit(401),
        );

        // Limite conservador para esta operação única.
        if (assignedTasks.size > 400) {
          throw new HttpError(
            409,
            "Este membro possui mais de 400 tarefas atribuídas. A exclusão precisa ser feita em um fluxo por etapas.",
          );
        }

        for (const taskDocument of assignedTasks.docs) {
          transaction.update(taskDocument.ref, {
            assigneeId: null,
            columnId: "backlog",
            status: "planned",
          });
        }

        transaction.delete(memberRef);

        return assignedTasks.size;
      },
    );

    documentsDeleted = true;

    if (!accountMissing) {
      try {
        await auth.deleteUser(uid);
      } catch (error) {
        if (
          (error as { code?: string })?.code !==
          "auth/user-not-found"
        ) {
          throw error;
        }
      }
    }

    return json({
      success: true,
      memberId,
      movedTasks,
    });
  } catch (error) {
    console.error("Falha ao excluir membro:", error);

    const detail =
      error instanceof HttpError
        ? ` ${error.message}`
        : "";

    return json(
      {
        success: false,
        accountBlocked,
        documentsDeleted,
        message: documentsDeleted
          ? "As tarefas foram movidas e o cadastro foi removido, mas a exclusão da conta no Authentication não foi confirmada. Recarregue a equipe e confira o Authentication."
          : accountBlocked
            ? "A conta foi bloqueada, mas a exclusão não foi concluída. Confira o cadastro antes de tentar novamente." + detail
            : "A exclusão não foi concluída. Confira Authentication e Firestore antes de tentar novamente." + detail,
      },
      error instanceof HttpError ? error.status : 503,
    );
  }
}

      /*
       * =========================================
       * CRIAR MEMBRO — POST
       * =========================================
       */

      if (request.method === "POST") {
        if (
          !isObject(body) ||
          Object.keys(body).some((key) => key !== "member") ||
          !isObject(body.member)
        ) {
          throw new HttpError(400, "Cadastro inválido.");
        }

        const input = body.member;
        const fields = [
          "name",
          "email",
          "role",
          "avatar",
          "isAdmin",
        ];

        if (
          Object.keys(input).some(
            (key) => !fields.includes(key),
          ) ||
          fields.some((key) => !(key in input))
        ) {
          throw new HttpError(
            400,
            "Campos do cadastro inválidos.",
          );
        }

        if (
          typeof input.email !== "string" ||
          input.email.trim().length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            input.email.trim(),
          )
        ) {
          throw new HttpError(
            400,
            "Informe um e-mail válido.",
          );
        }

        const validated = validateUpdates({
          name: input.name,
          role: input.role,
          avatar: input.avatar,
          isAdmin: input.isAdmin,
        });

        const email = input.email.trim().toLowerCase();
        const name = String(validated.name).trim();
        const role = String(validated.role).trim();
        const avatar = String(validated.avatar);
        const adminPermission = validated.isAdmin === true;

        const existingMembers = await db
          .collection("teamMembers")
          .where("email", "==", email)
          .limit(1)
          .get();

        if (!existingMembers.empty) {
          throw new HttpError(
            409,
            "Já existe um cadastro com esse e-mail. Confira o membro existente.",
          );
        }

        let createdUid: string | undefined;

        try {
          // A senha será definida pelo usuário no primeiro acesso.
          const createdUser = await auth.createUser({
            email,
            displayName: name,
            emailVerified: false,
            disabled: true,
          });

          createdUid = createdUser.uid;

          // Os membros existentes mantêm seus IDs originais.
          const newMember = {
            id: createdUid,
            firebaseUid: createdUid,
            email,
            name,
            role,
            avatar,
            isAdmin: adminPermission,
            isActive: true,
          };

          await auth.setCustomUserClaims(createdUid, {
            memberId: newMember.id,
            isAdmin: adminPermission,
          });

          const newMemberRef = db
            .collection("teamMembers")
            .doc(createdUid);

          await db.runTransaction(async (transaction) => {
            const currentActor = (
              await transaction.get(actorRef)
            ).data();

            if (
              !currentActor ||
              currentActor.isActive !== true ||
              currentActor.isAdmin !== true ||
              currentActor.id !== token.memberId ||
              currentActor.email !== token.email ||
              (
                currentActor.firebaseUid !== undefined &&
                currentActor.firebaseUid !== token.uid
              )
            ) {
              throw new HttpError(
                403,
                "Permissão administrativa revogada ou cadastro inconsistente.",
              );
            }

            // Não sobrescreve um documento existente.
            transaction.create(newMemberRef, newMember);
          });

          // Libera a conta após gravar cadastro e claims.
          await auth.updateUser(createdUid, {
            disabled: false,
          });

          return json(
            {
              success: true,
              member: newMember,
            },
            201,
          );
        } catch (error) {
          console.error("Falha ao criar membro:", error);

          if (createdUid) {
            let blocked = false;

            try {
              await auth.updateUser(createdUid, {
                disabled: true,
              });

              blocked = true;
            } catch (blockingError) {
              console.error(
                "Não foi possível confirmar o bloqueio da nova conta:",
                blockingError,
              );
            }

            return json(
              {
                success: false,
                message: blocked
                  ? "O cadastro ficou incompleto e a conta foi bloqueada. Confira Authentication e Firestore antes de tentar novamente."
                  : "Não foi possível confirmar a conclusão nem o bloqueio da conta. Confira Authentication e Firestore antes de tentar novamente.",
              },
              503,
            );
          }

          const code = (error as { code?: string })?.code;

          if (code === "auth/email-already-exists") {
            throw new HttpError(
              409,
              "Esse e-mail já existe no Authentication. É necessário conferir e vincular a conta existente.",
            );
          }

          if (code === "auth/invalid-email") {
            throw new HttpError(
              400,
              "O e-mail informado é inválido.",
            );
          }

          throw new HttpError(
            503,
            "Não foi possível confirmar a criação da conta. Confira o Authentication antes de tentar novamente.",
          );
        }
      }

      /*
       * =========================================
       * EDITAR MEMBRO — PATCH
       * =========================================
       */

      if (
        !isObject(body) ||
        Object.keys(body).some(
          (key) => key !== "uid" && key !== "updates",
        ) ||
        typeof body.uid !== "string" ||
        body.uid.length === 0 ||
        body.uid.length > 128 ||
        body.uid.includes("/")
      ) {
        throw new HttpError(
          400,
          "UID ou solicitação inválida.",
        );
      }

      const uid = body.uid;
      const updates = validateUpdates(body.updates);

      if (
        uid === token.uid &&
        (
          updates.isAdmin === false ||
          updates.isActive === false
        )
      ) {
        throw new HttpError(
          400,
          "Você não pode desativar ou retirar seu próprio acesso administrativo.",
        );
      }

      const targetUser = await auth.getUser(uid).catch((error) => {
        if ((error as { code?: string })?.code === "auth/user-not-found") {
          throw new HttpError(
            404,
            "Conta não encontrada no Authentication.",
          );
        }

        throw error;
      });

      if (targetUser.disabled && updates.isActive === true) {
        throw new HttpError(
          409,
          "A conta está desativada no Authentication.",
        );
      }

      const memberRef = db.collection("teamMembers").doc(uid);

      const savedMember = await db.runTransaction(
        async (transaction) => {
          const currentActor = (
            await transaction.get(actorRef)
          ).data();

          const currentMember = (
            await transaction.get(memberRef)
          ).data();

          // Confere novamente a autorização antes de gravar.
          if (
            !currentActor ||
            currentActor.isActive !== true ||
            currentActor.isAdmin !== true ||
            currentActor.id !== token.memberId ||
            currentActor.email !== token.email ||
            (
              currentActor.firebaseUid !== undefined &&
              currentActor.firebaseUid !== token.uid
            )
          ) {
            throw new HttpError(
              403,
              "Permissão administrativa revogada ou cadastro inconsistente.",
            );
          }

          if (!currentMember) {
            throw new HttpError(
              404,
              "Cadastro do membro não encontrado.",
            );
          }

          if (
            typeof currentMember.id !== "string" ||
            currentMember.id.length === 0 ||
            (
              currentMember.firebaseUid !== undefined &&
              currentMember.firebaseUid !== uid
            )
          ) {
            throw new HttpError(
              409,
              "Cadastro com identificação inconsistente.",
            );
          }

          const next = {
            ...currentMember,
            ...updates,
            id: currentMember.id,
            isAdmin: updates.isAdmin ?? currentMember.isAdmin,
            isActive: updates.isActive ?? currentMember.isActive,
            firebaseUid: uid,
          };

          if (
            typeof next.isAdmin !== "boolean" ||
            typeof next.isActive !== "boolean"
          ) {
            throw new HttpError(
              409,
              "Permissões do cadastro inválidas.",
            );
          }

          transaction.update(memberRef, {
            ...updates,
            firebaseUid: uid,
          });

          return next;
        },
      );

      profileSaved = true;

      const latestUser = await auth.getUser(uid);

      await auth.setCustomUserClaims(uid, {
        ...(latestUser.customClaims ?? {}),
        memberId: savedMember.id,
        isAdmin:
          savedMember.isActive === true &&
          savedMember.isAdmin === true,
      });

      // Detecta divergências após a sincronização.
      const latestMember = (await memberRef.get()).data();
      const verifiedUser = await auth.getUser(uid);

      if (
        latestMember?.id !== savedMember.id ||
        latestMember?.isAdmin !== savedMember.isAdmin ||
        latestMember?.isActive !== savedMember.isActive ||
        verifiedUser.customClaims?.memberId !== savedMember.id ||
        verifiedUser.customClaims?.isAdmin !==
          (
            savedMember.isActive === true &&
            savedMember.isAdmin === true
          )
      ) {
        throw new HttpError(
          409,
          "Houve outra alteração durante a sincronização. Recarregue o cadastro e tente novamente.",
        );
      }

      return json({
        success: true,
        member: savedMember,
      });
    } catch (error) {
      const status =
        error instanceof HttpError ? error.status : 500;

      console.error("Falha na operação administrativa:", error);

      return json(
        {
          success: false,
          profileSaved,
          message:
            error instanceof HttpError
              ? error.message
              : profileSaved
                ? "O cadastro foi salvo, mas a sincronização das permissões não foi concluída."
                : "Não foi possível concluir a operação administrativa.",
        },
        status,
      );
    }
  },
};