import { NextResponse } from "next/server";

const baseUrl = process.env.FLOWABLE_BASE_URL!;
const username = process.env.FLOWABLE_USERNAME!;
const password = process.env.FLOWABLE_PASSWORD!;

function authHeader() {
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

export async function POST(
  req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await context.params;
    const body = await req.json();

    const variables = [];

    if (typeof body.approved === "boolean") {
      variables.push({
        name: "approved",
        value: body.approved,
      });
    }

    if (body.comment) {
      variables.push({
        name: "comment",
        value: body.comment,
      });
    }

    const res = await fetch(`${baseUrl}/runtime/tasks/${taskId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(),
      },
      body: JSON.stringify({
        action: "complete",
        variables,
      }),
    });

    if (res.status === 204) {
      return NextResponse.json({ message: "Task completed" });
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : { message: "Task completed" };

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Complete task failed", error: String(error) },
      { status: 500 }
    );
  }
}