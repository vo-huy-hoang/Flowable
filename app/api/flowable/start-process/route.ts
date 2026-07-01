import { NextResponse } from "next/server";

const baseUrl = process.env.FLOWABLE_BASE_URL!;
const username = process.env.FLOWABLE_USERNAME!;
const password = process.env.FLOWABLE_PASSWORD!;

function authHeader() {
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${baseUrl}/runtime/process-instances`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(),
      },
      body: JSON.stringify({
        processDefinitionKey: "leaveRequestProcess",
        variables: [
          { name: "employeeName", value: body.employeeName },
          { name: "reason", value: body.reason },
          { name: "numberOfDays", value: Number(body.numberOfDays) },
        ],
      }),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : { message: "Process started" };

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Start process failed", error: String(error) },
      { status: 500 }
    );
  }
}