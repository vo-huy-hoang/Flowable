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

export default function ManagerTasksPage() {
  const [tasks, setTasks] = useState<TaskWithVariables[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadTasks() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        "/api/flowable/tasks?definitionKey=managerApproval"
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

  async function completeTask(taskId: string, approved: boolean) {
    setMessage("");

    try {
      const res = await fetch(`/api/flowable/tasks/${taskId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved }),
      });

      if (!res.ok) {
        throw new Error("Xử lý task thất bại");
      }

      setMessage(
        approved
          ? "Đã duyệt đơn. Task đã chuyển sang HR."
          : "Đã từ chối đơn. Quy trình đã kết thúc."
      );

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
            <span className="eyebrow">Manager Portal</span>
            <h1>Duyệt đơn nghỉ phép</h1>
            <p className="subtitle">
              Manager xem thông tin đơn nghỉ phép và quyết định duyệt hoặc từ chối.
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
              <h2 className="card-title">Manager Approval</h2>
              <p className="card-desc">Tổng số task đang chờ: {tasks.length}</p>
            </div>

            <button className="btn-secondary" onClick={loadTasks} disabled={loading}>
              {loading ? "Đang tải..." : "Tải lại"}
            </button>
          </div>

          {message && <div className="alert">{message}</div>}

          {tasks.length === 0 ? (
            <div className="empty-state">
              Không có task Manager Approval nào đang chờ xử lý.
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <div className="task-head">
                    <h3 className="task-name">{task.name}</h3>
                    <span className="badge">Pending</span>
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
                      Task ID: <code>{task.id}</code>
                    </div>
                    <div>
                      Process Instance: <code>{task.processInstanceId}</code>
                    </div>
                    <div>Created: {new Date(task.createTime).toLocaleString()}</div>
                  </div>

                  <div className="button-row">
                    <button
                      className="btn-success"
                      onClick={() => completeTask(task.id, true)}
                    >
                      Duyệt
                    </button>

                    <button
                      className="btn-danger"
                      onClick={() => completeTask(task.id, false)}
                    >
                      Từ chối
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}