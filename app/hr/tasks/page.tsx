"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FlowableTask = {
  id: string;
  name: string;
  createTime: string;
  taskDefinitionKey: string;
  processInstanceId: string;
};

type LeaveRequestVariables = {
  employeeName?: string;
  reason?: string;
  numberOfDays?: number;
  approved?: boolean;
};

type TaskWithVariables = FlowableTask & {
  variables: LeaveRequestVariables;
};

function variablesArrayToObject(variables: Array<{ name: string; value: unknown }>) {
  return variables.reduce<Record<string, unknown>>((acc, item) => {
    acc[item.name] = item.value;
    return acc;
  }, {});
}

export default function HrTasksPage() {
  const [tasks, setTasks] = useState<TaskWithVariables[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadTasks() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        "/api/flowable/tasks?definitionKey=hrConfirmation"
      );
      const data = await res.json();
      const rawTasks: FlowableTask[] = data.data || [];

      const tasksWithVariables = await Promise.all(
        rawTasks.map(async (task) => {
          const variableRes = await fetch(
            `/api/flowable/process-instances/${task.processInstanceId}/variables`
          );
          const variableData = await variableRes.json();
          const variablesObject = variablesArrayToObject(variableData || []);

          return {
            ...task,
            variables: {
              employeeName: variablesObject.employeeName as string | undefined,
              reason: variablesObject.reason as string | undefined,
              numberOfDays: variablesObject.numberOfDays as number | undefined,
              approved: variablesObject.approved as boolean | undefined,
            },
          };
        })
      );

      setTasks(tasksWithVariables);
    } catch (error) {
      setMessage(String(error));
    } finally {
      setLoading(false);
    }
  }

  async function completeTask(taskId: string) {
    setMessage("");

    try {
      const res = await fetch(`/api/flowable/tasks/${taskId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: "HR confirmed",
        }),
      });

      if (!res.ok) {
        throw new Error("HR xác nhận thất bại");
      }

      setMessage("HR đã xác nhận. Quy trình đã hoàn tất.");
      await loadTasks();
    } catch (error) {
      setMessage(String(error));
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <main className="app-shell">
      <section className="page">
        <div className="hero">
          <div>
            <span className="eyebrow">HR Portal</span>
            <h1>Xác nhận nghỉ phép</h1>
            <p className="subtitle">
              HR xem lại thông tin đơn đã được Manager duyệt và xác nhận hoàn tất.
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
          </nav>
        </div>

        <section className="card">
          <div className="task-head">
            <div>
              <h2 className="card-title">HR Confirmation</h2>
              <p className="card-desc">Tổng số task đang chờ: {tasks.length}</p>
            </div>

            <button className="btn-secondary" onClick={loadTasks} disabled={loading}>
              {loading ? "Đang tải..." : "Tải lại"}
            </button>
          </div>

          {message && <div className="alert">{message}</div>}

          {tasks.length === 0 ? (
            <div className="empty-state">
              Không có task HR Confirmation nào đang chờ xử lý.
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <div className="task-head">
                    <h3 className="task-name">{task.name}</h3>
                    <span className="badge">Waiting HR</span>
                  </div>

                  <div className="meta">
                    <div>
                      Nhân viên: <strong>{task.variables.employeeName || "Không có dữ liệu"}</strong>
                    </div>
                    <div>
                      Lý do nghỉ: <strong>{task.variables.reason || "Không có dữ liệu"}</strong>
                    </div>
                    <div>
                      Số ngày nghỉ: <strong>{task.variables.numberOfDays ?? "Không có dữ liệu"}</strong>
                    </div>
                    <div>
                      Manager đã duyệt:{" "}
                      <strong>
                        {task.variables.approved === true ? "Có" : "Không rõ"}
                      </strong>
                    </div>
                    <div>
                      Task ID: <code>{task.id}</code>
                    </div>
                    <div>
                      Process Instance: <code>{task.processInstanceId}</code>
                    </div>
                    <div>Created: {new Date(task.createTime).toLocaleString()}</div>
                  </div>

                  <button
                    className="btn-success"
                    onClick={() => completeTask(task.id)}
                  >
                    HR xác nhận
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}