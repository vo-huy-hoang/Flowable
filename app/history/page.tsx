"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HistoricProcessInstance = {
  id: string;
  name?: string | null;
  processDefinitionId: string;
  processDefinitionKey?: string;
  startTime: string;
  endTime?: string | null;
  durationInMillis?: number | null;
  startUserId?: string | null;
  deleteReason?: string | null;
};

type HistoricTask = {
  id: string;
  name: string;
  assignee?: string | null;
  startTime?: string;
  endTime?: string | null;
  durationInMillis?: number | null;
  taskDefinitionKey?: string;
};

type FlowableVariable = {
  name?: string;
  value?: unknown;
  variable?: {
    name: string;
    value: unknown;
    type?: string;
    scope?: string;
  };
};

type LeaveVariables = {
  employeeName?: string;
  reason?: string;
  numberOfDays?: number;
  approved?: boolean;
  comment?: string;
};

type HistoryRow = HistoricProcessInstance & {
  tasks: HistoricTask[];
  variables: LeaveVariables;
};

function getArrayFromResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray((response as { data?: unknown }).data)
  ) {
    return (response as { data: T[] }).data;
  }

  return [];
}

function variablesArrayToObject(variables: FlowableVariable[]) {
  return variables.reduce<Record<string, unknown>>((acc, item) => {
    const name = item.variable?.name ?? item.name;
    const value = item.variable?.value ?? item.value;

    if (name) {
      acc[name] = value;
    }

    return acc;
  }, {});
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
}

