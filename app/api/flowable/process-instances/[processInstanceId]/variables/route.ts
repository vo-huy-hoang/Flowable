import { NextResponse } from "next/server";

const baseUrl = process.env.FLOWABLE_BASE_URL!;
const username = process.env.FLOWABLE_USERNAME!;
const password = process.env.FLOWABLE_PASSWORD!;

function authHeader() {
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

export async function GET(
  req: Request,
  context: { params: Promise<{ processInstanceId: string }> }
) {
  try {
    const { processInstanceId } = await context.params;

    const res = await fetch(
      `${baseUrl}/runtime/process-instances/${processInstanceId}/variables`,
      {
        headers: {
          Authorization: authHeader(),
        },
        cache: "no-store",
      }
    );

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Get process variables failed", error: String(error) },
      { status: 500 }
    );
  }
}