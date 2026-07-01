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
  name: string;
  value: unknown;
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

function variablesArrayToObject(variables: FlowableVariable[]) {
  return variables.reduce<Record<string, unknown>>((acc, item) => {
    acc[item.name] = item.value;
    return acc;
  }, {});
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleString();
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

      const res = await fetch(url);
      const data = await res.json();

      const processes: HistoricProcessInstance[] = data.data || [];

      const rows = await Promise.all(
        processes.map(async (process) => {
          const [tasksRes, variablesRes] = await Promise.all([
            fetch(`/api/flowable/history/process-instances/${process.id}/tasks`),
            fetch(`/api/flowable/history/process-instances/${process.id}/variables`),
          ]);

          const tasksData = await tasksRes.json();
          const variablesData = await variablesRes.json();

          const variablesObject = variablesArrayToObject(variablesData.data || []);

          return {
            ...process,
            tasks: tasksData.data || [],
            variables: {
              employeeName: variablesObject.employeeName as string | undefined,
              reason: variablesObject.reason as string | undefined,
              numberOfDays: variablesObject.numberOfDays as number | undefined,
              approved: variablesObject.approved as boolean | undefined,
              comment: variablesObject.comment as string | undefined,
            },
          };
        })
      );

      setItems(rows);
    } catch (error) {
      setMessage(String(error));
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
              Xem lại các process đã chạy, task đã xử lý và dữ liệu đơn nghỉ phép.
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
              <p className="card-desc">
                Tổng số bản ghi: {items.length}
              </p>
            </div>

            <div className="button-row">
              <button
                className={filter === "all" ? "btn-primary" : "btn-secondary"}
                onClick={() => setFilter("all")}
              >
                Tất cả
              </button>

              <button
                className={filter === "running" ? "btn-primary" : "btn-secondary"}
                onClick={() => setFilter("running")}
              >
                Đang chạy
              </button>

              <button
                className={filter === "finished" ? "btn-primary" : "btn-secondary"}
                onClick={() => setFilter("finished")}
              >
                Đã hoàn thành
              </button>

              <button className="btn-secondary" onClick={loadHistory} disabled={loading}>
                {loading ? "Đang tải..." : "Tải lại"}
              </button>
            </div>
          </div>

          {message && <div className="alert">{message}</div>}

          {items.length === 0 ? (
            <div className="empty-state">
              Chưa có lịch sử process nào.
            </div>
          ) : (
            <div className="task-list">
              {items.map((item) => {
                const isFinished = Boolean(item.endTime);

                return (
                  <article className="task-card" key={item.id}>
                    <div className="task-head">
                      <div>
                        <h3 className="task-name">
                          {item.variables.employeeName || "Không có tên nhân viên"}
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
                                    {task.endTime ? "Đã hoàn thành" : "Đang chờ"}
                                  </strong>
                                </div>
                                <div>Bắt đầu: {formatDate(task.startTime)}</div>
                                <div>Kết thúc: {formatDate(task.endTime)}</div>
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