import type { MockEmail } from "@/lib/mock-emails";

export type InboxSyncProvider = "gmail" | "realmails";
export type GmailMailbox = "inbox" | "sent" | "starred" | "spam" | "trash" | "all";

type GmailHeader = { name?: string; value?: string };
type GmailPart = { mimeType?: string; body?: { data?: string }; parts?: GmailPart[] };
type GmailMessage = {
  id?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: { headers?: GmailHeader[]; mimeType?: string; body?: { data?: string }; parts?: GmailPart[] };
};

type RealmailsMessage = {
  id?: string | number;
  messageId?: string | number;
  from?: string;
  sender?: string;
  author?: string;
  email?: string;
  subject?: string;
  title?: string;
  preview?: string;
  snippet?: string;
  body?: string;
  content?: string;
  text?: string;
  receivedAt?: string | number | null;
  sentAt?: string | number | null;
  createdAt?: string | number | null;
  date?: string | number | null;
  unread?: boolean;
  read?: boolean;
  labels?: string[];
};

const env =
  typeof import.meta !== "undefined"
    ? import.meta.env
    : ({ VITE_INBOX_SYNC_PROVIDER: undefined, VITE_REALMAILS_API_URL: undefined, VITE_REALMAILS_API_KEY: undefined } as Record<
        string,
        string | undefined
      >);

export function getConfiguredInboxProvider(): InboxSyncProvider {
  const provider = (env.VITE_INBOX_SYNC_PROVIDER ?? "gmail").toLowerCase();
  return provider === "realmails" ? "realmails" : "gmail";
}

function decodeGmailText(value: string | undefined): string {
  if (!value) return "";
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function findGmailBody(part: GmailPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) return decodeGmailText(part.body.data);
  for (const child of part.parts ?? []) {
    const body = findGmailBody(child);
    if (body) return body;
  }
  return part.body?.data ? decodeGmailText(part.body.data) : "";
}

