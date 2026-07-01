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

    const finished = searchParams.get("finished");

    const params = new URLSearchParams();
    params.set("processDefinitionKey", "leaveRequestProcess");
    params.set("sort", "startTime");
    params.set("order", "desc");

    if (finished === "true") {
      params.set("finished", "true");
    }

    if (finished === "false") {
      params.set("unfinished", "true");
    }

    const res = await fetch(
      `${baseUrl}/history/historic-process-instances?${params.toString()}`,
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
      { message: "Get history process instances failed", error: String(error) },
      { status: 500 }
    );
  }
}