function formatDuration(ms?: number | null) {
  if (!ms) return "0 giây";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;

  if (minutes <= 0) {
    return `${remainSeconds} giây`;
  }

  return `${minutes} phút ${remainSeconds} giây`;
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "finished" | "running">("all");

  async function loadHistory() {
    setLoading(true);
    setMessage("");

    try {
      let url = "/api/flowable/history/process-instances";

      if (filter === "finished") {
        url += "?finished=true";
      }

      if (filter === "running") {
        url += "?finished=false";
      }

      const res = await fetch(url, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Không lấy được lịch sử process");
      }

      const data = await res.json();
      const processes = getArrayFromResponse<HistoricProcessInstance>(data);

      const rows = await Promise.all(
        processes.map(async (process) => {
          const [tasksRes, variablesRes] = await Promise.all([
            fetch(
              `/api/flowable/history/process-instances/${process.id}/tasks`,
              { cache: "no-store" }
            ),
            fetch(
              `/api/flowable/history/process-instances/${process.id}/variables`,
              { cache: "no-store" }
            ),
          ]);

          const tasksData = await tasksRes.json();
          const variablesData = await variablesRes.json();

          const tasks = getArrayFromResponse<HistoricTask>(tasksData);
          const variableList =
            getArrayFromResponse<FlowableVariable>(variablesData);

          const variablesObject = variablesArrayToObject(variableList);

          return {
            ...process,
            tasks,
            variables: {
              employeeName:
                typeof variablesObject.employeeName === "string"
                  ? variablesObject.employeeName
                  : undefined,
              reason:
                typeof variablesObject.reason === "string"
                  ? variablesObject.reason
                  : undefined,
              numberOfDays: toNumber(variablesObject.numberOfDays),
              approved: toBoolean(variablesObject.approved),
              comment:
                typeof variablesObject.comment === "string"
                  ? variablesObject.comment
                  : undefined,
            },
          };
        })
      );

      setItems(rows);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, [filter]);

  return (
    <main className="app-shell">
      <section className="page">
        <div className="hero">
          <div>
            <span className="eyebrow">Workflow History</span>
            <h1>Lịch sử đơn nghỉ phép</h1>
            <p className="subtitle">
              Xem lại các process đã chạy, task đã xử lý và dữ liệu đơn nghỉ
              phép.
            </p>
          </div>

          <nav className="nav-card">
            <Link className="nav-link" href="/leave-requests/create">
              Tạo đơn
            </Link>
            <Link className="nav-link" href="/manager/tasks">
              Manager
            </Link>
            <Link className="nav-link" href="/hr/tasks">
              HR
            </Link>
            <Link className="nav-link" href="/history">
              Lịch sử
            </Link>
          </nav>
        </div>

        <section className="card">
          <div className="task-head">
            <div>
              <h2 className="card-title">Danh sách process</h2>
              <p className="card-desc">Tổng số bản ghi: {items.length}</p>
            </div>

            <div className="button-row">
              <button
                className={filter === "all" ? "btn-primary" : "btn-secondary"}
                onClick={() => setFilter("all")}
              >
                Tất cả
              </button>

              <button
                className={
                  filter === "running" ? "btn-primary" : "btn-secondary"
                }
                onClick={() => setFilter("running")}
              >
                Đang chạy
              </button>

              <button
                className={
                  filter === "finished" ? "btn-primary" : "btn-secondary"
                }
                onClick={() => setFilter("finished")}
              >
                Đã hoàn thành
              </button>

              <button
                className="btn-secondary"
                onClick={loadHistory}
                disabled={loading}
              >
                {loading ? "Đang tải..." : "Tải lại"}
              </button>
            </div>
          </div>

          {message && <div className="alert">{message}</div>}

          {items.length === 0 ? (
            <div className="empty-state">Chưa có lịch sử process nào.</div>
          ) : (
            <div className="task-list">
              {items.map((item) => {
                const isFinished = Boolean(item.endTime);

                return (
                  <article className="task-card" key={item.id}>
                    <div className="task-head">
                      <div>
                        <h3 className="task-name">
                          {item.variables.employeeName ||
                            "Không có tên nhân viên"}
                        </h3>
                        <p className="card-desc" style={{ margin: "6px 0 0" }}>
                          {item.variables.reason || "Không có lý do nghỉ"}
                        </p>
                      </div>

                      <span className="badge">
                        {isFinished ? "Completed" : "Running"}
                      </span>
                    </div>

                    <div className="meta">
                      <div>
                        Nhân viên:{" "}
                        <strong>
                          {item.variables.employeeName || "Không có dữ liệu"}
                        </strong>
                      </div>

                      <div>
                        Lý do nghỉ:{" "}
                        <strong>
                          {item.variables.reason || "Không có dữ liệu"}
                        </strong>
                      </div>

                      <div>
                        Số ngày nghỉ:{" "}
                        <strong>
                          {item.variables.numberOfDays ?? "Không có dữ liệu"}
                        </strong>
                      </div>

                      <div>
                        Manager duyệt:{" "}
                        <strong>
                          {item.variables.approved === true
                            ? "Đã duyệt"
                            : item.variables.approved === false
                            ? "Đã từ chối"
                            : "Chưa xử lý"}
                        </strong>
                      </div>

                      <div>
                        HR comment:{" "}
                        <strong>{item.variables.comment || "Chưa có"}</strong>
                      </div>

                      <div>
                        Process Instance: <code>{item.id}</code>
                      </div>

                      <div>
                        Bắt đầu: <strong>{formatDate(item.startTime)}</strong>
                      </div>

                      <div>
                        Kết thúc: <strong>{formatDate(item.endTime)}</strong>
                      </div>

                      <div>
                        Thời lượng:{" "}
                        <strong>{formatDuration(item.durationInMillis)}</strong>
                      </div>
                    </div>

                    <div className="timeline">
                      <h4>Task đã đi qua</h4>

                      {item.tasks.length === 0 ? (
                        <p className="card-desc">Chưa có task nào.</p>
                      ) : (
                        item.tasks.map((task) => (
                          <div className="timeline-item" key={task.id}>
                            <div className="timeline-dot" />
                            <div>
                              <strong>{task.name}</strong>
                              <div className="meta" style={{ marginTop: 6 }}>
                                <div>
                                  Trạng thái:{" "}
                                  <strong>
                                    {task.endTime
                                      ? "Đã hoàn thành"
                                      : "Đang chờ"}
                                  </strong>
                                </div>
                                <div>Bắt đầu: {formatDate(task.startTime)}</div>
                                <div>Kết thúc: {formatDate(task.endTime)}</div>
                                <div>
                                  Thời lượng:{" "}
                                  {formatDuration(task.durationInMillis)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}