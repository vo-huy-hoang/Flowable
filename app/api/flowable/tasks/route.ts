import { NextResponse } from "next/server";

const baseUrl = process.env.FLOWABLE_BASE_URL!;
const username = process.env.FLOWABLE_USERNAME!;
const password = process.env.FLOWABLE_PASSWORD!;

function authHeader() {
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const group = searchParams.get("group");
    const assignee = searchParams.get("assignee");
    const definitionKey = searchParams.get("definitionKey");

    const params = new URLSearchParams();

    if (group) {
      params.set("candidateGroup", group);
    }

    if (assignee) {
      params.set("assignee", assignee);
    }

    if (definitionKey) {
      params.set("taskDefinitionKey", definitionKey);
    }

    const query = params.toString() ? `?${params.toString()}` : "";

    const res = await fetch(`${baseUrl}/runtime/tasks${query}`, {
      headers: {
        Authorization: authHeader(),
      },
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Get tasks failed", error: String(error) },
      { status: 500 }
    );
  }
}