function headerValue(message: GmailMessage, name: string): string {
  return message.payload?.headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseAddress(value: string): { name: string; email: string } {
  const match = value.match(/^(.*?)\s*<([^>]+)>$/);
  return {
    name: (match?.[1] ?? value).replace(/^"|"$/g, "").trim(),
    email: match?.[2] ?? value,
  };
}

function toMessageId(item: GmailMessage | RealmailsMessage): string | null {
  if ("id" in item && item.id !== undefined && item.id !== null) return String(item.id);
  if ("messageId" in item && item.messageId !== undefined && item.messageId !== null) return String(item.messageId);
  return null;
}

function getMessageBody(item: RealmailsMessage): string {
  const raw = item.body ?? item.content ?? item.text ?? item.preview ?? item.snippet ?? "";
  return typeof raw === "string" ? raw : "";
}

function mapGmailMessage(message: GmailMessage): MockEmail | null {
  if (!message.id) return null;
  const sender = parseAddress(headerValue(message, "From"));
  const subject = headerValue(message, "Subject") || "(No subject)";
  const body = findGmailBody(message.payload);
  const preview = body.replace(/\s+/g, " ").trim().slice(0, 180) || "No message preview available.";
  return {
    id: `gmail-${message.id}`,
    from: sender.name || sender.email,
    fromEmail: sender.email,
    subject,
    preview,
    body: body || preview,
    receivedAt: new Date(Number(message.internalDate ?? Date.now())).toISOString(),
    unread: message.labelIds?.includes("UNREAD") ?? false,
    priority: "medium",
    attentionScore: 50,
    category: "Work",
    summary: preview,
    tasks: [],
    sentiment: "neutral",
  };
}

function mapRealmailsMessage(item: RealmailsMessage): MockEmail | null {
  const id = toMessageId(item);
  if (!id) return null;

  const senderValue = item.from ?? item.sender ?? item.author ?? item.email ?? "Unknown sender";
  const sender = parseAddress(senderValue);
  const subject = item.subject ?? item.title ?? "(No subject)";
  const body = getMessageBody(item);
  const preview = body.replace(/\s+/g, " ").trim().slice(0, 180) || item.preview || item.snippet || "No message preview available.";
  const receivedAt = item.receivedAt ?? item.sentAt ?? item.createdAt ?? item.date ?? new Date().toISOString();

  return {
    id: `realmails-${id}`,
    from: sender.name || sender.email,
    fromEmail: sender.email,
    subject,
    preview,
    body: body || preview,
    receivedAt: new Date(receivedAt).toISOString(),
    unread: item.unread ?? !(item.read ?? false),
    priority: "medium",
    attentionScore: 50,
    category: "Work",
    summary: preview,
    tasks: [],
    sentiment: "neutral",
  };
}

async function fetchGmailMessages(providerToken?: string | null, mailbox: GmailMailbox = "inbox"): Promise<MockEmail[]> {
  if (!providerToken) {
    throw new Error("Connect with Google and grant Gmail read access before syncing.");
  }

  const labelIds: Record<Exclude<GmailMailbox, "all">, string> = {
    inbox: "INBOX",
    sent: "SENT",
    starred: "STARRED",
    spam: "SPAM",
    trash: "TRASH",
  };
  const params = new URLSearchParams({ maxResults: "25" });
  if (mailbox === "all") params.set("q", "in:anywhere -in:spam -in:trash");
  else params.set("labelIds", labelIds[mailbox]);
  const listResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${providerToken}` },
  });

  if (!listResponse.ok) {
    throw new Error("Gmail could not be reached. Reconnect Google and try again.");
  }

  const listed = (await listResponse.json()) as { messages?: { id?: string }[] };
  const messages = await Promise.all(
    (listed.messages ?? []).map(async ({ id }) => {
      if (!id) return null;
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
        headers: { Authorization: `Bearer ${providerToken}` },
      });
      return response.ok ? mapGmailMessage((await response.json()) as GmailMessage) : null;
    }),
  );

  return messages.filter((message): message is MockEmail => !!message);
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function sendGmailMessage(options: {
  token?: string | null;
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  if (!options.token) {
    throw new Error("Reconnect Google with Gmail access before sending.");
  }

  const raw = [
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "MIME-Version: 1.0",
    "",
    options.body,
  ].join("\r\n");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodeBase64Url(raw) }),
  });

  if (!response.ok) {
    let detail = "Gmail rejected the send request.";
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      if (payload.error?.message) detail = payload.error.message;
    } catch {
      // Keep the actionable fallback when Gmail returns no JSON body.
    }
    throw new Error(`${detail} Reconnect Google and grant Gmail send access.`);
  }
}

async function fetchRealmailsMessages(token?: string | null): Promise<MockEmail[]> {
  const apiUrl = env.VITE_REALMAILS_API_URL ?? "https://api.realmails.com";
  const apiKey = env.VITE_REALMAILS_API_KEY;
  const bearerToken = token ?? (typeof localStorage !== "undefined" ? localStorage.getItem("realmails-access-token") : null);

  const headers = new Headers({ Accept: "application/json" });
  if (bearerToken) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
  } else if (apiKey) {
    headers.set("X-API-Key", apiKey);
  }

  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/messages?limit=25`, { headers });
  if (!response.ok) {
    throw new Error("RealMails could not be reached. Configure the RealMails API URL and credentials first.");
  }

  const payload = (await response.json()) as
    | RealmailsMessage[]
    | { messages?: RealmailsMessage[]; data?: RealmailsMessage[]; items?: RealmailsMessage[] };

  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.messages)
      ? payload.messages
      : Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.items)
          ? payload.items
          : [];

  return items
    .map((item) => mapRealmailsMessage(item))
    .filter((message): message is MockEmail => !!message);
}

export async function fetchInboxMessages(options: { token?: string | null; provider?: InboxSyncProvider; mailbox?: GmailMailbox } = {}): Promise<MockEmail[]> {
  const provider = options.provider ?? getConfiguredInboxProvider();
  if (provider === "realmails") {
    return fetchRealmailsMessages(options.token ?? null);
  }
  return fetchGmailMessages(options.token ?? null, options.mailbox ?? "inbox");
}
